/**
 * De achtenveertig kandidaten uit de verkenning, alle achtenveertig tegelijk zichtbaar.
 *
 * Eén blokje per kandidaat, gegroepeerd per regio en binnen de regio op prioriteit. De
 * kleur is de prioriteit uit de verkenning; een blokje met een dichte rand heeft ook
 * themascores in `07-locaties.md` en telt dus mee in de rest van dit dashboard. Een open
 * blokje staat wel op de kaart maar nergens in een berekening.
 *
 * Dat onderscheid is de reden dat dit paneel bestaat. Van de negen kandidaten met hoge
 * prioriteit hebben er zeven geen enkele themascore. De verkenning en het PvE kijken dus
 * grotendeels naar verschillende plekken.
 */
import { doek, tag, tekst, trefvlak } from '../svg.mjs';

const BLOK = 26;
const RUIMTE = 4;
const X_REGIO = 132;

const KLEUR = {
  hoog: 'var(--terra)',
  midden: 'var(--ramp3)',
  laag: 'var(--ramp1)',
};

export function kandidaten(lijst, { breedte }) {
  const regios = [...new Set(lijst.map((k) => k.regio))];
  const rang = { hoog: 0, midden: 1, laag: 2 };
  const perRij = Math.floor((breedte - X_REGIO - 20) / (BLOK + RUIMTE));

  const delen = [];
  let y = 26;

  delen.push(tekst('PER REGIO, GESORTEERD OP PRIORITEIT',
    { x: X_REGIO, y: 14, 'font-size': 11, fill: 'var(--flauw)' }));

  for (const regio of regios) {
    const groep = lijst
      .filter((k) => k.regio === regio)
      .sort((a, b) => (rang[a.prioriteit] ?? 3) - (rang[b.prioriteit] ?? 3)
        || a.id.localeCompare(b.id));
    const regels = Math.ceil(groep.length / perRij);

    delen.push(tekst(regio,
      { x: X_REGIO - 14, y: y + 17, 'text-anchor': 'end', 'font-size': 13,
        fill: 'var(--inkt)', 'font-weight': 600 }));
    delen.push(tekst(`${groep.length} kandidaten`,
      { x: X_REGIO - 14, y: y + 32, 'text-anchor': 'end', 'font-size': 11,
        fill: 'var(--flauw)' }));

    groep.forEach((kandidaat, i) => {
      const kolom = i % perRij;
      const regel = Math.floor(i / perRij);
      const bx = X_REGIO + kolom * (BLOK + RUIMTE);
      const by = y + regel * (BLOK + RUIMTE);
      const kleur = KLEUR[kandidaat.prioriteit] ?? 'var(--raster)';
      const gescoord = kandidaat.heeftThemascores;

      delen.push(tag('rect', {
        x: bx, y: by, width: BLOK, height: BLOK, rx: 5,
        fill: gescoord ? kleur : 'transparent',
        stroke: kleur, 'stroke-width': gescoord ? 0 : 1.5,
        'stroke-dasharray': gescoord ? null : '3 2',
      }));
      delen.push(tekst(kandidaat.id.replace(/^[A-Z]+/, ''), {
        x: bx + BLOK / 2, y: by + BLOK / 2 + 4, 'text-anchor': 'middle', 'font-size': 10.5,
        fill: gescoord ? 'var(--paneel)' : 'var(--gedempt)', 'font-weight': 600,
      }));
      delen.push(trefvlak(bx, by, BLOK, BLOK,
        `<b>${kandidaat.id} · ${kandidaat.naam}</b><br>${kandidaat.gemeente}, ` +
        `${kandidaat.regio}<br><br>` +
        `${kandidaat.categorie} · spoor ${kandidaat.spoor} · prioriteit ` +
        `${kandidaat.prioriteit} · ${kandidaat.vertrouwen}<br>` +
        `omvang: ${kandidaat.omvang}<br><br>` +
        `${kandidaat.status}<br><i>${kandidaat.waarom}</i><br><br>` +
        (gescoord
          ? 'heeft themascores en telt mee in de rest van dit dashboard'
          : '<b>geen themascores</b>: staat wel op de kaart, telt nergens in mee')));
    });

    y += regels * (BLOK + RUIMTE) + 22;
  }

  return doek(breedte, y, 'de kandidaten uit de verkenning per regio', delen.join(''));
}

export const kandidatenLegenda = `
  <div class="legenda">
    <span class="sleutel"><i class="vierkant" style="background:var(--terra)"></i>hoge
      prioriteit</span>
    <span class="sleutel"><i class="vierkant" style="background:var(--ramp3)"></i>midden</span>
    <span class="sleutel"><i class="vierkant" style="background:var(--ramp1)"></i>laag</span>
    <span class="sleutel"><i class="vierkant" style="background:transparent;
      box-shadow:inset 0 0 0 1.5px var(--gedempt)"></i>gestippeld: geen themascores, telt
      nergens in mee</span>
  </div>`;
