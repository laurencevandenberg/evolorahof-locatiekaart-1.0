/**
 * Gewicht per thema, naast de dekking van dat thema over de plekken.
 *
 * Dit zijn twee grootheden met een verschillende schaal, dus geen tweede as: links een
 * balk voor het gewicht, rechts een strip vakjes voor de dekking. Zo blijft elk getal
 * op zijn eigen maat leesbaar en zie je toch in één oogopslag waar ze uit elkaar lopen.
 *
 * De kleur codeert de dekking, niet het gewicht: dat laatste staat al in de balklengte
 * en nog eens in het cijfer erachter. Terra betekent dat er geen enkele plek voor dat
 * thema is ingevuld, en dat het gewicht dus stil verdwijnt uit elke locatiescore.
 */
import { doek, tag, tekst, balk, trefvlak, getal } from '../svg.mjs';

const X_NAAM = 306;
const BALK = 396;
const REGEL = 44;
const VAKJE = 13;

export function themas(rijen, { breedte, aantalPlekken }) {
  const gesorteerd = [...rijen].sort((a, b) => b.gewicht - a.gewicht);
  const hoogte = 24 + gesorteerd.length * REGEL + 16;
  const maxGewicht = Math.max(...gesorteerd.map((r) => r.gewicht));
  const xStrip = X_NAAM + BALK + 96;

  const delen = [
    tekst('GEWICHT VAN DE GROEP', { x: X_NAAM, y: 14, 'font-size': 11, fill: 'var(--flauw)' }),
    tekst(`BIJ HOEVEEL VAN DE ${aantalPlekken} PLEKKEN INGEVULD`,
      { x: xStrip, y: 14, 'font-size': 11, fill: 'var(--flauw)' }),
  ];

  gesorteerd.forEach((rij, i) => {
    const y = 24 + i * REGEL + 14;
    const leeg = rij.dekking === 0;
    const dun = rij.dekking > 0 && rij.dekking <= 3;
    const kleur = leeg ? 'var(--terra)' : dun ? 'var(--ramp2)' : 'var(--ramp4)';
    const lengte = (rij.gewicht / maxGewicht) * BALK;

    delen.push(tekst(rij.naam,
      { x: X_NAAM - 12, y: y + 5, 'text-anchor': 'end', 'font-size': 13, fill: 'var(--inkt)' }));
    delen.push(balk(X_NAAM, y - 8, lengte, 16, kleur));
    delen.push(tekst(getal(rij.gewicht),
      { x: X_NAAM + lengte + 9, y: y + 5, 'font-size': 12.5, fill: 'var(--gedempt)' }));

    for (let k = 0; k < aantalPlekken; k += 1) {
      delen.push(tag('rect', {
        x: xStrip + k * VAKJE, y: y - 6, width: VAKJE - 4, height: 12, rx: 2,
        fill: k < rij.dekking ? kleur : 'var(--raster)',
      }));
    }
    delen.push(tekst(leeg ? 'nergens' : `${rij.dekking} van ${aantalPlekken}`,
      { x: xStrip + aantalPlekken * VAKJE + 8, y: y + 5, 'font-size': 12.5,
        fill: leeg ? 'var(--terra)' : 'var(--gedempt)' }));

    const uitleg = leeg
      ? 'bij geen enkele plek ingevuld: dit gewicht verdwijnt volledig uit de berekening'
      : `ingevuld bij ${rij.dekking} van de ${aantalPlekken} gescoorde plekken`;
    delen.push(trefvlak(0, y - REGEL / 2 + 4, breedte, REGEL - 6,
      `<b>${rij.naam}</b><br>gewicht ${getal(rij.gewicht)} van 100<br>${uitleg}`));
  });

  return doek(breedte, hoogte, 'gewicht per thema tegenover dekking', delen.join(''));
}
