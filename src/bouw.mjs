#!/usr/bin/env node
/**
 * Bouwt de pagina uit `inhoud/`: dist/index.html, de locatiezeef.
 *
 *   node src/bouw.mjs                          met de instellingen uit 01-instellingen.md
 *   node src/bouw.mjs --methode gemiddelde     eenmalig met de andere weegmethode
 *   node src/bouw.mjs --uit dist/proef.html    ander doel, laat dist/index.html met rust
 *
 * De bouw stopt bij de eerste fout in de inhoud en noemt bestand en regel. Dat is met
 * opzet: een pagina die stil doorbouwt met een stelling die nergens bij hoort, is
 * gevaarlijker dan een bouw die weigert.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { laadInhoud } from './inhoud.mjs';
import { bouwStijl, lettertype } from './stijl.mjs';
import { bouwPagina } from './pagina.mjs';
import {
  groepsgewicht, perStelling, trechter as trechterCijfers,
  themadekking, kerncijfers, wegingsverschil, kandidaatoverzicht, leadoverzicht,
} from './statistiek.mjs';
import { ladder } from './panelen/ladder.mjs';
import { themas as themapaneel } from './panelen/themas.mjs';
import { trechter as trechterpaneel } from './panelen/trechter.mjs';
import { topvijf as topvijfpaneel } from './panelen/topvijf.mjs';
import { wegingen as wegingenpaneel } from './panelen/wegingen.mjs';
import { kandidaten as kandidatenpaneel } from './panelen/kandidaten.mjs';
import { leads as leadspaneel } from './panelen/leads.mjs';

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

/**
 * Bouwt de pagina en geeft alles terug wat onderweg is uitgerekend.
 *
 * `schrijf: false` rekent en tekent wel, maar raakt de schijf niet. De testbundel
 * roept deze functie twee keer aan, ook met de andere weegmethode; zou dat naar
 * `dist/` schrijven, dan zou `npm test` de meegecommitte bouw stilletjes vervangen
 * door een bouw met andere instellingen. Dat is hier eerder gebeurd.
 */
export function bouw({ methode = null, doel = 'dist/index.html', schrijf = true } = {}) {
  const inhoud = laadInhoud(WORTEL);
  const waarschuwingen = [];

  // Instellingen mogen eenmalig van de opdrachtregel komen, zonder het bestand te wijzigen.
  if (methode) inhoud.instellingen.weegmethode = methode;

  // ------------------------------------------------------------------ rekenen
  const gewicht = groepsgewicht(
    inhoud.leden, inhoud.stellingen, inhoud.themas, inhoud.instellingen.weegmethode);
  const stellingen = perStelling(inhoud).map((s) => ({ ...s, aantalLeden: inhoud.leden.length }));
  const dekking = themadekking(inhoud);
  const scenarios = trechterCijfers(inhoud, gewicht);
  const cijfers = kerncijfers(inhoud, gewicht, stellingen);
  const verschillen = wegingsverschil(inhoud.scoremodel, inhoud.themas, gewicht);
  const overzicht = kandidaatoverzicht(inhoud.kandidaten);
  const zones = leadoverzicht(inhoud.leads);

  const aantalPlekken = inhoud.themascores.filter((l) => l.soort !== 'archetype').length;

  // ------------------------------------------------------------------- stijl
  const letter = lettertype(WORTEL, inhoud.huisstijl);
  if (letter.ontbreekt) {
    waarschuwingen.push(
      `Het display-lettertype staat op insluiten, maar ${inhoud.huisstijl['lettertype-bestand']}` +
      ' ontbreekt. De pagina gebruikt nu de terugvalletter.');
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
      { breedte: breed, aantalPlekken }),
    trechter: trechterpaneel(scenarios),
    topvijf: topvijfpaneel(stellingen, { aantalLeden: inhoud.leden.length }),
    wegingen: wegingenpaneel(verschillen, { breedte: breed }),
    kandidaten: kandidatenpaneel(inhoud.kandidaten, { breedte: breed }),
    leads: leadspaneel(zones, { breedte: breed, totaal: inhoud.leads.length }),
  };

  // ------------------------------------------------------------------ pagina
  const html = bouwPagina({ wortel: WORTEL, inhoud, panelen, cijfers, stellingen,
    gewicht, dekking, overzicht, css, waarschuwingen });
  const pad = join(WORTEL, doel);
  if (schrijf) {
    mkdirSync(dirname(pad), { recursive: true });
    writeFileSync(pad, html, 'utf8');
  }

  return { pad, html, gewicht, stellingen, scenarios, cijfers, dekking, verschillen,
    overzicht, zones, inhoud };
}

// Alleen uitvoeren als dit bestand rechtstreeks wordt aangeroepen, niet bij importeren.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const opties = leesArgumenten(process.argv.slice(2));
    const uitkomst = bouw(opties);
    console.log(`gebouwd: ${opties.doel} (${Math.round(uitkomst.html.length / 1024)} kB)`);
    console.log(`  weegmethode      ${uitkomst.inhoud.instellingen.weegmethode}`);
    console.log(`  leden            ${uitkomst.inhoud.leden.length}`);
    console.log(`  stellingen       ${uitkomst.stellingen.length}`);
    console.log(`  gescoorde plekken ${uitkomst.inhoud.themascores.filter((l) => l.soort !== 'archetype').length}`);
    console.log(`  gewicht zonder dekking  ${uitkomst.cijfers.zonderDekking.toFixed(1)}%`);
    console.log(`  kandidaten       ${uitkomst.overzicht.totaal}` +
      ` (${uitkomst.overzicht.metThemascores} met themascores)`);
    console.log(`  perceel-leads    ${uitkomst.inhoud.leads.length}`);
    console.log(`  grootste wegingsverschil  ${uitkomst.verschillen[0].naam}` +
      `, ${uitkomst.verschillen[0].verschil.toFixed(1)} punten`);
  } catch (fout) {
    console.error(`\nBouw gestopt.\n  ${fout.message}\n`);
    process.exitCode = 1;
  }
}
