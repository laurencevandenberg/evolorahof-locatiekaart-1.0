/**
 * De zeef: de kaart als hoofdscherm, met de eisen als bediening ernaast.
 *
 * Dit is de opvolger van de knop "wat doen onze eisen?" uit de oorspronkelijke rekentool.
 * Daar moest je op een knop drukken om te zien wat de weging met de kaart deed. Hier
 * gebeurt het meteen: zet een grens aan en de plekken die hem raken vallen ter plekke af,
 * schuif een gewicht op en de kleuren verschuiven mee.
 *
 * Twee ontwerpkeuzes die de rest verklaren.
 *
 * **De grens gaat voor het cijfer.** Een plek die een vastgestelde grens raakt valt af,
 * hoe hoog hij verder ook scoort. Dat is precies wat een gewogen gemiddelde niet kan, en
 * daarom staan de grenzen bovenaan in de bediening en de weging eronder.
 *
 * **De browser rekent met dezelfde functies als de bouw.** De inhoud van `kern.mjs` wordt
 * hier letterlijk in de pagina geplakt in plaats van nagebouwd, zodat de kaart en de
 * analysepagina nooit uiteen kunnen lopen.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml } from './markdown.mjs';

/** Haalt de kern op als platte broncode, zonder de module-uitvoer. */
function kernbroncode(wortel) {
  return readFileSync(join(wortel, 'src', 'kern.mjs'), 'utf8')
    .replace(/^export (function|const) /gm, '$1 ')
    .replace(/^export \{[^}]*\}[^\n]*\n/gm, '');
}

/**
 * Voegt de plekken uit `07-locaties.md` samen met de kandidaten uit `09-kandidaten.md`.
 * De koppeling loopt over `id`. Een kandidaat zonder themascores blijft in de lijst staan,
 * grijs: hij bestaat, we weten er alleen niets van. Dat weglaten zou de lijst mooier maken
 * en het beeld onwaar.
 */
function plekkenvoorraad(inhoud) {
  const opId = new Map(inhoud.locaties.map((l) => [l.id, l]));
  const uit = [];

  for (const kandidaat of inhoud.kandidaten) {
    const gescoord = opId.get(kandidaat.id);
    uit.push({
      id: kandidaat.id,
      naam: kandidaat.naam,
      detail: `${kandidaat.gemeente} · ${kandidaat.omvang}`,
      regio: kandidaat.regio,
      gemeente: kandidaat.gemeente,
      categorie: kandidaat.categorie,
      prioriteit: kandidaat.prioriteit,
      status: kandidaat.status,
      waarom: kandidaat.waarom,
      bron: kandidaat.bron,
      lat: kandidaat.lat,
      lon: kandidaat.lon,
      scores: gescoord ? gescoord.scores : {},
      raakt: gescoord ? gescoord.raakt : [],
    });
  }

  // Archetypen staan niet op de kaart maar horen wel in de lijst: ze zijn de ijkpunten
  // waartegen je de echte plekken leest.
  for (const locatie of inhoud.locaties.filter((l) => l.soort === 'archetype')) {
    uit.push({
      id: locatie.id,
      naam: locatie.naam,
      detail: locatie.detail,
      regio: 'archetype',
      gemeente: '',
      categorie: 'archetype',
      prioriteit: '',
      status: 'illustratief profiel, geen echt kavel',
      waarom: '',
      bron: '',
      lat: null,
      lon: null,
      scores: locatie.scores,
      raakt: locatie.raakt,
    });
  }
  return uit;
}

/* ------------------------------------------------------------------ bediening */

const schakelaar = (grens, effect) => `
  <div class="grens">
    <label class="grens__knop">
      <input type="checkbox" data-grens="${escapeHtml(grens.code)}">
      <span class="grens__code">${escapeHtml(grens.code)}</span>
      <span class="grens__naam">${escapeHtml(grens.naam)}</span>
      <span class="grens__effect" data-effect="${escapeHtml(grens.code)}">−${effect}</span>
    </label>
    <details class="grens__meer">
      <summary>drempel en bron</summary>
      <p>${escapeHtml(grens.drempel)}</p>
      <p><b>status</b> ${escapeHtml(grens.status)} · <b>te repareren</b> ${escapeHtml(grens.herstel)}</p>
      <p class="grens__bron">${grens.bron}</p>
    </details>
  </div>`;

