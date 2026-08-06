# Evolorahof locatiekaart 1.0

Twee pagina's.

**`dist/index.html` is de zeef.** De kaart staat centraal en onze eisen zijn de
bediening ernaast: zet een grens vast en de plekken die hem raken vallen ter plekke af,
schuif een gewicht op en de kleuren verschuiven mee. Dit is de opvolger van de knop "wat
doen onze eisen?" uit de oorspronkelijke rekentool, maar dan zonder knop: het antwoord
staat er al terwijl je nog aan het schuiven bent.

**`dist/analyse.html` is de analyse.** Wat de groep breed draagt, wat er net overheen
komt en waar zij in tweeën ligt, op basis van de acht ingevulde stellingenformulieren
van 26 juli 2026. Daarnaast wat de brede locatieverkenning van 16 juli 2026 opleverde:
48 benoemde kandidaten en 283 perceel-leads in de regio's Arnhem, Apeldoorn en
's-Hertogenbosch. En de plek waar de twee elkaar raken: de verkenning weegt óók, over
negen eigen criteria, en vertaald naar dezelfde negen thema's blijkt dat de twee
modellen het grondig oneens zijn over wat ertoe doet.

De zeef is om mee te werken, de analyse is om te lezen. Ze verwijzen naar elkaar en ze
rekenen met dezelfde functies uit `src/kern.mjs`; die broncode wordt letterlijk in de
zeefpagina geplakt, zodat de kaart en de analyse nooit uiteen kunnen lopen.

De kern van het ontwerp: **alles wat je zonder programmeren wilt kunnen veranderen,
staat in `inhoud/` als Markdown.** Kleuren, teksten, stellingen, antwoorden, grenzen,
plekken en drempelwaarden zijn allemaal gewone tabellen die je op GitHub kunt lezen en
bewerken. De code in `src/` rekent en tekent, en bevat geen enkel getal dat over
Evolorahof gaat.

```
npm run bouw          bouwt dist/index.html en dist/analyse.html
npm test              rekent alle uitspraken na
npm run controleer    toetst de kleuren op contrast en kleurenblindheid
npm run alles         alle drie achter elkaar
npm run vergelijk     bouwt er een tweede stel met de andere weegmethode naast
```

Er zijn geen afhankelijkheden. Node 18 of nieuwer is genoeg; `npm install` is niet
nodig. Open daarna `dist/index.html` in een browser.

Beide pagina's werken zonder internet. De zeef gebruikt de achtergrondkaart van
OpenStreetMap als die er is, en tekent anders dezelfde punten zelf, met een melding
erbij. De onderlinge ligging klopt dan nog steeds en alle bediening blijft werken, dus
een zaal zonder wifi is geen probleem.

---

## Wat je waar aanpast

| Wil je dit veranderen | Bewerk dit bestand |
|---|---|
| kleuren, lettertype, maatvoering | `inhoud/00-huisstijl.md` |
| weegmethode, vastgestelde grenzen, drempels, scenario's | `inhoud/01-instellingen.md` |
| elke zichtbare zin op de pagina | `inhoud/02-teksten.md` |
| de negen thema's | `inhoud/03-themas.md` |
| de dertig stellingen | `inhoud/04-stellingen.md` |
| wie wat heeft ingevuld | `inhoud/05-antwoorden.md` |
| de grenzen met hun drempel en bron | `inhoud/06-knock-outs.md` |
| de plekken en hun themascores | `inhoud/07-locaties.md` |
| de verantwoording onderaan | `inhoud/08-verantwoording.md` |
| de 48 kandidaten uit de verkenning | `inhoud/09-kandidaten.md` |
| de 283 perceel-leads | `inhoud/10-perceel-leads.md` |
| de criteria en wegingen van de verkenning | `inhoud/11-scoremodel.md` |

