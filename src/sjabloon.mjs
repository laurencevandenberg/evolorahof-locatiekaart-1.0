/**
 * Het HTML-skelet. Zet de panelen, de teksten en de stijl in elkaar tot één bestand.
 *
 * De uitvoer is bewust één zelfstandig bestand zonder externe verzoeken: het moet op
 * een beamer werken in een zaal zonder wifi, en over vijf jaar nog openen vanaf een
 * usb-stick. De meegeleverde JavaScript doet alleen de tooltips, de donkere modus en de
 * tabelknop; alle grafieken staan al in de HTML.
 */
import { naarHtml, escapeHtml } from './markdown.mjs';
import { getal } from './svg.mjs';
import { STATUS, statusLegenda } from './panelen/status.mjs';
import { wegingenLegenda } from './panelen/wegingen.mjs';
import { kandidatenLegenda } from './panelen/kandidaten.mjs';

/** De interactielaag. Klein genoeg om in te lezen, en het dashboard werkt ook zonder. */
const SCRIPT = `
"use strict";
// Tooltips: elk element met data-tip krijgt dezelfde zwevende ballon. De inhoud is bij
// het bouwen al gemaakt, hier wordt alleen gepositioneerd.
const tip = document.getElementById("tip");
function toon(gebeurtenis, html) {
  tip.innerHTML = html;
  tip.style.opacity = 1;
  const marge = 14;
  const x = gebeurtenis.clientX ?? innerWidth / 2;
  const y = gebeurtenis.clientY ?? innerHeight / 2;
  let links = x + marge;
  let boven = y + marge;
  if (links + tip.offsetWidth > innerWidth - 8) links = x - tip.offsetWidth - marge;
  if (boven + tip.offsetHeight > innerHeight - 8) boven = y - tip.offsetHeight - marge;
  tip.style.left = Math.max(8, links) + "px";
  tip.style.top = Math.max(8, boven) + "px";
}
const verberg = () => { tip.style.opacity = 0; };

for (const knoop of document.querySelectorAll("[data-tip]")) {
  const html = knoop.getAttribute("data-tip");
  knoop.addEventListener("mousemove", (g) => toon(g, html));
  knoop.addEventListener("mouseleave", verberg);
  knoop.addEventListener("focus", (g) => {
    const vak = knoop.getBoundingClientRect();
    toon({ clientX: vak.left + vak.width / 2, clientY: vak.top + vak.height / 2 }, html);
  });
  knoop.addEventListener("blur", verberg);
}
document.addEventListener("keydown", (g) => { if (g.key === "Escape") verberg(); });

// Aanwijzen van een regel in de ladder laat de bijbehorende stip links opzwellen.
for (const knoop of document.querySelectorAll("[data-stip]")) {
  const nummer = knoop.getAttribute("data-stip");
  const stip = document.querySelector('circle[data-stip="' + nummer + '"]');
  if (!stip) continue;
  const groot = () => stip.setAttribute("r", 8);
  const klein = () => stip.setAttribute("r", 5);
  knoop.addEventListener("mouseenter", groot);
  knoop.addEventListener("mouseleave", klein);
  knoop.addEventListener("focus", groot);
  knoop.addEventListener("blur", klein);
}

// Donkere modus. De keuze blijft binnen deze sessie; er wordt niets opgeslagen.
const modusknop = document.getElementById("modus");
if (modusknop) {
  modusknop.addEventListener("click", () => {
    const donker = document.documentElement.dataset.modus === "donker";
    document.documentElement.dataset.modus = donker ? "licht" : "donker";
    modusknop.textContent = donker ? modusknop.dataset.naarDonker : modusknop.dataset.naarLicht;
    modusknop.setAttribute("aria-pressed", String(!donker));
  });
}

// Tabelweergave, zodat niets alleen in kleur of positie zit.
const tabelknop = document.getElementById("tabelknop");
if (tabelknop) {
  tabelknop.addEventListener("click", () => {
    const paneel = document.getElementById("tabelpaneel");
    const open = paneel.classList.toggle("verborgen") === false;
    tabelknop.setAttribute("aria-pressed", String(open));
    if (open) paneel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
`.trim();

