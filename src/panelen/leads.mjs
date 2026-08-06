/**
 * De perceel-leads per zoekzone.
 *
 * Dit is de onderste laag van de verkenning: percelen van 1,5 tot 2 hectare uit de
 * Kadastrale Kaart, in twaalf zoekzones. Van deze percelen is alleen ligging en
 * oppervlakte bekend. Geen eigenaar, geen bestemming, geen netcapaciteit.
 *
 * De balk is het aantal leads per zone. Het staafje erachter toont de mediaan van de
 * oppervlakte binnen die zone, op een vaste schaal van 1,5 tot 2 hectare, zodat je ziet
 * of een zone vooral aan de krappe of aan de ruime kant zit.
 *
 * Let bij het lezen op de verhouding: 283 leads tegenover 48 kandidaten tegenover 12
 * plekken met themascores. De trechter is aan de bovenkant heel breed en aan de
 * onderkant heel smal, en dat is de eigenlijke stand van het zoekwerk.
 */
import { doek, tag, tekst, balk, trefvlak, getal } from '../svg.mjs';

const X_NAAM = 240;
const BALK = 300;
const SPREIDING = 150;
const REGEL = 28;
const MIN_HA = 1.5;
const MAX_HA = 2.0;

export function leads(zones, { breedte, totaal }) {
  const hoogte = 30 + zones.length * REGEL + 16;
  const maxAantal = Math.max(...zones.map((z) => z.aantal));
  const xSpreiding = X_NAAM + BALK + 96;
  const delen = [];

  delen.push(tekst('AANTAL PERCEEL-LEADS',
    { x: X_NAAM, y: 16, 'font-size': 11, fill: 'var(--flauw)' }));
  delen.push(tekst('OPPERVLAKTE, 1,5 TOT 2 HA',
    { x: xSpreiding, y: 16, 'font-size': 11, fill: 'var(--flauw)' }));

  zones.forEach((zone, i) => {
    const y = 30 + i * REGEL + 12;
    const lengte = (zone.aantal / maxAantal) * BALK;

    delen.push(tekst(zone.zoekzone,
      { x: X_NAAM - 12, y: y + 4, 'text-anchor': 'end', 'font-size': 12.5, fill: 'var(--inkt)' }));
    delen.push(balk(X_NAAM, y - 6, lengte, 12, 'var(--ramp3)'));
    delen.push(tekst(String(zone.aantal),
      { x: X_NAAM + lengte + 9, y: y + 4, 'font-size': 12, fill: 'var(--gedempt)' }));

    // spreiding van klein naar groot, met de mediaan als streepje
    const naarX = (ha) => xSpreiding + ((ha - MIN_HA) / (MAX_HA - MIN_HA)) * SPREIDING;
    delen.push(tag('line', {
      x1: naarX(zone.kleinste), x2: naarX(zone.grootste), y1: y, y2: y,
      stroke: 'var(--raster)', 'stroke-width': 4, 'stroke-linecap': 'round',
    }));
    delen.push(tag('line', {
      x1: naarX(zone.mediaan), x2: naarX(zone.mediaan), y1: y - 5, y2: y + 5,
      stroke: 'var(--ramp4)', 'stroke-width': 2.5,
    }));
    delen.push(tekst(`${getal(zone.mediaan, 2)} ha`,
      { x: xSpreiding + SPREIDING + 12, y: y + 4, 'font-size': 11.5, fill: 'var(--gedempt)' }));

    delen.push(trefvlak(0, y - REGEL / 2, breedte, REGEL,
      `<b>${zone.zoekzone}</b> · regio ${zone.regio}<br><br>` +
      `${zone.aantal} percelen van de juiste maat ` +
      `(${((zone.aantal / totaal) * 100).toFixed(0)} procent van alle leads)<br>` +
      `van ${getal(zone.kleinste, 2)} tot ${getal(zone.grootste, 2)} hectare, ` +
      `mediaan ${getal(zone.mediaan, 2)}<br><br>` +
      '<i>ligging en oppervlakte zijn bekend; eigenaar, bestemming en netcapaciteit niet</i>'));
  });

  return doek(breedte, hoogte, 'perceel-leads per zoekzone', delen.join(''));
}
