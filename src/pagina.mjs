/**
 * De pagina. Zet alle secties, de teksten en de stijl in elkaar tot één bestand.
 *
 * De opbouw volgt het verhaal van het instrument: eerst de zeef (de vraag op het
 * aanbod gelegd), dan waar de eisen vandaan komen, dan wat er is, dan wat er nog moet
 * gebeuren, en onderaan de begrippen en de verantwoording. Eén pagina, zodat niemand
 * hoeft te weten welk bestand hij moet openen.
 *
 * De uitvoer is bewust één zelfstandig bestand: het moet op een beamer werken in een
 * zaal zonder wifi, en over vijf jaar nog openen vanaf een usb-stick. Alleen de
 * achtergrondkaart van de zeef komt van internet; zonder verbinding tekent de zeef
 * dezelfde punten zelf.
 *
 * Twee afspraken gelden voor de hele pagina.
 *
 * **Elke zichtbare zin komt uit `inhoud/02-teksten.md`.** De helper `tekst` stopt de
 * bouw zodra een sleutel ontbreekt, zodat een hernoemde sleutel nooit stil een leeg
 * gat op de pagina wordt.
 *
 * **Vakwoorden krijgen een vraagteken.** Wie in een tekst `(?sleutel)` schrijft,
 * krijgt op die plek een klein vraagteken dat verwijst naar `inhoud/03-begrippen.md`.
 * Zonder JavaScript springt het naar de begrippenlijst onderaan; met JavaScript
 * verschijnt de uitleg ter plekke. Kale codes als K1 horen nergens in beeld te komen;
 * een test dwingt dat af.
 */
import { naarHtml, escapeHtml, InhoudFout } from './markdown.mjs';
import { getal } from './svg.mjs';
import { STATUS, statusLegenda } from './panelen/status.mjs';
import { wegingenLegenda } from './panelen/wegingen.mjs';
import { kandidatenLegenda } from './panelen/kandidaten.mjs';
import { bouwZeefSectie, ZEEFSTIJL } from './zeef.mjs';

/* --------------------------------------------------------------- tekst en uitleg */

/** Haalt een tekstsleutel op en stopt de bouw als hij ontbreekt. */
function maakTekst(teksten) {
  return (sleutel) => {
    const waarde = teksten[sleutel];
    if (waarde === undefined || String(waarde).trim() === '') {
      throw new InhoudFout('inhoud/02-teksten.md', 0,
        `de tekst "${sleutel}" ontbreekt; voeg hem toe als frontmatterregel of als sectie`);
    }
    return String(waarde);
  };
}

/**
 * Maakt de twee helpers van het begrippenmechanisme.
 *
 * `uitleg(sleutel)` levert het vraagteken zelf; `rijk(md)` zet een tekst om naar html
 * en vervangt daarbij elke `(?sleutel)` door zo'n vraagteken. Een verwijzing naar een
 * sleutel die niet in `03-begrippen.md` staat, stopt de bouw.
 */
function maakUitleg(begrippen) {
  const opSleutel = new Map(begrippen.map((b) => [b.sleutel, b]));
  const uitleg = (sleutel) => {
    const begrip = opSleutel.get(sleutel);
    if (!begrip) {
      throw new InhoudFout('inhoud/03-begrippen.md', 0,
        `er wordt verwezen naar begrip "${sleutel}", maar dat staat niet in de tabel`);
    }
    return `<a class="uitleg" href="#begrip-${escapeHtml(sleutel)}" ` +
      `data-begrip="${escapeHtml(sleutel)}" ` +
      `aria-label="uitleg: ${escapeHtml(begrip.begrip)}">?</a>`;
  };
  const rijk = (md) => naarHtml(md).replace(/\s*\(\?([a-z-]+)\)/g, (_, sleutel) => uitleg(sleutel));
  return { uitleg, rijk };
}

/* ----------------------------------------------------------------------- script */