De huisstijl levert ook het achtpuntsstramien (`--sp-1` tot `--sp-8`) waar alle
witruimte uit komt, en de kleuren van de kaartstippen. Er staat dus geen kleur- of
maatwaarde in de code.

Zie `inhoud/LEESMIJ.md` voor het formaat en de veelgemaakte fouten.

De bouw stopt bij de eerste fout in de inhoud en zegt in welk bestand en op welke regel
hij zit. Dat is met opzet: een dashboard dat stil doorbouwt met een stelling die nergens
bij hoort, is gevaarlijker dan een bouw die weigert.

---

## Wat de analyse laat zien

**De ladder** is het hart. De verticale as is de *eensgezindheid*: één min de gemiddelde
afstand tussen twee willekeurige antwoorden. Dat scheidt twee dingen die anders door
elkaar lopen. Acht mensen die allemaal "erg mee oneens" invullen zijn maximaal
eensgezind, ook al zeggen ze nee; samen nee zeggen is geen conflict. Links staat elke
stelling op zijn werkelijke hoogte, zodat je de gaten ziet. Rechts staan dezelfde
stellingen leesbaar, met de acht antwoorden als staafjes: vlak is eensgezind, een trap
betekent verdeeld.

**Waar het gewicht landt** zet het gewicht van de groep naast de dekking van dat thema
over de plekken. Dat levert de scherpste bevinding op: bijna de helft van wat de groep
zegt te wegen, valt op thema's die bij geen of nauwelijks een plek zijn ingevuld en
verdwijnt daarmee stil uit elke locatiescore.

**De trechter** laat zien hoeveel plekken overblijven per set vastgestelde grenzen. De
scenario's staan in `01-instellingen.md`.

**Wat niemand wil inleveren** telt de persoonlijke topvijven. Die laag telt bewust
nergens in mee: een gewicht en een ondergrens zijn niet hetzelfde, en het is beter om
die twee naast elkaar te laten zien dan ze te middelen tot één schijnprecies getal.

**De plekken** toont per plek de score met de onzekerheidsband eromheen. Dat de banden
elkaar overlappen is niet lelijk maar de boodschap: zolang dat zo is, kan het model geen
enkele plek uitsluiten.

Daaronder begint de afdeling over de verkenning.

**Twee wegingen naast elkaar** is het scharnier van het hele dashboard. De verkenning
verdeelt honderd punten over negen criteria, de groep over negen thema's, en via de
kolom `pve-thema` in `11-scoremodel.md` liggen ze op dezelfde as. Wat eruit komt: de
verkenning legt 40 punten op planologie, bestuur en verwerving waar de groep er 6,4 op
legt, en de verkenning weegt niets op bodem, op lucht en geluid en op voorzieningen,
terwijl de groep daar samen ruim dertig punten neerlegt. De verkenning meet of een plek
haalbaar is, de groep meet of het er goed wonen is.

**De achtenveertig kandidaten** laat alle kandidaten tegelijk zien, per regio en op
prioriteit. Een gestippeld blokje heeft geen themascores en telt dus nergens in mee.
Alle twaalf gescoorde plekken liggen in de regio Arnhem; van Apeldoorn en Den Bosch
samen is er niet één gescoord.

**De perceel-leads** toont de onderste laag per zoekzone, met de oppervlakteverdeling.
Let op de verhouding door de hele keten: 283 leads, 48 kandidaten, 12 plekken met
themascores.

---

## Wat de zeef doet

Links staan de eisen, in de volgorde waarin ze tellen.

**1 · de grenzen.** De acht knock-outs uit `06-knock-outs.md`, elk met een schakelaar.
Achter elke schakelaar staat hoeveel plekken die grens nog wegneemt *bovenop* wat er al
vaststaat. Zet je K2 aan, dan zakt het getal achter K8 naar nul: die twee raken dezelfde
plekken, dus samen nemen ze er niet tien weg maar vijf. Dat is precies het soort ding
dat je in een tabel niet ziet en in een gesprek eindeloos kost.

