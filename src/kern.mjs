/**
 * De rekenkern die zowel de bouw als de browser gebruikt.
 *
 * Dit bestand is met opzet klein en zonder imports. De bouw importeert het als module;
 * de zeefpagina krijgt de broncode er letterlijk ingeplakt. Daardoor draait de browser
 * exact dezelfde functies als `npm test` natrekt, en kan de kaart nooit stilletjes
 * anders rekenen dan de tabel ernaast.
 *
 * Voeg hier alleen zuivere functies toe: geen bestandssysteem, geen DOM, geen import.
 */

/**
 * Gewogen score van 0 tot 100 over de thema's die een cijfer hebben.
 *
 * `invulling` bepaalt wat er met een onbekend thema gebeurt:
 *   null      buiten de berekening laten; het gewicht gaat naar de overige thema's
 *   0 of 4    invullen, om de onder- en bovengrens van de onzekerheidsband te krijgen
 *
 * Let op wat de standaardstand betekent: onbekend is hier niet nul en niet gemiddeld,
 * het is weg. Een plek wordt dus beoordeeld op zijn bekende kant, en daarom hoort de
 * band altijd naast de score te staan.
 */
export function locatiescore(scores, gewicht, themacodes, invulling = null) {
  let somGewicht = 0;
  let somScore = 0;
  let geteld = 0;
  for (const code of themacodes) {
    const bekend = scores[code];
    const cijfer = bekend === null || bekend === undefined ? invulling : bekend;
    if (cijfer === null || cijfer === undefined) continue;
    if (bekend !== null && bekend !== undefined) geteld += 1;
    somGewicht += gewicht[code];
    somScore += gewicht[code] * (cijfer / 4);
  }
  return { score: somGewicht ? (somScore / somGewicht) * 100 : null, geteld };
}

/**
 * Het oordeel over één plek, in de volgorde die ertoe doet.
 *
 * Eerst de vastgestelde knock-outcriteria: een plek die er één raakt valt af, hoe goed
 * hij verder ook scoort. Dat is het hele punt van zo'n criterium, en een gewogen
 * gemiddelde kan het niet uitdrukken. Daarna pas de dekking, en pas daarna het cijfer.
 *
 * Groen vraagt zowel een hoge score als genoeg onderzocht thema's. Rood mag ook bij dunne
 * dekking: een lage score op de weinige dingen die we weten is een waarschuwing, geen
 * kennisgebrek.
 */
export function oordeel(plek, gewicht, themacodes, opties) {
  const { vastgesteld, groenVanaf, roodOnder, minimaleDekking } = opties;
  const geraakt = (plek.raakt ?? []).filter((code) => vastgesteld.includes(code));
  if (geraakt.length) {
    return { stand: 'afgevallen', geraakt, score: null, geteld: 0, ondergrens: null, bovengrens: null };
  }

  const midden = locatiescore(plek.scores, gewicht, themacodes, null);
  if (midden.score === null) {
    return { stand: 'ongescoord', geraakt, score: null, geteld: 0, ondergrens: null, bovengrens: null };
  }

  const ondergrens = locatiescore(plek.scores, gewicht, themacodes, 0).score;
  const bovengrens = locatiescore(plek.scores, gewicht, themacodes, 4).score;
  let stand = 'deels';
  if (midden.score < roodOnder) stand = 'zwak';
  else if (midden.score >= groenVanaf && midden.geteld >= minimaleDekking) stand = 'voldoet';

  return { stand, geraakt, score: midden.score, geteld: midden.geteld, ondergrens, bovengrens };
}

/** De vier standen met hun kleur en label. Kleur staat nooit alleen: er is altijd tekst bij. */
export const STANDEN = {
  voldoet: { kleur: 'var(--groen)', naam: 'voldoet' },
  deels: { kleur: 'var(--duindoorn)', naam: 'deels' },
  zwak: { kleur: 'var(--terra)', naam: 'te zwak' },
  afgevallen: { kleur: 'var(--terra)', naam: 'valt af' },
  ongescoord: { kleur: 'var(--flauw)', naam: 'niet gescoord' },
};

/**
 * Hoeveel plekken een knock-outcriterium in zijn eentje wegneemt, gegeven wat er al is
 * vastgesteld. Dit staat naast elke schakelaar, zodat je vóór het aanzetten ziet wat
 * hij doet; criteria die dezelfde plekken raken tellen zo niet dubbel.
 */
export function effectVanKnockout(plekken, code, vastgesteld) {
  const zonder = vastgesteld.filter((c) => c !== code);
  const overZonder = plekken.filter((p) => !(p.raakt ?? []).some((r) => zonder.includes(r)));
  return overZonder.filter((p) => (p.raakt ?? []).includes(code)).length;
}
