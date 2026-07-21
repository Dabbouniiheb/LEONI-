# PROMPT CODEX - RÉGÉNÉRATION COMPLÈTE DU RAPPORT DE STAGE LEONI

Tu travailles dans le dossier `DOSSIER_CODEX_RAPPORT_LEONI_IHEB`.

## Mission

Régénérer de manière complète, cohérente et académique le rapport de stage d'Iheb Dabbouni à partir du projet actuel, du cahier des charges, du rapport de référence, des informations validées, des diagrammes, des captures et des preuves de tests.

Le titre officiel est :

**Développement d'une application web de gestion du planning Home Office pour LEONI Data Management**

Le PDF final doit compter **64 pages**.

## Interdictions absolues

1. Ne réalise aucune commande ou opération Git.
2. Ne modifie aucun fichier dans `sources/`.
3. Ne cherche pas et n'ouvre pas de fichier `.env`.
4. N'invente aucun fait, test, déploiement, résultat, URL, logo, personne, fonction ou statistique.
5. N'affiche aucun mot de passe, compte par défaut ou secret.
6. Ne fabrique aucune capture.
7. Ne présente pas les tests manuels comme réussis sans preuve.
8. Ne conserve aucun placeholder `[INFORMATION À COMPLÉTER]` ou `[CAPTURE À INSÉRER]`.
9. Ne présente pas l'application comme déployée ou utilisée par les employés.
10. Ne présente pas `Material Master Data Management` comme la dénomination juridique de LEONI.

## Sources à lire intégralement

Lire d'abord, dans cet ordre :

- `README_START_HERE.md`
- `00_CONSIGNES_ET_HIERARCHIE_DES_SOURCES.md`
- `01_INFORMATIONS_ETUDIANT_ET_STAGE.md`
- `02_CONTEXTE_METIER_ET_OBJECTIFS.md`
- `03_PERIMETRE_INITIAL_ET_VERSION_FINALE.md`
- `04_TRAVAIL_PERSONNEL_METHODE_COMPETENCES.md`
- `05_CHRONOLOGIE_STAGE.md`
- `06_DEDICACE_ET_REMERCIEMENTS.md`
- `07_PREUVES_DE_TESTS_REELS.md`
- `08_CATALOGUE_DES_CAPTURES.md`
- `09_EXIGENCES_DU_RAPPORT_FINAL.md`
- `10_DECISIONS_REDACTIONNELLES.md`
- `11_FICHE_STRUCTURÉE.json`

Inspecter ensuite :

- `sources/cahier_des_charges_LEONI_Data_Management.pdf`
- tout le code de `sources/projet/leoni-planing/`
- `sources/projet/leoni-planing/tests/`
- `sources/tests_reels/`
- `sources/rapport_reference/rapport_stage_complet.md`
- les documents d'audit et de traçabilité ;
- les quinze fichiers PlantUML ;
- les captures disponibles.

## Hiérarchie de vérité

1. fichiers `01` à `11` ;
2. code actuel ;
3. sorties réelles des tests ;
4. cahier des charges ;
5. rapport de référence.

Le rapport de référence est une base rédactionnelle, pas une source de vérité absolue. Il contient une ancienne mention de 19 tests. La version finale doit utiliser **33 tests réussis sur 33**, exécutés le 17 juillet 2026 avec Node.js v22.16.0, ainsi que la vérification syntaxique **58/58**.

## Informations de couverture

Utiliser :

- Étudiant : IHEB DABBOUNI
- Matricule : 290420
- Établissement : EPI - Digital School
- Niveau : Deuxième année du cycle préparatoire
- Année universitaire : 2025-2026
- Nature : Stage d'été
- Période : du 15 juin au 15 juillet 2026
- Durée : 30 jours
- Organisme : LEONI
- Périmètre métier : Material Master Data Management
- Site : Messadine
- Encadrant professionnel : M. Iheb Mahmoudi

Ne pas afficher :

- adresse ;
- mission détaillée du département ;
- fonction de l'encadrant professionnel ;
- encadrant académique ;
- modalités de présence ;
- rubrique de confidentialité ;
- logos non fournis.

## Fond métier à intégrer

Le processus antérieur reposait sur Excel. Le problème doit être décrit comme un processus manuel, peu centralisé, exposé aux erreurs et insuffisamment traçable.

L'idée a été proposée par un employé, puis précisée avec l'encadrant.

Les utilisateurs visés sont les Team Leaders et les collaborateurs Data Cleansing, pour une population potentielle de plus de 99 utilisateurs selon l'estimation communiquée.

L'objectif est de centraliser, automatiser et sécuriser la planification Home Office.

L'application actuelle est un prototype fonctionnel avancé, non utilisé actuellement par les employés et sans déploiement de production confirmé.

## Périmètre fonctionnel

Distinguer explicitement :

### Besoin initial

- authentification ;
- premier changement de mot de passe ;
- gestion des utilisateurs et rôles ;
- groupes A/B ;
- génération mensuelle ;
- dashboard ;
- alertes de validation ;
- export Excel ;
- audit.

### Version finale

- connexion par e-mail ;
- permissions atomiques ;
- sélection mensuelle persistée ;
- fenêtre du 25 au dernier jour réel ;
- mois suivant calculé côté serveur dans `Africa/Tunis` ;
- génération A/B ;
- planning et calendrier ;
- congés ;
- suivi non intrusif du travail à distance ;
- CSV et XLSX ;
- audit ;
- protections HTTP et intégrité des données.

