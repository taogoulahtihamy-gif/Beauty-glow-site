# MagicShop and beauty — V4

Site multipage statique, sans framework ni dépendance JavaScript en production. Travail réalisé sur `feat/magishop-beauty-v3` ; aucun déploiement.

## Lancement local

```bash
npm run dev
```

Ouvrir **http://127.0.0.1:8088**. Node.js et Python 3 suffisent ; aucune installation npm n’est nécessaire pour construire ou servir le site. Le serveur sert `dist/`. Relancer `npm run build` après une modification des sources, puis recharger la page. Ctrl+C arrête le serveur.

## Les pages

| URL | Composition |
| --- | --- |
| `/index.html` | Accueil synthétique, photographie historique, aperçu des prestations et inspirations |
| `/notre-univers.html` | Portrait immersif et séquences éditoriales alternées |
| `/prestations.html` | Catalogue de six prestations, chacune avec photographie, description et réservation |
| `/inspirations.html` | Galerie asymétrique de onze photos, six filtres et visionneuse |
| `/reservation.html` | Formulaire dédié, aperçu de l’inspiration choisie et préparation du message WhatsApp |
| `/contact.html` | Coordonnées, carte du quartier et informations pratiques |
| `/credits.html` | Sources des photographies, polices et informations sur les données |

Chaque URL est un vrai fichier HTML : accès direct, rechargement, historique et navigation fonctionnent sans routage client. Les liens et la navigation fonctionnent aussi sans JavaScript.

## Sources et composants

- `src/partials/layout.html` : document HTML, métadonnées et éléments communs.
- `src/partials/header.html`, `footer.html`, `cta.html` : navigation, pied de page et invitation à réserver.
- `src/partials/booking-form.html`, `gallery-dialog.html` : formulaire et visionneuse.
- `src/pages/*.html` : contenu propre à chaque page.
- `src/data/gallery.json`, `services.json` : catalogue centralisé des photos et prestations.
- `scripts/build.mjs` : assemblage avec les seules API natives de Node.js. Les composants des photos et prestations sont réutilisés à partir des données.
- `style.css`, `script.js` : identité commune, responsive et interactions initialisées uniquement sur les pages concernées.
- `fonts/`, `images/editorial/` : ressources locales et optimisées.

**Modifier les sources dans `src/`, puis lancer `npm run build`.** Les fichiers HTML à la racine sont générés pour permettre également un serveur statique direct. `dist/` contient uniquement les pages, scripts, styles, polices et images à publier. Les anciennes images non utilisées ne sont pas copiées dans la sortie.

## Identité et données conservées

Le nom officiel est **MagicShop and beauty**, avec un « c ». La palette prune, lilas et rose, les polices Outfit / Plus Jakarta Sans, les courbes et le logo typographique prolongent la V3.

La photographie d’accueil `photo-1521590832167-7bcbfaa6381f` a été vérifiée dans `main:index.html` puis restaurée. Elle représente un intérieur de salon ; elle reste identifiée comme photo d’inspiration. Son cadrage est adapté sans étirement. Voir [les crédits](CREDITS.md).

Tarifs de départ conservés :

- Coiffure : 10 000 FCFA.
- Tresses : 15 000 FCFA.
- Maquillage : 20 000 FCFA.
- Manucure et pédicure : 5 000 FCFA.
- Vanilles et soins capillaires : tarif à demander, sans nouveau prix inventé.

Adresse : Chagoua, avenue Mathias Ngartery, axe CA7, N’Djamena, Tchad. Téléphone / WhatsApp : +235 61 48 85 44. Les horaires sont à demander au salon.

La carte Google Maps est centrée sur **le quartier Chagoua**. Elle ne prétend pas localiser précisément l’établissement. Le lien de recherche utilise l’adresse fournie.

## Parcours et accessibilité

- La navigation partagée indique la page active avec `aria-current`. Le menu mobile utilise une transition douce et rend ses liens inaccessibles au focus lorsqu’il est fermé.
- `reservation.html?service=Tresses` préremplit une prestation. Les six liens du catalogue utilisent les valeurs du formulaire.
- `inspirations.html?categorie=nattes` ouvre une catégorie ; `?photo=cornrows` ouvre directement une image.
- `reservation.html?inspiration=cornrows` transmet une inspiration validée dans le catalogue. Elle est visible dans le formulaire et ajoutée au message, y compris après rechargement. Les paramètres arbitraires ne sont pas insérés comme HTML.
- La visionneuse prend en charge les flèches, Échap, la boucle de focus, le retour au lien d’origine, le clic sur l’arrière-plan et le balayage horizontal tactile.
- Le formulaire contrôle le nom, le téléphone et la date dans le fuseau `Africa/Ndjamena`. Il n’impose aucune plage horaire non confirmée.
- Une soumission ouvre WhatsApp une seule fois et affiche un lien de secours. Le client vérifie et envoie lui-même son message. Le salon confirme ensuite le rendez-vous.
- Aucun stockage local ou serveur des coordonnées. L’inspiration circule dans l’URL sous forme d’identifiant, sans donnée personnelle.
- Réduction des mouvements respectée ; transitions de navigation natives dans les navigateurs compatibles et navigation normale ailleurs.

## Contrôles

```bash
npm run build
npm run check
npm install
# Conserver le serveur local actif dans un autre terminal.
npm run test:ui
```

Les dépendances npm sont exclusivement destinées aux tests. Chrome est recherché à `/opt/google/chrome/chrome` ; adapter `CHROME_PATH` si nécessaire. `BASE_URL` remplace l’adresse locale par défaut.

Le test navigateur vérifie les six pages à **320, 375, 390, 430, 768, 1024 et 1440 px**, génère leurs captures mobile/ordinateur, audite axe WCAG A/AA et teste navigation, galerie, transfert d’inspiration, réservation et liens WhatsApp. Les ouvertures WhatsApp sont interceptées ; aucun message n’est envoyé. La carte tierce est exclue de l’audit des composants locaux, mais son chargement est vérifié séparément.

Validation V4 effectuée : **42 combinaisons de page/largeur**, aucune erreur JavaScript, aucune ressource locale manquante, aucun débordement horizontal et aucune violation axe détectée. Les parcours WhatsApp, les filtres, les transferts d’inspiration, le menu, le focus clavier, le balayage tactile et la réduction des mouvements ont été vérifiés.

Résultats et captures : `artifacts/v4/` (non versionnés). L’audit automatisé ne remplace pas tous les essais sur appareils physiques ou technologies d’assistance.

## Compatibilité Vercel, sans déploiement

`vercel.json` sélectionne un projet sans framework, `npm run build` et la sortie statique `dist/`. Les URL `.html` sont conservées ; aucune réécriture vers une page unique n’est nécessaire. Le build n’effectue aucun accès réseau.

Le domaine final n’étant pas fourni, les métadonnées de partage utilisent une image relative. Pour générer aussi les URL canoniques et une image Open Graph absolue lors d’une future publication autorisée :

```bash
SITE_URL=https://votre-domaine.example/ npm run build
```

Configuration contrôlée à partir de la [documentation Vercel](https://vercel.com/docs/project-configuration). Aucun appel de déploiement n’est effectué par le projet.