/**
 * De interactielaag van de pagina zelf: tooltips, donkere modus, de tabelknop en de
 * uitlegkaartjes. Klein genoeg om in te lezen, en de pagina werkt ook zonder: de
 * vraagtekens zijn dan gewone ankers naar de begrippenlijst.
 */
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

// Donkere modus. De keuze blijft binnen deze sessie; er wordt niets opgeslagen. De
// zeef luistert naar de moduswissel, want de kaartstippen volgen de modus.
const modusknop = document.getElementById("modus");
modusknop.addEventListener("click", () => {
  const donker = document.documentElement.dataset.modus === "donker";
  document.documentElement.dataset.modus = donker ? "licht" : "donker";
  modusknop.textContent = donker ? modusknop.dataset.naarDonker : modusknop.dataset.naarLicht;
  modusknop.setAttribute("aria-pressed", String(!donker));
  document.dispatchEvent(new CustomEvent("moduswissel"));
});

// Tabelweergave, zodat niets alleen in kleur of positie zit.
const tabelknop = document.getElementById("tabelknop");
tabelknop.addEventListener("click", () => {
  const paneel = document.getElementById("tabelpaneel");
  const open = paneel.classList.toggle("verborgen") === false;
  tabelknop.setAttribute("aria-pressed", String(open));
  if (open) paneel.scrollIntoView({ behavior: "smooth", block: "start" });
});

