#!/usr/bin/env node
/**
 * Bouwt het dashboard: leest `inhoud/`, rekent, en schrijft `dist/index.html`.
 *
 *   node src/bouw.mjs                 bouwt met de instellingen uit 01-instellingen.md
 *   node src/bouw.mjs --methode gemiddelde   bouwt eenmalig met de andere weegmethode
 *   node src/bouw.mjs --uit dist/vergelijk.html
 *
 * De bouw stopt bij de eerste fout in de inhoud en noemt bestand en regel. Dat is met
 * opzet: een dashboard dat stil doorbouwt met een stelling die nergens bij hoort, is
 * gevaarlijker dan een bouw die weigert.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { laadInhoud } from './inhoud.mjs';
import { bouwStijl, lettertype } from './stijl.mjs';
import { bouwPagina } from './sjabloon.mjs';
import {
  groepsgewicht, perStelling, perLocatie, trechter as trechterCijfers,
  themadekking, kerncijfers,
} from './bereken.mjs';
import { ladder } from './panelen/ladder.mjs';
import { themas as themapaneel } from './panelen/themas.mjs';
import { trechter as trechterpaneel } from './panelen/trechter.mjs';
import { topvijf as topvijfpaneel } from './panelen/topvijf.mjs';
import { plekken as plekkenpaneel } from './panelen/plekken.mjs';

const WORTEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Leest de vlaggen van de opdrachtregel. */
function leesArgumenten(argv) {
  const uit = { methode: null, doel: 'dist/index.html' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--methode') uit.methode = argv[i + 1];
    if (argv[i] === '--uit') uit.doel = argv[i + 1];
  }
  return uit;
}

export function bouw({ methode = null, doel = 'dist/index.html' } = {}) {
  const inhoud = laadInhoud(WORTEL);
  const waarschuwingen = [];

  // Instellingen mogen eenmalig van de opdrachtregel komen, zonder het bestand te wijzigen.
  if (methode) inhoud.instellingen.weegmethode = methode;

  // ------------------------------------------------------------------ rekenen
  const gewicht = groepsgewicht(
    inhoud.leden, inhoud.stellingen, inhoud.themas, inhoud.instellingen.weegmethode);
  const stellingen = perStelling(inhoud).map((s) => ({ ...s, aantalLeden: inhoud.leden.length }));
  const dekking = themadekking(inhoud);
  const locaties = perLocatie(inhoud, gewicht)
    .map((l) => ({ ...l, aantalThemas: inhoud.themas.length }));
  const scenarios = trechterCijfers(inhoud, gewicht);
  const cijfers = kerncijfers(inhoud, gewicht, stellingen);

  const aantalKandidaten = inhoud.locaties.filter((l) => l.soort !== 'archetype').length;

  // ------------------------------------------------------------------- stijl
  const letter = lettertype(WORTEL, inhoud.huisstijl);
  if (letter.ontbreekt) {
    waarschuwingen.push(
      `Het display-lettertype staat op insluiten, maar ${inhoud.huisstijl['lettertype-bestand']}` +
      ' ontbreekt. Het dashboard gebruikt nu de terugvalletter.');
  }
  const css = bouwStijl(inhoud.huisstijl, letter.css);

  // ---------------------------------------------------------------- panelen
  const breed = inhoud.huisstijl.maat.grafiekbreedte;
  const panelen = {
    ladder: ladder(stellingen, {
      breedte: breed,
      regelhoogte: inhoud.huisstijl.maat['regelhoogte-ladder'],
      teksten: inhoud.teksten,
    }),
    themas: themapaneel(
      inhoud.themas.map((t) => ({ ...t, gewicht: gewicht[t.code], dekking: dekking[t.code] })),
      { breedte: breed, aantalPlekken: aantalKandidaten }),
    trechter: trechterpaneel(scenarios),
    topvijf: topvijfpaneel(stellingen, { aantalLeden: inhoud.leden.length }),
    plekken: plekkenpaneel(locaties, { breedte: breed }),
  };

  // ------------------------------------------------------------------ pagina
  const html = bouwPagina({ inhoud, panelen, cijfers, stellingen, css, waarschuwingen });
  const pad = join(WORTEL, doel);
  mkdirSync(dirname(pad), { recursive: true });
  writeFileSync(pad, html, 'utf8');

  return { pad, html, gewicht, stellingen, locaties, scenarios, cijfers, dekking, inhoud };
}

// Alleen uitvoeren als dit bestand rechtstreeks wordt aangeroepen, niet bij importeren.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const opties = leesArgumenten(process.argv.slice(2));
    const uitkomst = bouw(opties);
    const kb = Math.round(uitkomst.html.length / 1024);
    console.log(`gebouwd: ${opties.doel} (${kb} kB)`);
    console.log(`  weegmethode      ${uitkomst.inhoud.instellingen.weegmethode}`);
    console.log(`  leden            ${uitkomst.inhoud.leden.length}`);
    console.log(`  stellingen       ${uitkomst.stellingen.length}`);
    console.log(`  plekken          ${uitkomst.locaties.length}`);
    console.log(`  gewicht zonder dekking  ${uitkomst.cijfers.zonderDekking.toFixed(1)}%`);
  } catch (fout) {
    console.error(`\nBouw gestopt.\n  ${fout.message}\n`);
    process.exitCode = 1;
  }
}
