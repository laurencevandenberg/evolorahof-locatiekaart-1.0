/**
 * De trechter: hoeveel plekken blijven over per scenario van vastgestelde grenzen.
 *
 * De scenario's staan in `inhoud/01-instellingen.md` en zijn dus zonder code te
 * wijzigen. De volgorde in die tabel is de volgorde hier: bovenaan de ruimste stand,
 * onderaan de strengste.
 *
 * Eén tint groen, oplopend donker. Dat is de juiste vorm voor een grootheid die maar
 * één kant op loopt; een tweede kleur zou hier suggereren dat er iets tegenover staat.
 */
import { doek, tekst, balk, trefvlak, tag } from '../svg.mjs';

const X = 8;
const BALK = 320;
const REGEL = 62;

export function trechter(scenarios, { breedte = 600 } = {}) {
  const hoogte = scenarios.length * REGEL + 10;
  const maxOver = Math.max(...scenarios.map((s) => s.over), 1);
  const delen = [];

  scenarios.forEach((scenario, i) => {
    const y = i * REGEL + 22;
    // De ramp heeft vier stappen; bij meer scenario's herhaalt de laatste stap zich.
    const kleur = `var(--ramp${Math.min(i + 1, 4)})`;
    const lengte = (scenario.over / maxOver) * BALK;

    delen.push(tekst(scenario.naam,
      { x: X, y: y - 6, 'font-size': 13, fill: 'var(--inkt)', 'font-weight': 600 }));
    delen.push(balk(X, y + 2, lengte, 18, kleur));

    // Waarde en bijschrift in één tekstelement, zodat ze nooit over elkaar vallen.
    delen.push(tag('text',
      { x: X + lengte + 12, y: y + 16, 'font-size': 15, fill: 'var(--inkt)', 'font-weight': 600 },
      `${scenario.over}` +
      tag('tspan', { 'font-size': 12, 'font-weight': 400, fill: 'var(--gedempt)' },
        '  plekken over')));

    if (scenario.toelichting) {
      delen.push(tekst(scenario.toelichting,
        { x: X, y: y + 36, 'font-size': 11.5, fill: 'var(--flauw)' }));
    }

    const grenzen = scenario.grenzen.length ? scenario.grenzen.join(', ') : 'geen';
    delen.push(trefvlak(0, y - 18, breedte, REGEL - 4,
      `<b>${scenario.naam}</b><br>grenzen: ${grenzen}<br>` +
      `${scenario.over} plekken blijven over` +
      (scenario.beste ? `<br>hoogste score: ${scenario.beste} (${scenario.bestescore})` : '')));
  });

  return doek(breedte, hoogte, 'aantal plekken dat overblijft per scenario', delen.join(''));
}