const schuif = (thema, gewicht) => `
  <label class="schuif">
    <span class="schuif__naam">${escapeHtml(thema.code)} · ${escapeHtml(thema.naam)}</span>
    <input type="range" min="0" max="30" step="0.5" value="${gewicht.toFixed(1)}"
           data-gewicht="${escapeHtml(thema.code)}"
           aria-label="gewicht van thema ${escapeHtml(thema.naam)}">
    <output data-uitvoer="${escapeHtml(thema.code)}">${gewicht.toFixed(1).replace('.', ',')}</output>
  </label>`;

const vinkje = (naam, waarde, aan = true) => `
  <label class="vink"><input type="checkbox" data-filter="${naam}"
    value="${escapeHtml(waarde)}"${aan ? ' checked' : ''}> ${escapeHtml(waarde)}</label>`;

/* --------------------------------------------------------------------- script */

const SCRIPT = String.raw`
"use strict";

/* ---- toestand. Alles wat de gebruiker kan verzetten staat hier, en nergens anders. */
const toestand = {
  vastgesteld: [],
  gewicht: { ...BASIS.gewicht },
  methode: "onze weging",
  groenVanaf: BASIS.groenVanaf,
  minimaleDekking: BASIS.minimaleDekking,
  roodOnder: BASIS.roodOnder,
  lagen: { kandidaten: true, leads: false, archetypen: true },
  regios: new Set(BASIS.regios),
};

const el = (id) => document.getElementById(id);
const veilig = (waarde) => String(waarde ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const komma = (waarde, decimalen = 1) => waarde.toFixed(decimalen).replace(".", ",");

/** Alleen de plekken die door de lagen- en regiofilters komen. */
function inBeeld() {
  return BASIS.plekken.filter((plek) => {
    if (plek.categorie === "archetype") return toestand.lagen.archetypen;
    if (!toestand.lagen.kandidaten) return false;
    return toestand.regios.has(plek.regio);
  });
}

/** Het oordeel over elke plek in beeld, met de huidige instellingen. */
function beoordeel() {
  const opties = {
    vastgesteld: toestand.vastgesteld,
    groenVanaf: toestand.groenVanaf,
    roodOnder: toestand.roodOnder,
    minimaleDekking: toestand.minimaleDekking,
  };
  return inBeeld()
    .map((plek) => ({ plek, ...oordeel(plek, toestand.gewicht, BASIS.themacodes, opties) }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

/* ---------------------------------------------------------------- de kaart ---- */

let kaart = null;
let laagPlekken = null;
let laagLeads = null;

function bouwKaart() {
  if (typeof L === "undefined") return false;
  kaart = L.map("kaart", { scrollWheelZoom: true }).setView([52.0, 5.7], 9);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap", maxZoom: 18,
  }).addTo(kaart);
  laagPlekken = L.layerGroup().addTo(kaart);
  laagLeads = L.layerGroup();
  return true;
}

function tekenKaartLeaflet(uitslagen) {
  laagPlekken.clearLayers();
  for (const uitslag of uitslagen) {
    const { plek } = uitslag;
    if (plek.lat === null) continue;
    const stand = STANDEN[uitslag.stand];
    const marker = L.circleMarker([plek.lat, plek.lon], {
      radius: uitslag.stand === "ongescoord" ? 5 : 9,
      color: "#ffffff", weight: 1.5,
      fillColor: kleurOpTegels(uitslag.stand),
      fillOpacity: uitslag.stand === "ongescoord" ? 0.5 : 0.92,
    });
    marker.bindPopup(popup(uitslag, stand), { maxWidth: 330 });
    laagPlekken.addLayer(marker);
  }

  if (toestand.lagen.leads) {
    if (!laagLeads.getLayers().length) {
      for (const lead of BASIS.leads) {
        laagLeads.addLayer(L.circleMarker([lead.lat, lead.lon], {
          radius: 3.2, color: LEADKLEUR.licht, weight: 1,
          fillColor: LEADKLEUR.licht, fillOpacity: 0.5,
        }).bindPopup("<b>" + veilig(lead.aanduiding) + "</b><br>" + veilig(lead.zone) +
          "<br>" + komma(lead.ha, 2) + " hectare<br><br>" +
          "<i>alleen ligging en oppervlakte zijn bekend</i><br>" +
          '<span class="popup__id">' + veilig(lead.id) + "</span>"));
      }
    }
    laagLeads.addTo(kaart);
  } else if (laagLeads) {
    kaart.removeLayer(laagLeads);
  }
}

/**
 * Terugval zonder internet: dezelfde punten, zonder achtergrondkaart.
 * Web-Mercator op de omhullende van alle punten, zodat de onderlinge ligging klopt.
 */
function tekenKaartSvg(uitslagen) {
  const punten = uitslagen.filter((u) => u.plek.lat !== null);
  const vak = el("kaart");
  const breedte = vak.clientWidth || 760;
  const hoogte = vak.clientHeight || 520;
  // Web Mercator. De omrekening naar graden is nodig omdat de x-as ook graden gebruikt;
  // zonder die factor wordt de kaart een factor vijftig platgedrukt.
  const mercator = (lat) =>
    (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));

  const alle = punten.concat(toestand.lagen.leads
    ? BASIS.leads.map((l) => ({ plek: l })) : []);
  if (!alle.length) { vak.innerHTML = '<p class="leeg">geen plekken in beeld</p>'; return; }

  const lons = alle.map((p) => p.plek.lon);
  const lats = alle.map((p) => mercator(p.plek.lat));
  const marge = 28;
  const schaal = Math.min(
    (breedte - 2 * marge) / Math.max(Math.max(...lons) - Math.min(...lons), 1e-6),
    (hoogte - 2 * marge) / Math.max(Math.max(...lats) - Math.min(...lats), 1e-6));
  const naarX = (lon) => marge + (lon - Math.min(...lons)) * schaal;
  const naarY = (lat) => hoogte - marge - (mercator(lat) - Math.min(...lats)) * schaal;

  const leads = toestand.lagen.leads ? BASIS.leads.map((l) =>
    '<circle cx="' + naarX(l.lon).toFixed(1) + '" cy="' + naarY(l.lat).toFixed(1) +
    '" r="2.4" fill="' + LEADKLEUR[huidigeModus()] + '" opacity=".45"/>').join("") : "";

  const stippen = punten.map((u) =>
    '<circle cx="' + naarX(u.plek.lon).toFixed(1) + '" cy="' + naarY(u.plek.lat).toFixed(1) +
    '" r="' + (u.stand === "ongescoord" ? 4 : 7) + '" fill="' + kleurOpPagina(u.stand) +
    '" stroke="var(--paneel)" stroke-width="1.5" opacity="' +
    (u.stand === "ongescoord" ? ".55" : ".95") + '"><title>' +
    veilig(u.plek.naam) + " · " + STANDEN[u.stand].naam + "</title></circle>").join("");

  vak.innerHTML =
    '<svg viewBox="0 0 ' + breedte + " " + hoogte + '" width="100%" height="100%" ' +
    'role="img" aria-label="ligging van de plekken zonder achtergrondkaart">' +
    leads + stippen + "</svg>" +
    '<p class="kaart__terugval">Geen internet, dus geen achtergrondkaart. De onderlinge ' +
    "ligging klopt wel; de zeef werkt gewoon.</p>";
}

/* ------------------------------------------------------------------ weergave -- */

function popup(uitslag, stand) {
  const { plek } = uitslag;
  const regels = [
    "<b>" + veilig(plek.id) + " · " + veilig(plek.naam) + "</b>",
    veilig(plek.detail),
    "",
    '<b style="color:' + kleurOpTegels(uitslag.stand) + '">' + stand.naam + "</b>",
  ];
  if (uitslag.geraakt.length) {
    regels.push("raakt " + uitslag.geraakt.join(", "));
  } else if (uitslag.score !== null) {
    regels.push("score " + Math.round(uitslag.score) + " · band " +
      Math.round(uitslag.ondergrens) + " tot " + Math.round(uitslag.bovengrens) +
      " · " + uitslag.geteld + " van " + BASIS.themacodes.length + " thema's");
  } else {
    regels.push("geen themascores, dus geen oordeel");
  }
  if (plek.status) regels.push("", veilig(plek.status));
  if (plek.waarom) regels.push("<i>" + veilig(plek.waarom) + "</i>");
  if (plek.bron) {
    regels.push('<a href="' + veilig(plek.bron) + '" target="_blank" rel="noopener">bron</a>');
  }
  return regels.join("<br>");
}

function tekenLijst(uitslagen) {
  const over = uitslagen.filter((u) => u.stand !== "afgevallen");
  const af = uitslagen.filter((u) => u.stand === "afgevallen");

  el("lijst").innerHTML = over.length === 0
    ? '<p class="leeg">Alles valt af. Zet een grens uit of maak hem tot prijskaartje.</p>'
    : over.map((u) => {
      const stand = STANDEN[u.stand];
      const band = u.score === null ? "" :
        '<span class="rij__band"><span style="left:' + u.ondergrens.toFixed(1) +
        "%;width:" + (u.bovengrens - u.ondergrens).toFixed(1) + '%"></span>' +
        '<i style="left:' + u.score.toFixed(1) + '%"></i></span>';
      return '<div class="rij"><span class="rij__stip" style="background:' +
        kleurOpPagina(u.stand) + '"></span>' +
        '<span class="rij__naam">' + veilig(u.plek.naam) +
        '<small>' + veilig(u.plek.detail) + "</small></span>" +
        '<span class="rij__cijfer">' +
        (u.score === null ? "—" : Math.round(u.score)) + "</span>" +
        band +
        '<span class="rij__stand">' + stand.naam +
        (u.score === null ? "" : " · " + u.geteld + "/" + BASIS.themacodes.length) +
        "</span></div>";
    }).join("");

  el("afgevallen").innerHTML = af.length === 0
    ? '<p class="leeg">Nog niets valt af. Stel hierboven een grens vast.</p>'
    : af.map((u) => '<div class="rij rij--af"><span class="rij__naam">' +
        veilig(u.plek.naam) + "</span><span class=\"rij__stand\">valt af op " +
        u.geraakt.join(", ") + "</span></div>").join("");
}

function tekenTellers(uitslagen) {
  const tel = (stand) => uitslagen.filter((u) => u.stand === stand).length;
  el("teller").innerHTML =
    '<b>' + uitslagen.length + "</b> plekken in beeld · " +
    '<b>' + (uitslagen.length - tel("afgevallen")) + "</b> over na de grenzen · " +
    '<b style="color:var(--groen)">' + tel("voldoet") + "</b> voldoet · " +
    '<b style="color:var(--terra)">' + tel("afgevallen") + "</b> afgevallen · " +
    tel("ongescoord") + " zonder themascores";

  // Wat elke grens nog zou wegnemen bovenop wat al vaststaat.
  for (const knoop of document.querySelectorAll("[data-effect]")) {
    const code = knoop.getAttribute("data-effect");
    const aantal = effectVanGrens(inBeeld(), code, toestand.vastgesteld);
    knoop.textContent = toestand.vastgesteld.includes(code) ? "aan" : "−" + aantal;
    knoop.classList.toggle("grens__effect--aan", toestand.vastgesteld.includes(code));
    knoop.classList.toggle("grens__effect--nul",
      !toestand.vastgesteld.includes(code) && aantal === 0);
  }
}

/** Alles opnieuw tekenen. Eén ingang, zodat er geen half bijgewerkt scherm kan ontstaan. */
function ververs() {
  const uitslagen = beoordeel();
  if (kaart) tekenKaartLeaflet(uitslagen); else tekenKaartSvg(uitslagen);
  tekenLijst(uitslagen);
  tekenTellers(uitslagen);
}

/* ----------------------------------------------------------------- bediening -- */

for (const veld of document.querySelectorAll("[data-grens]")) {
  veld.addEventListener("change", () => {
    const code = veld.getAttribute("data-grens");
    toestand.vastgesteld = veld.checked
      ? [...toestand.vastgesteld, code]
      : toestand.vastgesteld.filter((c) => c !== code);
    ververs();
  });
}

for (const veld of document.querySelectorAll("[data-gewicht]")) {
  veld.addEventListener("input", () => {
    const code = veld.getAttribute("data-gewicht");
    toestand.gewicht[code] = Number(veld.value);
    document.querySelector('[data-uitvoer="' + code + '"]').textContent = komma(Number(veld.value));
    el("weegstand").textContent = "eigen weging";
    ververs();
  });
}

el("herstel-weging").addEventListener("click", () => {
  toestand.gewicht = { ...BASIS.gewicht };
  for (const veld of document.querySelectorAll("[data-gewicht]")) {
    const code = veld.getAttribute("data-gewicht");
    veld.value = BASIS.gewicht[code];
    document.querySelector('[data-uitvoer="' + code + '"]').textContent = komma(BASIS.gewicht[code]);
  }
  el("weegstand").textContent = "onze weging";
  ververs();
});

el("herstel-alles").addEventListener("click", () => {
  toestand.vastgesteld = [];
  for (const veld of document.querySelectorAll("[data-grens]")) veld.checked = false;
  el("herstel-weging").click();
});

for (const veld of document.querySelectorAll("[data-laag]")) {
  veld.addEventListener("change", () => {
    toestand.lagen[veld.getAttribute("data-laag")] = veld.checked;
    ververs();
  });
}

for (const veld of document.querySelectorAll('[data-filter="regio"]')) {
  veld.addEventListener("change", () => {
    if (veld.checked) toestand.regios.add(veld.value); else toestand.regios.delete(veld.value);
    ververs();
  });
}

for (const [id, sleutel] of [["groen-vanaf", "groenVanaf"], ["dekking", "minimaleDekking"]]) {
  const veld = el(id);
  veld.addEventListener("input", () => {
    toestand[sleutel] = Number(veld.value);
    el(id + "-uit").textContent = veld.value;
    ververs();
  });
}

el("modus").addEventListener("click", () => {
  const donker = document.documentElement.dataset.modus === "donker";
  document.documentElement.dataset.modus = donker ? "licht" : "donker";
  el("modus").textContent = donker ? "donkere modus" : "lichte modus";
  el("modus").setAttribute("aria-pressed", String(!donker));
  ververs();
});

if (!bouwKaart()) {
  document.body.classList.add("zonder-kaart");
}
addEventListener("resize", () => { if (!kaart) ververs(); });
ververs();
`.trim();

