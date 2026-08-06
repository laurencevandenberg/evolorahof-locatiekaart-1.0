/**
 * Bouwt `dist/kaart.html`: alle kandidaten en perceel-leads op een kaart.
 *
 * Dit is de enige pagina die internet nodig heeft, want de achtergrondkaart komt van
 * OpenStreetMap en Leaflet van een CDN. Daarom staat hij los van `index.html`, dat
 * bewust zelfstandig blijft en het ook op een beamer zonder wifi doet. Zonder verbinding
 * toont deze pagina een nette melding in plaats van een leeg vlak.
 *
 * De filters werken samen: regio, spoor, prioriteit en categorie snijden elkaar, en de
 * teller boven de kaart zegt steeds hoeveel punten er nog staan. Dat maakt van de kaart
 * een zeef in plaats van een plaatje.
 */
import { escapeHtml } from './markdown.mjs';

/** Alleen wat de kaart echt nodig heeft; scheelt de helft in bestandsgrootte. */
function kaartgegevens(inhoud, locatiescores) {
  return {
    kandidaten: inhoud.kandidaten.map((k) => ({
      id: k.id, naam: k.naam, gemeente: k.gemeente, regio: k.regio,
      categorie: k.categorie, vertrouwen: k.vertrouwen, spoor: k.spoor,
      prioriteit: k.prioriteit, omvang: k.omvang, status: k.status, waarom: k.waarom,
      contact: k.contact, bron: k.bron, lat: k.lat, lon: k.lon,
      score: locatiescores.get(k.id) ?? null,
    })),
    leads: inhoud.leads.map((l) => ({
      id: l.id, zone: l.zoekzone, regio: l.regio, aanduiding: l.aanduiding,
      ha: l.hectare, lat: l.lat, lon: l.lon, spoor: l.spoor,
    })),
  };
}

