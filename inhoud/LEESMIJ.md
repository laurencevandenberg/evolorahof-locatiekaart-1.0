# Deze map bewerken

Alles wat de pagina laat zien, staat hier. Je hebt geen programmeerkennis nodig: het
zijn gewone Markdown-bestanden die je op GitHub kunt lezen en met de potloodknop kunt
bewerken. Ook een taalmodel kan hier veilig in werken: elk bestand legt bovenaan uit
wat het is, en de bouw controleert alles.

Na een wijziging draai je `npm run bouw`. Klopt er iets niet, dan stopt de bouw met een
melding die het bestand, de regel en het probleem noemt.

## De indeling

De nummers groeperen de bestanden op rol:

| nummers | rol | bestanden |
|---------|-----|-----------|
| 00 – 03 | hoe de pagina eruitziet en praat | huisstijl, instellingen, teksten, begrippen |
| 04 – 07 | wat wij vragen | thema's, stellingen, antwoorden, knock-outcriteria |
| 08 – 11 | wat er is | themascores, kandidaten, perceel-leads, scoremodel verkenning |
| 12 | verantwoording | de tekst onderaan de pagina |

## Het formaat

**Losse instellingen** staan bovenaan tussen twee regels met drie streepjes:

```markdown
---
weegmethode: rangorde
anonimiseren: ja
vastgestelde-knock-outs: [K7, K8]
---
```

`ja` en `nee` worden waar en onwaar. Getallen worden getallen. Iets tussen blokhaken
wordt een lijst.

**Tabellen** zijn gewone Markdown-tabellen. De kop bepaalt de kolomnamen, dus die moet
je laten staan zoals hij is:

```markdown
| code | naam |
|------|------|
| A | water en klimaat |
```

**Secties** zijn de stukken onder een kop met twee hekjes. In `02-teksten.md` en
`12-verantwoording.md` wordt zo'n sectie letterlijk een stuk tekst op de pagina. In de
tekst mag je `**vet**`, `*cursief*`, `` `code` `` en `[link](https://...)` gebruiken;
al het andere blijft platte tekst.

## Codes en namen

De bestanden verwijzen naar elkaar met korte codes: `K1` tot `K8` voor de
knock-outcriteria, `A` tot `I` voor de thema's, en id's als `AR01` voor plekken. Dat
zijn adressen voor in de bestanden. **Op de pagina zelf verschijnt altijd de volledige
naam**; er is zelfs een test die zakt zodra ergens een kale code in beeld komt.

## Waar het meestal misgaat

**Een kolom vergeten.** Elke rij moet evenveel pijpen hebben als de kop. De melding
zegt precies welke regel het is.

**Een reeks antwoorden die niet klopt.** In `06-antwoorden.md` moet de reeks even lang
zijn als het aantal stellingen. Voeg je een stelling toe, dan moet iedereen er een
teken bij krijgen; gebruik een punt voor niet ingevuld.

**Een code die nergens bestaat.** Verwijs je in `08-themascores.md` naar een
knock-outcriterium `K9` dat niet in `07-knock-outs.md` staat, dan stopt de bouw.
Hetzelfde geldt voor een stelling die naar een thema verwijst dat niet bestaat, en voor
een begripsleutel waar geen begrip bij hoort.

**Een themakolom vergeten bij een nieuw thema.** Voeg je een thema toe in
`04-themas.md`, dan moet `08-themascores.md` een kolom met die code krijgen. Leeg laten
mag; dat betekent gewoon "nog niet gescoord".

## Volgorde van bewerken

Voeg je iets toe, doe het dan in deze volgorde, dan klopt de samenhang vanzelf:

1. thema in `04-themas.md`
2. kolom voor dat thema in `08-themascores.md`
3. stelling in `05-stellingen.md`
4. een teken erbij in elke reeks in `06-antwoorden.md`
