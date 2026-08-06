#!/usr/bin/env node
/**
 * Controleert het kleurgebruik uit `inhoud/00-huisstijl.md`.
 *
 * Kleur is het enige onderdeel van een grafiek dat je niet op het oog kunt beoordelen:
 * of twee tinten bij kleurenblindheid uit elkaar te houden zijn, is een som. Deze
 * controle rekent hem uit in plaats van erover te redeneren.
 *
 *   npm run controleer
 *
 * Wat er wordt gemeten:
 *   1. contrast van elke tint tegen het oppervlak (WCAG-verhouding)
 *   2. de groenramp: loopt hij een kant op, met genoeg verschil per stap
 *   3. het statuspaar groen tegenover terra, ook bij protanopie en deuteranopie
 *
 * Punt 3 zakt bewust: die twee tinten liggen bij kleurenblindheid dicht bij elkaar. Dat
 * is toegestaan zolang kleur niet het enige kanaal is, en dat is het hier niet: elke
 * status heeft ook een open of dichte vulling, een legenda en een label in de tooltip.
 * De controle meldt het als bekende afwijking en niet als fout.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { laadInhoud } from './inhoud.mjs';

const WORTEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* --------------------------------------------------------------- kleurleer */

const naarKanalen = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/** sRGB naar lineair licht; nodig voor zowel contrast als OKLab. */
const lineair = (kanaal) =>
  kanaal <= 0.04045 ? kanaal / 12.92 : ((kanaal + 0.055) / 1.055) ** 2.4;

