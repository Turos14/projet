# projet — Portfolio GitHub

Site statique (HTML/CSS/JS) qui présente mes projets GitHub, avec pour chacun :
- **Ouvrir l'app** (GitHub Pages ou `homepage` du dépôt),
- **Télécharger l'app** et **le code source** (archive .zip),
- lien vers le dépôt.

La liste est chargée en direct depuis l'API GitHub (cache 1 h), avec repli sur `projects.json`.

## Personnaliser
Dans `projects.json` :
- `exclude` : dépôts à masquer ;
- `overrides.<repo>` : `title`, `description`, `webUrl` (ou `null`), `branch`, `pagesBranch`, `appDownload` (URL d'un .zip/release).

## Hébergement
Publié via GitHub Pages depuis la branche `main` : https://turos14.github.io/projet/