/** Eén paneel met kop, uitleg en inhoud. */
const paneel = (titel, uitleg, inhoud, extra = '') => `
  <section class="paneel">
    <h2>${escapeHtml(titel)}</h2>
    <p class="uitleg">${naarHtml(uitleg)}</p>
    ${extra}
    ${inhoud}
  </section>`;

/** De vier kerncijfers boven aan de pagina; alleen de eerste is een held. */
function tegels(cijfers, teksten) {
  const totaal = cijfers.zonderDekking + cijfers.dunneDekking;
  const tegel = (label, waarde, bij, klasse = '', held = false) => `
    <div class="tegel${held ? ' held' : ''}">
      <div class="label">${escapeHtml(label)}</div>
      <div class="waarde${klasse}">${escapeHtml(waarde)}</div>
      <div class="bij">${escapeHtml(bij)}</div>
    </div>`;
  return `<div class="cijfers">
    ${tegel(teksten['tegel-gewicht-label'], `${Math.round(totaal)}%`,
      `waarvan ${getal(cijfers.zonderDekking)} procent op thema's die nergens zijn ingevuld`,
      ' let', true)}
    ${tegel(teksten['tegel-samen-label'], String(cijfers.samen), teksten['tegel-samen-bij'])}
    ${tegel(teksten['tegel-sloot-label'], String(cijfers.sloot), teksten['tegel-sloot-bij'], ' let')}
    ${tegel(teksten['tegel-verdeeld-label'], String(cijfers.verdeeld),
      teksten['tegel-verdeeld-bij'], ' let')}
  </div>`;
}

/** De volledige tabel met alle stellingen, als tegenhanger van de ladder. */
function tabel(stellingen, teksten) {
  const rijen = [...stellingen]
    .sort((a, b) => b.eensgezindheid - a.eensgezindheid || b.gemiddelde - a.gemiddelde)
    .map((rij) => {
      const let_ = ['sloot', 'verdeeld'].includes(rij.status) ? ' class="let"' : '';
      return `<tr${let_}>
        <td class="num">${rij.nr}</td><td>${escapeHtml(rij.thema)}</td>
        <td>${escapeHtml(rij.tekst)}</td>
        <td class="num">${Math.round(rij.eensgezindheid * 100)}%</td>
        <td class="num">${getal(rij.gemiddelde, 2)}</td>
        <td class="num">${rij.voor}</td><td class="num">${rij.tegen}</td>
        <td class="num">${rij.topvijf || '—'}</td>
        <td>${escapeHtml(teksten[STATUS[rij.status].sleutel])}</td>
        <td>${rij.zeeft ? 'ja' : 'nee'}</td></tr>`;
    }).join('');
  return `<div class="tabelhouder"><table class="data">
    <thead><tr><th>nr</th><th>thema</th><th>stelling</th><th class="num">eensgezind</th>
    <th class="num">gemiddeld</th><th class="num">voor</th><th class="num">tegen</th>
    <th class="num">top vijf</th><th>oordeel</th><th>zeeft</th></tr></thead>
    <tbody>${rijen}</tbody></table></div>`;
}

/** De verantwoording onderaan: elke sectie wordt een alinea met vette kop. */
const verantwoording = (secties) => Object.entries(secties)
  .map(([sleutel, tekst]) => {
    const kop = sleutel.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
    return `<b>${escapeHtml(kop)}.</b> ${naarHtml(tekst)}`;
  }).join('<br>');

/** Sprongnavigatie. Werkt zonder JavaScript, want het zijn gewone ankers. */
const navigatie = (teksten) => `
  <nav class="sprong" aria-label="secties">
    <a href="#pve">${escapeHtml(teksten['nav-pve'])}</a>
    <a href="#verkenning">${escapeHtml(teksten['nav-verkenning'])}</a>
    <a href="index.html">${escapeHtml(teksten['knop-kaart'])}</a>
  </nav>`;

export function bouwPagina({ inhoud, panelen, cijfers, stellingen, css, waarschuwingen }) {
  const t = inhoud.teksten;
  const waarschuwing = waarschuwingen.length
    ? `<div class="waarschuwing">${waarschuwingen.map(escapeHtml).join('<br>')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="nl" data-modus="licht">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(t.paginatitel)}</title>
