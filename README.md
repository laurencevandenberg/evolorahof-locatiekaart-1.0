# De locatiezeef

Eén instrument dat één vraag beantwoordt: **welke plekken passen bij wat wij vragen, en
hoe zeker weten we dat?**

Het instrument heeft drie lagen.

1. **De vraag.** Wat wij nooit accepteren (acht knock-outcriteria) en wat wij zwaarder
   laten tellen (een weging over negen thema's), opgehaald met de acht ingevulde
   stellingenformulieren van 26 juli 2026.
2. **Het aanbod.** Wat er is: 48 benoemde kandidaten en 283 perceel-leads uit de brede
   locatieverkenning van 16 juli 2026, waarvan twaalf plekken themascores hebben, plus
   drie archetypen als ijkpunt.
3. **De zeef.** De vraag op het aanbod gelegd. Eerst vallen plekken af op de
   vastgestelde knock-outcriteria, dan pas telt het gewogen cijfer, en elk cijfer
   draagt een onzekerheidsband, want bijna de helft van ons gewicht valt op thema's die
   nog niet zijn onderzocht.

Daaromheen ligt één onderbouwingslaag: waar de eisen vandaan komen (hoe eensgezind de
groep per stelling is), wat we van het aanbod nog níet weten (de onderzoeksagenda), en
de verantwoording van de methode.

Dat alles is **één pagina**: `dist/index.html`. De zeef staat bovenaan en is
interactief; alles daaronder is het bewijsmateriaal, in leesvolgorde. De pagina is
zelfstandig, werkt zonder internet (alleen de achtergrondkaart komt van buiten; zonder
verbinding tekent de zeef dezelfde punten zelf) en is dus geschikt voor een beamer in
een zaal zonder wifi.

```
npm run bouw          bouwt dist/index.html
npm test              rekent alle uitspraken na (50 tests)
npm run controleer    toetst de kleuren op contrast en kleurenblindheid
npm run alles         alle drie achter elkaar
npm run vergelijk     bouwt dist/vergelijk.html met de andere weegmethode
```

Er zijn geen afhankelijkheden. Node 18 of nieuwer is genoeg; `npm install` is niet
nodig.

---

## Alles wat je wilt veranderen, staat in `inhoud/`

Dit is de kern van het ontwerp: **de code in `src/` rekent en tekent, en bevat geen
enkel getal, geen enkele zin en geen enkele kleur die over Evolorahof gaat.** Alles wat
je zonder programmeren wilt kunnen veranderen, staat in `inhoud/` als gewone
Markdown-bestanden, leesbaar en bewerkbaar op GitHub, geschikt voor mensen én voor een
taalmodel dat namens iemand meewerkt.

| nummers | rol | wat erin staat |
|---------|-----|----------------|
| 00 – 03 | hoe de pagina eruitziet en praat | huisstijl, instellingen, alle teksten, de begrippenlijst |
| 04 – 07 | wat wij vragen | thema's, stellingen, ingevulde antwoorden, knock-outcriteria |
| 08 – 11 | wat er is | themascores per plek, kandidaten, perceel-leads, scoremodel van de verkenning |
| 12 | verantwoording | de tekst onderaan de pagina |

Zie `inhoud/LEESMIJ.md` voor het formaat en de veelgemaakte fouten. De bouw stopt bij
de eerste fout in de inhoud en zegt in welk bestand en op welke regel hij zit. Dat is
met opzet: een pagina die stil doorbouwt met een stelling die nergens bij hoort, is
gevaarlijker dan een bouw die weigert.

Twee mechanismen maken de inhoudslaag af:

- **Elke zichtbare zin komt uit `02-teksten.md`**, ook de zinnen die de browser pas
  tijdens het schuiven samenstelt. Een sleutel die ontbreekt stopt de bouw; er kan dus
  geen leeg gat op de pagina ontstaan.
- **Vakwoorden krijgen een vraagteken.** Schrijf `(?sleutel)` in een tekst en er
  verschijnt een klein vraagteken dat verwijst naar de uitleg in `03-begrippen.md`.
  Zonder JavaScript springt het naar de begrippenlijst onderaan de pagina; met
  JavaScript verschijnt de uitleg ter plekke.

---

## Wat er op de pagina staat

**De zeef** is het hart. Links de eisen, in de volgorde waarin ze tellen: eerst de
knock-outcriteria, dan de weging, dan de strengheid van het oordeel, dan wat je op de
kaart wilt zien. Rechts de uitkomst: de kaart, wat er overblijft (met per plek de
onzekerheidsband) en wat afvalt, met het criterium erbij dat het deed. Achter elk
criterium staat hoeveel plekken het nog wegneemt bovenop wat al vaststaat; criteria
die dezelfde plekken raken tellen zo niet dubbel, en dat is precies het soort inzicht
dat in een vergadering anders een half uur kost.

**Waar de eisen vandaan komen** onderbouwt de linkerhelft van de zeef: de ladder (hoe
eensgezind de groep per stelling is), waar het gewicht landt en of daar dekking
tegenover staat, de trechter met voorbeeldstanden, en wat niemand wil inleveren (de
persoonlijke topvijven, die bewust nergens in meetellen).

**Wat er is** onderbouwt de rechterhelft: de twee wegingen naast elkaar (de verkenning
weegt of een plek haalbaar is, de groep of het er goed wonen is), de 48 kandidaten per
regio, en de perceel-leads per zoekzone. Hier staat ook de scherpste bevinding: alle
twaalf gescoorde plekken liggen in de regio Arnhem, dus het programma van eisen heeft
tot nu toe over één regio geoordeeld terwijl de verkenning er drie bestrijkt.

**Wat nog moet** is de onderzoeksagenda. Niets erin is met de hand ingevuld: de lijsten
komen rechtstreeks uit dezelfde cijfers als de grafieken, dus de agenda loopt vanzelf
leeg naarmate het onderzoek vordert.

**Begrippen** en **verantwoording** sluiten af. Elk vraagteken op de pagina komt hier
uit voort.

---

## De keuzes, en waarom

**Knock-outcriteria gaan vóór het cijfer.** Een gewogen gemiddelde ruilt alles tegen
alles weg: een mooie bereikbaarheid kan een onveilige bodem wegpoetsen. Daarom valt een
plek die een vastgesteld criterium raakt af, wat de score ook is, en staan de criteria
in de bediening boven de weging. Welke criteria vaststaan is een groepsbesluit; de
uitgangsstand is leeg.

**Onbekend is niet nul en niet gemiddeld, maar weg.** Een thema zonder cijfer valt uit
de noemer en zijn gewicht wordt over de rest verdeeld. Een plek wordt dus beoordeeld op
zijn bekende kant. Daarom staat de onzekerheidsband altijd naast de score, en daarom is
leeg laten eerlijker dan gokken.

**De weegmethode staat open en is een keuze.** Standaard telt per persoon alleen de
eigen volgorde van de thema's (rangorde), zodat streng en mild aankruisen even zwaar
wegen. Het ruwe gemiddelde, de methode van de oorspronkelijke rekentool, blijft
beschikbaar via `npm run vergelijk`.

**Eén weging voor de verkenning.** De verkenning kende twee profielen naast elkaar
(netgebonden en energie-autonoom met waterstof). Die tweedeling suggereerde een
afweging die de groep nog niet heeft gemaakt en is uit het model gehaald; het
netgebonden profiel staat in `11-scoremodel.md`, met de redenering erbij. De kolom
`spoor` in de gegevensbestanden is archief en wordt nergens gelezen.

**De vertaling van verkenningscriteria naar thema's is analyse, geen gegeven.** De
kolom `pve-thema` in `11-scoremodel.md` bepaalt hoe de weging van de verkenning op de
as van het programma van eisen landt. Ze is aanvechtbaar, en dat hoort ze te zijn:
daarom staat ze in een Markdown-bestand en niet in de code.

**De antwoorden worden per stelling gehusseld.** Je ziet de verdeling maar niet wie wat
invulde, in lijn met de afspraak dat individuele profielen alleen met instemming worden
gedeeld. Het husselen gebruikt een vaste startwaarde, dus een herbouw geeft geen ruis
in de git-geschiedenis. Uitzetten kan met `anonimiseren: nee` in `06-antwoorden.md`.

**Codes zijn adressen, geen taal.** De bestanden verwijzen naar elkaar met K1 tot K8 en
A tot I; op de pagina verschijnt altijd de volledige naam, met een vraagteken voor de
uitleg. Een test leest de pagina zoals een bezoeker dat doet, tooltips inbegrepen, en
zakt zodra ergens een kale code in beeld komt.

---

## Wat dit niet is

Geen besluit en geen uitslag. Eén zwaarwegend bezwaar telt zwaarder dan elk gemiddelde
hier. De koppeling van knock-outcriteria aan plekken (kolom `raakt` in
`08-themascores.md`) is een inschatting op ligging en regelgeving, geen perceelsgewijze
toets; de onderzoeksagenda op de pagina zegt dat er ook bij. De themascores zijn
indicaties uit de brede verkenning, geen metingen.

---

## Opbouw van de code

```
inhoud/           alle gegevens en teksten, als Markdown
src/
  markdown.mjs    frontmatter, tabellen en secties lezen
  inhoud.mjs      inladen en controleren; alle validatie zit hier
  kern.mjs        het oordeel over één plek; draait ook in de browser
  statistiek.mjs  de groepsstatistiek: gewichten, eensgezindheid, overzichten
  stijl.mjs       het stijlblad uit de huisstijltabellen
  svg.mjs         hulpjes om svg als tekst te bouwen
  panelen/        de zeven grafieken, elk in een eigen bestand
  zeef.mjs        de interactieve zeefsectie en haar browserscript
  pagina.mjs      het paginaskelet: secties, begrippen, interactielaag
  bouw.mjs        ingang: leest, rekent, schrijft dist/index.html
  controleer.mjs  kleurcontrole (contrast, ramp, kleurenblindheid)
test/             testloper zonder afhankelijkheden, plus de bundel
dist/index.html   de gebouwde pagina, meegecommit
```

De taakverdeling die alles verklaart: **`kern.mjs` beoordeelt één plek en wordt bij het
bouwen letterlijk in de pagina geplakt**, zodat de browser met exact dezelfde functies
rekent als `npm test` natrekt; `statistiek.mjs` rekent over de groep en draait alleen
bij het bouwen. De grafieken worden bij het bouwen als svg getekend, dus de
onderbouwing is leesbaar zonder JavaScript; de meegeleverde scripts doen de zeef, de
tooltips, de donkere modus, de tabelknop en de uitlegkaartjes.

`npm test` rekent niet alleen de losse functies na, maar ook de cijfers die in de
rapporten staan: de themagewichten, de indeling van de stellingen, de trechter van
twaalf naar drie, het wegingsverschil van 33,6 punten op planologie, en dat alle
gescoorde plekken in één regio liggen. Daarnaast bewaakt de bundel de afspraken van de
pagina zelf: de kern staat werkelijk in de uitvoer, elke css-variabele bestaat, elk
vraagteken wijst naar een bestaand begrip, elk begrip wordt gebruikt, en er komt geen
kale code in beeld. `npm test` schrijft zelf niets naar `dist/`; die bouw is een
artefact van `npm run bouw`.

---

## Het display-lettertype

Evolorahof gebruikt in zijn presentaties een letter die in de bestanden
`Evolorahof Display` heet: een hernoemde versie van een commercieel gelicentieerde
letter (Fontatica 4F van 4th february), waarvan de licentie verspreiding verbiedt.
**Die letter staat daarom niet in deze repository.** De pagina gebruikt de terugval uit
`00-huisstijl.md` (Open Sans, conform de huisstijl) en ziet er verder identiek uit. Zie
`assets/lettertype/LEESMIJ.md` om hem lokaal toe te voegen.

## Taal

Bestandsnamen, functienamen en commentaar zijn Nederlands. Dat is een bewuste keuze: de
mensen die deze inhoud bewerken zijn Nederlandstalig, en `inhoud/` moet leesbaar zijn
voor iemand die geen programmeur is.

## Licentie

De code staat onder MIT (zie `LICENSE`). De inhoud in `inhoud/` gaat over Evolorahof en
blijft eigendom van de initiatiefgroep.
