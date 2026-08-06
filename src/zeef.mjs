/**
 * De zeef: de interactieve sectie boven aan de pagina.
 *
 * Links de eisen als bediening, rechts de kaart en de lijst, en alles rekent meteen
 * mee: zet een knock-outcriterium vast en de plekken die het raken vallen ter plekke
 * af, schuif een gewicht op en de kleuren schuiven mee.
 *
 * Twee ontwerpkeuzes die de rest verklaren.
 *
 * **Het criterium gaat voor het cijfer.** Een plek die een vastgesteld
 * knock-outcriterium raakt valt af, hoe hoog hij verder ook scoort. Dat is precies wat
 * een gewogen gemiddelde niet kan uitdrukken, en daarom staan de criteria bovenaan in
 * de bediening en de weging eronder.
 *
 * **De browser rekent met dezelfde functies als de bouw.** De inhoud van `kern.mjs`
 * wordt hier letterlijk in de pagina geplakt in plaats van nagebouwd, zodat de kaart
 * en de rest van de pagina nooit uiteen kunnen lopen. Een test controleert dat de
 * kern werkelijk in de uitvoer staat.
 *
 * Dit bestand bouwt alleen de sectie en haar script; het paginaskelet, de koppen en de
 * begrippenlijst zijn van `pagina.mjs`. Alle zichtbare tekst komt uit
 * `inhoud/02-teksten.md`, ook de zinnen die de browser pas later samenstelt.
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
 * Voegt de kandidaten uit `09-kandidaten.md` samen met de themascores uit
 * `08-themascores.md`. De koppeling loopt over `id`. Een kandidaat zonder themascores
 * blijft in de lijst staan, grijs: hij bestaat, we weten er alleen niets van. Hem
 * weglaten zou de lijst mooier maken en het beeld onwaar.
 */
