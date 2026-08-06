---
titel: Instellingen
weegmethode: rangorde
vastgestelde-knock-outs: []
tegenstemmers-voor-sloot: 2
minimale-dekking-voor-groen: 5
groen-vanaf: 65
rood-onder: 45
---

# Instellingen

De knoppen die de uitkomst sturen. Elke instelling staat hier één keer, zodat je nooit
in de code hoeft te zoeken waar een drempel vandaan komt.

## Weegmethode

`weegmethode` bepaalt hoe de ingevulde formulieren een weging per thema worden.

- `rangorde` telt per lid alleen de eigen volgorde van de negen thema's. Wie streng
  aankruist en wie mild aankruist tellen dan even zwaar. Dit is de aanbevolen stand.
- `gemiddelde` neemt het ruwe gemiddelde per thema en schaalt naar honderd. Dat is de
  methode van de oorspronkelijke rekentool. Hij meet mede hoe streng iemand aankruist,
  waardoor de negen thema's dichter bij elkaar eindigen.

Het verschil is groot genoeg om te zien en klein genoeg om beide te laten zien. Bouw
gerust twee keer (`npm run vergelijk`) en leg ze naast elkaar.

## Vastgestelde knock-outcriteria

`vastgestelde-knock-outs` is de lijst codes uit `07-knock-outs.md` die de groep als
besluit heeft aangenomen. Zolang de lijst leeg is, valt geen enkele plek af en doet de
score al het werk. Dat is de eerlijke uitgangsstand: een knock-outcriterium is een
besluit, geen aanname, en de zeef op de pagina laat iedereen vrij proberen wat elk
criterium zou doen.

Voorbeeld na een consentronde:

```yaml
vastgestelde-knock-outs: [K7, K8]
```

## Waar de streep ligt

`tegenstemmers-voor-sloot` bepaalt vanaf hoeveel tegenstemmers een stelling met een
meerderheid vóór toch als "net over de sloot" wordt aangemerkt. Standaard 2. Dit is een
afspraak en geen meting; hij staat ook zo uitgelegd in de begrippenlijst.

`minimale-dekking-voor-groen` is het aantal thema's dat gescoord moet zijn voordat een
plek "voldoet" mag heten. `groen-vanaf` en `rood-onder` zijn de scoregrenzen daarbij:
vanaf `groen-vanaf` kan een plek voldoen, onder `rood-onder` heet hij te zwak.

## Scenario's voor de trechter

Elke regel is een stap in de trechter op de pagina. `knock-outs` is een lijst codes uit
`07-knock-outs.md`; leeg betekent dat er geen enkel criterium is toegepast. De trechter
rekent per stap uit hoeveel gescoorde plekken overblijven en welke daarvan het hoogst
scoort. De naam is vrije tekst en verschijnt letterlijk in beeld.

| naam | knock-outs | toelichting |
|------|------------|-------------|
| niets vastgesteld | | alle gescoorde plekken |
| waterdiepte vast | K7 | Betuwe en rivieroever vallen af |
| stikstof en bouwtermijn vast | K2, K8 | de eisen die de Veluweflank wegnemen |
| alle drie vast | K2, K7, K8 | alleen bestaand stedelijk gebied blijft over |
