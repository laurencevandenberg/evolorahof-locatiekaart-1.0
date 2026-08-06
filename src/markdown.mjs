/**
 * Minimale Markdown-lezer voor de bestanden in `inhoud/`.
 *
 * Bewust geen externe afhankelijkheid: dit project moet over vijf jaar nog te bouwen
 * zijn met niets meer dan Node. De lezer kent precies drie dingen, want meer heeft
 * `inhoud/` niet nodig:
 *
 *   1. frontmatter  losse sleutels bovenaan het bestand, tussen twee regels `---`
 *   2. tabellen     GitHub-stijl tabellen, herkend aan de scheidingsregel `|---|`
 *   3. secties      alles onder een `##`-kop, als platte tekst
 *
 * Foutmeldingen noemen altijd bestand en regelnummer, zodat iemand die alleen
 * Markdown bewerkt zelf kan zien wat er mis is.
 */

/** Fout met bestandsnaam en regelnummer erin, zodat hij zelfverklarend is. */
export class InhoudFout extends Error {
  constructor(bestand, regel, bericht) {
    super(`${bestand}:${regel} ${bericht}`);
    this.name = 'InhoudFout';
    this.bestand = bestand;
    this.regel = regel;
  }
}

/**
 * Zet een frontmatterwaarde om naar het juiste type.
 * Herkent: lijsten tussen blokhaken, ja/nee, getallen, en verder platte tekst.
 */
function leesWaarde(ruw) {
  const tekst = ruw.trim();
  if (tekst === '') return '';
  if (tekst.startsWith('[') && tekst.endsWith(']')) {
    const binnen = tekst.slice(1, -1).trim();
    return binnen === '' ? [] : binnen.split(',').map((d) => d.trim()).filter(Boolean);
  }
  if (/^(ja|waar|true)$/i.test(tekst)) return true;
  if (/^(nee|onwaar|false)$/i.test(tekst)) return false;
  if (/^-?\d+(\.\d+)?$/.test(tekst)) return Number(tekst);
  return tekst.replace(/^["']|["']$/g, '');
}

/**
 * Leest de frontmatter en geeft die terug plus de regel waar de body begint.
 * Ondersteunt ook lijsten die over meerdere regels lopen met `  - waarde`.
 */
function leesFrontmatter(regels, bestand) {
  if (regels[0]?.trim() !== '---') return { kop: {}, vanaf: 0 };
  const kop = {};
  let laatsteSleutel = null;
  for (let i = 1; i < regels.length; i += 1) {
    const regel = regels[i];
    if (regel.trim() === '---') return { kop, vanaf: i + 1 };
    if (regel.trim() === '') continue;

    const lijstitem = regel.match(/^\s+-\s+(.*)$/);
    if (lijstitem) {
      if (!laatsteSleutel) throw new InhoudFout(bestand, i + 1, 'lijstregel zonder sleutel erboven');
      if (!Array.isArray(kop[laatsteSleutel])) kop[laatsteSleutel] = [];
      kop[laatsteSleutel].push(leesWaarde(lijstitem[1]));
      continue;
    }

    const paar = regel.match(/^([\w-]+):\s*(.*)$/);
    if (!paar) throw new InhoudFout(bestand, i + 1, `"${regel.trim()}" is geen sleutel: waarde`);
    laatsteSleutel = paar[1];
    kop[laatsteSleutel] = paar[2].trim() === '' ? [] : leesWaarde(paar[2]);
  }
  throw new InhoudFout(bestand, regels.length, 'frontmatter is niet afgesloten met ---');
}

/** Splitst één tabelregel op de pijpen, met de buitenste pijpen eraf. */
const splitsRij = (regel) =>
  regel.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

/** Herkent de scheidingsregel onder de tabelkop: | --- | :--- | enzovoort. */
const isScheiding = (regel) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(regel) && regel.includes('-');

/**
 * Leest één Markdown-bestand.
 *
 * @returns {{kop: object, tabellen: object[][], secties: object, tekst: string}}
 *   `tabellen` is een lijst van tabellen, elk een lijst van objecten met de
 *   kolomkoppen als sleutel. `secties` heeft de `##`-koppen als sleutel, in
 *   kleine letters met streepjes, en de tekst eronder als waarde.
 */
export function leesMarkdown(inhoud, bestand = 'onbekend') {
  const regels = inhoud.split(/\r?\n/);
  const { kop, vanaf } = leesFrontmatter(regels, bestand);

  const tabellen = [];
  const secties = {};
  const losseTekst = [];
  let huidigeSectie = null;

  for (let i = vanaf; i < regels.length; i += 1) {
    const regel = regels[i];

    // ---- kop van een sectie
    const sectiekop = regel.match(/^##\s+(.+?)\s*$/);
    if (sectiekop) {
      huidigeSectie = sectiekop[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      secties[huidigeSectie] = [];
      continue;
    }
    if (/^#\s+/.test(regel)) { huidigeSectie = null; continue; }

    // ---- tabel: een regel met pijpen waarvan de volgende regel de scheiding is
    if (regel.includes('|') && isScheiding(regels[i + 1] ?? '')) {
      const kolommen = splitsRij(regel);
      const rijen = [];
      let j = i + 2;
      for (; j < regels.length && regels[j].includes('|'); j += 1) {
        const cellen = splitsRij(regels[j]);
        if (cellen.length !== kolommen.length) {
          const telwoord = (n) => `${n} kolom${n === 1 ? '' : 'men'}`;
          throw new InhoudFout(bestand, j + 1,
            `deze rij heeft ${telwoord(cellen.length)}, de kop heeft er ${telwoord(kolommen.length)}`);
        }
        rijen.push(Object.fromEntries(kolommen.map((k, n) => [k, cellen[n]])));
      }
      if (rijen.length === 0) throw new InhoudFout(bestand, i + 1, 'tabel zonder rijen');
      tabellen.push(rijen);
      i = j - 1;
      continue;
    }

    // ---- gewone tekst
    if (huidigeSectie) secties[huidigeSectie].push(regel);
    else losseTekst.push(regel);
  }

  // sectieregels samenvoegen tot één alinea per sectie
  for (const naam of Object.keys(secties)) {
    secties[naam] = secties[naam].join('\n').trim().replace(/\n{2,}/g, '\n\n');
  }

  return { kop, tabellen, secties, tekst: losseTekst.join('\n').trim() };
}

/**
 * Zet de beperkte Markdown die in teksten voorkomt om naar HTML.
 * Alleen **vet**, *cursief*, `code` en [tekst](url). Al het andere blijft platte tekst,
 * en alles wordt eerst ontdaan van HTML-betekenis.
 */
export function naarHtml(tekst) {
  return escapeHtml(tekst)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(])\*([^*]+)\*/g, '$1<i>$2</i>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** Maakt tekst veilig voor HTML- en SVG-attributen. */
export function escapeHtml(tekst) {
  return String(tekst)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