Préciser les écarts :

- le cahier proposait e-mail ou username ; le code actuel utilise l'e-mail ;
- le reset du mot de passe par le Team Leader n'est pas exposé ;
- les notifications réalisées sont des alertes visuelles du dashboard, sans e-mail ni Teams ;
- les congés étaient une évolution future et sont présents dans la version finale.

## Contribution et méthode

Présenter le développement comme un travail individuel d'Iheb Dabbouni.

Mentionner l'aide ponctuelle d'Ayoub Bahrouni sur certains détails, sans le présenter comme co-développeur.

Présenter M. Iheb Mahmoudi comme ayant apporté besoins, conseils et validation progressive.

Décrire une progression incrémentale avec réunions de suivi selon l'avancement. Ne pas inventer de fréquence chiffrée et ne pas revendiquer Scrum.

Utiliser les difficultés, solutions et compétences du fichier `04_TRAVAIL_PERSONNEL_METHODE_COMPETENCES.md`.

## Architecture et précision technique

Documenter avec exactitude :

- monolithe Express ;
- pages HTML/CSS/JavaScript et API JSON ;
- architecture inspirée de couches, mais accès aux données hétérogène ;
- MySQL et magasin de sessions ;
- modèles, services, contrôleurs, routes et middlewares ;
- transactions et verrous ;
- tables principales ;
- permissions et contrôles de propriété ;
- sécurité : bcrypt, session MySQL, CSRF, Helmet/CSP, rate limiting, validation ;
- suivi distant : heartbeat, pause, reprise, fin, expiration, plafond de huit heures ;
- séparation heures prévues / réalisées.

Ne pas transformer une observation statique en certification de sécurité.

## Tests

Créer un chapitre de tests avec :

- protocole d'exécution ;
- tableau des cinq fichiers ;
- résultat 33/33 ;
- résultat syntaxique 58/58 ;
- scénarios réellement couverts ;
- limites ;
- matrice de tests manuels à exécuter, marquée « non exécuté » lorsque la preuve manque.

Tu peux considérer les captures comme preuves visuelles de rendu d'écran, pas comme preuve complète d'une opération de bout en bout.

## Diagrammes

Rendre et insérer les quinze diagrammes PlantUML présents dans :

`sources/rapport_reference/diagrams/`

Vérifier :

- lisibilité A4 ;
- légendes ;
- numérotation ;
- cohérence avec le code actuel ;
- absence d'informations inventées.

Si un diagramme contient une contradiction manifeste avec le code actuel, corriger seulement une copie placée dans `output/assets/diagrams/`, sans modifier la source.

## Captures

Utiliser les treize captures uniques du catalogue.

Traitement obligatoire :

- recadrer la barre du navigateur ;
- retirer la miniature en bas à droite du cadrage ;
- anonymiser les noms, e-mails, matricules, motifs, dates sensibles et détails d'audit ;
- employer des masques opaques ;
- garder le titre de la page ;
- produire des images homogènes dans `output/assets/captures/`.

Le fichier de dernière capture est une page **404**, même si l'URL visible contient `/403`. Ne jamais la légender comme 403. Décrire le contrôle 403 à partir du code et signaler qu'aucune capture 403 réelle n'a été fournie.

Ne pas utiliser les deux captures de changement de mot de passe ; choisir la plus lisible.

## Dédicace et remerciements

Utiliser les textes fournis dans `06_DEDICACE_ET_REMERCIEMENTS.md`, avec une correction stylistique légère seulement.

Ne pas ajouter d'encadrant académique.

## Structure du document

Conserver une structure académique complète :

1. page de garde ;
2. dédicace ;
3. remerciements ;
4. résumé et mots-clés ;
5. abstract et keywords ;
6. table des matières ;
7. liste des figures ;
8. liste des tableaux ;
9. liste des abréviations ;
10. introduction générale ;
11. chapitre 1 - organisme et cadre du stage ;
12. chapitre 2 - analyse et conception ;
13. chapitre 3 - réalisation ;
14. chapitre 4 - tests et validation ;
15. conclusion générale ;
16. perspectives ;
17. références ;
18. annexes.

Le texte doit être formel, naturel, précis, sans répétitions artificielles.

## Livrables

Créer exclusivement dans `output/` :

- `rapport_stage_final.md`
- `rapport_stage_final.html`
- `rapport_stage_final.docx`
- `rapport_stage_final.pdf`
- `rapport_qa_final.md`
- `assets/diagrams/`
- `assets/captures/`

## Contrôle qualité obligatoire

Avant de terminer :

1. vérifier qu'aucun placeholder ne subsiste ;
2. rechercher et supprimer toute ancienne mention « 19 tests » ;
3. vérifier le nom, le matricule et les dates ;
4. vérifier qu'aucun encadrant académique n'est ajouté ;
5. vérifier qu'aucun secret ou compte par défaut n'apparaît ;
6. vérifier que les captures sont anonymisées ;
7. actualiser table des matières, liste des figures et liste des tableaux ;
8. vérifier les renvois et les numéros de figures ;
9. ouvrir/rendre le DOCX et le PDF pour contrôler les coupures, tableaux et images ;
10. compter les pages du PDF et ajuster proprement pour atteindre **64 pages** ;
11. consigner les vérifications et les éventuelles limites dans `rapport_qa_final.md`.

Ne termine pas par un simple résumé. Produis les fichiers demandés et indique leur emplacement.
