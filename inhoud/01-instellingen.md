---
titel: Instellingen
weegmethode: rangorde
vastgestelde-grenzen: []
tegenstemmers-voor-sloot: 2
minimale-dekking-voor-groen: 5
groen-vanaf: 65
rood-onder: 45
---

# Instellingen

De knoppen die de uitkomst sturen. Elke instelling staat hier één keer, zodat je nooit
in de code hoeft te zoeken waar een grens vandaan komt.

## Weegmethode

`weegmethode` bepaalt hoe de antwoorden een gewicht per thema worden.

- `rangorde` telt per lid alleen de eigen volgorde van de negen thema's. Wie streng
  aankruist en wie mild aankruist tellen dan even zwaar. Dit is de aanbevolen stand.
- `gemiddelde` neemt het ruwe gemiddelde per thema en schaalt naar honderd. Dat is de
  methode van de oorspronkelijke rekentool. Hij meet mede hoe streng iemand aankruist,
  waardoor de negen thema's dichter bij elkaar eindigen.

Het verschil is groot genoeg om te zien en klein genoeg om beide te laten zien. Bouw
gerust twee keer en leg ze naast elkaar.

## Vastgestelde grenzen

`vastgestelde-grenzen` is de lijst codes uit `06-knock-outs.md` die de groep heeft
aangenomen. Zolang de lijst leeg is, valt geen enkele plek af en doet de score al het
werk. Dat is de eerlijke uitgangsstand: de grenzen zijn een besluit, geen aanname.

Voorbeeld na een consentronde:

```yaml
vastgestelde-grenzen: [K7, K8]
```

## Waar de streep ligt

`tegenstemmers-voor-sloot` bepaalt vanaf hoeveel tegenstemmers een stelling met een
meerderheid vóór toch als "net over de sloot" wordt aangemerkt. Standaard 2. Dit is een
afspraak en geen meting; hij staat expliciet in de voetnoot van het dashboard.

`minimale-dekking-voor-groen` is het aantal thema's dat gescoord moet zijn voordat een
plek groen mag heten. `groen-vanaf` en `rood-onder` zijn de scoregrenzen daarbij.

## Scenario's voor de trechter

Elke regel is een stap in de trechter. `grenzen` is een lijst codes; leeg betekent
geen enkele grens toegepast. De trechter rekent per stap uit hoeveel kandidaten
overblijven en welke daarvan het hoogst scoort.

| naam | grenzen | toelichting |
|------|---------|-------------|
| geen grens | | alle gescoorde kandidaten |
| K7 water | K7 | Betuwe en rivieroever vallen af |
| K2 en K8 | K2, K8 | stikstof en de eis van drie jaar halen de Veluweflank weg |
| alle drie | K2, K7, K8 | alleen bestaand stedelijk gebied blijft over |
