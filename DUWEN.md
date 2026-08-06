# Deze repo naar GitHub duwen

De commit staat er al klaar in, met de juiste remote. Er is één commando nodig.

```bash
cd evolorahof-locatiekaart-1.0
git push -u origin main
```

Vraagt hij om een wachtwoord, plak dan je personal access token in plaats van je
wachtwoord. Of stel het eenmalig in met de GitHub CLI:

```bash
gh auth login
git push -u origin main
```

## Daarna: het dashboard online zetten

`dist/index.html` staat mee in de repo, dus GitHub Pages heeft niets extra's nodig:

1. Ga naar **Settings** en dan **Pages**.
2. Zet **Source** op `Deploy from a branch`.
3. Kies branch `main` en map `/ (root)`.
4. Het dashboard staat daarna op
   `https://laurencevandenberg.github.io/evolorahof-locatiekaart-1.0/dist/`.

Wil je een kortere url, hernoem `dist` dan naar `docs` en kies die map bij stap 3. Pas
in dat geval ook het standaarddoel in `src/bouw.mjs` en de paden in `.gitignore` aan.

## Als je de repo liever privé houdt

Dan mag het display-lettertype er wel in. Zie `assets/lettertype/LEESMIJ.md`, en haal
in `.gitignore` de regels onder het kopje over het lettertype weg.
