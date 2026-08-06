/**
 * Hoe vaak een stelling in iemands persoonlijke top vijf staat.
 *
 * Deze laag telt nergens in mee: de top vijf beïnvloedt de themagewichten niet en dus
 * ook niet welke plek afvalt. Dat is geen fout maar een keuze, en juist daarom staat
 * hij hier apart. Een gewicht en een ondergrens zijn niet hetzelfde, en het is beter
 * om die twee naast elkaar te laten zien dan ze te middelen tot één schijnprecies getal.
 *
 * De kleur zegt of het bijbehorende thema überhaupt ergens is gescoord. Terra betekent:
 * dit vindt iemand het zwaarst wegen, en het kan geen enkele plek laten afvallen.
 */
import { doek, tekst, balk, trefvlak, kort } from '../svg.mjs';

const X = 34;
const BALK = 104;
const REGEL = 26;

export function topvijf(stellingen, { breedte = 520, aantalLeden }) {
  const rijen = stellingen
    .filter((s) => s.topvijf > 0)
    .sort((a, b) => b.topvijf - a.topvijf || a.nr - b.nr);
  const hoogte = rijen.length * REGEL + 14;
  const delen = [];

  rijen.forEach((rij, i) => {
    const y = i * REGEL + 16;
    const kleur = rij.zeeft ? 'var(--ramp4)' : 'var(--terra)';
    const lengte = (rij.topvijf / aantalLeden) * BALK;

    delen.push(tekst(String(rij.nr),
      { x: X - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 11.5, fill: 'var(--flauw)' }));
    delen.push(balk(X, y - 6, lengte, 12, kleur));
    delen.push(tekst(`${rij.topvijf}×`,
      { x: X + lengte + 9, y: y + 4, 'font-size': 12, fill: 'var(--gedempt)' }));
    delen.push(tekst(kort(rij.tekst, 42),
      { x: X + BALK + 44, y: y + 4, 'font-size': 12, fill: 'var(--inkt)' }));

    delen.push(trefvlak(0, y - 13, breedte, REGEL - 2,
      `<b>Stelling ${rij.nr}</b> · thema ${rij.thema}<br>${rij.tekst}<br><br>` +
      `in <b>${rij.topvijf}</b> van de ${aantalLeden} topvijven` +
      (rij.zeeft ? '' : '<br><i>thema nergens gescoord: telt niet mee in welke plek afvalt</i>')));
  });

  return doek(breedte, hoogte, 'hoe vaak een stelling in een top vijf staat', delen.join(''));
}
