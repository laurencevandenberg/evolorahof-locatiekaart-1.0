# De locatiezeef

Het locatie-instrument van Evolorahof bij het Programma van Eisen 2.0: één zelfstandige
pagina die de eisen van de groep, het aanbod aan plekken en de confrontatie tussen die
twee bij elkaar brengt, met de onderbouwing en de begrippen erbij. De interactieve zeef
bovenaan is het bedieningspaneel; de app is het geheel.

**Inhoud van deze leeswijzer**

1. [Wat de app is](#1--wat-de-app-is)
2. [Starten](#2--starten)
3. [De pagina, sectie voor sectie](#3--de-pagina-sectie-voor-sectie)
4. [Hoe er gerekend wordt](#4--hoe-er-gerekend-wordt)
5. [Zelf dingen veranderen](#5--zelf-dingen-veranderen)
6. [Opbouw van de code](#6--opbouw-van-de-code)
7. [Tests en kwaliteitsbewaking](#7--tests-en-kwaliteitsbewaking)
8. [Online zetten](#8--online-zetten)
9. [Lettertype, taal en licentie](#9--lettertype-taal-en-licentie)

---

## 1 · Wat de app is

Eén instrument dat één vraag beantwoordt: **welke plekken passen bij wat wij vragen, en
hoe zeker weten we dat?** Het bestaat uit drie lagen gegevens en één laag duiding.

1. **De vraag.** Wat wij nooit accepteren (acht knock-outcriteria) en wat wij zwaarder
   laten tellen (een weging over negen thema's), opgehaald met de acht ingevulde
   stellingenformulieren van 26 juli 2026.
2. **Het aanbod.** Wat er is: 48 benoemde kandidaten en 283 perceel-leads uit de brede
   locatieverkenning van 16 juli 2026, waarvan twaalf plekken themascores hebben, plus
   drie archetypen als ijkpunt.
3. **De zeef.** De vraag op het aanbod gelegd. Eerst vallen plekken af op de
   vastgestelde knock-outcriteria, dan pas telt het gewogen cijfer, en elk cijfer
   draagt een onzekerheidsband, want bijna de helft van het gewicht van de groep valt
   op thema's die nog niet zijn onderzocht.
4. **De duiding.** Waar de eisen vandaan komen en hoe eensgezind ze zijn, waar het
   model blind is (de onderzoeksagenda), elk vakwoord uitgelegd (de begrippenlijst) en
   de verantwoording van methode en bronnen.

Alles samen is **één pagina**: `dist/index.html`. Zelfstandig, zonder installatie,
zonder verplicht internet (alleen de achtergrondkaart komt van buiten; zonder
verbinding tekent de zeef dezelfde punten zelf), en daarmee geschikt voor een beamer in
een zaal zonder wifi én om als los bestand rond te sturen.

Wat de app nadrukkelijk **niet** is: een besluit of een uitslag. Eén zwaarwegend
bezwaar telt zwaarder dan elk gemiddelde hier. De app maakt zichtbaar wat de groep
vindt, wat er bekend is en waar de gaten zitten; besluiten blijft mensenwerk.

## 2 · Starten

Alleen kijken: open `dist/index.html` in een browser. Dat bestand is al gebouwd en
staat mee in de repository.

Zelf bouwen, na een wijziging in `inhoud/`:

```
npm run bouw          bouwt dist/index.html
npm test              rekent alle uitspraken na (50 tests)
npm run controleer    toetst de kleuren op contrast en kleurenblindheid
npm run alles         alle drie achter elkaar
npm run vergelijk     bouwt dist/vergelijk.html met de andere weegmethode
```

Er zijn geen afhankelijkheden: Node 18 of nieuwer is genoeg, `npm install` is niet
nodig, en er wordt tijdens het bouwen niets van internet gehaald.

## 3 · De pagina, sectie voor sectie

### De kop en de vier kerncijfers

Bovenaan staan de knoppen voor de donkere modus en de tabelweergave, de
sprongnavigatie, en vier tegels. De grote tegel is de belangrijkste bevinding van het
hele instrument: **47 procent van het gewicht van de groep landt op thema's die bij
geen of nauwelijks een plek zijn ingevuld** (26,3 procent op thema's die nergens zijn
ingevuld). Dat gewicht verdwijnt stil uit elke locatiescore. De drie kleinere tegels
vatten de stellingen samen: 13 breed gedragen, 7 net over de sloot, 10 waar de groep
in tweeën ligt.

### De zeef · leg onze eisen op de kaart

Het interactieve hart. Links staan de eisen, in de volgorde waarin ze tellen; rechts
rekent alles meteen mee.

**1 · wat nooit mag.** De acht knock-outcriteria, elk met volledige naam, een
aankruisvakje en een uitklapbare toelichting met drempel, juridische status, of het te
repareren is, en de bron. Achter elk criterium staat hoeveel plekken het nog wegneemt
**bovenop wat al vaststaat**. Dat getal rekent overlap eerlijk door: zet stikstof
(criterium 2) vast en het getal achter "binnen drie jaar kunnen bouwen" (criterium 8)
zakt naar nul, want die twee raken dezelfde plekken. Precies het soort inzicht dat in
een vergadering anders een half uur kost.

**2 · wat zwaarder telt.** Negen schuiven, standaard op de weging uit de eigen
stellingenformulieren. Schuiven laat meteen zien wat een andere verdeling met de
volgorde doet (meestal: verrassend weinig). Eén knop zet alles terug; de pagina zegt er
steeds bij of de eigen of een aangepaste weging actief is.

**3 · hoe streng het oordeel.** Vanaf welke score een plek "voldoet" mag heten en
hoeveel thema's daarvoor minstens gescoord moeten zijn. De standaardwaarden komen uit
`inhoud/01-instellingen.md`.

**4 · wat je ziet.** Lagen (kandidaten, perceel-leads, archetypen) en regiofilters.

Rechts staat de uitkomst. De **teller** vat de stand samen. De **kaart** toont elke
plek als stip in de kleur van zijn oordeel; met internet op de kaart van
OpenStreetMap, zonder internet als eigen tekening met een melding erbij, en in beide
gevallen met dezelfde popups (score, band, dekking, status, bron). De lijst **wat er
overblijft** staat op volgorde van score, met per plek de onzekerheidsband en hoeveel
van de negen thema's zijn onderzocht. **Wat afvalt, en waarop** noemt bij elke
afgevallen plek het criterium dat het deed, voluit.

### Waar de eisen vandaan komen

De onderbouwing van de linkerkant van de zeef, uit de formulieren van 26 juli.

**De ladder** toont per stelling hoe eensgezind de groep is. De hoogte is de
eensgezindheid: bovenaan staat wat iedereen hetzelfde invulde, of dat nu voor of tegen
was, onderaan ligt de groep in tweeën. Links staat elke stelling op zijn werkelijke
hoogte, zodat je de gaten ziet; rechts staan dezelfde stellingen leesbaar, met de acht
antwoorden als staafjes van laag naar hoog. Vlak is eensgezind, een trap is verdeeld.
Kleur en vulling coderen het oordeel (samen voor, samen tegen, net over de sloot, in
tweeën), en alles staat ook als tekst in de tooltip en in de tabelweergave.

**Waar ons gewicht landt, en of het ergens op slaat** zet per thema het gewicht van de
groep naast de dekking: bij hoeveel van de twaalf gescoorde plekken dat thema is
ingevuld. Hier is de 47 procent uit de kop per thema te zien: energie en
nutsinfrastructuur (15,8 punten) en sociale omgeving en veiligheid (10,4 punten) zijn
nergens ingevuld.

**De trechter** toont drie voorbeeldstanden van de zeef: wat er van de twaalf gescoorde
plekken overblijft bij een oplopende reeks vastgestelde criteria (12 → 7 → 8 → 3). De
reeks staat in `inhoud/01-instellingen.md` en is vrij aan te passen.

**Wat niemand wil inleveren** telt hoe vaak een stelling in iemands persoonlijke top
vijf staat. Die laag telt bewust nergens in mee: een gewicht en een ondergrens zijn
verschillende dingen, en het is eerlijker ze naast elkaar te tonen dan ze te middelen
tot één schijnprecies getal.

### Wat er is

De onderbouwing van de rechterkant van de zeef, uit de verkenning van 16 juli.

**Twee wegingen naast elkaar** is het scharnier tussen de twee werelden. De verkenning
verdeelt honderd punten over negen eigen criteria; via de kolom `pve-thema` in
`inhoud/11-scoremodel.md` worden die vertaald naar onze negen thema's, zodat beide
wegingen op één as liggen. De uitkomst: de verkenning legt 40 punten op planologie,
bestuur en verwerving waar de groep er 6,4 op legt (het grootste verschil, 33,6
punten), en weegt niets op bodem, op lucht en geluid en op voorzieningen, waar de groep
samen ruim dertig punten neerlegt. Kort gezegd: **de verkenning weegt of een plek
haalbaar is, de groep weegt of het er goed wonen is.** De vertaling zelf is analyse en
staat daarom in een bewerkbaar bestand, niet in de code.

**De achtenveertig kandidaten** toont het hele veld per regio en op prioriteit. Een
dicht blokje heeft themascores en telt mee in de zeef; een gestippeld blokje staat wel
op de kaart maar nergens in een berekening. De rijen vertellen de scherpste bevinding
van deze afdeling: **alle twaalf gescoorde plekken liggen in de regio Arnhem.** Van
Apeldoorn en Den Bosch samen, eenendertig kandidaten, is er niet één gescoord; het
programma van eisen heeft dus over één regio geoordeeld terwijl de verkenning er drie
bestrijkt.

**De perceel-leads** toont de onderste laag per zoekzone, met de oppervlakteverdeling
(anderhalf tot twee hectare, met de mediaan per zone). Van deze percelen is alleen
ligging en oppervlakte bekend; het is nadrukkelijk geen kandidatenlijst. De verhouding
door de keten is de boodschap: 283 leads, 48 kandidaten, 12 plekken met themascores.

### Wat nog moet · de onderzoeksagenda

De zeef is zo goed als wat erin zit, en er zit nog te weinig in. Deze sectie somt op
wat het beeld het snelst scherper maakt: de vier thema's die veel gewicht dragen maar
bij hooguit drie plekken zijn ingevuld, de zeven kandidaten met hoge prioriteit zonder
één themascore (allemaal in Apeldoorn en Den Bosch), en de knock-outvermoedens die per
perceel nagetrokken moeten worden vóór er echt op besloten wordt. Niets hierin is met
de hand ingevuld: de lijsten komen rechtstreeks uit dezelfde cijfers als de grafieken,
dus de agenda loopt vanzelf leeg naarmate het onderzoek vordert.

### Alle stellingen als tabel

Achter de knop bovenaan zit de volledige tabel: alle dertig stellingen met thema,
eensgezindheid, gemiddelde, voor- en tegenstemmen, topvijf-vermeldingen, oordeel en of
de stelling een plek kan laten afvallen. De tabel bestaat zodat niets op de pagina
alleen in kleur of positie zit.

### Begrippen en verantwoording

Elk vakwoord op de pagina heeft een klein vraagteken. Klikken toont de uitleg ter
plekke; zonder JavaScript springt het naar de begrippenlijst onderaan, waar alle
begrippen bij elkaar staan. De verantwoording sluit af met methode, aannames, bronnen
en de afspraken over privacy.

## 4 · Hoe er gerekend wordt

Alle formules zijn klein genoeg om na te vertellen, en dat is een ontwerpdoel.

**Van formulier naar weging.** Per lid worden de dertig antwoorden (0 tot 3, omgekeerd
gestelde stellingen gespiegeld) per thema gemiddeld. De standaardmethode `rangorde`
gebruikt daarna alleen de **volgorde** van de negen thema's per lid (gelijke scores
krijgen de gemiddelde rangpositie), zodat streng en mild aankruisen even zwaar wegen.
De methode `gemiddelde` — die van de oorspronkelijke rekentool — schaalt de ruwe
gemiddelden zelf naar honderd en meet daardoor mede hoe streng iemand invult. Het
groepsgewicht is het gemiddelde over de leden, elk lid even zwaar. Beide methodes staan
naast elkaar via `npm run vergelijk`.

**Eensgezindheid.** Eén min de gemiddelde afstand tussen twee willekeurige antwoorden,
op de schaal van 0 tot 3. Iedereen hetzelfde is 100 procent, óók bij unaniem "nee":
samen afwijzen is geen verdeeldheid. Een groep exact in tweeën komt uit op 43 procent.

**De score van een plek.** Het gewogen gemiddelde over de thema's die een cijfer
hebben, geschaald naar 0–100. **Onbekend is niet nul en niet gemiddeld, maar weg**: een
leeg thema valt uit de noemer en zijn gewicht verschuift naar de rest. Daarom hoort bij
elke score de onzekerheidsband: de linkerkant vult elk leeg thema met 0 in, de
rechterkant met 4. Hoe minder er is ingevuld, hoe breder de band.

**Het oordeel, in vaste volgorde.** Eerst de knock-outcriteria: een plek die een
vastgesteld criterium raakt **valt af**, wat de score ook is; dat niet-compenseerbare
is precies wat een gewogen gemiddelde mist. Dan pas het cijfer: **voldoet** vraagt een
score boven de groengrens én genoeg dekking, **te zwak** is onder de ondergrens, alles
daartussen is **deels**, en zonder themascores volgt **niet gescoord** in plaats van
een oordeel.

**Anonimisering.** De antwoorden worden per stelling gehusseld: je ziet de verdeling,
niet wie wat invulde, conform de afspraak dat individuele profielen alleen met
instemming worden gedeeld. Het husselen gebruikt een vaste startwaarde, dus een
herbouw geeft geen ruis in de git-geschiedenis. Uitzetten kan met `anonimiseren: nee`
in `inhoud/06-antwoorden.md`.

## 5 · Zelf dingen veranderen

De kern van het ontwerp: **de code in `src/` rekent en tekent, en bevat geen enkel
getal, geen enkele zin en geen enkele kleur die over Evolorahof gaat.** Alles wat je
zonder programmeren wilt kunnen veranderen staat in `inhoud/` als gewone
Markdown-bestanden — leesbaar en bewerkbaar op GitHub, geschikt voor mensen én voor een
taalmodel dat namens iemand meewerkt.

| nummers | rol | wat erin staat |
|---------|-----|----------------|
| 00 – 03 | hoe de pagina eruitziet en praat | huisstijl, instellingen, alle teksten, de begrippenlijst |
| 04 – 07 | wat wij vragen | thema's, stellingen, ingevulde antwoorden, knock-outcriteria |
| 08 – 11 | wat er is | themascores per plek, kandidaten, perceel-leads, scoremodel van de verkenning |
| 12 | verantwoording | de tekst onderaan de pagina |

Veelvoorkomende ingrepen, steeds gevolgd door `npm run alles`:

- **Een knock-outcriterium vaststellen na een consentronde:** zet de code in
  `vastgestelde-knock-outs` in `01-instellingen.md`.
- **Een kandidaat laten meetellen in de zeef:** geef hem een rij met dezelfde `id` in
  `08-themascores.md` en vul in wat bekend is; leeg laten is eerlijker dan gokken.
- **Een zin herformuleren of een vraagteken toevoegen:** bewerk `02-teksten.md`;
  schrijf `(?sleutel)` waar uitleg hoort, met de uitleg zelf in `03-begrippen.md`.
- **Een kleur of maat wijzigen:** één regel in `00-huisstijl.md`; `npm run controleer`
  bewaakt daarna contrast en kleurenblindheid.
- **De drempels van het oordeel verschuiven:** `groen-vanaf`, `rood-onder` en
  `minimale-dekking-voor-groen` in `01-instellingen.md`.

Drie afspraken maken dit veilig. De bouw **stopt bij de eerste fout** en noemt bestand
en regel; een pagina die stil doorbouwt met een stelling die nergens bij hoort, is
gevaarlijker dan een bouw die weigert. **Elke zichtbare zin komt uit `02-teksten.md`**,
ook de zinnen die de browser pas tijdens het schuiven samenstelt, en een ontbrekende
sleutel stopt de bouw. En **codes zijn adressen, geen taal**: K1 tot K8 en A tot I zijn
verwijzingen voor in de bestanden; op de pagina verschijnt altijd de volledige naam, en
een test zakt zodra dat ergens niet zo is.

Zie `inhoud/LEESMIJ.md` voor het formaat en de veelgemaakte fouten.

## 6 · Opbouw van de code

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
rekent als `npm test` natrekt en de zeef nooit stilletjes iets anders kan vinden dan de
grafieken eronder. `statistiek.mjs` rekent over de groep en draait alleen bij het
bouwen. De grafieken worden bij het bouwen als svg getekend, dus de onderbouwing is
leesbaar zonder JavaScript; de meegeleverde scripts doen de zeef, de tooltips, de
donkere modus, de tabelknop en de uitlegkaartjes.

Twee wegingsprofielen ("spoor A en B") uit de oorspronkelijke verkenning zijn bewust
uit het model gehaald: die tweedeling suggereerde een afweging die de groep nog niet
heeft gemaakt. De redenering staat bovenaan `inhoud/11-scoremodel.md`; de kolom
`spoor` in de gegevensbestanden is archief en wordt nergens gelezen.

## 7 · Tests en kwaliteitsbewaking

`npm test` draait vijftig tests in drie lagen. De onderste rekent de losse functies na
met gevallen die met de hand te controleren zijn. De middelste pint **de cijfers die in
de rapporten staan**: de themagewichten, de 47 en 26,3 procent, de indeling van de
stellingen, de trechter van twaalf naar drie, het wegingsverschil van 33,6 punten op
planologie, en dat alle gescoorde plekken in één regio liggen — verandert inhoud of
methode, dan zakt de test, en dat is het doel: de getallen op de pagina en de getallen
in de rapporten moeten dezelfde getallen zijn. De bovenste laag bewaakt de afspraken
van de pagina zelf: de rekenkern staat werkelijk in de uitvoer, elke css-variabele
bestaat, elk vraagteken wijst naar een bestaand begrip, elk begrip wordt ergens
gebruikt, en er komt geen kale code in beeld (de test leest de pagina zoals een
bezoeker, tooltips inbegrepen). `npm test` schrijft zelf niets naar `dist/`.

`npm run controleer` toetst het kleurgebruik: contrast van elke teksttint tegen het
oppervlak, de groenramp (één richting, genoeg stap, loskomen van de achtergrond), de
kaartstippen tegen hun ondergrond, en het statuspaar groen-terra ook door de ogen van
kleurenblindheid. Waar kleur alleen niet genoeg is, is dat een gedocumenteerde
afwijking met een tweede kanaal (vulling, label, legenda), geen fout.

## 8 · Online zetten

`dist/index.html` staat mee in de repository, dus GitHub Pages heeft niets extra's
nodig; `DUWEN.md` beschrijft het duwen en de Pages-instelling. Rondsturen als los
bestand kan ook: de pagina heeft geen server nodig.

## 9 · Lettertype, taal en licentie

**Lettertype.** Evolorahof gebruikt in presentaties een letter die in oudere bestanden
`Evolorahof Display` heet: een hernoemde versie van een commercieel gelicentieerde
letter (Fontatica 4F van 4th february), waarvan de licentie verspreiding verbiedt.
**Die letter staat daarom niet in deze repository.** De pagina gebruikt de terugval uit
`00-huisstijl.md` (Open Sans, conform de huisstijl) en ziet er verder identiek uit; zie
`assets/lettertype/LEESMIJ.md` om hem lokaal toe te voegen.

**Taal.** Bestandsnamen, functienamen en commentaar zijn Nederlands. Dat is een bewuste
keuze: de mensen die deze inhoud bewerken zijn Nederlandstalig, en `inhoud/` moet
leesbaar zijn voor iemand die geen programmeur is.

**Licentie.** De code staat onder MIT (zie `LICENSE`). De inhoud in `inhoud/` gaat over
Evolorahof en blijft eigendom van de initiatiefgroep.