// De uitlegkaartjes achter de vraagtekens. De inhoud komt uit de begrippenlijst
// onderaan de pagina, zodat er maar één bron is; zonder JavaScript springt het anker
// er gewoon naartoe.
const kaartje = document.getElementById("uitlegkaart");
function sluitKaartje() { kaartje.classList.remove("open"); }
for (const knoop of document.querySelectorAll("a.uitleg[data-begrip]")) {
  knoop.addEventListener("click", (gebeurtenis) => {
    gebeurtenis.preventDefault();
    gebeurtenis.stopPropagation();
    const sleutel = knoop.getAttribute("data-begrip");
    const bron = document.getElementById("begrip-" + sleutel);
    if (!bron) return;
    kaartje.innerHTML =
      "<b>" + bron.querySelector("dt").innerHTML + "</b>" +
      "<p>" + bron.querySelector("dd").innerHTML + "</p>" +
      '<a href="#begrip-' + sleutel + '">naar de begrippenlijst ↓</a>';
    kaartje.classList.add("open");
    const vak = knoop.getBoundingClientRect();
    let links = vak.left;
    let boven = vak.bottom + 8;
    if (links + kaartje.offsetWidth > innerWidth - 12) {
      links = innerWidth - kaartje.offsetWidth - 12;
    }
    if (boven + kaartje.offsetHeight > innerHeight - 12) {
      boven = vak.top - kaartje.offsetHeight - 8;
    }
    kaartje.style.left = Math.max(12, links) + "px";
    kaartje.style.top = Math.max(12, boven) + "px";
    kaartje.querySelector("a").addEventListener("click", sluitKaartje);
  });
}
document.addEventListener("click", (gebeurtenis) => {
  if (!kaartje.contains(gebeurtenis.target)) sluitKaartje();
});
document.addEventListener("keydown", (gebeurtenis) => {
  if (gebeurtenis.key === "Escape") { sluitKaartje(); verberg(); }
});
`.trim();

/* ---------------------------------------------------------------------- stukken */

/** Eén paneel met kop, uitleg en inhoud. */
const paneel = (titel, uitlegHtml, inhoud, extra = '') => `
  <section class="paneel">
    <h2>${escapeHtml(titel)}</h2>
    <p class="uitlegtekst">${uitlegHtml}</p>
    ${extra}
    ${inhoud}
  </section>`;

/** De vier kerncijfers boven aan de pagina; alleen de eerste is een held. */
function tegels(cijfers, tekst, rijk) {
  const totaal = cijfers.zonderDekking + cijfers.dunneDekking;
  const tegel = (label, waarde, bij, klasse = '', held = false) => `
    <div class="tegel${held ? ' held' : ''}">
      <div class="label">${rijk(label)}</div>
      <div class="waarde${klasse}">${escapeHtml(waarde)}</div>
      <div class="bij">${rijk(bij)}</div>
    </div>`;
  return `<div class="cijfers">
    ${tegel(tekst('tegel-gewicht-label'), `${Math.round(totaal)}%`,
      `waarvan ${getal(cijfers.zonderDekking)} procent op thema's die nergens zijn ingevuld`,
      ' let', true)}
    ${tegel(tekst('tegel-samen-label'), String(cijfers.samen), tekst('tegel-samen-bij'))}
    ${tegel(tekst('tegel-sloot-label'), String(cijfers.sloot), tekst('tegel-sloot-bij'), ' let')}
    ${tegel(tekst('tegel-verdeeld-label'), String(cijfers.verdeeld),
      tekst('tegel-verdeeld-bij'), ' let')}
  </div>`;
}

/** Sprongnavigatie. Werkt zonder JavaScript, want het zijn gewone ankers. */
const navigatie = (tekst) => `
  <nav class="sprong" aria-label="secties">
    <a href="#zeef">${escapeHtml(tekst('nav-zeef'))}</a>
    <a href="#vraag">${escapeHtml(tekst('nav-vraag'))}</a>
    <a href="#aanbod">${escapeHtml(tekst('nav-aanbod'))}</a>
    <a href="#agenda">${escapeHtml(tekst('nav-agenda'))}</a>
    <a href="#begrippen">${escapeHtml(tekst('nav-begrippen'))}</a>
    <a href="#verantwoording">${escapeHtml(tekst('nav-verantwoording'))}</a>
  </nav>`;

/**
 * De onderzoeksagenda: wat het beeld het snelst scherper maakt. Niets hier is met de
 * hand ingevuld; de lijsten komen rechtstreeks uit dezelfde cijfers als de grafieken,
 * zodat de agenda vanzelf leegloopt naarmate het onderzoek vordert.
 */
function agenda(tekst, rijk, { inhoud, gewicht, dekking, overzicht }) {
  const aantalPlekken = inhoud.themascores.filter((l) => l.soort !== 'archetype').length;

  const magereThemas = inhoud.themas
    .filter((t) => dekking[t.code] <= 3)
    .sort((a, b) => gewicht[b.code] - gewicht[a.code])
    .map((t) => `<li><b>${escapeHtml(t.naam)}</b> — ${getal(gewicht[t.code])} van de
      honderd gewichtspunten, ${dekking[t.code] === 0 ? 'nergens ingevuld'
        : `bij ${dekking[t.code]} van de ${aantalPlekken} plekken ingevuld`}</li>`);

  const openKandidaten = overzicht.hoogZonderLijst
    .map((k) => `<li><b>${escapeHtml(k.naam)}</b> — ${escapeHtml(k.gemeente)},
      regio ${escapeHtml(k.regio)}</li>`);

  return `
  <section class="paneel" id="agenda">
    <h2>${escapeHtml(tekst('agenda-titel'))}</h2>
    <p class="uitlegtekst">${rijk(tekst('agenda-uitleg'))}</p>
    <div class="agenda">
      <div>
        <p>${rijk(tekst('agenda-themas'))}</p>
        <ul>${magereThemas.join('')}</ul>
      </div>
      <div>
        <p>${rijk(tekst('agenda-kandidaten'))}</p>
        <ul>${openKandidaten.join('')}</ul>
      </div>
      <div>
        <p>${rijk(tekst('agenda-vermoedens'))}</p>
      </div>
    </div>
  </section>`;
}

/** De volledige tabel met alle stellingen, als tegenhanger van de ladder. */
function tabel(stellingen, teksten) {
  const rijen = [...stellingen]
    .sort((a, b) => b.eensgezindheid - a.eensgezindheid || b.gemiddelde - a.gemiddelde)
    .map((rij) => {
      const let_ = ['sloot', 'verdeeld'].includes(rij.status) ? ' class="let"' : '';
      return `<tr${let_}>
        <td class="num">${rij.nr}</td><td>${escapeHtml(rij.themanaam)}</td>
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
    <th class="num">top vijf</th><th>oordeel</th><th>kan een plek laten afvallen</th></tr></thead>
    <tbody>${rijen}</tbody></table></div>`;
}

/** De begrippenlijst: de bron waar elk vraagteken naar verwijst. */
function begrippenlijst(begrippen, tekst, rijk) {
  const items = begrippen.map((b) => `
    <div class="begrip" id="begrip-${escapeHtml(b.sleutel)}">
      <dt>${escapeHtml(b.begrip)}</dt>
      <dd>${naarHtml(b.uitleg)}</dd>
    </div>`).join('');
  return `
  <section class="paneel" id="begrippen">
    <h2>${escapeHtml(tekst('begrippen-titel'))}</h2>
    <p class="uitlegtekst">${rijk(tekst('begrippen-uitleg'))}</p>
    <dl class="begrippen">${items}</dl>
  </section>`;
}

/** De verantwoording onderaan: elke sectie wordt een alinea met vette kop. */
const verantwoording = (secties) => Object.entries(secties)
  .map(([sleutel, inhoud]) => {
    const kop = sleutel.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
    return `<b>${escapeHtml(kop)}.</b> ${naarHtml(inhoud)}`;
  }).join('<br>');

/* ----------------------------------------------------------------------- pagina */

export function bouwPagina({ wortel, inhoud, panelen, cijfers, stellingen, gewicht,
  dekking, overzicht, css, waarschuwingen }) {
  const tekst = maakTekst(inhoud.teksten);
  const { uitleg, rijk } = maakUitleg(inhoud.begrippen);
  const zeef = bouwZeefSectie({ wortel, inhoud, gewicht, rijk, tekst });

  const waarschuwing = waarschuwingen.length
    ? `<div class="waarschuwing">${waarschuwingen.map(escapeHtml).join('<br>')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="nl" data-modus="licht">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(tekst('paginatitel'))}</title>
