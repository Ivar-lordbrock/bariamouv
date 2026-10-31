# BariaMouv · Sport adapté au parcours bariatrique

Application web **mobile-first** de suivi d'activité physique adaptée (APA) pour le parcours bariatrique.
100 % front-end : aucun serveur, aucun compte. Les données restent dans le navigateur du téléphone (`localStorage`).

- **Bibliothèque** : 36 exercices issus du livret APA, triés en 7 catégories (mobilité, haut du corps, bas du corps, sangle abdominale, cardio doux, équilibre, souplesse), avec consignes, dosage du livret, conseil « parcours bariatrique » et phase conseillée.
- **Tri** : reclassement d'un exercice en une touche ; tri automatique (par mots-clés) quand on ajoute un exercice perso avec sa photo.
- **Ateliers** : composer ses séances en piochant dans la bibliothèque (touche = ajout), réordonner au doigt (glisser ⠿), régler séries / répétitions / durée / repos.
- **Mode séance** : chrono plein écran (préparation → effort → récupération → changement de côté), bips 3-2-1, vibrations, écran maintenu allumé, version allégée si fatigue, bouton « Je ne me sens pas bien ».
- **Historique** : séances terminées ou partielles, effort ressenti (0-10), notes, graphique des 8 dernières semaines, progression douce proposée.
- **Hors ligne** : installable sur l'écran d'accueil (PWA), fonctionne sans réseau après la première visite.

> ⚠️ Cette application ne remplace pas l'avis de l'équipe médicale. Les phases sont indicatives.

## Structure

```
sport-bariatrique/
├── index.html            # Page unique : en-tête, onglets, conteneurs (Tailwind CSS via CDN)
├── style.css             # Thèmes clair/sombre (variables), composants, mode séance
├── data.js               # Bibliothèque par défaut : catégories, phases, 36 exercices, ateliers proposés
├── app.js                # Logique : vues, ateliers, glisser-déposer, chronomètre, historique, réglages
├── sw.js                 # Service worker (hors ligne)
├── manifest.webmanifest  # Installation sur l'écran d'accueil
├── .nojekyll             # Publication GitHub Pages telle quelle
├── icons/                # Icône de l'application
└── img/
    ├── exercices/        # 36 illustrations découpées dans les photos du livret
    └── fiches/           # 13 pages du livret (bouton « Fiche » d'un exercice)
```

Les photos ont été redimensionnées et **débarrassées de leurs métadonnées EXIF (dont la position GPS)** avant d'être ajoutées.

## Tester sur l'ordinateur

Le service worker et certaines API exigent un vrai serveur (pas un double-clic sur `index.html`) :

```bash
python -m http.server 8765 --directory sport-bariatrique
```

Puis ouvrir http://localhost:8765 (dans Chrome : F12 → icône téléphone pour simuler un mobile).

## Mettre en ligne sur GitHub Pages

### Option A — sans rien installer (navigateur)

1. Sur github.com : **New repository** → nom `bariamouv` (par exemple) → **Public** → *Create repository*.
2. Sur la page du dépôt vide : lien **uploading an existing file** → glisser **le contenu** du dossier `sport-bariatrique` (les fichiers et les dossiers `img`, `icons`, pas le dossier lui-même) → **Commit changes**.
3. **Settings → Pages** → *Source* : **Deploy from a branch** → branche **main**, dossier **/ (root)** → **Save**.

Au bout d'une à deux minutes, l'appli est en ligne sur `https://<ton-pseudo>.github.io/bariamouv/`.

> Le fichier `.nojekyll` commence par un point : s'il n'apparaît pas dans l'explorateur, ce n'est pas grave, l'appli fonctionne sans.

### Option B — en ligne de commande (git)

```bash
cd sport-bariatrique
git init -b main
git add .
git commit -m "BariaMouv : première version"
git remote add origin https://github.com/<ton-pseudo>/bariamouv.git
git push -u origin main
```

Puis l'étape 3 ci-dessus (Settings → Pages).

### Installer l'appli sur le téléphone

Ouvrir l'adresse GitHub Pages sur le téléphone, puis :
- **Android (Chrome)** : menu ⋮ → *Ajouter à l'écran d'accueil* / *Installer l'application* ;
- **iPhone (Safari)** : bouton Partager → *Sur l'écran d'accueil*.

## Points d'attention

- **Le site GitHub Pages est public** (compte gratuit) : les illustrations et pages du livret seront visibles par toute personne qui a l'adresse. Si le livret ne doit pas être diffusé, ne publie pas le dossier `img/fiches` (le bouton « Fiche » affichera alors une image vide) ou garde l'appli en local.
- **Les données sont propres à chaque navigateur** : l'historique du téléphone n'apparaît pas sur l'ordinateur. Pour changer de téléphone : Réglages → *Exporter*, puis *Importer* sur le nouvel appareil.
- **Mise à jour du code** : après avoir modifié des fichiers, change `CACHE = 'bariamouv-v1'` en `v2` dans `sw.js` pour que les téléphones récupèrent la nouvelle version sans attendre.
- **Tailwind via CDN** : pratique pour démarrer (un avertissement « should not be used in production » s'affiche dans la console, c'est normal). Il faut une connexion lors de la toute première ouverture ; ensuite le service worker le garde en cache.

## Ajouter un exercice par défaut

Dans `data.js`, copier un bloc `ex({ ... })`, lui donner un `id` unique et déposer son image dans `img/exercices/<id>.jpg`.
Les exercices ajoutés depuis l'application (bouton **+** de l'onglet Exercices, avec photo) sont stockés dans le téléphone et n'ont pas besoin de toucher au code.