/* ---------------------------------------------------------------------- pagina */

/**
 * De vier standen als concrete hex, per modus, uit de huisstijltabellen.
 * Zie de toelichting bij STANDKLEUR in het script: Leaflet kan hier geen css-variabele
 * gebruiken, dus de waarden worden bij het bouwen ingevuld in plaats van in de browser
 * opgezocht. Zo blijft `00-huisstijl.md` de enige plek waar een kleur wordt gekozen.
 */
function kaartpalet(huisstijl) {
  const perModus = (kleur) => ({
    voldoet: kleur.groen,
    deels: kleur.duindoorn,
    zwak: kleur.terra,
    afgevallen: kleur.terra,
    ongescoord: kleur.flauw,
  });
  return {
    standkleuren: { licht: perModus(huisstijl.licht), donker: perModus(huisstijl.donker) },
    leadkleuren: { licht: huisstijl.licht.lead, donker: huisstijl.donker.lead },
  };
}

export function bouwZeef({ wortel, inhoud, gewicht, css }) {
  const plekken = plekkenvoorraad(inhoud);
  const themacodes = inhoud.themas.map((t) => t.code);
  const regios = [...new Set(inhoud.kandidaten.map((k) => k.regio))].sort();
  const t = inhoud.teksten;
  const { standkleuren, leadkleuren } = kaartpalet(inhoud.huisstijl);

  const basis = {
    plekken,
    themacodes,
    gewicht,
    regios,
    // Alleen de velden die de kaart nodig heeft. De id gaat mee omdat je daarmee de
    // lead terugvindt in `inhoud/10-perceel-leads.md`; de rest van de kolommen niet.
    leads: inhoud.leads.map((l) => ({
      id: l.id, lat: l.lat, lon: l.lon, ha: l.hectare, zone: l.zoekzone,
      aanduiding: l.aanduiding,
    })),
    groenVanaf: inhoud.instellingen['groen-vanaf'] ?? 65,
    roodOnder: inhoud.instellingen['rood-onder'] ?? 45,
    minimaleDekking: inhoud.instellingen['minimale-dekking-voor-groen'] ?? 5,
  };

  // Het effect van een grens bij de start: nog niets vastgesteld.
  const effect = (code) => plekken.filter((p) => p.raakt.includes(code)).length;

  return `<!DOCTYPE html>
<html lang="nl" data-modus="licht">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>De zeef · waar kan Evolorahof landen</title>
<meta name="description" content="Zet een grens aan en zie welke plekken afvallen.">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
${css}
${ZEEFSTIJL}
</style>
</head>
<body>
<main class="breed">

  <div class="kop">
    <div>
      <p class="kicker">${escapeHtml(t.kicker)}</p>
      <h1><span class="accent">de zeef.</span> wat doen onze eisen</h1>
      <p class="sub">Zet links een grens vast en kijk wat er gebeurt. Een plek die een
      vastgestelde grens raakt valt af, hoe hoog hij verder ook scoort. Pas daarna telt het
      cijfer, en dat cijfer volgt de weging die je eronder kunt bijstellen.</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <a class="knop" href="analyse.html">de analyse</a>
      <button class="knop" id="modus" aria-pressed="false">donkere modus</button>
    </div>
  </div>

  <div class="zeefblad">
    <aside class="rail" aria-label="instellingen">

      <section class="rail__blok">
        <h2>1 · de grenzen</h2>
        <p class="rail__uit">Wat nooit mag. Achter elke grens staat hoeveel plekken hij nog
        wegneemt bovenop wat al vaststaat.</p>
        ${inhoud.grenzen.map((g) => schakelaar(g, effect(g.code))).join('')}
      </section>

      <section class="rail__blok">
        <h2>2 · de weging</h2>
        <p class="rail__uit">Standaard staat hier onze eigen weging uit het
        stellingenformulier: <span id="weegstand">onze weging</span>. Schuif om te zien wat
        een andere verdeling doet.</p>
        ${inhoud.themas.map((thema) => schuif(thema, gewicht[thema.code])).join('')}
        <button class="knop klein" id="herstel-weging">terug naar onze weging</button>
      </section>

      <section class="rail__blok">
        <h2>3 · hoe streng</h2>
        <label class="schuif">
          <span class="schuif__naam">groen vanaf score</span>
          <input type="range" id="groen-vanaf" min="40" max="90" step="1"
                 value="${basis.groenVanaf}">
          <output id="groen-vanaf-uit">${basis.groenVanaf}</output>
        </label>
        <label class="schuif">
          <span class="schuif__naam">minimaal gescoorde thema's</span>
          <input type="range" id="dekking" min="1" max="${themacodes.length}" step="1"
                 value="${basis.minimaleDekking}">
          <output id="dekking-uit">${basis.minimaleDekking}</output>
        </label>
      </section>

      <section class="rail__blok">
        <h2>4 · wat je ziet</h2>
        <label class="vink"><input type="checkbox" data-laag="kandidaten" checked>
          kandidaten (${inhoud.kandidaten.length})</label>
        <label class="vink"><input type="checkbox" data-laag="leads">
          perceel-leads (${inhoud.leads.length})</label>
        <label class="vink"><input type="checkbox" data-laag="archetypen" checked>
          archetypen (${inhoud.locaties.filter((l) => l.soort === 'archetype').length})</label>
        <div class="rail__scheiding"></div>
        ${regios.map((regio) => vinkje('regio', regio)).join('')}
        <button class="knop klein" id="herstel-alles">alles terugzetten</button>
      </section>
    </aside>

    <div class="hoofd">
      <p id="teller" class="teller">laden…</p>
      <div id="kaart"></div>

      <section class="paneel">
        <h2>wat er overblijft</h2>
        <p class="uitleg">Op volgorde van score met de huidige weging. De balk is de
        onzekerheidsband: links wat het wordt als alles wat we nog niet weten tegenvalt,
        rechts als het meevalt.</p>
        <div id="lijst"></div>
      </section>

      <section class="paneel">
        <h2>wat afvalt, en waarop</h2>
        <div id="afgevallen"></div>
      </section>
    </div>
  </div>
</main>

<script>
${kernbroncode(wortel)}

// Leaflet zet kleuren als svg-attribuut en kan daar geen css-variabele lezen, dus deze
// vier standen staan hier als concrete hex. Ze komen wel uit dezelfde huisstijltabellen
// als de rest, zodat er maar één plek is waar je een kleur verandert.
const STANDKLEUR = ${JSON.stringify(standkleuren)};
const LEADKLEUR = ${JSON.stringify(leadkleuren)};

/** De kaarttegels van OpenStreetMap zijn ook in donkere modus licht. */
const kleurOpTegels = (stand) => STANDKLEUR.licht[stand];

/** Op de pagina zelf, en op de terugvalkaart, volgt de kleur wel de modus. */
const huidigeModus = () =>
  document.documentElement.dataset.modus === "donker" ? "donker" : "licht";
const kleurOpPagina = (stand) => STANDKLEUR[huidigeModus()][stand];
const BASIS = ${JSON.stringify(basis)};
${SCRIPT}
</script>
</body>
</html>
`;
}

