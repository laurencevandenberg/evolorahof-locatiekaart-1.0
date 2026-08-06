/**
 * Bouwt het stijlblad uit `inhoud/00-huisstijl.md`.
 *
 * Elke kleur uit die tabel wordt een CSS-variabele. Niets in de grafieken noemt een
 * kleur rechtstreeks: ze verwijzen allemaal naar `var(--terra)` en dergelijke, zodat
 * één regel in het Markdown-bestand het hele dashboard omzet, inclusief donkere modus.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Zet een kleurtabel om naar CSS-variabelen. */
const variabelen = (kleuren, ramp) => [
  ...Object.entries(kleuren).map(([sleutel, waarde]) => `  --${sleutel}: ${waarde};`),
  ...ramp.map((waarde, i) => `  --ramp${i + 1}: ${waarde};`),
].join('\n');

/**
 * Haalt het display-lettertype op als de huisstijl daarom vraagt en het bestand bestaat.
 * De letter die Evolorahof gebruikt is commercieel gelicentieerd en staat daarom niet
 * in deze repository; zie `assets/lettertype/LEESMIJ.md`. Ontbreekt hij, dan valt het
 * dashboard stil terug op de fallback en gaat de bouw gewoon door.
 */
export function lettertype(wortel, huisstijl) {
  if (huisstijl['lettertype-insluiten'] !== true) return { css: '', ingesloten: false };
  const pad = join(wortel, huisstijl['lettertype-bestand'] ?? '');
  if (!existsSync(pad)) return { css: '', ingesloten: false, ontbreekt: pad };
  return { css: readFileSync(pad, 'utf8'), ingesloten: true };
}

