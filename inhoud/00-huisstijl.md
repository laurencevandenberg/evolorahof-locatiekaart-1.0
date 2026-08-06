---
titel: Huisstijl
lettertype-insluiten: nee
lettertype-bestand: assets/lettertype/evolorahof-display.css
display-fallback: Oswald, Haettenschweiler, Impact, sans-serif
tekst-fallback: Open Sans, -apple-system, system-ui, sans-serif
donkere-modus: ja
---

# Huisstijl

Alle kleuren van het dashboard staan hieronder. Wijzig je een waarde, dan verandert
hij overal waar hij gebruikt wordt: bouw opnieuw met `npm run bouw` en klaar.

## Het display-lettertype

Het lettertype dat Evolorahof in de presentaties gebruikt heet in de bestanden
`Evolorahof Display`. Dat is een hernoemde versie van een commerciële letter
(Fontatica-4F van Sergiy S. Tkachenko, 4th february). De licentie verbiedt
verspreiding, dus **die letter staat niet in deze repository**.

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
| flauw | #9a9082 | aslabels en voetnoten |
| oppervlak | #faf7f0 | achtergrond van de pagina |
| verdiept | #f3ecdd | ingesprongen vlakken |
| paneel | #ffffff | achtergrond van de kaders |
| rand | #c9bfa8 | randen van kaders en knoppen |
| raster | #e6ddca | rasterlijnen in de grafieken |
| terra | #b0463c | het accent: verdeeldheid, waarschuwing, klemtoon |
| groen | #437059 | het tweede accent: eensgezindheid, positief |

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
| hoekstraal | 12 | afronding van de kaders |