**2 · de weging.** Negen schuiven, standaard op de weging uit ons eigen
stellingenformulier. Schuiven mag: dan zie je meteen wat een andere verdeling met de
volgorde doet. Eén knop zet alles terug.

**3 · de drempels en de lagen.** Vanaf welk cijfer iets groen mag heten, hoeveel thema's
er minimaal ingevuld moeten zijn voordat groen betekenis heeft, en welke lagen je op de
kaart wilt: kandidaten, perceel-leads, archetypen, en per regio.

Rechts staat de uitkomst: de teller, de kaart, wat er overblijft op volgorde van score
met de onzekerheidsband eromheen, en onderaan wat afvalt met de grens erbij die het
deed. De volgorde is niet vrijblijvend: **een plek die een vastgestelde grens raakt valt
af, hoe hoog hij verder ook scoort.** Dat is precies wat een gewogen gemiddelde niet kan
uitdrukken, en daarom staan de grenzen bovenaan en de weging eronder.

De zeef rekent in de browser met dezelfde functies als `npm test` natrekt. De inhoud van
`src/kern.mjs` wordt bij het bouwen letterlijk in de pagina geplakt in plaats van
nagebouwd; er is een test die controleert dat dat ook echt gebeurd is.

---

## Vijf keuzes die je moet kennen

**Onbekend is niet nul en niet gemiddeld, maar weg.** Een thema zonder cijfer valt uit
de noemer en zijn gewicht wordt over de rest verdeeld. Een plek wordt dus beoordeeld op
zijn bekende kant. Daarom staat de band altijd naast de score, en daarom is leeg laten
eerlijker dan gokken.

**De weegmethode maakt uit.** `rangorde` telt per lid alleen de eigen volgorde van de
negen thema's, zodat streng en mild aankruisen even zwaar wegen. `gemiddelde` is de
methode van de oorspronkelijke rekentool en meet mede hoe streng iemand is. Bouw beide
en leg ze naast elkaar met `npm run vergelijk`.

**De grens tussen "samen" en "net over de sloot" ligt bij twee tegenstemmers.** Dat is
een afspraak van de groep en geen meting. Hij staat in `01-instellingen.md` en in de
voetnoot van het dashboard.

**De vertaling van criteria naar thema's is analyse, geen gegeven.** De kolom
`pve-thema` in `11-scoremodel.md` bepaalt hoe de weging van de verkenning op de as van
het PvE landt. Vind je dat "prijs en onzekerheid" eerder bij thema H hoort dan bij F,
pas de kolom dan aan en bouw opnieuw. Dat de vertaling aanvechtbaar is, is precies
waarom ze in een Markdown-bestand staat en niet in de code.

**De tweedeling in sporen is eruit.** De verkenning kende twee wegingsprofielen naast
elkaar, een netgebonden en een energie-autonoom profiel met waterstof. Het model draait
nu op één weging, het netgebonden profiel; zie de toelichting bovenaan
`11-scoremodel.md`. De kolom `spoor` staat nog wel in `09-kandidaten.md` en
`10-perceel-leads.md`, als archief van de verkenning, maar de tool doet er niets mee.

**De antwoorden worden per stelling gehusseld.** Je ziet de verdeling maar niet wie wat
invulde, in lijn met de afspraak dat individuele profielen alleen met instemming worden
gedeeld. Zet `anonimiseren: nee` in `05-antwoorden.md` als de groep daar anders over
besluit. Het husselen gebruikt een vaste startwaarde, dus een herbouw geeft geen ruis in
de git-geschiedenis.

---

## Wat dit niet is

Geen besluit en geen uitslag. Eén zwaarwegend bezwaar telt zwaarder dan elk gemiddelde
hier. De koppeling van grenzen aan specifieke plekken (kolom `raakt` in
`07-locaties.md`) is een inschatting op basis van ligging en regelgeving, geen
perceelsgewijze toets; in het dashboard staan die vermoedens als zodanig gemarkeerd. De
themascores zijn indicaties uit de brede verkenning.