export function bouwStijl(huisstijl, lettertypeCss) {
  const { licht, donker, ramp, maat } = huisstijl;
  const display = huisstijl['display-fallback'];
  const tekstletter = huisstijl['tekst-fallback'];
  const displayStapel = lettertypeCss ? `"Evolorahof Display", ${display}` : display;

  return `${lettertypeCss}
:root {
${variabelen(licht, ramp.licht)}
  --paginabreedte: ${maat.paginabreedte}px;
  --hoekstraal: ${maat.hoekstraal}px;
  --display: ${displayStapel};
  --tekst: ${tekstletter};
}
:root[data-modus="donker"] {
${variabelen(donker, ramp.donker)}
}

* { box-sizing: border-box; }
html { color-scheme: light dark; }
body {
  margin: 0; background: var(--oppervlak); color: var(--inkt);
  font: 15px/1.55 var(--tekst);
  -webkit-font-smoothing: antialiased;
}
main { max-width: var(--paginabreedte); margin: 0 auto; padding: 30px 24px 90px; }

/* ---------------------------------------------------------------- typografie */
.kicker {
  font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
  color: var(--terra); margin: 0 0 3px;
}
h1 {
  font-family: var(--display); font-weight: 400; font-size: 42px;
  text-transform: lowercase; margin: 0 0 8px; line-height: 1.08;
}
h1 .accent { color: var(--terra); }
h2 {
  font-family: var(--display); font-weight: 400; font-size: 25px;
  text-transform: lowercase; margin: 0 0 4px;
}
.sub { color: var(--gedempt); margin: 0 0 8px; max-width: 660px; }
.uitleg { font-size: 13px; color: var(--gedempt); margin: 0 0 16px; max-width: 800px; }
.uitleg b { color: var(--inkt); }

/* --------------------------------------------------------------------- vlakken */
.paneel {
  background: var(--paneel); border: 1px solid var(--rand); border-radius: var(--hoekstraal);
  padding: 22px 24px 24px; margin-bottom: 20px;
}
.kop {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 20px; flex-wrap: wrap; margin-bottom: 22px;
}
.tweeluik { display: grid; grid-template-columns: 1.15fr 1fr; gap: 20px; align-items: start; }

/* --------------------------------------------------------------------- knoppen */
.knop {
  font: 700 12px var(--tekst); padding: 8px 15px; cursor: pointer;
  border: 1px solid var(--rand); border-radius: 999px;
  background: var(--paneel); color: var(--gedempt);
}
.knop:hover { border-color: var(--gedempt); }
.knop:focus-visible { outline: 2px solid var(--terra); outline-offset: 2px; }
.knop[aria-pressed="true"] { background: var(--inkt); border-color: var(--inkt); color: var(--oppervlak); }

/* ------------------------------------------------------------------ kerncijfers */
.cijfers { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.tegel {
  background: var(--paneel); border: 1px solid var(--rand);
  border-radius: var(--hoekstraal); padding: 18px 20px;
}
.tegel .label { font-size: 12.5px; color: var(--gedempt); margin-bottom: 6px; }
.tegel .waarde { font-size: 34px; font-weight: 600; line-height: 1; letter-spacing: -.02em; }
.tegel.held .waarde { font-size: 56px; }
.tegel .waarde.let { color: var(--terra); }
.tegel .bij { font-size: 12px; color: var(--flauw); margin-top: 7px; }

/* -------------------------------------------------------------------- legenda's */
.legenda {
  display: flex; gap: 18px; flex-wrap: wrap; font-size: 12.5px;
  color: var(--gedempt); margin: 0 0 14px;
}
.legenda .sleutel { display: inline-flex; align-items: center; gap: 7px; }
.legenda i { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.legenda i.vierkant { border-radius: 2px; }

/* --------------------------------------------------------------------- grafiek */
svg { display: block; max-width: 100%; height: auto; }
svg text { font-family: var(--tekst); }
svg [data-tip] { cursor: default; }
svg [data-tip]:focus-visible { outline: 2px solid var(--terra); }

/* --------------------------------------------------------------------- tooltip */
#tip {
  position: fixed; z-index: 50; pointer-events: none; opacity: 0;
  background: var(--inkt); color: var(--oppervlak); border-radius: 8px;
  padding: 9px 12px; font-size: 12.5px; line-height: 1.45; max-width: 330px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, .18); transition: opacity .12s;
}
#tip b { color: var(--paneel); }
:root[data-modus="donker"] #tip { background: #0f0e0c; color: var(--inkt); }
:root[data-modus="donker"] #tip b { color: #ffffff; }

/* ----------------------------------------------------------------------- tabel */
.tabelhouder { overflow-x: auto; }
table.data {
  width: 100%; min-width: 720px; border-collapse: collapse;
  font-size: 13px; font-variant-numeric: tabular-nums;
}
table.data th {
  text-align: left; font-size: 11px; letter-spacing: .07em; text-transform: uppercase;
  color: var(--flauw); font-weight: 700; padding: 7px 10px 7px 0;
  border-bottom: 1px solid var(--rand);
}
table.data td { padding: 6px 10px 6px 0; border-bottom: 1px solid var(--raster); vertical-align: top; }
table.data td.num { text-align: right; }
table.data tr.let td { background: color-mix(in srgb, var(--terra) 7%, transparent); }

/* ------------------------------------------------------------------- diversen */
.verborgen { display: none; }
.voet { font-size: 12px; color: var(--flauw); line-height: 1.6; }
.voet b { color: var(--gedempt); }
.waarschuwing {
  border-left: 3px solid var(--terra); background: var(--verdiept);
  padding: 10px 14px; border-radius: 0 8px 8px 0; font-size: 12.5px;
  color: var(--gedempt); margin: 0 0 18px;
}

@media (max-width: 860px) {
  .cijfers { grid-template-columns: 1fr 1fr; }
  .tweeluik { grid-template-columns: 1fr; }
  h1 { font-size: 32px; }
}
@media print {
  .knop, #tip { display: none; }
  .paneel { break-inside: avoid; }
}`;
}