/** Stijl die alleen de zeefpagina nodig heeft. De tokens komen uit de huisstijl. */
const ZEEFSTIJL = `
main.breed { max-width: 1560px; }
.zeefblad { display: grid; grid-template-columns: 352px 1fr; gap: var(--sp-5); align-items: start; }
.rail { position: sticky; top: var(--sp-4); max-height: calc(100vh - 32px); overflow-y: auto;
        padding-right: var(--sp-2); }
.rail__blok { background: var(--paneel); border: 1px solid var(--rand);
              border-radius: var(--hoekstraal); padding: var(--sp-4) var(--sp-4) var(--sp-5);
              margin-bottom: var(--sp-4); }
.rail__blok h2 { font-size: 19px; margin-bottom: var(--sp-2); }
.rail__uit { font-size: 12.5px; color: var(--gedempt); margin: 0 0 var(--sp-4); }
.rail__scheiding { height: 1px; background: var(--raster); margin: var(--sp-4) 0; }

.grens { border-bottom: 1px solid var(--raster); padding: 6px 0; }
.grens:last-child { border-bottom: 0; }
.grens__knop { display: grid; grid-template-columns: 18px 26px 1fr 38px; gap: 7px;
               align-items: center; cursor: pointer; font-size: 12.5px; min-height: 32px; }
.grens__knop input { accent-color: var(--terra); width: 16px; height: 16px; }
.grens__code { font-weight: 700; color: var(--gedempt); font-size: 12px; }
.grens__effect { font-size: 11.5px; color: var(--flauw); text-align: right;
                 font-variant-numeric: tabular-nums; }
.grens__effect--aan { color: var(--terra); font-weight: 700; }
.grens__effect--nul { opacity: .45; }
.grens__meer { margin: 2px 0 4px 51px; font-size: 11.5px; color: var(--gedempt); }
.grens__meer summary { cursor: pointer; color: var(--groen); }
.grens__meer p { margin: 4px 0; }
.grens__bron a { color: var(--groen); }

.schuif { display: grid; grid-template-columns: 1fr 96px 34px; gap: 8px; align-items: center;
          font-size: 12.5px; padding: 3px 0; }
.schuif__naam { color: var(--inkt); }
.schuif input { accent-color: var(--groen); width: 100%; }
.schuif output { text-align: right; color: var(--gedempt); font-variant-numeric: tabular-nums; }
.vink { display: block; font-size: 13px; padding: 4px 0; cursor: pointer; }
.vink input { accent-color: var(--terra); margin-right: 7px; }
.knop.klein { padding: 6px 12px; font-size: 11.5px; margin-top: var(--sp-3); width: 100%; }

.teller { font-size: 13.5px; color: var(--gedempt); margin: 0 0 var(--sp-3); }
#kaart { height: 62vh; min-height: 460px; border-radius: var(--hoekstraal);
         border: 1px solid var(--rand); background: var(--verdiept);
         margin-bottom: var(--sp-5); position: relative; }
.kaart__terugval { position: absolute; left: 16px; bottom: 12px; margin: 0; max-width: 340px;
                   font-size: 11.5px; color: var(--gedempt); }
.leaflet-container { font-family: var(--tekst); }
.leaflet-popup-content { margin: 12px 14px; font-size: 12.5px; line-height: 1.5; }

.rij { display: grid; grid-template-columns: 12px 1fr 40px 150px 150px; gap: 12px;
       align-items: center; padding: 7px 0; border-bottom: 1px solid var(--raster);
       font-size: 13px; }
.rij--af { grid-template-columns: 1fr 220px; opacity: .7; }
.rij__stip { width: 10px; height: 10px; border-radius: 50%; }
.rij__naam small { display: block; color: var(--flauw); font-size: 11.5px; }
.rij__cijfer { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.rij__band { position: relative; height: 8px; background: var(--raster); border-radius: 4px; }
.rij__band span { position: absolute; top: 0; bottom: 0; background: var(--ramp2);
                  border-radius: 4px; opacity: .55; }
.rij__band i { position: absolute; top: -3px; width: 3px; height: 14px;
               background: var(--groen); border-radius: 2px; }
.rij__stand { color: var(--gedempt); font-size: 12px; }
.leeg { color: var(--flauw); font-style: italic; font-size: 13px; }
.popup__id { color: var(--flauw); font-size: 11px; letter-spacing: .04em; }

@media (max-width: 1100px) {
  .zeefblad { grid-template-columns: 1fr; }
  .rail { position: static; max-height: none; }
  .rij { grid-template-columns: 12px 1fr 40px 90px; }
  .rij__band { display: none; }
}`;