---

## Opbouw van de code

```
inhoud/          alle gegevens en teksten, als Markdown
src/
  markdown.mjs   frontmatter, tabellen en secties lezen
  inhoud.mjs     inladen en controleren; alle validatie zit hier
  bereken.mjs    de rekenkern; elke functie is puur en getest
  stijl.mjs      het stijlblad uit de huisstijltabellen
  svg.mjs        hulpjes om svg als tekst te bouwen
  kern.mjs       de rekenkern die bouw en browser delen; zonder imports, met opzet
  sjabloon.mjs   het html-skelet en de interactielaag van de analyse
  panelen/       de acht grafieken, elk in een eigen bestand
  zeef.mjs       de zeefpagina: bediening, kaart en de ingeplakte kern
  bouw.mjs       ingang: leest, rekent, schrijft dist/
  controleer.mjs kleurcontrole (contrast, ramp, kleurenblindheid)
test/            testloper zonder afhankelijkheden, plus de bundel
dist/index.html  de zeef, meegecommit
dist/analyse.html de analyse, meegecommit
```

`src/kern.mjs` is met opzet klein en importeert niets: hij wordt zowel als module
ingeladen door de bouw als letterlijk in de zeefpagina geplakt. Voeg er alleen zuivere
functies aan toe, geen bestandssysteem en geen DOM.

De grafieken worden **bij het bouwen** getekend, niet in de browser. Daardoor is het
dashboard leesbaar zonder JavaScript en kun je de uitvoer in git vergelijken. De
meegeleverde JavaScript doet alleen de tooltips, de donkere modus en de tabelknop.

`npm test` rekent niet alleen de losse functies na, maar ook de cijfers die in de
rapporten staan: de themagewichten, de 47 procent, de indeling van de stellingen, de
trechter van twaalf naar drie, het wegingsverschil van 33,6 punten op thema F, en dat
alle gescoorde plekken in één regio liggen. Verandert er iets aan de inhoud of de
methode, dan zakt die test. Dat is het doel: de getallen in het dashboard en de getallen
in de rapporten moeten dezelfde getallen zijn.

Twee controles gaan niet over cijfers maar over de bouw zelf, en staan er omdat het daar
eerder is misgegaan. De ene kijkt of elke `var(--x)` in het stijlblad ook echt
gedefinieerd is: een ontbrekende variabele geeft geen foutmelding in de browser, hij
maakt stilletjes alle witruimte nul. De andere kijkt of de kern werkelijk in de
zeefpagina staat. `npm test` schrijft zelf niets naar `dist/`; die bouw is een artefact
van `npm run bouw`.

---

## Het display-lettertype

Evolorahof gebruikt in zijn presentaties een letter die in de bestanden
`Evolorahof Display` heet. Dat is een hernoemde versie van een commercieel
gelicentieerde letter (Fontatica-4F van Sergiy S. Tkachenko, 4th february), waarvan de
licentie verspreiding verbiedt. **Die letter staat daarom niet in deze repository.**

Het dashboard gebruikt zonder die letter een terugval uit `00-huisstijl.md` en ziet er
verder identiek uit. Wil je de echte letter gebruiken op je eigen machine, zie
`assets/lettertype/LEESMIJ.md`.

---

## Taal

Bestandsnamen, functienamen en commentaar zijn Nederlands. Dat is een bewuste keuze: de
mensen die deze inhoud bewerken zijn Nederlandstalig, de bestaande rekentool van
Evolorahof is dat ook, en `inhoud/` moet leesbaar zijn voor iemand die geen
programmeur is.

## Licentie

De code staat onder MIT (zie `LICENSE`). De inhoud in `inhoud/` gaat over Evolorahof en
blijft eigendom van de initiatiefgroep.
