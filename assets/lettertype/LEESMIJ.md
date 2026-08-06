# Het display-lettertype

De letter die Evolorahof in zijn presentaties gebruikt heet in de bestanden
`Evolorahof Display`. Dat is een hernoemde versie van **Fontatica-4F** van Sergiy S.
Tkachenko (4th february, Kremenchuk). De licentie in het lettertypebestand zelf zegt:

> All rights reserved. This font software is the property of Sergiy S. Tkachenko. You
> may not reproduce, modify, adapt, translate, alter nor create derivative works of the
> font software.

Meeleveren in een repository is verspreiden, en dat mag dus niet. Daarom staat de letter
hier niet.

## Wat het dashboard zonder die letter doet

Het valt terug op de stapel in `inhoud/00-huisstijl.md` bij `display-fallback`. De
opmaak blijft verder gelijk; alleen de koppen zien er anders uit.

## Hoe je hem lokaal toevoegt

Alleen als je een geldige licentie hebt, en houd de map dan buiten een publieke
repository.

1. Zet het lettertypebestand in deze map.
2. Maak hier een bestand `evolorahof-display.css` met daarin de `@font-face`-regel:

   ```css
   @font-face {
     font-family: "Evolorahof Display";
     src: url(evolorahof-display.woff2) format("woff2");
     font-display: swap;
   }
   ```

   Of, als je het lettertype als data-url wilt insluiten zodat het bestand zelfstandig
   blijft, zet dan de volledige base64-regel in `src:`.

3. Zet in `inhoud/00-huisstijl.md` de regel `lettertype-insluiten` op `ja`.
4. Draai `npm run bouw`.

Staat de schakelaar op `ja` maar ontbreekt het bestand, dan bouwt hij gewoon door met de
terugvalletter en zet hij een melding bovenaan het dashboard.

## Een vrij alternatief

Zoek je een letter met dezelfde smalle, hoge indruk zonder licentiegedoe: **Oswald** en
**Archivo Narrow** staan op Google Fonts onder de SIL Open Font License. Die staan al in
de terugvalstapel.