<meta name="description" content="${escapeHtml(tekst('kop-rest'))}">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
${css}
${PAGINASTIJL}
${ZEEFSTIJL}
</style>
</head>
<body>
<main class="breed">

  <div class="kolom">
    <div class="kop">
      <div>
        <p class="kicker">${escapeHtml(tekst('kicker'))}</p>
        <h1><span class="accent">${escapeHtml(tekst('kop-accent'))}</span><br>${escapeHtml(tekst('kop-rest'))}</h1>
        <p class="sub">${rijk(tekst('inleiding'))}</p>
      </div>
      <div class="knoppen">
        <button class="knop" id="modus" aria-pressed="false"
          data-naar-donker="${escapeHtml(tekst('knop-donker'))}"
          data-naar-licht="${escapeHtml(tekst('knop-licht'))}">${escapeHtml(tekst('knop-donker'))}</button>
        <button class="knop" id="tabelknop" aria-pressed="false"
          aria-controls="tabelpaneel">${escapeHtml(tekst('knop-tabel'))}</button>
      </div>
    </div>

    ${navigatie(tekst)}
    ${waarschuwing}
    ${tegels(cijfers, tekst, rijk)}
  </div>

  ${zeef.html}

  <div class="kolom">
    <h2 class="afdeling" id="vraag">${rijk(tekst('afdeling-vraag-titel'))}</h2>
    <p class="afdeling-uitleg">${rijk(tekst('afdeling-vraag-uitleg'))}</p>

    ${paneel(tekst('ladder-titel'), rijk(tekst('ladder-uitleg')), panelen.ladder,
      statusLegenda(inhoud.teksten, tekst('legenda-ladder')))}

    ${paneel(tekst('themas-titel'), rijk(tekst('themas-uitleg')), panelen.themas)}

    <div class="tweeluik">
      ${paneel(tekst('trechter-titel'), rijk(tekst('trechter-uitleg')), panelen.trechter)}
      ${paneel(tekst('topvijf-titel'), rijk(tekst('topvijf-uitleg')), panelen.topvijf)}
    </div>

    <h2 class="afdeling" id="aanbod">${rijk(tekst('afdeling-aanbod-titel'))}</h2>
    <p class="afdeling-uitleg">${rijk(tekst('afdeling-aanbod-uitleg'))}</p>

    ${paneel(tekst('wegingen-titel'), rijk(tekst('wegingen-uitleg')), panelen.wegingen,
      wegingenLegenda)}
    ${paneel(tekst('kandidaten-titel'), rijk(tekst('kandidaten-uitleg')), panelen.kandidaten,
      kandidatenLegenda)}
    ${paneel(tekst('leads-titel'), rijk(tekst('leads-uitleg')), panelen.leads)}

    ${agenda(tekst, rijk, { inhoud, gewicht, dekking, overzicht })}

    <section class="paneel verborgen" id="tabelpaneel">
      <h2>${escapeHtml(tekst('tabel-titel'))}</h2>
      <p class="uitlegtekst">${rijk(tekst('tabel-uitleg'))}</p>
      ${tabel(stellingen, inhoud.teksten)}
    </section>

    ${begrippenlijst(inhoud.begrippen, tekst, rijk)}

    <p class="voet" id="verantwoording">${verantwoording(inhoud.verantwoording)}</p>
  </div>
