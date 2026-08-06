---
titel: Het scoremodel van de verkenning
bron: Brede locatieverkenning Evolorahof, 16 juli 2026, hoofdstuk 3
---

# Het scoremodel van de verkenning

De brede locatieverkenning gebruikt een eigen scoremodel: negen criteria, twee
wegingsprofielen. **Weging A** geldt voor het netgebonden spoor, **weging B** voor het
energie-autonome spoor met waterstof. Netcapaciteit telt in spoor A vier keer zo zwaar
als in spoor B; bestuurlijke ontvankelijkheid juist andersom.

Dat is een tweede weging naast die van de groep, en daar zit de reden dat dit bestand
bestaat. De groep heeft in het stellingenformulier zelf gewogen, over negen thema's. De
verkenning heeft gewogen over negen criteria. Het zijn niet dezelfde negen, en ze komen
niet op hetzelfde uit. De laatste kolom vertaalt elk criterium naar het thema waar het
in het PvE thuishoort, zodat de twee wegingen naast elkaar te leggen zijn.

**Die vertaling is analyse, geen gegeven.** Ze is aanvechtbaar, en dat hoort ze ook te
zijn: als je vindt dat "prijs en onzekerheid" eerder bij thema H hoort dan bij F, pas de
kolom dan aan en bouw opnieuw. De uitkomst verandert mee, en dat is precies waarvoor
dit bestand los staat van de code.

| criterium | weging A | weging B | pve-thema | meten via |
|-----------|---------:|---------:|-----------|-----------|
| omvang en vorm, 1,5 tot 2 ha aaneengesloten | 0.15 | 0.15 | H | PDOK Kadastrale Kaart |
| netcapaciteit afname | 0.20 | 0.05 | G | capaciteitskaart Netbeheer Nederland |
| stikstof, afstand tot Natura 2000 | 0.15 | 0.15 | F | AERIUS plus zone-check 500/1000 m |
| overstroming en maaiveldhoogte | 0.10 | 0.10 | A | Klimaateffectatlas, AHN |
| afstand tot woonwijk, waterstofbuffer | 0.10 | 0.12 | D | PDOK BAG |
| herbestembaarheid en bestemming | 0.10 | 0.10 | F | ruimtelijkeplannen.nl, DSO |
| bereikbaarheid | 0.05 | 0.05 | E | PDOK NWB wegen |
| prijs en onzekerheid | 0.05 | 0.08 | F | Kadaster koopsommen |
| bestuurlijke ontvankelijkheid gemeente | 0.10 | 0.20 | F | omgevings- en woonvisie |

## Harde uitsluiters van de verkenning

Deze gelden vóór elke score, net als de grenzen in `06-knock-outs.md`. Ze staan hier ter
vergelijking; ze worden niet automatisch toegepast.

| uitsluiter | eis |
|------------|-----|
| stikstof | binnen de 500 of 1000 m-zone van gevoelige Natura 2000 valt af |
| overstroming | hoog overstromingsrisico valt af |
| herbestemming | geen enkele herbestemmingsroute valt af |
| omvang | minder dan 1,5 ha aaneengesloten valt af |
| waterstofbuffer | geen vrije rand van orde 30 tot 55 m rond de installatie valt af |
