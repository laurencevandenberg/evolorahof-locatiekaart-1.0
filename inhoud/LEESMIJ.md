# Deze map bewerken

Alles wat het dashboard laat zien, staat hier. Je hebt geen programmeerkennis nodig:
het zijn gewone Markdown-bestanden die je op GitHub kunt lezen en met de potloodknop
kunt bewerken.

Na een wijziging draai je `npm run bouw`. Klopt er iets niet, dan stopt de bouw met een
melding die het bestand, de regel en het probleem noemt.

## Het formaat

**Losse instellingen** staan bovenaan tussen twee regels met drie streepjes:

```markdown
---
weegmethode: rangorde
anonimiseren: ja
vastgestelde-grenzen: [K7, K8]
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
`08-verantwoording.md` wordt zo'n sectie letterlijk een stuk tekst op de pagina. In de
tekst mag je `**vet**`, `*cursief*`, `` `code` `` en `[link](https://...)` gebruiken;
al het andere blijft platte tekst.

## Waar het meestal misgaat

**Een kolom vergeten.** Elke rij moet evenveel pijpen hebben als de kop. De melding
zegt precies welke regel het is.

**Een reeks antwoorden die niet klopt.** In `05-antwoorden.md` moet de reeks even lang
zijn als het aantal stellingen. Voeg je een stelling toe, dan moet iedereen er een
teken bij krijgen; gebruik een punt voor niet ingevuld.

**Een code die nergens bestaat.** Verwijs je in `07-locaties.md` naar een grens `K9` die
niet in `06-knock-outs.md` staat, dan stopt de bouw. Hetzelfde geldt voor een stelling
die naar een thema verwijst dat niet bestaat.

**Een themakolom vergeten bij een nieuw thema.** Voeg je een thema toe in
`03-themas.md`, dan moet `07-locaties.md` een kolom met die code krijgen. Leeg laten mag;
dat betekent gewoon "nog niet gescoord".

## Volgorde van bewerken

Voeg je iets toe, doe het dan in deze volgorde, dan klopt de samenhang vanzelf:

1. thema in `03-themas.md`
2. kolom voor dat thema in `07-locaties.md`
3. stelling in `04-stellingen.md`
4. een teken erbij in elke reeks in `05-antwoorden.md`
