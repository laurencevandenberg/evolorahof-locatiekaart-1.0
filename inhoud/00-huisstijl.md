---
titel: Huisstijl
lettertype-insluiten: nee
lettertype-bestand: assets/lettertype/evolorahof-display.css
display-fallback: Open Sans, ui-sans-serif, system-ui, sans-serif
tekst-fallback: Open Sans, -apple-system, system-ui, sans-serif
donkere-modus: ja
---

# Huisstijl

Alle kleuren van het dashboard staan hieronder. Wijzig je een waarde, dan verandert
hij overal waar hij gebruikt wordt: bouw opnieuw met `npm run bouw` en klaar.

## Het display-lettertype

Het display-lettertype van Evolorahof is **Fontatica 4F** van 4thfebruary. In sommige
oudere bestanden staat het hernoemd als `Evolorahof Display`. Het is een aangeschafte
licentie die verspreiding verbiedt, dus **de letter staat niet in deze repository**.

De terugval is Open Sans, precies zoals `design.md` sectie 12 voorschrijft. Koppen zien
er dan minder eigen uit maar wel goed; een vervangende display-letter erbij verzinnen zou
verder van de huisstijl af staan dan de voorgeschreven terugval.

Zie `assets/lettertype/LEESMIJ.md` voor hoe je hem lokaal toevoegt. Zolang dat niet is
gebeurd, gebruikt het dashboard de fallback hierboven. Zet
`lettertype-insluiten: ja` zodra het bestand er staat.

## Kleuren, lichte modus

Contrast is gemeten tegen `oppervlak`. Waarden onder 3:1 zijn alleen toegestaan voor
vlakken met een zichtbaar label ernaast, niet voor tekst.

| sleutel | waarde | waarvoor |
|---------|--------|----------|
| inkt | #2a2723 | hoofdtekst en koppen |
| gedempt | #5a524a | bijschriften en toelichting |
| flauw | #6f655a | aslabels en voetnoten (ink-3) |
| oppervlak | #faf7f0 | achtergrond van de pagina |
| verdiept | #f3ecdd | ingesprongen vlakken |
| paneel | #ffffff | achtergrond van de kaders |
| rand | #c9bfa8 | randen van kaders en knoppen |
| raster | #e4dcc9 | rasterlijnen in de grafieken (line) |
| terra | #b0463c | het accent: verdeeldheid, waarschuwing, klemtoon |
| groen | #437059 | het tweede accent: eensgezindheid, positief (bosgroen) |
| duindoorn | #8f5e1d | derde accent: deels, tussenstand. De vlakversie #e9a35b haalt geen contrast |
| veldrand | #8f8163 | rand van invoervelden; een lichtgrijze rand haalt geen 3:1 |
| lead | #6b7f8f | de perceel-leads op de kaart; blauwgrijs, los van elke statuskleur |

## Kleuren, donkere modus

Geen automatische omkering: elke stap is apart gekozen en getoetst tegen het donkere
oppervlak.

| sleutel | waarde | waarvoor |
|---------|--------|----------|
| inkt | #f2ede2 | hoofdtekst en koppen |
| gedempt | #bcb3a4 | bijschriften en toelichting |
| flauw | #8d8477 | aslabels en voetnoten |
| oppervlak | #23211e | achtergrond van de pagina |
| verdiept | #2e2b26 | ingesprongen vlakken |
| paneel | #2a2723 | achtergrond van de kaders |
| rand | #4a453d | randen van kaders en knoppen |
| raster | #3a352e | rasterlijnen in de grafieken |
| terra | #d9736a | het accent |
| groen | #7fae92 | het tweede accent |
| duindoorn | #d9a05e | derde accent |
| veldrand | #6d6555 | rand van invoervelden |
| lead | #8fa3b3 | de perceel-leads op de kaart |

## De groenramp

Vier stappen van licht naar donker, voor de trechter. Eén tint, oplopende donkerte,
en de lichtste stap komt los van de achtergrond. Aanpassen mag, maar controleer daarna
met `npm run controleer` of de stappen nog van elkaar te onderscheiden zijn.

| stap | licht | donker |
|------|-------|--------|
| 1 | #9db69c | #3c5a49 |
| 2 | #7d9a84 | #5f8a70 |
| 3 | #5d856f | #8fb59a |
| 4 | #437059 | #c2d4c6 |

## Maatvoering

| sleutel | waarde | waarvoor |
|---------|--------|----------|
| paginabreedte | 1180 | maximale breedte van de kolom, in pixels |
| grafiekbreedte | 1108 | breedte van de brede grafieken |
| regelhoogte-ladder | 31 | hoogte van één stelling in de ladder |
| hoekstraal | 14 | afronding van de kaders (r-md uit design.md) |

## Ruimte

Het achtpuntsstramien uit `design.md` sectie 6.1. Elke afstand in het stijlblad is een
van deze stappen, zodat witruimte een keuze uit een lijstje is en niet elke keer opnieuw
verzonnen wordt. Ze komen als `--sp-1` tot en met `--sp-8` in de css terecht.

| stap | pixels | waarvoor |
|------|--------|----------|
| 1 | 4 | tussen icoon en tekst |
| 2 | 8 | tussen dingen die bij elkaar horen |
| 3 | 12 | binnenruimte van compacte onderdelen |
| 4 | 16 | standaard binnenruimte |
| 5 | 24 | tussen alinea's, binnenruimte van kaders |
| 6 | 32 | tussen kleine secties |
| 7 | 48 | tussen middelgrote secties |
| 8 | 64 | tussen paginasecties |