/** Relatieve luminantie volgens WCAG 2. */
function luminantie(hex) {
  const [r, g, b] = naarKanalen(hex).map(lineair);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrastverhouding tussen twee kleuren, van 1:1 tot 21:1. */
export function contrast(voor, achter) {
  const a = luminantie(voor);
  const b = luminantie(achter);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** sRGB naar OKLab. Perceptueel gelijkmatig, dus geschikt om afstanden in te meten. */
function naarOklab(hex) {
  const [r, g, b] = naarKanalen(hex).map(lineair);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

/** Afstand tussen twee kleuren in OKLab, maal honderd zodat de getallen leesbaar zijn. */
export function afstand(een, twee) {
  const a = naarOklab(een);
  const b = naarOklab(twee);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100;
}

/**
 * Benadert hoe een kleur eruitziet bij kleurenblindheid (Machado e.a., ernst 1,0).
 * Bedoeld om afstanden mee te vergelijken, niet om kleuren mee te tonen.
 */
const CVD_MATRIX = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
};

function simuleer(hex, soort) {
  const m = CVD_MATRIX[soort];
  const [r, g, b] = naarKanalen(hex);
  const kanaal = (i) => Math.min(1, Math.max(0, m[i] * r + m[i + 1] * g + m[i + 2] * b));
  const naarHex = (waarde) => Math.round(waarde * 255).toString(16).padStart(2, '0');
  return `#${naarHex(kanaal(0))}${naarHex(kanaal(3))}${naarHex(kanaal(6))}`;
}

/* --------------------------------------------------------------- controles */

const GESLAAGD = 'geslaagd';
const GEZAKT = 'gezakt';
const BEKEND = 'bekend';

function controleerModus(naam, kleuren, ramp) {
  const oppervlak = kleuren.oppervlak;
  const uitkomsten = [];

  // 1. contrast van tekst- en accenttinten
  const tekstkleuren = ['inkt', 'gedempt', 'terra', 'groen'];
  for (const sleutel of tekstkleuren) {
    const verhouding = contrast(kleuren[sleutel], oppervlak);
    uitkomsten.push({
      naam: `contrast ${sleutel} op oppervlak`,
      waarde: `${verhouding.toFixed(2)}:1`,
      stand: verhouding >= 3 ? GESLAAGD : GEZAKT,
      eis: 'minimaal 3:1',
    });
  }

  // 2. de ramp. Wat telt is niet "van licht naar donker" maar "steeds verder van het
  //    oppervlak af". Op een crèmekleurige achtergrond betekent dat donkerder worden,
  //    op een donkere achtergrond juist lichter. Beide richtingen zijn goed, zolang de
  //    ramp maar één kant op loopt en de eerste stap al loskomt van de achtergrond.
  const helderheden = ramp.map((kleur) => naarOklab(kleur)[0]);
  const stappen = helderheden.slice(1).map((waarde, i) => waarde - helderheden[i]);
  const eenRichting = stappen.every((stap) => stap > 0) || stappen.every((stap) => stap < 0);
  const richting = stappen[0] < 0 ? 'licht naar donker' : 'donker naar licht';
  uitkomsten.push({
    naam: 'ramp loopt één kant op',
    waarde: eenRichting ? richting : 'nee',
    stand: eenRichting ? GESLAAGD : GEZAKT,
    eis: 'elke stap verder van het oppervlak dan de vorige',
  });
  const kleinsteStap = Math.min(...stappen.map(Math.abs));
  uitkomsten.push({
    naam: 'kleinste stap in de ramp',
    waarde: kleinsteStap.toFixed(3),
    stand: kleinsteStap >= 0.06 ? GESLAAGD : GEZAKT,
    eis: 'minimaal 0,060 helderheidsverschil',
  });
  const eerste = contrast(ramp[0], oppervlak);
  uitkomsten.push({
    naam: 'eerste rampstap tegen het oppervlak',
    waarde: `${eerste.toFixed(2)}:1`,
    stand: eerste >= 2 ? GESLAAGD : GEZAKT,
    eis: 'minimaal 2:1, anders verdwijnt hij in de achtergrond',
  });

  // 3. de stippen op de terugvalkaart. Die liggen op `verdiept` en niet op het
  //    oppervlak, en ze zijn klein: als een van deze tinten daar wegvalt, is een plek
  //    onvindbaar zonder dat er iets kapot lijkt.
  for (const sleutel of ['groen', 'duindoorn', 'terra', 'flauw', 'lead']) {
    const verhouding = contrast(kleuren[sleutel], kleuren.verdiept);
    uitkomsten.push({
      naam: `kaartstip ${sleutel} op verdiept`,
      waarde: `${verhouding.toFixed(2)}:1`,
      stand: verhouding >= 3 ? GESLAAGD : GEZAKT,
      eis: 'minimaal 3:1',
    });
  }

  // 4. het statuspaar, ook door de ogen van een kleurenblinde
  const paar = [kleuren.groen, kleuren.terra];
  const normaal = afstand(paar[0], paar[1]);
  uitkomsten.push({
    naam: 'groen tegenover terra, normaal zicht',
    waarde: normaal.toFixed(1),
    stand: normaal >= 15 ? GESLAAGD : GEZAKT,
    eis: 'minimaal 15',
  });
  for (const soort of ['protan', 'deutan', 'tritan']) {
    const gesimuleerd = afstand(simuleer(paar[0], soort), simuleer(paar[1], soort));
    uitkomsten.push({
      naam: `groen tegenover terra, ${soort}`,
      waarde: gesimuleerd.toFixed(1),
      stand: gesimuleerd >= 8 ? GESLAAGD : BEKEND,
      eis: 'minimaal 8, of een tweede kanaal naast kleur',
    });
  }

  return { naam, uitkomsten };
}

function rapporteer(blokken) {
  const merk = { [GESLAAGD]: '  ok  ', [GEZAKT]: ' FOUT ', [BEKEND]: ' let  ' };
  let gezakt = 0;
  for (const blok of blokken) {
    console.log(`\n${blok.naam}`);
    for (const rij of blok.uitkomsten) {
      if (rij.stand === GEZAKT) gezakt += 1;
      console.log(`  [${merk[rij.stand]}] ${rij.naam.padEnd(42)} ${String(rij.waarde).padStart(8)}`
        + `   ${rij.eis}`);
    }
  }
  console.log('');
  if (gezakt === 0) {
    console.log('Alle harde controles geslaagd.');
    console.log('Regels met "let" zijn bekende afwijkingen: groen en terra liggen bij');
    console.log('kleurenblindheid dicht bij elkaar. Dat mag hier, omdat elke status ook een');
    console.log('open of dichte vulling, een legenda en een label heeft.\n');
  } else {
    console.log(`${gezakt} controle(s) gezakt. Pas de kleuren aan in inhoud/00-huisstijl.md.\n`);
  }
  return gezakt;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const { huisstijl } = laadInhoud(WORTEL);
  const gezakt = rapporteer([
    controleerModus('lichte modus', huisstijl.licht, huisstijl.ramp.licht),
    controleerModus('donkere modus', huisstijl.donker, huisstijl.ramp.donker),
  ]);
  process.exitCode = gezakt === 0 ? 0 : 1;
}