const SCRIPT = String.raw`
"use strict";

const KLEUR = { hoog: "#b0463c", midden: "#5d856f", laag: "#9db69c", overig: "#9a9082" };
const el = (id) => document.getElementById(id);

if (typeof L === "undefined") {
  el("kaart").innerHTML =
    '<div class="melding">De kaart kon niet laden. Deze pagina heeft internet nodig voor ' +
    'de achtergrondkaart en de kaartbibliotheek. Het dashboard zelf werkt wel offline.</div>';
  el("teller").textContent =
    DATA.kandidaten.length + " kandidaten en " + DATA.leads.length +
    " perceel-leads staan klaar, maar de kaart kan zonder internet niet tekenen.";
  for (const veld of document.querySelectorAll("input, button")) veld.disabled = true;
} else {
  const kaart = L.map("kaart", { scrollWheelZoom: true }).setView([52.0, 5.7], 9);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap", maxZoom: 18,
  }).addTo(kaart);

  const laagKandidaten = L.layerGroup().addTo(kaart);
  const laagLeads = L.layerGroup();
  const markers = { kandidaten: [], leads: [] };

  const veilig = (waarde) => String(waarde ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // ---- kandidaten: grotere stip, kleur op prioriteit
  for (const k of DATA.kandidaten) {
    const marker = L.circleMarker([k.lat, k.lon], {
      radius: k.prioriteit === "hoog" ? 10 : k.prioriteit === "midden" ? 7 : 5.5,
      color: "#ffffff", weight: 1.5,
      fillColor: KLEUR[k.prioriteit] ?? KLEUR.overig,
      fillOpacity: k.categorie === "kandidaat" ? 0.92 : 0.45,
    });
    marker.bindPopup(
      "<b>" + veilig(k.id) + " · " + veilig(k.naam) + "</b><br>" +
      veilig(k.gemeente) + " · " + veilig(k.regio) + "<br><br>" +
      veilig(k.categorie) + " · spoor " + veilig(k.spoor) + " · prioriteit " +
      veilig(k.prioriteit) + " · " + veilig(k.vertrouwen) + "<br>" +
      "<b>omvang</b> " + veilig(k.omvang) + "<br>" +
      "<b>status</b> " + veilig(k.status) + "<br>" +
      "<i>" + veilig(k.waarom) + "</i><br>" +
      (k.contact ? "<b>contact</b> " + veilig(k.contact) + "<br>" : "") +
      (k.score !== null
        ? "<br><b>themascore " + Math.round(k.score) + "</b> uit het PvE"
        : "<br><i>geen themascores: telt nergens in mee</i>") +
      (k.bron ? '<br><br><a href="' + veilig(k.bron) + '" target="_blank" rel="noopener">bron</a>' : ""),
      { maxWidth: 320 });
    markers.kandidaten.push({ marker, gegevens: k });
  }

  // ---- perceel-leads: kleine stip, kleur op spoor
  for (const l of DATA.leads) {
    const marker = L.circleMarker([l.lat, l.lon], {
      radius: 3.4, color: "#6b7f8f", weight: 1,
      fillColor: l.spoor === "B" ? "#6b7f8f" : "#8aa590", fillOpacity: 0.55,
    });
    marker.bindPopup(
      "<b>" + veilig(l.aanduiding) + "</b><br>" + veilig(l.zone) + " · " + veilig(l.regio) +
      "<br>" + l.ha.toFixed(2).replace(".", ",") + " hectare · spoor " + veilig(l.spoor) +
      "<br><br><i>alleen ligging en oppervlakte zijn bekend</i>", { maxWidth: 280 });
    markers.leads.push({ marker, gegevens: l });
  }

  /** Leest de aangevinkte waarden van een filtergroep. */
  const gekozen = (naam) => new Set(
    [...document.querySelectorAll('[data-filter="' + naam + '"]:checked')].map((v) => v.value));

  function ververs() {
    const regios = gekozen("regio");
    const sporen = gekozen("spoor");
    const prioriteiten = gekozen("prioriteit");
    const categorieen = gekozen("categorie");
    const toonKandidaten = el("laag-kandidaten").checked;
    const toonLeads = el("laag-leads").checked;

    laagKandidaten.clearLayers();
    let zichtbaarK = 0;
    for (const { marker, gegevens } of markers.kandidaten) {
      const past = toonKandidaten
        && regios.has(gegevens.regio)
        && prioriteiten.has(gegevens.prioriteit)
        && categorieen.has(gegevens.categorie)
        // "A+B" telt mee zodra een van beide sporen is aangevinkt
        && [...sporen].some((s) => gegevens.spoor.includes(s));
      if (past) { laagKandidaten.addLayer(marker); zichtbaarK += 1; }
    }

    laagLeads.clearLayers();
    let zichtbaarL = 0;
    for (const { marker, gegevens } of markers.leads) {
      const past = toonLeads
        && regios.has(gegevens.regio)
        && [...sporen].some((s) => gegevens.spoor.includes(s));
      if (past) { laagLeads.addLayer(marker); zichtbaarL += 1; }
    }
    if (toonLeads) laagLeads.addTo(kaart); else kaart.removeLayer(laagLeads);

    el("teller").textContent =
      zichtbaarK + " van " + markers.kandidaten.length + " kandidaten · " +
      zichtbaarL + " van " + markers.leads.length + " perceel-leads";
  }

  for (const veld of document.querySelectorAll('input[type="checkbox"]')) {
    veld.addEventListener("change", ververs);
  }
  el("herstel").addEventListener("click", () => {
    for (const veld of document.querySelectorAll('input[type="checkbox"]')) veld.checked = true;
    ververs();
    kaart.setView([52.0, 5.7], 9);
  });
  el("alleen-hoog").addEventListener("click", () => {
    for (const veld of document.querySelectorAll('[data-filter="prioriteit"]')) {
      veld.checked = veld.value === "hoog";
    }
    el("laag-leads").checked = false;
    ververs();
  });

  ververs();
}
`.trim();

/** Eén filtergroep met een vinkje per waarde. */
function filtergroep(titel, naam, waarden) {
  const vinkjes = waarden.map((waarde) => `
    <label><input type="checkbox" data-filter="${naam}" value="${escapeHtml(waarde)}" checked>
      ${escapeHtml(waarde)}</label>`).join('');
  return `<div class="filtergroep"><h3>${escapeHtml(titel)}</h3>${vinkjes}</div>`;
}

