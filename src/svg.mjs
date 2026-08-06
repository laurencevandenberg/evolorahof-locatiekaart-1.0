/**
 * Kleine hulpjes om SVG als tekst te bouwen.
 *
 * De grafieken worden bij het bouwen gemaakt, niet in de browser. Daardoor is het
 * dashboard leesbaar zonder JavaScript, laadt het meteen, en kun je de uitvoer in git
 * vergelijken. De JavaScript die wel meegaat doet alleen de tooltips, de donkere modus
 * en de tabelknop.
 */
import { escapeHtml } from './markdown.mjs';

/**
 * Bouwt één SVG-element.
 * Attributen met waarde `null` of `undefined` worden weggelaten, zodat aanroepers
 * niet steeds hoeven te controleren of iets gezet moet worden.
 */
export function tag(naam, kenmerken = {}, inhoud = '') {
  const attributen = Object.entries(kenmerken)
    .filter(([, waarde]) => waarde !== null && waarde !== undefined && waarde !== '')
    .map(([sleutel, waarde]) => `${sleutel}="${escapeHtml(waarde)}"`)
    .join(' ');
  const open = attributen ? `<${naam} ${attributen}` : `<${naam}`;
  return inhoud === '' ? `${open}/>` : `${open}>${inhoud}</${naam}>`;
}

/** Tekstelement. De inhoud wordt altijd ge-escaped: stellingteksten bevatten aanhalingstekens. */
export const tekst = (inhoud, kenmerken = {}) =>
  tag('text', kenmerken, escapeHtml(inhoud));

/** Rechthoek met vierkante aanzet op de nullijn, zodat de balk vastzit aan zijn as. */
export function balk(x, y, breedte, hoogte, kleur, straal = 4) {
  const lengte = Math.max(breedte, 2);
  return tag('rect', { x, y, width: lengte, height: hoogte, rx: straal, fill: kleur })
       + tag('rect', { x, y, width: Math.min(straal, lengte), height: hoogte, fill: kleur });
}

/** Onzichtbaar trefvlak met een tooltip eraan; ruimer dan de tekening zelf. */
export const trefvlak = (x, y, breedte, hoogte, tip) =>
  tag('rect', { x, y, width: breedte, height: hoogte, fill: 'transparent',
                'data-tip': tip, tabindex: '0' });

/** Buitenste svg-omhulsel met een toegankelijk label. */
export const doek = (breedte, hoogte, label, inhoud) =>
  tag('svg', {
    viewBox: `0 0 ${breedte} ${hoogte}`, width: breedte, height: hoogte,
    role: 'img', 'aria-label': label,
  }, inhoud);

/** Kort een tekst af op hele woorden, met een beletselteken. */
export function kort(waarde, lengte) {
  if (waarde.length <= lengte) return waarde;
  return `${waarde.slice(0, lengte - 1).replace(/[\s,.;:]+$/, '')}…`;
}

/** Nederlandse notatie: komma als decimaalteken. */
export const getal = (waarde, decimalen = 1) =>
  waarde.toFixed(decimalen).replace('.', ',');
