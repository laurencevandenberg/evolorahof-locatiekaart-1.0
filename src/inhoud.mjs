/**
 * Laadt alles uit `inhoud/`, controleert het, en levert één object af waarmee de rest
 * van de bouw werkt.
 *
 * De controles zijn streng met opzet. Een dashboard dat stilletjes doorbouwt met een
 * stelling die nergens bij hoort, is gevaarlijker dan een bouw die stopt met een
 * duidelijke fout. Elke controle noemt het bestand en zegt wat er moet gebeuren.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { leesMarkdown, InhoudFout } from './markdown.mjs';

/** Leest één bestand uit `inhoud/` en geeft de ontlede inhoud terug. */
function bestand(wortel, naam) {
  const pad = join(wortel, 'inhoud', naam);
  try {
    return { ...leesMarkdown(readFileSync(pad, 'utf8'), `inhoud/${naam}`), naam };
  } catch (fout) {
    if (fout.code === 'ENOENT') throw new InhoudFout(`inhoud/${naam}`, 0, 'bestand ontbreekt');
    throw fout;
  }
}

/** Zet een kleurentabel om naar een object sleutel -> waarde, met controle op het formaat. */
function kleuren(rijen, bron) {
  const uit = {};
  for (const rij of rijen) {
    const waarde = rij.waarde?.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(waarde ?? '')) {
      throw new InhoudFout(bron, 0, `"${rij.sleutel}" heeft geen geldige kleur (#rrggbb): "${waarde}"`);
    }
    uit[rij.sleutel] = waarde.toLowerCase();
  }
  return uit;
}