export function bouwKaart({ inhoud, locatiescores, css }) {
  const gegevens = kaartgegevens(inhoud, locatiescores);
  const uniek = (veld) => [...new Set(inhoud.kandidaten.map((k) => k[veld]))].sort();
  // "A+B" is geen apart filter maar valt onder beide sporen, dus alleen A en B tonen.
  const sporen = ['A', 'B'];

  return `<!DOCTYPE html>
<html lang="nl" data-modus="licht">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Locatiekaart · Evolorahof</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
${css}
.kaartblad { display: grid; grid-template-columns: 268px 1fr; gap: 20px; align-items: start; }
#kaart { height: 74vh; min-height: 520px; border-radius: var(--hoekstraal);
         border: 1px solid var(--rand); background: var(--verdiept); }
.filtergroep { margin-bottom: 18px; }
.filtergroep h3 { font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
                  color: var(--flauw); margin: 0 0 7px; font-weight: 700; }
.filtergroep label { display: block; font-size: 13px; color: var(--inkt); padding: 3px 0;
                     cursor: pointer; }
.filtergroep input { margin-right: 7px; accent-color: var(--terra); }
.filtergroep input:disabled + span, .knop:disabled { opacity: .5; cursor: not-allowed; }
.melding { padding: 28px; color: var(--gedempt); font-size: 13.5px; max-width: 460px; }
#teller { font-size: 12.5px; color: var(--gedempt); margin: 0 0 12px; }
.leaflet-container { font-family: var(--tekst); }
.leaflet-popup-content { margin: 12px 14px; font-size: 12.5px; line-height: 1.5; }
@media (max-width: 860px) { .kaartblad { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
  <div class="kop">
    <div>
      <p class="kicker">${escapeHtml(inhoud.teksten.kicker)}</p>
      <h1><span class="accent">de kaart.</span> waar kan evolorahof landen</h1>
      <p class="sub">Achtenveertig benoemde kandidaten en 283 perceel-leads uit de brede
      locatieverkenning van 16 juli 2026. De filters snijden elkaar; de teller boven de
      kaart zegt hoeveel punten er nog staan.</p>
    </div>
    <div style="display:flex;gap:8px">
      <a class="knop" href="index.html">terug naar het dashboard</a>
    </div>
  </div>

  <div class="paneel">
    <div class="kaartblad">
      <div>
        <div class="filtergroep">
          <h3>lagen</h3>
          <label><input type="checkbox" id="laag-kandidaten" checked> kandidaten</label>
          <label><input type="checkbox" id="laag-leads" checked> perceel-leads</label>
        </div>
        ${filtergroep('regio', 'regio', uniek('regio'))}
        ${filtergroep('spoor', 'spoor', sporen)}
        ${filtergroep('prioriteit', 'prioriteit', ['hoog', 'midden', 'laag'])}
        ${filtergroep('categorie', 'categorie', uniek('categorie'))}
        <div class="filtergroep">
          <h3>snel</h3>
          <button class="knop" id="alleen-hoog" style="width:100%;margin-bottom:8px">alleen
            hoge prioriteit</button>
          <button class="knop" id="herstel" style="width:100%">alles terug</button>
        </div>
      </div>
      <div>
        <p id="teller">laden…</p>
        <div id="kaart"></div>
        <p class="uitleg" style="margin-top:12px">Grote stippen zijn benoemde kandidaten,
        gekleurd op prioriteit; doorschijnend betekent dat het geen woonlocatie is maar een
        energiepartner, referentie of uitsluiting. Kleine grijsblauwe stippen zijn
        perceel-leads: van die percelen is alleen ligging en oppervlakte bekend.
        Deze pagina heeft internet nodig voor de achtergrondkaart.</p>
      </div>
    </div>
  </div>
</main>

<script>
const DATA = ${JSON.stringify(gegevens)};
${SCRIPT}
</script>
</body>
</html>
`;
}
