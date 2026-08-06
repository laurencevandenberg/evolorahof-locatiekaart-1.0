/**
 * De ladder: hoe eensgezind de groep per stelling is.
 *
 * Twee blokken naast elkaar, en dat is een bewuste keuze.
 *
 * Links staat elke stelling op zijn **werkelijke** hoogte op de as. Daar lees je de
 * afstanden en de gaten: twee eenzame stippen bovenaan, een dichte kluit in het midden,
 * een staart naar beneden. Stippen die elkaar zouden overlappen schuiven opzij in
 * plaats van omhoog, zodat geen enkele hoogte gelogen is.
 *
 * Rechts staan dezelfde stellingen op gelijke regelafstand, leesbaar, met per stelling
 * de acht antwoorden als staafjes van laag naar hoog. Vlak betekent eensgezind, een
 * trap betekent uiteenlopend. Aanwijzen licht de bijbehorende stip links op.
 *
 * De verleiding is om links en rechts met leiderlijnen te verbinden. Dat is geprobeerd
 * en het werkt niet: bij dertig stellingen in een smalle band waaieren die lijnen zo
 * ver uit dat ze onleesbaar worden en de onderste rijen hun echte hoogte verliezen.
 */
import { doek, tag, tekst, trefvlak, kort, getal } from '../svg.mjs';
import { STATUS } from './status.mjs';

/** Waar de as begint en eindigt. Iets ruimer dan de data, zodat niets de rand raakt. */
const AS_ONDER = 0.42;
const AS_BOVEN = 1.02;

/** Vaste x-posities van de twee blokken. */
const X_AS = 142;
const X_ZWERM = 160;
const ZWERM_BREEDTE = 74;
const X_NUMMER = 268;
const X_STAAFJES = 282;
const X_TEKST = 372;

/** De ijkpunten op de as, met alleen bij de uitersten een woord erbij. */
const IJKPUNTEN = [
  [1.0, 'iedereen hetzelfde'], [0.9, ''], [0.8, ''],
  [0.7, 'flink verschil'], [0.6, ''], [0.5, ''], [0.43, 'precies in tweeën'],
];

