/**
 * De groepsstatistiek: alles wat uit de formulieren en de scores wordt uitgerekend.
 *
 * Elke functie is puur: dezelfde invoer geeft altijd dezelfde uitvoer, er wordt niets
 * bewaard tussen aanroepen door. Daardoor is elke uitspraak op de pagina na te rekenen
 * met `npm test`, en kan een grafiek nooit stilletjes iets anders berekenen dan de
 * tabel ernaast.
 *
 * De taakverdeling met `kern.mjs`: de kern beoordeelt één plek (score, band, oordeel,
 * knock-outs) en draait ook in de browser; dit bestand rekent over de groep en het
 * geheel (gewichten, eensgezindheid, trechter, overzichten) en draait alleen bij het
 * bouwen. Wie hier iets aan een plekscore wil veranderen, zit in het verkeerde bestand.
 */
import { locatiescore } from './kern.mjs';

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
function themamiddelen(lid, stellingen, themas) {
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

  const themanaam = Object.fromEntries(inhoud.themas.map((t) => [t.code, t.naam]));
  return stellingen.map((stelling, i) => {
    const gegeven = leden.map((l) => l.antwoorden[i]).filter((a) => a !== null);
    const gemiddelde = gegeven.reduce((a, b) => a + b, 0) / gegeven.length;
    const tegen = gegeven.filter((a) => a <= 1).length;
    const voor = gegeven.length - tegen;
    const topvijf = leden.filter((l) => l.topvijf.includes(stelling.nr)).length;

    return {
      ...stelling,
      themanaam: themanaam[stelling.thema],
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

/** Bij hoeveel gescoorde plekken is elk thema daadwerkelijk ingevuld. */
export function themadekking(inhoud) {
  const kandidaten = inhoud.themascores.filter((l) => l.soort !== 'archetype');
  const uit = {};
  for (const { code } of inhoud.themas) {
    uit[code] = kandidaten.filter((l) => l.scores[code] !== null).length;
  }
  return uit;
}

/** Score, band en geraakte knock-outcriteria per plek, gesorteerd van hoog naar laag. */
export function perPlek(inhoud, gewicht) {
  const { themas, themascores, instellingen } = inhoud;
  const codes = themas.map((t) => t.code);
  const vastgesteld = new Set(instellingen['vastgestelde-knock-outs'] ?? []);

  return themascores
    .map((plek) => {
      const midden = locatiescore(plek.scores, gewicht, codes, null);
      return {
        ...plek,
        score: midden.score,
        dekking: midden.geteld,
        ondergrens: locatiescore(plek.scores, gewicht, codes, 0).score,
        bovengrens: locatiescore(plek.scores, gewicht, codes, 4).score,
        valtAf: plek.raakt.filter((code) => vastgesteld.has(code)),
      };
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

/** Per scenario: hoeveel plekken blijven over en welke daarvan scoort het hoogst. */
export function trechter(inhoud, gewicht) {
  const codes = inhoud.themas.map((t) => t.code);
  const naamVan = Object.fromEntries(
    inhoud.knockouts.map((k) => [k.code, `knock-outcriterium ${k.nummer} · ${k.naam}`]));
  const kandidaten = inhoud.themascores.filter((l) => l.soort !== 'archetype');
  return (inhoud.instellingen.scenarios ?? []).map((scenario) => {
    const gesloten = new Set(scenario.codes);
    const over = kandidaten.filter((l) => !l.raakt.some((code) => gesloten.has(code)));
    const gescoord = over
      .map((l) => ({ naam: l.naam, ...locatiescore(l.scores, gewicht, codes) }))
      .filter((l) => l.score !== null)
      .sort((a, b) => b.score - a.score);
    return {
      ...scenario,
      // De volledige namen zijn voor de tooltip: kale codes komen niet in beeld.
      namen: scenario.codes.map((code) => naamVan[code]),
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

/* ------------------------------------------------- de verkenning ernaast ---- */

/**
 * Vertaalt de negen criteria van de verkenning naar de negen thema's van het PvE, zodat
 * de twee wegingen op dezelfde as liggen. Criteria die op hetzelfde thema uitkomen
 * worden opgeteld: "stikstof", "herbestembaarheid", "prijs" en "bestuurlijke
 * ontvankelijkheid" vallen alle vier onder thema F, en samen zijn ze zwaar.
 *
 * De uitkomst is per thema een percentage, net als het groepsgewicht, dus de twee zijn
 * rechtstreeks vergelijkbaar. Thema's waar de verkenning niets op weegt komen op nul uit.
 */
export function verkenningsweging(scoremodel, themas) {
  const uit = {};
  for (const { code } of themas) uit[code] = 0;
  for (const rij of scoremodel) uit[rij.thema] += rij.weging * 100;
  return uit;
}

/**
 * Legt het groepsgewicht naast de verkenningsweging en rekent per thema het verschil uit.
 * Gesorteerd op de grootste afwijking, want daar zit het gesprek.
 */
export function wegingsverschil(scoremodel, themas, groepsgewichten) {
  const verkenning = verkenningsweging(scoremodel, themas);
  return themas
    .map((thema) => {
      const groep = groepsgewichten[thema.code];
      return {
        ...thema,
        groep,
        verkenning: verkenning[thema.code],
        verschil: groep - verkenning[thema.code],
        criteria: scoremodel.filter((r) => r.thema === thema.code).map((r) => r.criterium),
      };
    })
    .sort((a, b) => Math.abs(b.verschil) - Math.abs(a.verschil));
}

/**
 * De vier tellingen die de verhouding in de keten laten zien: hoeveel kandidaten er zijn,
 * hoeveel daarvan woonlocatie zijn, en hoeveel er werkelijk themascores hebben. Dat
 * laatste getal is het punt: alles wat daarbuiten valt staat wel op de kaart maar telt
 * nergens in mee, en een kandidaat met hoge prioriteit zonder scores is een gat in het
 * onderzoek, geen afgevallen plek.
 */
export function kandidaatoverzicht(kandidaten) {
  const hoogZonder = kandidaten.filter((k) => k.prioriteit === 'hoog' && !k.heeftThemascores);
  return {
    totaal: kandidaten.length,
    woonlocaties: kandidaten.filter((k) => k.categorie === 'kandidaat').length,
    metThemascores: kandidaten.filter((k) => k.heeftThemascores).length,
    hoogZonderThemascores: hoogZonder.length,
    // Voor de onderzoeksagenda: wie zijn het, en waar liggen ze.
    hoogZonderLijst: hoogZonder.map((k) => ({
      naam: k.naam, gemeente: k.gemeente, regio: k.regio,
    })),
  };
}

/** Perceel-leads gebundeld per zoekzone, met de oppervlakteverdeling erbij. */
export function leadoverzicht(leads) {
  const zones = new Map();
  for (const lead of leads) {
    if (!zones.has(lead.zoekzone)) {
      zones.set(lead.zoekzone, { zoekzone: lead.zoekzone, regio: lead.regio, hectares: [] });
    }
    zones.get(lead.zoekzone).hectares.push(lead.hectare);
  }
  return [...zones.values()]
    .map((zone) => {
      const gesorteerd = [...zone.hectares].sort((a, b) => a - b);
      return {
        zoekzone: zone.zoekzone,
        regio: zone.regio,
        aantal: gesorteerd.length,
        mediaan: gesorteerd[Math.floor(gesorteerd.length / 2)],
        kleinste: gesorteerd[0],
        grootste: gesorteerd.at(-1),
      };
    })
    .sort((a, b) => b.aantal - a.aantal);
}
