# Périmètre initial et version finale

Le cahier des charges local constitue la source du périmètre initial. Le code actuel constitue la source de la version finale.

## Fonctions prévues initialement

- gestion des utilisateurs et des rôles ;
- création des comptes par le Team Leader ;
- gestion des groupes Home Office A et B ;
- planification mensuelle automatique ;
- authentification ;
- changement obligatoire du mot de passe au premier accès ;
- tableau de bord du Team Leader ;
- indicateurs de validation ;
- export Excel ;
- contrôle d'accès selon le rôle ;
- audit des actions ;
- alertes de statut à partir du 25 du mois.

## Comparaison

| Domaine | Cahier des charges initial | Version finale observable |
|---|---|---|
| Authentification | E-mail ou username | Connexion par adresse e-mail |
| Premier accès | Changement obligatoire | Implémenté avec blocage de l'accès métier |
| Comptes | Création, modification, suppression, reset mot de passe | Création, modification et suppression logique ; pas de reset Team Leader exposé |
| Groupes | Choix A ou B | Sélection mensuelle persistée et verrouillée après génération |
| Génération | Mois et groupe choisis | Mois cible imposé par le serveur ; génération uniquement du mois suivant |
| Fenêtre temporelle | Ouverture à partir du 25 | Du 25 au dernier jour réel, fuseau `Africa/Tunis` |
| Planning | Génération et consultation | Tableau, filtres et consultation selon le périmètre du rôle |
| Calendrier | Non détaillé | Historique calendaire mensuel |
| Dashboard | Statistiques et suivi | Statistiques, taux de validation et suivi des collaborateurs |
| Notifications | Alerte à partir du 25 | Bannières et états dans le dashboard ; pas d'e-mail ni Teams |
| Export | Excel | CSV et XLSX, avec filtres |
| Audit | Opérations principales | Journal des événements récents |
| Congés | Évolution future | Création, annulation, approbation et rejet implémentés |
| Suivi du travail | Non prévu | Sessions actives, heartbeat, pause, reprise, fin et expiration |
| Confidentialité du suivi | Non prévu | Aucun screenshot, texte saisi, coordonnées de souris ou application visitée n'est enregistré |
| Sécurité HTTP | Principes généraux | Sessions MySQL, bcrypt, CSRF, Helmet/CSP, rate limiting et validations |
| Intégrité | Non détaillée | Contraintes uniques, clés étrangères, transactions et verrouillage |

## Fonctionnalités complémentaires développées

Les fonctions suivantes peuvent être présentées comme des compléments de la version finale par rapport au cahier des charges :

1. gestion des demandes de congé ;
2. suivi non intrusif des sessions de travail à distance ;
3. calendrier mensuel et conservation de l'historique ;
4. export CSV en plus du format XLSX ;
5. sélection mensuelle persistée et verrouillée ;
6. fenêtre temporelle calculée côté serveur dans le fuseau `Africa/Tunis` ;
7. sécurisation des sessions et des requêtes HTTP ;
8. permissions atomiques ;
9. prévention des sessions actives concurrentes ;
10. séparation des heures prévues et des heures réellement comptabilisées.

Ne pas présenter les notifications e-mail/Teams, Power BI ou l'application mobile comme des fonctions réalisées. Elles restent des perspectives.
