# Fiche de préparation à la soutenance

## 1. Présentation du projet en 60 secondes

> Mon projet est une application web de gestion du planning Home Office et de suivi du travail à distance. Elle repose sur Node.js, Express et MySQL, avec une interface HTML, CSS et JavaScript. Deux rôles sont définis : le Team Leader, qui administre les utilisateurs, consulte les données globales, traite les congés, exporte et accède à l’audit ; et le rôle Data Cleansing, centré sur ses données. La génération mensuelle est protégée par une fenêtre serveur du 25 à la fin du mois, une sélection de groupe A ou B et des transactions empêchant les doublons. L’application inclut aussi un calendrier, un tableau de bord, les exports CSV/XLSX, les congés et des sessions de travail avec heartbeat et heures plafonnées à huit heures. Les 19 tests automatisés actuels, consacrés à la fenêtre et aux gardes de génération, ont tous réussi. Les autres modules restent principalement validés par inspection du code et nécessitent une couverture de tests plus large.

## 2. Problématique et solution

**Problématique formulée à partir de l’application :** comment centraliser la gestion des utilisateurs, des groupes Home Office, des jours distants et des activités associées dans un système contrôlé, traçable et exploitable par plusieurs profils ?

**Solution réalisée :** une application web à sessions, structurée autour de pages protégées et d’API JSON, avec règles de planning, persistance MySQL, permissions, exports et journalisation.

`[INFORMATION À COMPLÉTER : Formulation métier validée par l’encadrant et description exacte du processus organisationnel concerné]`

## 3. Architecture à expliquer oralement

Le navigateur charge une page HTML, puis quatre types de scripts : client API, gestion de session, layout commun et logique de page. Une action appelle une route `/api`. Express applique les middlewares globaux, puis les middlewares d’authentification, d’onboarding, de permission et de validation associés à la route. Le contrôleur orchestre la réponse. Pour les modules les plus structurés, il délègue à un service qui porte les règles métier, puis à un modèle qui exécute des requêtes MySQL paramétrées. Certains contrôleurs simples interrogent directement le pool. Les erreurs asynchrones remontent au gestionnaire global.

**Formulation courte :** « architecture en couches inspirée de MVC, avec un flux route–contrôleur–service–modèle–MySQL pour les domaines complexes, et un frontend JavaScript consommant des API JSON ».

## 4. Rôles

- **Team Leader :** administration des utilisateurs, lecture globale du planning et des sélections, génération pour un autre utilisateur lorsque la sélection existe, synthèse des sessions, gestion des congés, export, audit et paramètres.
- **Data Cleansing :** tableau de bord, lecture et génération de son planning, sélection de son groupe mensuel, suivi de ses sessions, gestion de ses demandes de congé et changement de son mot de passe.

La permission affichée dans le navigateur améliore l’expérience, mais l’autorité principale reste le serveur.

## 5. Algorithme du planning

1. Le serveur obtient une heure UTC depuis MySQL et la convertit dans `Africa/Tunis`.
2. Il autorise l’opération du 25 au dernier jour réel du mois.
3. Le seul mois accepté est le mois immédiatement suivant.
4. Une sélection mensuelle A ou B doit exister.
5. Le service refuse un planning déjà généré pour cet utilisateur et ce mois.
6. Groupe A : mercredi, jeudi, vendredis de rang 1, 3 et, s’il existe, 5.
7. Groupe B : lundi, mardi, vendredis de rang 2 et 4.
8. Les lignes distantes sont insérées en lot dans une transaction.

## 6. Sélection mensuelle et fenêtre temporelle

La table `monthly_group_selections` impose une seule sélection par couple utilisateur/mois. Le service vérifie la fenêtre avant et juste avant l’écriture, verrouille les lignes pertinentes et refuse un changement de groupe après la création du planning. Cette conception évite qu’une requête commencée à la limite de la fenêtre écrive avec un état devenu invalide.

## 7. Sécurité à présenter

- mots de passe hashés avec bcrypt et dix tours de sel configurés ;
- sessions stockées côté serveur dans MySQL ;
- cookie `HttpOnly`, `SameSite=Lax` et `Secure` lorsque l’environnement vaut production ;
- jeton CSRF pour les méthodes d’écriture ;
- Helmet et Content Security Policy ;
- limiteur global d’API et limiteur plus strict pour la connexion ;
- validation `express-validator` ;
- requêtes paramétrées ;
- rôles traduits en permissions atomiques ;
- changement de mot de passe obligatoire à la première connexion ;
- audit de nombreuses actions ;
- gestionnaire global qui ne renvoie pas la pile interne pour une erreur inattendue.

Ne pas dire « l’application est totalement sécurisée ». Dire « ces mécanismes sont observables dans le code actuel ».

## 8. Sessions de travail à distance

Le suivi n’enregistre pas de contenu d’écran. Il repose sur une ligne de planning distante pour la date serveur, un démarrage ou une reprise automatique, un heartbeat toutes les 60 secondes dans l’interface, une pause après cinq minutes d’inactivité côté page, une fin manuelle et une expiration serveur des sessions obsolètes. Le serveur ne comptabilise qu’un intervalle borné par la grâce de heartbeat, cumule `active_seconds`, puis met à jour `planning.work_hour` avec un maximum de huit heures. `planned_work_hour` conserve la valeur prévue de huit heures. La contrainte `active_slot` protège l’unicité d’une session active.

## 9. Congés