/** Leest een reeks als "233.21" om naar een lijst getallen, met een punt voor onbekend. */
function leesReeks(ruw, aantal, naam, bron) {
  const schoon = ruw.replace(/`/g, '').trim();
  const tekens = [...schoon];
  if (tekens.length !== aantal) {
    throw new InhoudFout(bron, 0,
      `${naam} heeft ${tekens.length} antwoorden, er zijn ${aantal} stellingen`);
  }
  return tekens.map((teken, i) => {
    if (teken === '.' || teken === '-') return null;
    if (!'0123'.includes(teken)) {
      throw new InhoudFout(bron, 0,
        `${naam}, antwoord ${i + 1} is "${teken}"; alleen 0, 1, 2, 3 of een punt`);
    }
    return Number(teken);
  });
}

/** Splitst "K2, K8" naar ['K2','K8']; lege cel wordt een lege lijst. */
const lijst = (cel) => (cel ?? '').split(',').map((d) => d.trim()).filter(Boolean);

export function laadInhoud(wortel) {
  const huisstijl = bestand(wortel, '00-huisstijl.md');
  const instellingen = bestand(wortel, '01-instellingen.md');
  const teksten = bestand(wortel, '02-teksten.md');
  const begrippenBestand = bestand(wortel, '03-begrippen.md');
  const themasBestand = bestand(wortel, '04-themas.md');
  const stellingenBestand = bestand(wortel, '05-stellingen.md');
  const antwoordenBestand = bestand(wortel, '06-antwoorden.md');
  const knockoutsBestand = bestand(wortel, '07-knock-outs.md');
  const themascoresBestand = bestand(wortel, '08-themascores.md');
  const verantwoording = bestand(wortel, '12-verantwoording.md');
  const kandidatenBestand = bestand(wortel, '09-kandidaten.md');
  const leadsBestand = bestand(wortel, '10-perceel-leads.md');
  const scoremodelBestand = bestand(wortel, '11-scoremodel.md');

  // ---------------------------------------------------------------- thema's
  const themas = themasBestand.tabellen[0].map((rij) => ({
    code: rij.code, naam: rij.naam, uitleg: rij['waar het over gaat'] ?? '',
  }));
  const themacodes = new Set(themas.map((t) => t.code));

  // ------------------------------------------------------------- stellingen
  const stellingen = stellingenBestand.tabellen[0].map((rij) => {
    if (!themacodes.has(rij.thema)) {
      throw new InhoudFout('inhoud/05-stellingen.md', 0,
        `stelling ${rij.nr} verwijst naar thema "${rij.thema}", dat niet in 04-themas.md staat`);
    }
    return {
      nr: Number(rij.nr), thema: rij.thema, tekst: rij.tekst,
      omgekeerd: /^ja$/i.test(rij.omgekeerd ?? 'nee'),
    };
  });
  stellingen.forEach((s, i) => {
    if (s.nr !== i + 1) {
      throw new InhoudFout('inhoud/05-stellingen.md', 0,
        `de nummers moeten oplopen vanaf 1; regel ${i + 1} heeft nummer ${s.nr}`);
    }
  });

  // ------------------------------------------------------------- antwoorden
  const opmerkingen = Object.fromEntries(
    (antwoordenBestand.tabellen[1] ?? []).map((rij) => [rij.naam, rij.opmerking]));
  const leden = antwoordenBestand.tabellen[0].map((rij) => {
    const topvijf = lijst(rij['top vijf']).map(Number);
    for (const nr of topvijf) {
      if (!Number.isInteger(nr) || nr < 1 || nr > stellingen.length) {
        throw new InhoudFout('inhoud/06-antwoorden.md', 0,
          `${rij.naam} heeft ${nr} in de top vijf; dat is geen stellingnummer`);
      }
    }
    if (new Set(topvijf).size !== topvijf.length) {
      throw new InhoudFout('inhoud/06-antwoorden.md', 0,
        `${rij.naam} heeft een nummer dubbel in de top vijf`);
    }
    return {
      naam: rij.naam,
      antwoorden: leesReeks(rij.antwoorden, stellingen.length, rij.naam, 'inhoud/06-antwoorden.md'),
      topvijf,
      opmerking: opmerkingen[rij.naam] ?? '',
    };
  });
  if (leden.length === 0) {
    throw new InhoudFout('inhoud/06-antwoorden.md', 0, 'er staat geen enkel lid in de tabel');
  }

  // ---------------------------------------------------------------- begrippen
  // De begrippenlijst is het woordenboek achter elk (?)-vraagteken op de pagina. De
  // sleutel is het adres waarmee de code ernaar verwijst; verwijst de code naar een
  // sleutel die hier niet staat, dan stopt de bouw daar met een duidelijke melding.
  const begrippen = begrippenBestand.tabellen[0].map((rij) => {
    for (const veld of ['sleutel', 'begrip', 'uitleg']) {
      if (!(rij[veld] ?? '').trim()) {
        throw new InhoudFout('inhoud/03-begrippen.md', 0,
          `de rij "${rij.sleutel || rij.begrip || '?'}" mist de kolom "${veld}"`);
      }
    }
    return { sleutel: rij.sleutel, begrip: rij.begrip, uitleg: rij.uitleg };
  });
  const dubbeleSleutels = begrippen.map((b) => b.sleutel)
    .filter((sleutel, i, alle) => alle.indexOf(sleutel) !== i);
  if (dubbeleSleutels.length) {
    throw new InhoudFout('inhoud/03-begrippen.md', 0,
      `dubbele sleutels: ${[...new Set(dubbeleSleutels)].join(', ')}`);
  }

  // ------------------------------------------------------ knock-outcriteria
  // `nummer` is de code zonder de K: op de pagina heet K3 voluit
  // "knock-outcriterium 3", de kale code komt daar nooit in beeld.
  const knockouts = knockoutsBestand.tabellen[0].map((rij) => ({
    code: rij.code,
    nummer: rij.code.replace(/^K/, ''),
    naam: rij.criterium,
    status: rij.status,
    drempel: rij.drempel,
    herstel: rij['te repareren'],
    bron: rij.bron,
  }));
  const knockoutcodes = new Set(knockouts.map((k) => k.code));

  // ------------------------------------------------------------- themascores
  const themascores = themascoresBestand.tabellen[0].map((rij) => {
    const scores = {};
    for (const { code } of themas) {
      const cel = (rij[code] ?? '').trim();
      if (cel === '') { scores[code] = null; continue; }
      const cijfer = Number(cel);
      if (!Number.isInteger(cijfer) || cijfer < 0 || cijfer > 4) {
        throw new InhoudFout('inhoud/08-themascores.md', 0,
          `${rij.id}, thema ${code}: "${cel}" is geen cijfer van 0 tot 4`);
      }
      scores[code] = cijfer;
    }
    const raakt = lijst(rij.raakt);
    for (const code of raakt) {
      if (!knockoutcodes.has(code)) {
        throw new InhoudFout('inhoud/08-themascores.md', 0,
          `${rij.id} raakt "${code}", dat niet in 07-knock-outs.md staat`);
      }
    }
    return {
      id: rij.id, soort: rij.soort, prioriteit: rij.prioriteit ?? '',
      naam: rij.naam, detail: rij.detail ?? '', scores, raakt,
    };
  });
  const dubbel = themascores.map((l) => l.id).filter((id, i, a) => a.indexOf(id) !== i);
  if (dubbel.length) {
    throw new InhoudFout('inhoud/08-themascores.md', 0,
      `dubbele id's: ${[...new Set(dubbel)].join(', ')}`);
  }

  // ------------------------------------------------------------ instellingen
  for (const code of instellingen.kop['vastgestelde-knock-outs'] ?? []) {
    if (!knockoutcodes.has(code)) {
      throw new InhoudFout('inhoud/01-instellingen.md', 0,
        `vastgestelde-knock-outs bevat "${code}", dat niet in 07-knock-outs.md staat`);
    }
  }
  const weegmethode = instellingen.kop.weegmethode ?? 'rangorde';
  if (!['rangorde', 'gemiddelde'].includes(weegmethode)) {
    throw new InhoudFout('inhoud/01-instellingen.md', 0,
      `weegmethode is "${weegmethode}"; kies "rangorde" of "gemiddelde"`);
  }
  const scenarios = (instellingen.tabellen[0] ?? []).map((rij) => {
    const codes = lijst(rij['knock-outs']);
    for (const code of codes) {
      if (!knockoutcodes.has(code)) {
        throw new InhoudFout('inhoud/01-instellingen.md', 0,
          `scenario "${rij.naam}" noemt "${code}", dat niet in 07-knock-outs.md staat`);
      }
    }
    return { naam: rij.naam, codes, toelichting: rij.toelichting ?? '' };
  });

  // -------------------------------------------------- kandidaten uit de verkenning
  // Een kandidaat mag dezelfde id hebben als een plek in 07-locaties.md. Zo ja, dan
  // heeft hij ook themascores; zo niet, dan staat hij wel op de kaart maar telt hij
  // nergens in mee. Dat verschil zichtbaar maken is een van de doelen van dit bestand.
  const gescoordeIds = new Set(themascores.map((l) => l.id));
  const kandidaten = kandidatenBestand.tabellen[0].map((rij) => ({
    id: rij.id,
    regio: rij.regio,
    naam: rij.locatie,
    gemeente: rij.gemeente,
    categorie: rij.categorie,
    vertrouwen: rij.vertrouwen,
    prioriteit: rij.prioriteit,
    omvang: rij.omvang,
    status: rij.status,
    waarom: rij['waarom past het'] ?? '',
    contact: rij.contact ?? '',
    bron: rij.bron ?? '',
    lat: Number(rij.lat),
    lon: Number(rij.lon),
    heeftThemascores: gescoordeIds.has(rij.id),
  }));
  for (const kandidaat of kandidaten) {
    if (!Number.isFinite(kandidaat.lat) || !Number.isFinite(kandidaat.lon)) {
      throw new InhoudFout('inhoud/09-kandidaten.md', 0,
        `${kandidaat.id} heeft geen bruikbare coordinaten`);
    }
  }

  // ------------------------------------------------------------ perceel-leads
  const leads = leadsBestand.tabellen[0].map((rij) => ({
    id: rij.id,
    regio: rij.regio,
    zoekzone: rij.zoekzone,
    aanduiding: rij['kadastrale aanduiding'],
    hectare: Number(rij['opp (ha)']),
    lat: Number(rij.lat),
    lon: Number(rij.lon),
  }));

  // --------------------------------------------------------------- scoremodel
  const themacodesLijst = themas.map((t) => t.code);
  const scoremodel = scoremodelBestand.tabellen[0].map((rij) => {
    const thema = rij['pve-thema'];
    if (!themacodesLijst.includes(thema)) {
      throw new InhoudFout('inhoud/11-scoremodel.md', 0,
        `criterium "${rij.criterium}" verwijst naar thema "${thema}", dat niet bestaat`);
    }
    return {
      criterium: rij.criterium,
      weging: Number(rij.weging),
      thema,
      meten: rij['meten via'] ?? '',
    };
  });
  const somWeging = scoremodel.reduce((totaal, rij) => totaal + rij.weging, 0);
  if (Math.abs(somWeging - 1) > 0.005) {
    throw new InhoudFout('inhoud/11-scoremodel.md', 0,
      `de weging telt op tot ${somWeging.toFixed(3)} in plaats van 1,000`);
  }
  const uitsluiters = (scoremodelBestand.tabellen[1] ?? []).map((rij) => ({
    naam: rij.uitsluiter, eis: rij.eis,
  }));

  // -------------------------------------------------------------- huisstijl
  const [lichteKleuren, donkereKleuren, ramp, maten, ruimte] = huisstijl.tabellen;
  const maatvoering = Object.fromEntries(maten.map((rij) => [rij.sleutel, Number(rij.waarde)]));
  // Het achtpuntsstramien wordt --sp-1 tot --sp-8. Zonder deze tabel zouden de afstanden
  // in het stijlblad stil op nul uitkomen, en dat is precies eerder misgegaan.
  if (!ruimte?.length) {
    throw new InhoudFout('inhoud/00-huisstijl.md', 0,
      'de tabel onder "## Ruimte" ontbreekt; zonder die stappen valt alle witruimte weg');
  }
  const stramien = ruimte.map((rij) => Number(rij.pixels));
  if (stramien.some((px) => !Number.isFinite(px))) {
    throw new InhoudFout('inhoud/00-huisstijl.md', 0,
      'elke stap in de ruimtetabel heeft een getal in de kolom "pixels" nodig');
  }

  return {
    // De schakelaar staat in 05-antwoorden.md, bij de gegevens waar hij over gaat.
    anonimiseren: antwoordenBestand.kop.anonimiseren !== false,
    peildatum: antwoordenBestand.kop.peildatum ?? null,
    huisstijl: {
      ...huisstijl.kop,
      licht: kleuren(lichteKleuren, 'inhoud/00-huisstijl.md'),
      donker: kleuren(donkereKleuren, 'inhoud/00-huisstijl.md'),
      ramp: { licht: ramp.map((r) => r.licht), donker: ramp.map((r) => r.donker) },
      maat: maatvoering,
      stramien,
    },
    instellingen: { ...instellingen.kop, weegmethode, scenarios },
    teksten: { ...teksten.kop, ...teksten.secties },
    verantwoording: verantwoording.secties,
    themas, stellingen, leden, begrippen, knockouts, themascores,
    kandidaten, leads, scoremodel, uitsluiters,
    verkenning: { ...kandidatenBestand.kop, scoremodelbron: scoremodelBestand.kop.bron },
  };
}