export function ladder(stellingen, { breedte, regelhoogte, teksten }) {
  const rijen = [...stellingen].sort(
    (a, b) => b.eensgezindheid - a.eensgezindheid || b.gemiddelde - a.gemiddelde);

  const boven = 30;
  const onder = 20;
  const plothoogte = rijen.length * regelhoogte;
  const hoogte = boven + plothoogte + onder;
  const yVan = (waarde) => boven + ((AS_BOVEN - waarde) / (AS_BOVEN - AS_ONDER)) * plothoogte;

  // Stippen die binnen elf pixels van elkaar liggen krijgen een stapje opzij, zodat de
  // hoogte klopt en ze toch alle dertig zichtbaar blijven.
  const geplaatst = [];
  for (const rij of rijen) {
    rij.y = yVan(rij.eensgezindheid);
    let stap = 0;
    while (geplaatst.some((p) => Math.abs(p.y - rij.y) < 11 && p.stap === stap)) stap += 1;
    rij.stap = stap;
    geplaatst.push({ y: rij.y, stap });
  }
  const maxStap = Math.max(...rijen.map((r) => r.stap), 1);
  const stapbreedte = Math.min(13, ZWERM_BREEDTE / (maxStap + 1));

  const delen = [];

  // ---------------------------------------------------------------- de as
  delen.push(tekst('EENSGEZINDHEID',
    { x: X_AS - 8, y: 14, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--flauw)' }));
  delen.push(tekst('ERG ONEENS  →  ERG EENS',
    { x: X_STAAFJES, y: 14, 'font-size': 11, fill: 'var(--flauw)' }));

  for (const [waarde, naam] of IJKPUNTEN) {
    const y = yVan(waarde);
    delen.push(tag('line', { x1: X_AS - 2, x2: X_ZWERM + ZWERM_BREEDTE, y1: y, y2: y,
      stroke: 'var(--raster)', 'stroke-width': 1 }));
    delen.push(tekst(`${Math.round(waarde * 100)}%`,
      { x: X_AS - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--flauw)' }));
    if (naam) {
      delen.push(tekst(naam,
        { x: X_AS - 8, y: y + 16, 'text-anchor': 'end', 'font-size': 10, fill: 'var(--flauw)' }));
    }
  }

  // ------------------------------------------------------------- de rijen
  rijen.forEach((rij, i) => {
    const stijl = STATUS[rij.status];
    const yRij = boven + i * regelhoogte + regelhoogte / 2;
    const tip = tooltip(rij, teksten);

    // stip links, op de echte hoogte
    delen.push(tag('circle', {
      cx: X_ZWERM + rij.stap * stapbreedte, cy: rij.y, r: 5,
      fill: stijl.dicht ? stijl.kleur : 'var(--paneel)',
      stroke: stijl.kleur, 'stroke-width': 2,
      'data-tip': tip, 'data-stip': rij.nr, tabindex: '0',
    }));

    delen.push(tekst(String(rij.nr),
      { x: X_NUMMER, y: yRij + 4, 'text-anchor': 'end', 'font-size': 11.5, fill: 'var(--flauw)' }));

    // acht staafjes, gesorteerd van laag naar hoog
    const gesorteerd = [...rij.antwoorden].sort((a, b) => a - b);
    const basis = yRij + 8;
    const pitch = 7.4;
    gesorteerd.forEach((antwoord, k) => {
      const staafhoogte = 3 + antwoord * 4.2;
      delen.push(tag('rect', {
        x: X_STAAFJES + k * pitch, y: basis - staafhoogte,
        width: pitch - 2, height: staafhoogte, rx: 1.5,
        fill: stijl.kleur, opacity: antwoord <= 1 ? 0.45 : 0.95,
      }));
    });
    delen.push(tag('line', {
      x1: X_STAAFJES, x2: X_STAAFJES + gesorteerd.length * pitch - 2,
      y1: basis + 1.5, y2: basis + 1.5, stroke: 'var(--raster)', 'stroke-width': 1,
    }));

    delen.push(tekst(kort(rij.tekst, 92),
      { x: X_TEKST, y: yRij + 4, 'font-size': 12.5, fill: 'var(--inkt)' }));
    delen.push(tekst(`${rij.voor} voor · ${rij.tegen} tegen`,
      { x: breedte - 14, y: yRij + 4, 'text-anchor': 'end', 'font-size': 11.5, fill: 'var(--gedempt)' }));

    delen.push(trefvlak(X_NUMMER - 22, yRij - regelhoogte / 2,
      breedte - X_NUMMER + 14, regelhoogte, tip)
      .replace('/>', ` data-stip="${rij.nr}"/>`));
  });

  return doek(breedte, hoogte, 'eensgezindheid per stelling', delen.join(''));
}

/** De tooltiptekst; html is toegestaan omdat de tooltip als html wordt gezet. */
function tooltip(rij, teksten) {
  const regels = [
    `<b>Stelling ${rij.nr}</b> · ${rij.themanaam}`,
    rij.tekst,
    '',
    `eensgezindheid <b>${Math.round(rij.eensgezindheid * 100)}%</b>` +
      ` · gemiddelde <b>${getal(rij.gemiddelde, 2)}</b>`,
    `${rij.voor} voor, ${rij.tegen} tegen` +
      (rij.ingevuld < rij.aantalLeden ? ` (${rij.ingevuld} van ${rij.aantalLeden} ingevuld)` : ''),
    teksten[STATUS[rij.status].sleutel],
  ];
  if (rij.topvijf) regels.push(`in ${rij.topvijf} van de topvijven`);
  if (!rij.zeeft) {
    regels.push('<i>thema nergens gescoord: deze stelling kan geen plek laten afvallen</i>');
  }
  return regels.join('<br>');
}