Un utilisateur crée une demande datée et typée. Le service valide la plage, le type et la longueur du motif, puis refuse tout chevauchement avec une demande en attente ou approuvée. Une demande personnelle ne peut être annulée que lorsqu’elle est en attente. Le Team Leader peut approuver ou rejeter une demande d’un autre utilisateur, avec commentaire facultatif. Chaque transition principale est auditée.

## 10. Principale difficulté technique

La difficulté la plus clairement visible dans le code est la **cohérence d’opérations dépendant du temps et de la concurrence**. La fenêtre de génération peut se fermer pendant une requête, deux requêtes peuvent cibler la même sélection ou le même planning et plusieurs événements navigateur peuvent tenter d’ouvrir une session active. Les solutions mises en œuvre sont l’horloge autoritaire de la base, les transactions, `FOR UPDATE`, la double validation de la fenêtre, les contraintes uniques et la récupération après une erreur de doublon de session.

## 11. Limites à reconnaître

- tests automatisés concentrés sur la génération et la sélection mensuelle ;
- script `npm test` non relié aux tests actuels ;
- champ `horaire` présent mais non calculé ;
- alertes du tableau de bord calculées dans le navigateur, sans centre persistant ;
- absence de pagination sur les utilisateurs, plannings, congés et audit ;
- accès direct à MySQL depuis certains contrôleurs, donc architecture non uniformément service/modèle ;
- usage résiduel de `users.group_id` dans certaines synthèses alors que le planning utilise une sélection mensuelle ;
- absence de pipeline de déploiement ou de supervision visible dans les sources ;
- dépendance de l’interface à des ressources CDN ;
- version minimale de Node.js non déclarée dans le manifeste.

## 12. Dix questions probables du jury

### Q1 — Pourquoi avoir choisi Express ?

**Réponse modèle :** Express fournit le routage, la composition de middlewares et le service des pages et API. Dans ce projet, il permet de chaîner session, CSRF, permissions, validation et contrôleurs avec une structure lisible. Le choix observé est cohérent avec une application Node.js de taille modérée.

### Q2 — L’architecture est-elle vraiment MVC ?

**Réponse modèle :** Elle est inspirée de MVC, mais je la décris plus précisément comme une architecture en couches. Les pages sont les vues, les contrôleurs pilotent les réponses, et des services/modèles existent pour les domaines complexes. Certains contrôleurs accèdent toutefois directement à MySQL, donc il ne s’agit pas d’un MVC strict et uniforme.

### Q3 — Comment empêchez-vous une génération hors période ?

**Réponse modèle :** Le serveur lit l’heure UTC depuis MySQL, la convertit dans le fuseau métier, construit la fenêtre du 25 au dernier jour et n’accepte que le mois suivant. Cette validation est répétée dans la transaction juste avant l’écriture.

### Q4 — Comment évitez-vous un planning en double ?

**Réponse modèle :** Le service vérifie l’existence d’un planning mensuel dans la transaction et le schéma impose aussi l’unicité du couple utilisateur/date. La sélection mensuelle a elle-même une contrainte utilisateur/mois.

### Q5 — Quelle différence entre `work_hour` et `planned_work_hour` ?

**Réponse modèle :** `planned_work_hour` représente la durée prévue, initialisée à huit heures. `work_hour` représente les heures réellement recalculées depuis les secondes actives et plafonnées à huit heures.

### Q6 — Le suivi est-il intrusif ?

**Réponse modèle :** Le code ne capture ni écran, ni texte, ni webcam. Il enregistre des timestamps, heartbeats, statuts et secondes actives. Le navigateur utilise seulement des événements d’activité pour décider de mettre en pause ou de reprendre la session.

### Q7 — Comment les autorisations sont-elles appliquées ?

**Réponse modèle :** Une matrice associe des permissions atomiques aux deux rôles. Les routes sensibles appellent un middleware `requirePermission`. Pour certaines lectures de planning, le service restreint également les résultats selon le rôle et l’utilisateur connecté.

### Q8 — Quels tests avez-vous réellement exécutés ?

**Réponse modèle :** J’ai exécuté `node --test tests/*.test.js`. Les 19 tests ont réussi. Ils couvrent la fenêtre, les fins de mois, le fuseau Tunis, le mois cible, la sélection mensuelle, les doublons et la génération A/B. Je ne présente pas les autres modules comme testés automatiquement.

### Q9 — Quelle amélioration serait prioritaire ?

**Réponse modèle :** Étendre la couverture automatisée aux autorisations, congés et sessions de travail, car ces modules contiennent des transitions d’état et des règles sensibles qui sont aujourd’hui surtout justifiées par inspection du code.

### Q10 — Comment la base garantit-elle l’intégrité ?

**Réponse modèle :** Elle utilise des clés primaires, étrangères, index et contraintes uniques. Les opérations sensibles ajoutent des transactions et des verrous. Par exemple, `active_slot` associé à une clé unique limite une session active par utilisateur, planning et date, tout en autorisant plusieurs lignes historiques.

<!-- Sources projet : leoni-planing/server.js, leoni-planing/config/constants.js, leoni-planing/config/permissions.js, leoni-planing/middlewares/auth.js, leoni-planing/services/PlanningService.js, leoni-planing/services/MonthlyGroupSelectionService.js, leoni-planing/services/LeaveRequestService.js, leoni-planing/services/WorkSessionService.js, leoni-planing/sql/schema.sql, leoni-planing/tests/ -->
