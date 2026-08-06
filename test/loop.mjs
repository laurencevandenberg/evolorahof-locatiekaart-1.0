/**
 * Piepkleine testloper. Geen afhankelijkheden, want de bouw heeft er ook geen.
 *
 * Gebruik:
 *   import { test, gelijk, bijna, gooit, rapport } from './loop.mjs';
 *   test('naam', () => { gelijk(1 + 1, 2); });
 */
const uitkomsten = [];

export function test(naam, werk) {
  try {
    werk();
    uitkomsten.push({ naam, goed: true });
  } catch (fout) {
    uitkomsten.push({ naam, goed: false, bericht: fout.message });
  }
}

/** Strikte gelijkheid, met een leesbare fout als het misgaat. */
export function gelijk(gekregen, verwacht, toelichting = '') {
  const a = JSON.stringify(gekregen);
  const b = JSON.stringify(verwacht);
  if (a !== b) {
    throw new Error(`${toelichting || 'niet gelijk'}\n    gekregen: ${a}\n    verwacht: ${b}`);
  }
}

/** Gelijkheid voor kommagetallen, binnen een marge. */
export function bijna(gekregen, verwacht, marge = 0.001, toelichting = '') {
  if (Math.abs(gekregen - verwacht) > marge) {
    throw new Error(`${toelichting || 'buiten de marge'}\n    gekregen: ${gekregen}`
      + `\n    verwacht: ${verwacht} (marge ${marge})`);
  }
}

/** Controleert dat een stuk code een fout gooit waarvan de tekst het patroon bevat. */
export function gooit(werk, patroon, toelichting = '') {
  try {
    werk();
  } catch (fout) {
    if (!new RegExp(patroon, 'i').test(fout.message)) {
      throw new Error(`${toelichting || 'verkeerde fout'}\n    gekregen: ${fout.message}`
        + `\n    verwacht patroon: ${patroon}`);
    }
    return;
  }
  throw new Error(`${toelichting || 'er werd geen fout gegooid'}, verwacht patroon: ${patroon}`);
}

/** Drukt het resultaat af en zet de afsluitcode. Roep dit aan onderaan de testbundel. */
export function rapport(titel) {
  const gezakt = uitkomsten.filter((u) => !u.goed);
  console.log(`\n${titel}`);
  for (const u of uitkomsten) {
    console.log(`  ${u.goed ? 'ok  ' : 'FOUT'}  ${u.naam}`);
    if (!u.goed) console.log(`        ${u.bericht.replace(/\n/g, '\n        ')}`);
  }
  console.log(`\n  ${uitkomsten.length - gezakt.length} van ${uitkomsten.length} geslaagd\n`);
  if (gezakt.length) process.exitCode = 1;
  uitkomsten.length = 0;
}