function plekkenvoorraad(inhoud) {
  const opId = new Map(inhoud.themascores.map((l) => [l.id, l]));
  const uit = [];

  for (const kandidaat of inhoud.kandidaten) {
    const gescoord = opId.get(kandidaat.id);
    uit.push({
      id: kandidaat.id,
      naam: kandidaat.naam,
      detail: `${kandidaat.gemeente} · ${kandidaat.omvang}`,
      regio: kandidaat.regio,
      categorie: kandidaat.categorie,
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
  for (const profiel of inhoud.themascores.filter((l) => l.soort === 'archetype')) {
    uit.push({
      id: profiel.id,
      naam: profiel.naam,
      detail: profiel.detail,
      regio: 'archetype',
      categorie: 'archetype',
      status: '',
      waarom: '',
      bron: '',
      lat: null,
      lon: null,
      scores: profiel.scores,
      raakt: profiel.raakt,
    });
  }
  return uit;
}

/**
 * De kleuren van de kaartstippen als concrete hex, per modus, uit de huisstijl.
 * Leaflet zet kleuren als svg-attribuut en kan daar geen css-variabele lezen, dus de
 * waarden worden bij het bouwen ingevuld in plaats van in de browser opgezocht. Zo
 * blijft `00-huisstijl.md` de enige plek waar een kleur wordt gekozen.
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

/* -------------------------------------------------------------------- bediening */

/**
 * Eén knock-outcriterium in de bediening: aankruisvakje, volledige naam, het aantal
 * plekken dat het nog wegneemt, en een uitklapbare toelichting met drempel, status en
 * bron. De kale code (K1) is alleen het interne adres en komt niet in beeld.
 */
const schakelaar = (knockout, effect) => `
  <div class="knockout">
    <label class="knockout__knop">
      <input type="checkbox" data-knockout="${escapeHtml(knockout.code)}">
      <span class="knockout__tekst">
        <span class="knockout__label">knock-outcriterium ${escapeHtml(knockout.nummer)}</span>
        <span class="knockout__naam">${escapeHtml(knockout.naam)}</span>
      </span>
      <span class="knockout__effect" data-effect="${escapeHtml(knockout.code)}">−${effect}</span>
    </label>
    <details class="knockout__meer">
      <summary><span class="uitleg uitleg--vast" aria-hidden="true">?</span>drempel, status en bron</summary>
      <p>${escapeHtml(knockout.drempel)}</p>
      <p><b>status</b> ${escapeHtml(knockout.status)} · <b>te repareren</b> ${escapeHtml(knockout.herstel)}</p>
      <p class="knockout__bron">${knockout.bron}</p>
    </details>
  </div>`;

/** Eén weegschuif. De naam is de volledige themanaam; de code blijft intern. */
const schuif = (thema, gewicht) => `
  <label class="schuif" title="${escapeHtml(thema.uitleg)}">
    <span class="schuif__naam">${escapeHtml(thema.naam)}</span>
    <input type="range" min="0" max="30" step="0.5" value="${gewicht.toFixed(1)}"
           data-gewicht="${escapeHtml(thema.code)}"
           aria-label="gewicht van het thema ${escapeHtml(thema.naam)}">
    <output data-uitvoer="${escapeHtml(thema.code)}">${gewicht.toFixed(1).replace('.', ',')}</output>
  </label>`;

const regiovinkje = (regio) => `
  <label class="vink"><input type="checkbox" data-filter="regio"
    value="${escapeHtml(regio)}" checked> regio ${escapeHtml(regio)}</label>`;

/* ----------------------------------------------------------------------- script */

/**
 * Het browser-script van de zeef. Draait na de ingeplakte kern en na de definitie van
 * BASIS (de gegevens), STANDKLEUR en LEADKLEUR (de kleuren). Alle zichtbare zinnen
 * komen uit BASIS.tekst, zodat ook deze laag zonder code te herschrijven is.
 */
const SCRIPT = String.raw`
"use strict";

/* ---- toestand. Alles wat de gebruiker kan verzetten staat hier, en nergens anders. */
const toestand = {
  vastgesteld: [],
  gewicht: { ...BASIS.gewicht },
  groenVanaf: BASIS.groenVanaf,
  roodOnder: BASIS.roodOnder,
  minimaleDekking: BASIS.minimaleDekking,
  lagen: { kandidaten: true, leads: false, archetypen: true },
  regios: new Set(BASIS.regios),
};

const el = (id) => document.getElementById(id);
const veilig = (waarde) => String(waarde ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const komma = (waarde, decimalen = 1) => waarde.toFixed(decimalen).replace(".", ",");
const T = BASIS.tekst;

/** De volledige naam van een knock-outcriterium; kale codes komen niet in beeld. */
const knockoutnaam = (code) => BASIS.knockouts[code] ?? code;

/** De kaartstippen volgen de paginamodus; op de lichte OpenStreetMap-tegels niet. */
const huidigeModus = () =>
  document.documentElement.dataset.modus === "donker" ? "donker" : "licht";
const kleurOpTegels = (stand) => STANDKLEUR.licht[stand];
const kleurOpPagina = (stand) => STANDKLEUR[huidigeModus()][stand];

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

/* ------------------------------------------------------------------- de kaart ---- */

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
    const marker = L.circleMarker([plek.lat, plek.lon], {
      radius: uitslag.stand === "ongescoord" ? 5 : 9,
      color: "#ffffff", weight: 1.5,
      fillColor: kleurOpTegels(uitslag.stand),
      fillOpacity: uitslag.stand === "ongescoord" ? 0.5 : 0.92,
    });
    marker.bindPopup(popup(uitslag), { maxWidth: 330 });
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
          "<i>" + veilig(T.popupLead) + "</i><br>" +
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
  // Web Mercator. De omrekening naar graden is nodig omdat de x-as ook graden
  // gebruikt; zonder die factor wordt de kaart een factor vijftig platgedrukt.
  const mercator = (lat) =>
    (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));

  const alle = punten.concat(toestand.lagen.leads
    ? BASIS.leads.map((l) => ({ plek: l })) : []);
  if (!alle.length) {
    vak.innerHTML = '<p class="leeg">' + veilig(T.leegKaart) + "</p>";
    return;
  }

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
    '<p class="kaart__terugval">' + veilig(T.kaartTerugval) + "</p>";
}

/* -------------------------------------------------------------------- weergave -- */

function popup(uitslag) {
  const { plek } = uitslag;
  const regels = [
    "<b>" + veilig(plek.naam) + "</b>",
    veilig(plek.detail),
    "",
    '<b style="color:' + kleurOpTegels(uitslag.stand) + '">' + STANDEN[uitslag.stand].naam + "</b>",
  ];
  if (uitslag.geraakt.length) {
    regels.push(veilig(T.valtAfOp) + " " +
      uitslag.geraakt.map((code) => veilig(knockoutnaam(code))).join("<br>en "));
  } else if (uitslag.score !== null) {
    regels.push(veilig(T.score) + " " + Math.round(uitslag.score) + " · " +
      veilig(T.band) + " " + Math.round(uitslag.ondergrens) + " tot " +
      Math.round(uitslag.bovengrens) + "<br>" + uitslag.geteld + " van " +
      BASIS.themacodes.length + " " + veilig(T.themasOnderzocht));
  } else {
    regels.push(veilig(T.geenScores));
  }
  if (plek.categorie === "archetype") regels.push("", "<i>" + veilig(T.archetype) + "</i>");
  if (plek.status) regels.push("", veilig(plek.status));
  if (plek.waarom) regels.push("<i>" + veilig(plek.waarom) + "</i>");
  if (plek.bron) {
    regels.push('<a href="' + veilig(plek.bron) + '" target="_blank" rel="noopener">bron</a>');
  }
  regels.push('<span class="popup__id">' + veilig(plek.id) + "</span>");
  return regels.join("<br>");
}

function tekenLijst(uitslagen) {
  const over = uitslagen.filter((u) => u.stand !== "afgevallen");
  const af = uitslagen.filter((u) => u.stand === "afgevallen");
  const totaal = BASIS.themacodes.length;

  el("lijst").innerHTML = over.length === 0
    ? '<p class="leeg">' + veilig(T.leegLijst) + "</p>"
    : over.map((u) => {
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
        '<span class="rij__stand">' + STANDEN[u.stand].naam +
        (u.score === null ? "" : "<small>" + u.geteld + " van " + totaal +
          " " + veilig(T.themasOnderzocht) + "</small>") +
        "</span></div>";
    }).join("");

  el("afgevallen").innerHTML = af.length === 0
    ? '<p class="leeg">' + veilig(T.leegAfgevallen) + "</p>"
    : af.map((u) => '<div class="rij rij--af"><span class="rij__naam">' +
        veilig(u.plek.naam) + '</span><span class="rij__stand">' + veilig(T.valtAfOp) +
        " " + u.geraakt.map((code) => veilig(knockoutnaam(code))).join("<br>en ") +
        "</span></div>").join("");
}

function tekenTellers(uitslagen) {
  const tel = (stand) => uitslagen.filter((u) => u.stand === stand).length;
  el("teller").innerHTML =
    "<b>" + uitslagen.length + "</b> " + veilig(T.inBeeld) + " · " +
    "<b>" + (uitslagen.length - tel("afgevallen")) + "</b> " + veilig(T.over) + " · " +
    '<b style="color:var(--groen)">' + tel("voldoet") + "</b> " + veilig(T.voldoet) + " · " +
    '<b style="color:var(--terra)">' + tel("afgevallen") + "</b> " + veilig(T.afgevallen) +
    " · " + tel("ongescoord") + " " + veilig(T.ongescoord);

  // Wat elk criterium nog zou wegnemen bovenop wat al vaststaat.
  for (const knoop of document.querySelectorAll("[data-effect]")) {
    const code = knoop.getAttribute("data-effect");
    const aantal = effectVanKnockout(inBeeld(), code, toestand.vastgesteld);
    knoop.textContent = toestand.vastgesteld.includes(code) ? T.vast : "−" + aantal;
    knoop.classList.toggle("knockout__effect--aan", toestand.vastgesteld.includes(code));
    knoop.classList.toggle("knockout__effect--nul",
      !toestand.vastgesteld.includes(code) && aantal === 0);
  }
}

/** Alles opnieuw tekenen. Eén ingang, zodat er geen half bijgewerkt scherm ontstaat. */
function ververs() {
  const uitslagen = beoordeel();
  if (kaart) tekenKaartLeaflet(uitslagen); else tekenKaartSvg(uitslagen);
  tekenLijst(uitslagen);
  tekenTellers(uitslagen);
}

/* ------------------------------------------------------------------- bediening -- */

for (const veld of document.querySelectorAll("[data-knockout]")) {
  veld.addEventListener("change", () => {
    const code = veld.getAttribute("data-knockout");
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
    document.querySelector('[data-uitvoer="' + code + '"]').textContent =
      komma(Number(veld.value));
    el("weegstand").textContent = T.weegstandEigen;
    ververs();
  });
}

el("herstel-weging").addEventListener("click", () => {
  toestand.gewicht = { ...BASIS.gewicht };
  for (const veld of document.querySelectorAll("[data-gewicht]")) {
    const code = veld.getAttribute("data-gewicht");
    veld.value = BASIS.gewicht[code];
    document.querySelector('[data-uitvoer="' + code + '"]').textContent =
      komma(BASIS.gewicht[code]);
  }
  el("weegstand").textContent = T.weegstandOnze;
  ververs();
});

el("herstel-alles").addEventListener("click", () => {
  toestand.vastgesteld = [];
  for (const veld of document.querySelectorAll("[data-knockout]")) veld.checked = false;
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

// De moduswissel zit in het paginascript; de zeef tekent alleen opnieuw, want de
// stippen op de terugvalkaart en in de lijst volgen de modus.
document.addEventListener("moduswissel", ververs);

if (!bouwKaart()) {
  document.body.classList.add("zonder-kaart");
}
addEventListener("resize", () => { if (!kaart) ververs(); });
ververs();
`.trim();

/* ------------------------------------------------------------------------ sectie */

/**
 * Bouwt de sectie en het bijbehorende script.
 *
 * `rijk` zet een tekst uit `02-teksten.md` om naar html met werkende
 * (?begrip)-verwijzingen; `tekst` haalt een sleutel op en stopt de bouw als hij
 * ontbreekt. Beide komen uit `pagina.mjs`, zodat de hele pagina één
 * begrippenmechanisme heeft.
 */
export function bouwZeefSectie({ wortel, inhoud, gewicht, rijk, tekst }) {
  const plekken = plekkenvoorraad(inhoud);
  const themacodes = inhoud.themas.map((t) => t.code);
  const regios = [...new Set(inhoud.kandidaten.map((k) => k.regio))].sort();
  const { standkleuren, leadkleuren } = kaartpalet(inhoud.huisstijl);
  const aantalArchetypen = inhoud.themascores.filter((l) => l.soort === 'archetype').length;

  const basis = {
    plekken,
    themacodes,
    gewicht,
    regios,
    // De volledige namen voor in popups en de lijst; de kale code blijft het adres.
    knockouts: Object.fromEntries(inhoud.knockouts.map((k) =>
      [k.code, `knock-outcriterium ${k.nummer} · ${k.naam}`])),
    // Alleen de velden die de kaart nodig heeft. De id gaat mee omdat je daarmee de
    // lead terugvindt in `inhoud/10-perceel-leads.md`; de rest van de kolommen niet.
    leads: inhoud.leads.map((l) => ({
      id: l.id, lat: l.lat, lon: l.lon, ha: l.hectare, zone: l.zoekzone,
      aanduiding: l.aanduiding,
    })),
    groenVanaf: inhoud.instellingen['groen-vanaf'] ?? 65,
    roodOnder: inhoud.instellingen['rood-onder'] ?? 45,
    minimaleDekking: inhoud.instellingen['minimale-dekking-voor-groen'] ?? 5,
    // Elke zin die de browser samenstelt, uit `02-teksten.md`.
    tekst: {
      inBeeld: tekst('teller-in-beeld'),
      over: tekst('teller-over'),
      voldoet: tekst('teller-voldoet'),
      afgevallen: tekst('teller-afgevallen'),
      ongescoord: tekst('teller-ongescoord'),
      vast: 'vast',
      valtAfOp: tekst('popup-valt-af-op'),
      score: tekst('popup-score'),
      band: tekst('popup-band'),
      themasOnderzocht: tekst('popup-themas-onderzocht'),
      geenScores: tekst('popup-geen-scores'),
      popupLead: tekst('popup-lead'),
      archetype: tekst('popup-archetype'),
      leegLijst: tekst('leeg-lijst'),
      leegAfgevallen: tekst('leeg-afgevallen'),
      leegKaart: tekst('leeg-kaart'),
      kaartTerugval: tekst('kaart-terugval'),
      weegstandOnze: tekst('weegstand-onze'),
      weegstandEigen: tekst('weegstand-eigen'),
    },
  };

  // Het effect van een criterium bij de start: er is nog niets vastgesteld.
  const effect = (code) => plekken.filter((p) => p.raakt.includes(code)).length;

  const html = `
  <section id="zeef" class="paneel paneel--zeef">
    <h2>${escapeHtml(tekst('zeef-titel'))}</h2>
    <p class="uitlegtekst">${rijk(tekst('zeef-uitleg'))}</p>

    <div class="zeefblad">
      <aside class="rail" aria-label="de eisen">

        <section class="rail__blok">
          <h3>1 · ${rijk(tekst('rail-knockouts-titel'))}</h3>
          <p class="rail__uit">${rijk(tekst('rail-knockouts-uitleg'))}</p>
          ${inhoud.knockouts.map((k) => schakelaar(k, effect(k.code))).join('')}
        </section>

        <section class="rail__blok">
          <h3>2 · ${rijk(tekst('rail-weging-titel'))}</h3>
          <p class="rail__uit">${rijk(tekst('rail-weging-uitleg'))}
            Nu actief: <span id="weegstand">${escapeHtml(tekst('weegstand-onze'))}</span>.</p>
          ${inhoud.themas.map((thema) => schuif(thema, gewicht[thema.code])).join('')}
          <button class="knop klein" id="herstel-weging">${escapeHtml(tekst('knop-herstel-weging'))}</button>
        </section>

        <section class="rail__blok">
          <h3>3 · ${rijk(tekst('rail-streng-titel'))}</h3>
          <p class="rail__uit">${rijk(tekst('rail-streng-uitleg'))}</p>
          <label class="schuif">
            <span class="schuif__naam">${escapeHtml(tekst('label-groen-vanaf'))}</span>
            <input type="range" id="groen-vanaf" min="40" max="90" step="1"
                   value="${basis.groenVanaf}">
            <output id="groen-vanaf-uit">${basis.groenVanaf}</output>
          </label>
          <label class="schuif">
            <span class="schuif__naam">${escapeHtml(tekst('label-dekking'))}</span>
            <input type="range" id="dekking" min="1" max="${themacodes.length}" step="1"
                   value="${basis.minimaleDekking}">
            <output id="dekking-uit">${basis.minimaleDekking}</output>
          </label>
        </section>

        <section class="rail__blok">
          <h3>4 · ${rijk(tekst('rail-lagen-titel'))}</h3>
          <label class="vink"><input type="checkbox" data-laag="kandidaten" checked>
            ${rijk(tekst('laag-kandidaten'))} (${inhoud.kandidaten.length})</label>
          <label class="vink"><input type="checkbox" data-laag="leads">
            ${rijk(tekst('laag-leads'))} (${inhoud.leads.length})</label>
          <label class="vink"><input type="checkbox" data-laag="archetypen" checked>
            ${rijk(tekst('laag-archetypen'))} (${aantalArchetypen})</label>
          <div class="rail__scheiding"></div>
          ${regios.map(regiovinkje).join('')}
          <button class="knop klein" id="herstel-alles">${escapeHtml(tekst('knop-herstel-alles'))}</button>
        </section>
      </aside>

      <div class="hoofd">
        <p id="teller" class="teller">laden…</p>
        <div id="kaart"></div>

        <h3 class="hoofd__kop">${escapeHtml(tekst('overblijft-titel'))}</h3>
        <p class="uitlegtekst">${rijk(tekst('overblijft-uitleg'))}</p>
        <div id="lijst"></div>

        <h3 class="hoofd__kop">${escapeHtml(tekst('afgevallen-titel'))}</h3>
        <div id="afgevallen"></div>
      </div>
    </div>
  </section>`;

  const script = `
${kernbroncode(wortel)}
const STANDKLEUR = ${JSON.stringify(standkleuren)};
const LEADKLEUR = ${JSON.stringify(leadkleuren)};
const BASIS = ${JSON.stringify(basis)};
${SCRIPT}`;

  return { html, script };
}

/** Stijl die alleen de zeefsectie nodig heeft. De tokens komen uit de huisstijl. */
export const ZEEFSTIJL = `
.paneel--zeef { padding-bottom: var(--sp-5); }
.zeefblad { display: grid; grid-template-columns: 384px 1fr; gap: var(--sp-5);
            align-items: start; margin-top: var(--sp-4); }
.rail { position: sticky; top: var(--sp-4); max-height: calc(100vh - 32px);
        overflow-y: auto; padding-right: var(--sp-2); }
.rail__blok { background: var(--verdiept); border: 1px solid var(--rand);
              border-radius: var(--hoekstraal); padding: var(--sp-4) var(--sp-4) var(--sp-5);
              margin-bottom: var(--sp-4); }
.rail__blok h3 { font-size: 17px; margin: 0 0 var(--sp-2); color: var(--inkt); }
.rail__uit { font-size: 12.5px; color: var(--gedempt); margin: 0 0 var(--sp-4); }
.rail__scheiding { height: 1px; background: var(--raster); margin: var(--sp-4) 0; }

.knockout { border-bottom: 1px solid var(--raster); padding: var(--sp-2) 0; }
.knockout:last-of-type { border-bottom: 0; }
.knockout__knop { display: grid; grid-template-columns: 18px 1fr 44px; gap: var(--sp-2);
                  align-items: start; cursor: pointer; }
.knockout__knop input { accent-color: var(--terra); width: 16px; height: 16px;
                        margin-top: 2px; }
.knockout__label { display: block; font-size: 10.5px; font-weight: 700;
                   letter-spacing: .07em; text-transform: uppercase; color: var(--flauw); }
.knockout__naam { display: block; font-size: 13px; color: var(--inkt); line-height: 1.35; }
.knockout__effect { font-size: 12px; color: var(--flauw); text-align: right;
                    font-variant-numeric: tabular-nums; margin-top: 6px; }
.knockout__effect--aan { color: var(--terra); font-weight: 700; }
.knockout__effect--nul { opacity: .45; }
.knockout__meer { margin: var(--sp-1) 0 var(--sp-1) 26px; font-size: 11.5px;
                  color: var(--gedempt); }
.knockout__meer summary { cursor: pointer; color: var(--groen); list-style: none; }
.knockout__meer summary::-webkit-details-marker { display: none; }
.knockout__meer p { margin: var(--sp-1) 0; }
.knockout__bron a { color: var(--groen); }

.schuif { display: grid; grid-template-columns: 1fr 96px 34px; gap: var(--sp-2);
          align-items: center; font-size: 12.5px; padding: 3px 0; }
.schuif__naam { color: var(--inkt); }
.schuif input { accent-color: var(--groen); width: 100%; }
.schuif output { text-align: right; color: var(--gedempt);
                 font-variant-numeric: tabular-nums; }
.vink { display: block; font-size: 13px; padding: 4px 0; cursor: pointer; }
.vink input { accent-color: var(--terra); margin-right: 7px; }
.knop.klein { padding: 6px 12px; font-size: 11.5px; margin-top: var(--sp-3); width: 100%; }

.teller { font-size: 13.5px; color: var(--gedempt); margin: 0 0 var(--sp-3); }
#kaart { height: 62vh; min-height: 460px; border-radius: var(--hoekstraal);
         border: 1px solid var(--rand); background: var(--verdiept);
         margin-bottom: var(--sp-5); position: relative; }
.kaart__terugval { position: absolute; left: 16px; bottom: 12px; margin: 0;
                   max-width: 340px; font-size: 11.5px; color: var(--gedempt); }
.leaflet-container { font-family: var(--tekst); }
.leaflet-popup-content { margin: 12px 14px; font-size: 12.5px; line-height: 1.5; }

.hoofd__kop { font-size: 19px; margin: var(--sp-5) 0 var(--sp-1); }
.rij { display: grid; grid-template-columns: 12px 1fr 40px 140px 170px; gap: var(--sp-3);
       align-items: center; padding: 7px 0; border-bottom: 1px solid var(--raster);
       font-size: 13px; }
.rij--af { grid-template-columns: 220px 1fr; opacity: .75; align-items: start; }
.rij__stip { width: 10px; height: 10px; border-radius: 50%; }
.rij__naam small { display: block; color: var(--flauw); font-size: 11.5px; }
.rij__cijfer { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.rij__band { position: relative; height: 8px; background: var(--raster); border-radius: 4px; }
.rij__band span { position: absolute; top: 0; bottom: 0; background: var(--ramp2);
                  border-radius: 4px; opacity: .55; }
.rij__band i { position: absolute; top: -3px; width: 3px; height: 14px;
               background: var(--groen); border-radius: 2px; }
.rij__stand { color: var(--gedempt); font-size: 12px; }
.rij__stand small { display: block; color: var(--flauw); font-size: 11px; }
.leeg { color: var(--flauw); font-style: italic; font-size: 13px; }
.popup__id { color: var(--flauw); font-size: 11px; letter-spacing: .04em; }

@media (max-width: 1100px) {
  .zeefblad { grid-template-columns: 1fr; }
  .rail { position: static; max-height: none; }
  .rij { grid-template-columns: 12px 1fr 40px 110px; }
  .rij__band { display: none; }
}`;