</main>

<div id="tip" role="status" aria-live="polite"></div>
<div id="uitlegkaart" role="note"></div>
<script>
${SCRIPT}
</script>
<script>
${zeef.script}
</script>
</body>
</html>
`;
}

/** Stijl voor de paginadelen die niet bij een paneel of de zeef horen. */
const PAGINASTIJL = `
main.breed { max-width: 1600px; }
.kolom { max-width: var(--paginabreedte); margin-inline: auto; }
.knoppen { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
.uitlegtekst { color: var(--gedempt); font-size: 13.5px; max-width: 74ch;
               margin: 0 0 var(--sp-4); }

.uitleg { display: inline-flex; align-items: center; justify-content: center;
          width: 16px; height: 16px; border-radius: 50%;
          border: 1.5px solid var(--veldrand); color: var(--gedempt);
          font-size: 10.5px; font-weight: 700; font-style: normal;
          text-decoration: none; vertical-align: 2px; margin-left: 3px; }
.uitleg:hover, .uitleg:focus-visible { border-color: var(--groen); color: var(--groen); }
.uitleg--vast { margin: 0 6px 0 0; border-color: var(--groen); color: var(--groen); }

#uitlegkaart { position: fixed; z-index: 60; max-width: 340px; display: none;
               background: var(--paneel); border: 1px solid var(--rand);
               border-radius: var(--hoekstraal); padding: var(--sp-3) var(--sp-4);
               font-size: 12.5px; line-height: 1.55; color: var(--inkt);
               box-shadow: 0 6px 24px rgba(0,0,0,.14); }
#uitlegkaart.open { display: block; }
#uitlegkaart b { display: block; margin-bottom: var(--sp-1); }
#uitlegkaart p { margin: 0 0 var(--sp-2); color: var(--gedempt); }
#uitlegkaart a { color: var(--groen); font-size: 11.5px; }

.agenda { display: grid; gap: var(--sp-4); }
.agenda p { margin: 0 0 var(--sp-1); max-width: 74ch; }
.agenda ul { margin: 0 0 var(--sp-2); padding-left: var(--sp-5); }
.agenda li { margin: 3px 0; color: var(--gedempt); }
.agenda li b { color: var(--inkt); font-weight: 600; }

.begrippen { margin: 0; columns: 2; column-gap: var(--sp-7); }
.begrip { break-inside: avoid; padding: var(--sp-2) 0; scroll-margin-top: var(--sp-5); }
.begrip dt { font-weight: 700; margin-bottom: 2px; }
.begrip dd { margin: 0; color: var(--gedempt); font-size: 13px; }
.begrip:target dt { color: var(--groen); }
@media (max-width: 900px) { .begrippen { columns: 1; } }`;
