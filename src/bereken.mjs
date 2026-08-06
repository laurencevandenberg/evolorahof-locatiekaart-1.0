/**
 * De rekenkern. Alles wat een getal oplevert staat hier, en nergens anders.
 *
 * Elke functie is puur: dezelfde invoer geeft altijd dezelfde uitvoer, er wordt niets
 * bewaard tussen aanroepen door. Daardoor is elke uitspraak in het dashboard na te
 * rekenen met `npm test`, en kan een grafiek nooit stilletjes iets anders berekenen
 * dan de tabel ernaast.
 */

/* ------------------------------------------------------------------ toeval */

/**
 * Kleine deterministische toevalsgenerator (mulberry32).
 * Nodig om de antwoorden te husselen bij `anonimiseren: ja`. Met een vaste startwaarde
 * levert dezelfde inhoud altijd hetzelfde dashboard op, zodat een herbouw geen ruis
 * in de git-geschiedenis geeft.
 */
export function toevalsreeks(start) {
  let toestand = start >>> 0;
  return () => {
    toestand = (toestand + 0x6d2b79f5) >>> 0;
    let t = toestand;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Husselt een lijst met een gegeven toevalsgenerator (Fisher-Yates). */
export function hussel(lijst, volgende) {
  const uit = [...lijst];
  for (let i = uit.length - 1; i > 0; i -= 1) {
    const j = Math.floor(volgende() * (i + 1));
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  return uit;
}

/* --------------------------------------------------------------- gewichten */

/**
 * Gemiddelde antwoordscore per thema, ruw en nog niet geschaald.
 * Omgekeerd gepoolde stellingen tellen gespiegeld: een 3 wordt een 0.
 */
export function themamiddelen(lid, stellingen, themas) {
  const som = new Map();
  const telling = new Map();
  stellingen.forEach((stelling, i) => {
    const antwoord = lid.antwoorden[i];
    if (antwoord === null) return;
    const waarde = stelling.omgekeerd ? 3 - antwoord : antwoord;
    som.set(stelling.thema, (som.get(stelling.thema) ?? 0) + waarde);
    telling.set(stelling.thema, (telling.get(stelling.thema) ?? 0) + 1);
  });
  const uit = {};
  for (const { code } of themas) {
    uit[code] = telling.has(code) ? som.get(code) / telling.get(code) : 0;
  }
  return uit;
}

/**
 * Weegmethode "gemiddelde": het ruwe gemiddelde per thema, geschaald naar som 100.
 * Dit is de methode van de oorspronkelijke rekentool. Hij meet mede hoe streng iemand
 * aankruist: wie overal een 3 zet en wie overal een 1 zet komen op hetzelfde uit, maar
 * de verhoudingen tussen thema's worden er wel platter van.
 */
export function gewichtGemiddelde(lid, stellingen, themas) {
  const ruw = themamiddelen(lid, stellingen, themas);
  const totaal = Object.values(ruw).reduce((a, b) => a + b, 0) || 1;
  const uit = {};
  for (const { code } of themas) uit[code] = (ruw[code] / totaal) * 100;
  return uit;
}

/**
 * Weegmethode "rangorde": alleen de eigen volgorde van de thema's telt.
 * Thema's met exact dezelfde ruwe score krijgen de gemiddelde rangpositie, zodat de
 * toevallige volgorde in het bestand geen voorrang geeft.
 */
export function gewichtRangorde(lid, stellingen, themas) {
  const ruw = themamiddelen(lid, stellingen, themas);
  const codes = themas.map((t) => t.code);
  const gesorteerd = [...codes].sort((a, b) => ruw[a] - ruw[b]);

  const rang = {};
  for (let i = 0; i < gesorteerd.length;) {
    let j = i;
    while (j + 1 < gesorteerd.length && ruw[gesorteerd[j + 1]] === ruw[gesorteerd[i]]) j += 1;
    const gedeeld = (i + j) / 2 + 1;            // gemiddelde positie, 1 tot n
    for (let k = i; k <= j; k += 1) rang[gesorteerd[k]] = gedeeld;
    i = j + 1;
  }
  const totaal = Object.values(rang).reduce((a, b) => a + b, 0);
  const uit = {};
  for (const code of codes) uit[code] = (rang[code] / totaal) * 100;
  return uit;
}

/** Het groepsgewicht: het gemiddelde van de persoonlijke gewichten, elk lid even zwaar. */
export function groepsgewicht(leden, stellingen, themas, methode = 'rangorde') {
  const bereken = methode === 'gemiddelde' ? gewichtGemiddelde : gewichtRangorde;
  const per = leden.map((lid) => bereken(lid, stellingen, themas));
  const uit = {};
  for (const { code } of themas) {
    uit[code] = per.reduce((a, g) => a + g[code], 0) / per.length;
  }
  return uit;
}

/* ---------------------------------------------------------- eensgezindheid */

/**
 * Eensgezindheid: 1 min de gemiddelde afstand tussen twee willekeurige antwoorden,
 * geschaald op de lengte van de schaal.
 *
 *   iedereen hetzelfde            -> 1,00
 *   groep exact in tweeen, 0 en 3 -> 0,43
 *
 * Deze maat kijkt naar spreiding, niet naar richting. Acht mensen die allemaal
 * "erg mee oneens" invullen zijn maximaal eensgezind, ook al zeggen ze nee. Dat is
 * precies de bedoeling: samen nee zeggen is geen conflict.
 */
export function eensgezindheid(waarden, schaalbreedte = 3) {
  if (waarden.length < 2) return 1;
  let som = 0;
  let paren = 0;
  for (let i = 0; i < waarden.length; i += 1) {
    for (let j = i + 1; j < waarden.length; j += 1) {
      som += Math.abs(waarden[i] - waarden[j]);
      paren += 1;
    }
  }
  return 1 - som / paren / schaalbreedte;
}

/**
 * Deelt een stelling in op de beslisconsequentie, niet op het gemiddelde.
 *
 *   samen-voor    hoogstens een tegenstemmer: haalt een consentronde
 *   samen-tegen   hoogstens een voorstemmer: de groep wijst dit samen af
 *   sloot         meerderheid voor, maar genoeg tegenstemmers om om te vallen
 *   verdeeld      geen meerderheid, of gelijk verdeeld
 */
export function stellingstatus(voor, tegen, drempel = 2) {
  if (tegen <= 1) return 'samen-voor';
  if (voor <= 1) return 'samen-tegen';
  if (voor > tegen && tegen >= drempel) return 'sloot';
  return 'verdeeld';
}

/** Alles wat het dashboard per stelling nodig heeft, in één keer uitgerekend. */
export function perStelling(inhoud) {
  const { stellingen, leden, instellingen } = inhoud;
  const anonimiseren = inhoud.anonimiseren !== false;
  const volgende = toevalsreeks(20260726);
  const gescoordeThemas = themadekking(inhoud);

  return stellingen.map((stelling, i) => {
    const gegeven = leden.map((l) => l.antwoorden[i]).filter((a) => a !== null);
    const gemiddelde = gegeven.reduce((a, b) => a + b, 0) / gegeven.length;
    const tegen = gegeven.filter((a) => a <= 1).length;
    const voor = gegeven.length - tegen;
    const topvijf = leden.filter((l) => l.topvijf.includes(stelling.nr)).length;

    return {
      ...stelling,
      antwoorden: anonimiseren ? hussel(gegeven, volgende) : gegeven,
      ingevuld: gegeven.length,
      gemiddelde,
      eensgezindheid: eensgezindheid(gegeven),
      voor,
      tegen,
      topvijf,
      status: stellingstatus(voor, tegen, instellingen['tegenstemmers-voor-sloot'] ?? 2),
      // Een stelling kan alleen een plek laten afvallen als er ergens een cijfer
      // voor haar thema staat. Zo niet, dan verdwijnt haar gewicht in de noemer.
      zeeft: (gescoordeThemas[stelling.thema] ?? 0) > 0,
    };
  });
}

/* ------------------------------------------------------------------ plekken */

/** Bij hoeveel kandidaten is elk thema daadwerkelijk ingevuld. */
export function themadekking(inhoud) {
  const kandidaten = inhoud.locaties.filter((l) => l.soort !== 'archetype');
  const uit = {};
  for (const { code } of inhoud.themas) {
    uit[code] = kandidaten.filter((l) => l.scores[code] !== null).length;
  }
  return uit;
}

/**
 * Gewogen score van 0 tot 100 over de ingevulde thema's.
 *
 * `invulling` bepaalt wat er met een onbekend thema gebeurt:
 *   null      buiten de berekening laten; het gewicht wordt over de rest verdeeld
 *   0 of 4    invullen, om de onder- en bovengrens van de band te krijgen
 *
 * Let op wat de standaardstand betekent: onbekend is hier niet nul en niet gemiddeld,
 * het is weg. Een plek wordt dus beoordeeld op zijn bekende kant. Daarom staat de band
 * altijd naast de score in het dashboard.
 */
export function locatiescore(scores, gewicht, themas, invulling = null) {
  let somGewicht = 0;
  let somScore = 0;
  let geteld = 0;
  for (const { code } of themas) {
    const bekend = scores[code];
    const cijfer = bekend === null || bekend === undefined ? invulling : bekend;
    if (cijfer === null) continue;
    if (bekend !== null && bekend !== undefined) geteld += 1;
    somGewicht += gewicht[code];
    somScore += gewicht[code] * (cijfer / 4);
  }
  return { score: somGewicht ? (somScore / somGewicht) * 100 : null, geteld };
}

/** Score, band en geraakte grenzen per plek, gesorteerd van hoog naar laag. */
export function perLocatie(inhoud, gewicht) {
  const { themas, locaties, instellingen } = inhoud;
  const vastgesteld = new Set(instellingen['vastgestelde-grenzen'] ?? []);

  return locaties
    .map((locatie) => {
      const midden = locatiescore(locatie.scores, gewicht, themas, null);
      return {
        ...locatie,
        score: midden.score,
        dekking: midden.geteld,
        ondergrens: locatiescore(locatie.scores, gewicht, themas, 0).score,
        bovengrens: locatiescore(locatie.scores, gewicht, themas, 4).score,
        // Alle grenzen die deze plek raakt, en apart welke daarvan zijn vastgesteld.
        raaktGrenzen: locatie.raakt,
        valtAf: locatie.raakt.filter((code) => vastgesteld.has(code)),
      };
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

/** Per scenario: hoeveel kandidaten blijven over en welke daarvan scoort het hoogst. */
export function trechter(inhoud, gewicht) {
  const kandidaten = inhoud.locaties.filter((l) => l.soort !== 'archetype');
  return (inhoud.instellingen.scenarios ?? []).map((scenario) => {
    const gesloten = new Set(scenario.grenzen);
    const over = kandidaten.filter((l) => !l.raakt.some((code) => gesloten.has(code)));
    const gescoord = over
      .map((l) => ({ naam: l.naam, ...locatiescore(l.scores, gewicht, inhoud.themas) }))
      .filter((l) => l.score !== null)
      .sort((a, b) => b.score - a.score);
    return {
      ...scenario,
      over: over.length,
      beste: gescoord[0]?.naam ?? '',
      bestescore: gescoord[0] ? Math.round(gescoord[0].score) : null,
    };
  });
}

/**
 * De kopcijfers boven het dashboard.
 * `gewichtZonderDekking` is het aandeel van het gewicht dat op thema's landt die bij
 * geen enkele plek zijn ingevuld: dat deel verdwijnt volledig uit elke locatiescore.
 */
export function kerncijfers(inhoud, gewicht, stellingen) {
  const dekking = themadekking(inhoud);
  const aandeel = (voorwaarde) => inhoud.themas
    .filter(({ code }) => voorwaarde(dekking[code]))
    .reduce((som, { code }) => som + gewicht[code], 0);

  const tel = (status) => stellingen.filter((s) => s.status === status).length;
  return {
    zonderDekking: aandeel((n) => n === 0),
    dunneDekking: aandeel((n) => n > 0 && n <= 3),
    samen: tel('samen-voor') + tel('samen-tegen'),
    sloot: tel('sloot'),
    verdeeld: tel('verdeeld'),
  };
}
