# Plan des captures d’écran

Les captures doivent être réalisées manuellement sur une instance d’essai autorisée, avec des données déjà présentes ou préparées par le responsable de l’environnement. Ne pas modifier la base uniquement pour illustrer le rapport. Masquer les identifiants, adresses électroniques, matricules réels, détails d’audit sensibles et toute donnée personnelle non nécessaire.

| No | Interface | Rôle | Navigation | Données à afficher | Données à masquer | Légende proposée | Section du rapport |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Connexion | Non authentifié | `/login` | Carte de connexion, champ e-mail, champ mot de passe et bouton | Valeur du mot de passe, adresse réelle saisie | **Figure 16 — Interface d’authentification par e-mail** | 3.8 Authentification |
| 2 | Changement obligatoire du mot de passe | Utilisateur authentifié soumis à l’onboarding | Redirection vers `/change-password?reason=password-required` | Alerte de changement obligatoire et formulaire | Tous les mots de passe saisis, identité réelle si visible | **Figure 17 — Changement obligatoire du mot de passe à la première connexion** | 3.9 Changement obligatoire du mot de passe |
| 3 | Tableau de bord Team Leader | Team Leader | `/dashboard` | Indicateurs, taux, groupes mensuels et tableau de suivi | Noms et matricules réels, volumes confidentiels si requis | **Figure 18 — Tableau de bord et suivi mensuel du Team Leader** | 3.17 Tableau de bord |
| 4 | Tableau de bord collaborateur | Data Cleansing | `/dashboard` | Indicateurs visibles et bannière d’état calculée | Identité et informations individuelles | **Figure 19 — Tableau de bord d’un utilisateur Data Cleansing** | 3.17 Tableau de bord |
| 5 | Gestion des utilisateurs | Team Leader | `/users-page` | Tableau, rôles, départements et actions d’édition/suppression | E-mails, matricules et noms réels | **Figure 20 — Répertoire des utilisateurs et actions d’administration** | 3.11 Gestion des utilisateurs |
| 6 | Création d’un utilisateur | Team Leader | `/users-page`, bouton de création | Modale et champs attendus, sans soumission | Mot de passe temporaire, e-mail et matricule réels | **Figure 21 — Formulaire de création d’un utilisateur** | 3.11 Gestion des utilisateurs |
| 7 | Sélection mensuelle du groupe | Team Leader ou Data Cleansing ciblant son propre compte | `/planning-page`, bouton de sélection du groupe pendant une fenêtre ouverte | Mois autorisé, options A/B et état de verrouillage | Nom/matricule d’un tiers, données internes | **Figure 22 — Sélection du groupe Home Office pour le mois autorisé** | 3.12 Sélection mensuelle du groupe |
| 8 | Génération du planning | Team Leader ou Data Cleansing selon la cible | `/planning-page` | Avis de fenêtre serveur, cible, groupe enregistré et bouton de génération | Identifiants de l’employé sélectionné | **Figure 23 — Zone de génération du planning mensuel** | 3.13 et 3.14 |
| 9 | Consultation du planning | Team Leader ou Data Cleansing | `/planning-page` | Filtres et tableau des dates, statut et heures | Noms, dates ou horaires confidentiels selon la politique interne | **Figure 24 — Consultation filtrée du planning Home Office** | 3.15 Consultation du planning |
| 10 | Suivi d’une session de travail | Data Cleansing ayant une ligne distante pour la date serveur | `/planning-page` | Badge d’état, compteur, bouton de fin et texte de confidentialité | Identité et détail individuel non nécessaire | **Figure 25 — État visible du suivi d’une session de travail à distance** | 3.21 Suivi du travail à distance |
| 11 | Calendrier | Team Leader ou Data Cleansing | `/calendar-page` | Calendrier mensuel et jours générés | Nom de l’utilisateur si diffusion non autorisée | **Figure 26 — Visualisation calendaire des jours de travail à distance** | 3.16 Calendrier |
| 12 | Demandes de congé — vue personnelle | Data Cleansing ou Team Leader | `/leave-requests-page` | Formulaire et historique personnel avec statuts | Motif libre, dates sensibles et identité | **Figure 27 — Création et suivi d’une demande de congé** | 3.20 Gestion des congés |
| 13 | Traitement des congés | Team Leader | `/leave-requests-page` | File de traitement, actions approuver/rejeter et commentaire | Motifs, commentaires et données personnelles | **Figure 28 — Traitement des demandes de congé par le Team Leader** | 3.20 Gestion des congés |
| 14 | Export | Team Leader | `/export-page` | Filtres mois, groupe, employé et boutons CSV/XLSX | Noms et matricules réels dans les filtres | **Figure 29 — Configuration d’un export de planning** | 3.18 Export CSV et XLSX |
| 15 | Journal d’audit | Team Leader | `/logs-page` | Derniers événements, action, date et détail | Identifiants, noms et détails pouvant révéler une donnée interne | **Figure 30 — Consultation du journal d’audit** | 3.19 Journal d’audit |
| 16 | Accès interdit | Utilisateur sans permission adaptée | Navigation vers une page non autorisée | Page 403, sans provoquer de changement de données | Toute URL contenant un identifiant ou paramètre sensible | **Figure 31 — Réponse de l’interface à un accès interdit** | 3.10 et 3.24 |

## Consignes de réalisation

1. Utiliser une résolution homogène, de préférence 1440 × 900 ou supérieure.
2. Conserver la même échelle de navigateur et la même largeur pour les écrans de bureau.
3. Recadrer autour de la fonction expliquée sans supprimer le titre de page nécessaire au contexte.
4. Employer des rectangles opaques pour masquer les données ; ne pas utiliser un simple flou réversible.
5. Vérifier la lisibilité des libellés après insertion dans une page A4.
6. Numéroter les fichiers `capture_01_login.png`, `capture_02_changement_mdp.png`, etc.
7. Si l’état fonctionnel requis n’existe pas dans l’environnement autorisé, conserver le placeholder du rapport au lieu de créer une donnée fictive.
8. Faire valider les captures par l’encadrant avant diffusion.

<!-- Sources projet : leoni-planing/routes/viewRoutes.js, leoni-planing/config/permissions.js, leoni-planing/views/login.html, leoni-planing/views/assets/js/dashboard.js, leoni-planing/views/assets/js/users.js, leoni-planing/views/assets/js/planning.js, leoni-planing/views/assets/js/calendar.js, leoni-planing/views/assets/js/leave-requests.js, leoni-planing/views/assets/js/export.js, leoni-planing/views/assets/js/logs.js -->
