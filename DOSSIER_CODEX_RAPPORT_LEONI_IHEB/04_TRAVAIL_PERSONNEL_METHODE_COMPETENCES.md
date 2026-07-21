# Travail personnel, méthode et compétences

## Contribution personnelle

Le projet a été développé individuellement par Iheb Dabbouni. Son travail couvre :

- l'analyse du cahier des charges ;
- la conception de la base de données ;
- le développement du backend Node.js/Express ;
- la réalisation des interfaces HTML, CSS et JavaScript ;
- la mise en place de l'authentification et des permissions ;
- l'implémentation de la logique de génération ;
- la gestion des utilisateurs, congés, exports et journaux ;
- le suivi du travail à distance ;
- les tests, corrections et documentation ;
- la préparation des diagrammes PlantUML et du rapport.

Ayoub Bahrouni a apporté une aide ponctuelle sur quelques détails. Il ne doit pas être présenté comme co-développeur.

## Apport de l'encadrant professionnel

M. Iheb Mahmoudi a contribué par :

- la communication et la clarification des besoins ;
- les conseils fonctionnels ;
- la validation progressive des choix et des résultats.

Ne pas inventer sa fonction professionnelle ni une fréquence précise de réunions.

## Outils effectivement utilisables dans le rapport

### Développement et exécution

- Node.js et npm ;
- Express ;
- MySQL et `mysql2/promise` ;
- HTML5, CSS3 et JavaScript ;
- Bootstrap ;
- navigateur web et outils de développement ;
- Visual Studio Code, cohérent avec la configuration `.vscode` fournie.

### Conception, documentation et assistance

- PlantUML ;
- GitHub ;
- Codex ;
- ChatGPT.

Présenter Codex et ChatGPT comme outils d'assistance à la programmation et à la documentation, sous contrôle de l'étudiant, et non comme auteurs autonomes du projet.

## Méthode de travail

Formulation recommandée :

> Le développement a suivi une progression incrémentale. Après l'analyse du besoin et la conception des données, les modules ont été réalisés par étapes, puis vérifiés au moyen de démonstrations, de retours de l'encadrant, de tests ciblés et de corrections successives. Des réunions de suivi ont été organisées selon l'avancement et les besoins de validation, sans calendrier fixe documenté.

Ne pas qualifier officiellement la démarche de Scrum, Agile ou cycle en V.

## Validation des fonctionnalités

- comparaison avec le cahier des charges ;
- démonstration des interfaces dans le navigateur ;
- vérification avec des comptes de test Team Leader et Data Cleansing ;
- contrôle des droits d'accès ;
- inspection des écritures en base dans l'environnement de développement ;
- tests automatisés Node ;
- vérification syntaxique des fichiers JavaScript ;
- retours et validations de l'encadrant.

Les captures prouvent l'affichage de plusieurs écrans, mais ne remplacent pas un test de bout en bout de toutes les opérations.

## Principales difficultés

1. traduire les règles d'alternance des groupes A/B en calcul de dates fiable ;
2. garantir que seul le mois suivant puisse être généré pendant la fenêtre autorisée ;
3. séparer correctement les permissions du Team Leader et du Data Cleansing ;
4. maintenir la cohérence de la base lors des sélections et générations concurrentes ;
5. comptabiliser le temps actif sans adopter une surveillance intrusive ;
6. faire évoluer le schéma avec les congés, les sessions, les heures et la sélection mensuelle ;
7. conserver une interface cohérente entre les différents modules ;
8. sécuriser les formulaires, les sessions et les données reçues.

## Solutions apportées

- calcul serveur de la date métier avec le fuseau `Africa/Tunis` ;
- validations centralisées et erreurs typées ;
- transactions MySQL et verrous sur les opérations sensibles ;
- contraintes d'unicité contre les doublons ;
- permissions atomiques et contrôles de propriété ;
- heartbeat et expiration des sessions ;
- séparation entre `planned_work_hour` et `work_hour` ;
- protection CSRF, Helmet/CSP, rate limiting et bcrypt ;
- composants de mise en page et client API partagés ;
- tests unitaires ciblant les règles sensibles.

## Compétences techniques acquises

- conception d'une application web en couches ;
- développement d'API Express ;
- modélisation et migration d'une base MySQL ;
- transactions et contraintes d'intégrité ;
- authentification et autorisation ;
- validation serveur et traitement des erreurs ;
- sécurité HTTP ;
- développement d'interfaces responsive ;
- génération CSV/XLSX ;
- tests avec `node:test` ;
- documentation UML et rédaction technique.

## Compétences professionnelles acquises

- analyse d'un besoin métier ;
- autonomie dans la conduite d'un projet ;
- organisation et priorisation ;
- communication avec un encadrant ;
- prise en compte des retours ;
- documentation des limites ;
- attention à la confidentialité et à la traçabilité ;
- résolution progressive de problèmes.

## Conclusion personnelle proposée

> Ce stage m'a permis de transformer un besoin concret de gestion du Home Office en une application web structurée. J'ai consolidé mes connaissances en développement backend, base de données, sécurité et interfaces web, tout en apprenant à analyser une règle métier, à la traduire en contraintes techniques et à vérifier son comportement. Le travail individuel m'a également conduit à mieux organiser mes tâches, documenter mes choix et corriger les incohérences rencontrées. Même si la solution n'est pas encore déployée en production, elle constitue une base fonctionnelle et évolutive pour remplacer le traitement manuel par Excel.
