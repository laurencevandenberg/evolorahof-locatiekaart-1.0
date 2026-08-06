/**
 * Twee wegingen naast elkaar: die van de groep en die van de brede locatieverkenning.
 *
 * Beide verdelen honderd punten over dezelfde negen thema's, dus ze zijn rechtstreeks
 * vergelijkbaar. Per thema staan twee stippen op één lijn: de groene is wat de groep in
 * het stellingenformulier heeft ingevuld, de grijze is wat de verkenning erop legt. De
 * lijn ertussen is het verschil.
 *
 * Is die lijn lang, dan kijken de twee modellen wezenlijk anders naar dat thema. Daar
 * zit het gesprek: de verkenning weegt of een plek haalbaar is, de groep weegt of het er
 * goed wonen is, en geen van beide modellen meet wat het andere belangrijk vindt.
 *
 * De rijen staan op grootte van het verschil, niet op alfabet of op gewicht. Het gaat
 * hier om de afwijking, dus die hoort bovenaan.
 */
import { doek, tag, tekst, trefvlak, getal } from '../svg.mjs';

const X_NAAM = 306;
const SCHAAL = 640;          // pixels voor honderd punten
const REGEL = 40;
const GROOT = 5;             // vanaf hoeveel punten verschil we het uitschrijven

export function wegingen(rijen, { breedte }) {
  const hoogte = 34 + rijen.length * REGEL + 20;
  const maximum = Math.max(...rijen.flatMap((r) => [r.groep, r.verkenning]), 20);
  const naarX = (waarde) => X_NAAM + (waarde / maximum) * SCHAAL;
  const delen = [];

  // ---- as
  // De stapgrootte volgt uit de hoogste waarde, zodat de as altijd tot aan de verste
  // stip loopt. Een vaste reeks ging hier eerder mis: de as stopte bij twintig terwijl
  // de verkenning veertig punten op één thema legt.
  const stap = maximum <= 20 ? 5 : 10;
  const stappen = [];
  for (let waarde = 0; waarde <= maximum + 1e-9; waarde += stap) stappen.push(waarde);
  for (const waarde of stappen) {
    const x = naarX(waarde);
    delen.push(tag('line', { x1: x, x2: x, y1: 26, y2: hoogte - 18,
      stroke: 'var(--raster)', 'stroke-width': 1 }));
    delen.push(tekst(String(waarde),
      { x, y: 18, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--flauw)' }));
  }
  delen.push(tekst('GEWICHT VAN HONDERD PUNTEN',
    { x: 0, y: 18, 'font-size': 11, fill: 'var(--flauw)' }));

  rijen.forEach((rij, i) => {
    const y = 40 + i * REGEL + 8;
    const xGroep = naarX(rij.groep);
    const xVerkenning = naarX(rij.verkenning);
    const groot = Math.abs(rij.verschil) >= GROOT;

    delen.push(tekst(`${rij.code} · ${rij.naam}`,
      { x: X_NAAM - 12, y: y + 4, 'text-anchor': 'end', 'font-size': 13, fill: 'var(--inkt)' }));

    // het gat tussen de twee wegingen
    delen.push(tag('line', {
      x1: xVerkenning, x2: xGroep, y1: y, y2: y,
      stroke: groot ? 'var(--terra)' : 'var(--gedempt)',
      'stroke-width': groot ? 2.5 : 1.5,
      'stroke-dasharray': groot ? null : '3 3',
    }));

    // de stip van de verkenning
    delen.push(tag('circle', {
      cx: xVerkenning, cy: y, r: 5, fill: 'var(--gedempt)',
      stroke: 'var(--paneel)', 'stroke-width': 2,
    }));

    // de stip van de groep
    delen.push(tag('circle', {
      cx: xGroep, cy: y, r: 5.5, fill: 'var(--groen)',
      stroke: 'var(--paneel)', 'stroke-width': 2,
    }));

    // het verschil in cijfers, alleen waar het ertoe doet
    if (groot) {
      const rechts = Math.max(xGroep, xVerkenning) + 12;
      delen.push(tekst(`${rij.verschil > 0 ? '+' : ''}${getal(rij.verschil)}`,
        { x: rechts, y: y + 4, 'font-size': 12, fill: 'var(--terra)', 'font-weight': 600 }));
    }

    const criteria = rij.criteria.length
      ? rij.criteria.map((c) => `· ${c}`).join('<br>')
      : '<i>de verkenning weegt niets op dit thema</i>';
    delen.push(trefvlak(0, y - REGEL / 2, breedte, REGEL,
      `<b>${rij.code} · ${rij.naam}</b><br><br>` +
      `de groep: <b>${getal(rij.groep)}</b><br>` +
      `de verkenning: <b>${getal(rij.verkenning)}</b><br><br>` +
      `criteria van de verkenning op dit thema:<br>${criteria}`));
  });

  return doek(breedte, hoogte, 'weging van de groep tegenover die van de verkenning',
    delen.join(''));
}

/** De legenda hoort bij dit paneel en staat daarom hier, naast de vormen zelf. */
export const wegingenLegenda = `
  <div class="legenda">
    <span class="sleutel"><i style="background:var(--groen)"></i>de groep, uit het
      stellingenformulier</span>
    <span class="sleutel"><i style="background:var(--gedempt)"></i>de verkenning, uit
      het scoremodel</span>
    <span class="sleutel"><i style="background:var(--terra);height:3px;width:20px;
      border-radius:2px"></i>verschil van vijf punten of meer</span>
  </div>`;