<meta name="description" content="${escapeHtml(t.inleiding)}">
<style>
${css}
</style>
</head>
<body>
<main>

  <div class="kop">
    <div>
      <p class="kicker">${escapeHtml(t.kicker)}</p>
      <h1><span class="accent">${escapeHtml(t['kop-accent'])}</span><br>${escapeHtml(t['kop-rest'])}</h1>
      <p class="sub">${naarHtml(t.inleiding)}</p>
    </div>
    <div style="display:flex;gap:8px">
      <button class="knop" id="modus" aria-pressed="false"
        data-naar-donker="${escapeHtml(t['knop-donker'])}"
        data-naar-licht="${escapeHtml(t['knop-licht'])}">${escapeHtml(t['knop-donker'])}</button>
      <button class="knop" id="tabelknop" aria-pressed="false"
        aria-controls="tabelpaneel">${escapeHtml(t['knop-tabel'])}</button>
      <a class="knop" href="index.html">${escapeHtml(t['knop-kaart'])}</a>
    </div>
  </div>

  ${navigatie(t)}

  ${waarschuwing}
  ${tegels(cijfers, t)}

  <h2 class="afdeling" id="pve">het programma van eisen</h2>

  ${paneel(t['ladder-titel'], t['ladder-uitleg'], panelen.ladder,
    statusLegenda(t, t['legenda-ladder']))}

  ${paneel(t['themas-titel'], t['themas-uitleg'], panelen.themas)}

  <div class="tweeluik">
    ${paneel(t['trechter-titel'], t['trechter-uitleg'], panelen.trechter)}
    ${paneel(t['topvijf-titel'], t['topvijf-uitleg'], panelen.topvijf, `
      <div class="legenda">
        <span class="sleutel"><i class="vierkant" style="background:var(--ramp4)"></i>het thema is
          bij minstens één plek ingevuld</span>
        <span class="sleutel"><i class="vierkant" style="background:var(--terra)"></i>thema nergens
          gescoord: kan geen plek laten afvallen</span>
      </div>`)}
  </div>

  ${paneel(t['plekken-titel'], t['plekken-uitleg'], panelen.plekken)}

  <h2 class="afdeling" id="verkenning">de locatieverkenning</h2>
  <p class="afdeling-uitleg">Wat hierboven staat gaat over wat wij willen. Wat hieronder
  staat gaat over wat er is: de brede locatieverkenning van 16 juli 2026, met 48 benoemde
  kandidaten en 283 perceel-leads. De twee ontmoeten elkaar in het eerste paneel.</p>

  ${paneel(t['wegingen-titel'], t['wegingen-uitleg'], panelen.wegingen, wegingenLegenda)}
  ${paneel(t['kandidaten-titel'], t['kandidaten-uitleg'], panelen.kandidaten, kandidatenLegenda)}
  ${paneel(t['leads-titel'], t['leads-uitleg'], panelen.leads)}

  <section class="paneel verborgen" id="tabelpaneel">
    <h2>${escapeHtml(t['tabel-titel'])}</h2>
    <p class="uitleg">${naarHtml(t['tabel-uitleg'])}</p>
    ${tabel(stellingen, t)}
  </section>

  <p class="voet">${verantwoording(inhoud.verantwoording)}</p>
</main>

<div id="tip" role="status" aria-live="polite"></div>
<script>
${SCRIPT}
</script>
</body>
</html>
`;
}
