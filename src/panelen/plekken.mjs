/**
 * Score en onzekerheidsband per plek.
 *
 * De stip is de score op de thema's die zijn ingevuld. De balk eromheen is de band:
 * links wat de score wordt als alle onbekende thema's een 0 blijken, rechts als ze een
 * 4 blijken. Een smalle band betekent dat we de plek kennen; een brede band betekent
 * dat het cijfer nog weinig zegt.
 *
 * Dat de banden elkaar overlappen is geen tekortkoming van de tekening maar de
 * boodschap: zolang dat zo is, kan het model geen plek uitsluiten. Daarom staat de
 * band hier even prominent als de score, en niet als klein foutbalkje.
 */
import { doek, tag, tekst, trefvlak, kort } from '../svg.mjs';

const X_NAAM = 300;
const BALK = 620;
const REGEL = 30;

export function plekken(rijen, { breedte }) {
  const hoogte = rijen.length * REGEL + 40;
  const naarX = (waarde) => X_NAAM + (waarde / 100) * BALK;
  const delen = [];

  // ---- as van 0 tot 100
  for (const waarde of [0, 25, 50, 75, 100]) {
    const x = naarX(waarde);
    delen.push(tag('line', { x1: x, x2: x, y1: 22, y2: hoogte - 22,
      stroke: 'var(--raster)', 'stroke-width': 1 }));
    delen.push(tekst(String(waarde),
      { x, y: 14, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--flauw)' }));
  }

  rijen.forEach((rij, i) => {
    const y = 34 + i * REGEL;
    const isArchetype = rij.soort === 'archetype';
    // Terra zodra de plek een grens raakt, ook als die grens nog niet is vastgesteld:
    // dat is precies de informatie die je vooraf wilt zien.
    const kleur = rij.raaktGrenzen.length ? 'var(--terra)' : 'var(--ramp4)';

    delen.push(tekst(kort(rij.naam, 40), {
      x: X_NAAM - 12, y: y + 4, 'text-anchor': 'end', 'font-size': 12.5,
      fill: isArchetype ? 'var(--gedempt)' : 'var(--inkt)',
      'font-style': isArchetype ? 'italic' : null,
    }));

    if (rij.score === null) {
      delen.push(tekst('nog niet gescoord',
        { x: X_NAAM + 8, y: y + 4, 'font-size': 12, fill: 'var(--flauw)' }));
      return;
    }

    const x1 = naarX(rij.ondergrens);
    const x2 = naarX(rij.bovengrens);
    delen.push(tag('rect', { x: x1, y: y - 5, width: x2 - x1, height: 10, rx: 5,
      fill: kleur, opacity: 0.16 }));
    delen.push(tag('circle', { cx: naarX(rij.score), cy: y, r: 5, fill: kleur,
      stroke: 'var(--paneel)', 'stroke-width': 2 }));

    const staart = `${Math.round(rij.score)} · ${rij.dekking}/${rij.aantalThemas} thema's`
      + (rij.raaktGrenzen.length ? ` · raakt ${rij.raaktGrenzen.join(', ')}` : '');
    delen.push(tekst(staart, { x: x2 + 10, y: y + 4, 'font-size': 12, fill: 'var(--gedempt)' }));

    delen.push(trefvlak(0, y - 14, breedte, REGEL - 2,
      `<b>${rij.naam}</b><br>${rij.detail}<br><br>` +
      `score ${Math.round(rij.score)} met onze eigen gewichten<br>` +
      `band ${Math.round(rij.ondergrens)} tot ${Math.round(rij.bovengrens)}, ` +
      `op ${rij.dekking} van de ${rij.aantalThemas} thema's<br>` +
      (rij.raaktGrenzen.length
        ? `raakt ${rij.raaktGrenzen.join(', ')}` +
          (rij.valtAf.length ? `, waarvan vastgesteld: ${rij.valtAf.join(', ')}` : '')
        : 'raakt geen van de opgenomen grenzen')));
  });

  return doek(breedte, hoogte, 'score en onzekerheidsband per plek', delen.join(''));
}
