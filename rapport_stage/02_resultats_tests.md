# Résultats des tests actuels

## 1. Cadre d’exécution

Les tests ont été exécutés en lecture seule depuis le dossier applicatif `leoni-planing/`. L’application n’a pas été démarrée et aucune connexion à une base de données réelle n’a été réalisée. Les tests concernés utilisent le module natif `node:test` et, pour les services nécessitant un accès aux données, des substituts en mémoire injectés par le cache de modules.

| Élément | Valeur constatée |
| --- | --- |
| Date d’exécution | 15 juillet 2026 |
| Répertoire | `leoni-planing/` |
| Commande | `node --test tests/*.test.js` |
| Version Node.js de l’environnement d’exécution | `v24.16.0` |
| Version npm détectée | `11.13.0` |
| Connexion à MySQL | Non utilisée |
| Démarrage du serveur Express | Non effectué |

<!-- Sources projet : leoni-planing/package.json, leoni-planing/tests/monthlyGroupSelectionWindowGuard.test.js, leoni-planing/tests/planningGenerationWindow.test.js, leoni-planing/tests/planningServiceGenerationGuard.test.js -->

## 2. Fichiers exécutés

1. `tests/monthlyGroupSelectionWindowGuard.test.js` : vérification des gardes entourant l’enregistrement du groupe mensuel.
2. `tests/planningGenerationWindow.test.js` : vérification de la construction et de la validation de la fenêtre temporelle.
3. `tests/planningServiceGenerationGuard.test.js` : vérification des protections du service de génération et de la création pour les groupes A et B.

## 3. Résultat réel

| Indicateur | Résultat |
| --- | ---: |
| Tests détectés | 19 |
| Tests réussis | 19 |
| Tests échoués | 0 |
| Tests annulés | 0 |
| Tests ignorés | 0 |
| Tests marqués TODO | 0 |
| Durée rapportée par le test runner | 116,323958 ms |

**Statut global : réussi.** La commande s’est terminée avec un code de sortie nul.

## 4. Scénarios couverts et observés

| ID | Fichier | Scénario vérifié | Résultat observé | Statut |
| --- | --- | --- | --- | --- |
| TA-01 | `planningGenerationWindow.test.js` | Fenêtre fermée du 1er au 24 | Comportement attendu confirmé | Réussi |
| TA-02 | `planningGenerationWindow.test.js` | Ouverture du 25 au dernier jour du mois | Comportement attendu confirmé | Réussi |
| TA-03 | `planningGenerationWindow.test.js` | Mois de 30 et 31 jours | Dernier jour réel pris en compte | Réussi |
| TA-04 | `planningGenerationWindow.test.js` | Février non bissextile | Fermeture calculée au 28 | Réussi |
| TA-05 | `planningGenerationWindow.test.js` | Février bissextile | Fermeture calculée au 29 | Réussi |
| TA-06 | `planningGenerationWindow.test.js` | Passage décembre vers janvier | Année suivante calculée | Réussi |
| TA-07 | `planningGenerationWindow.test.js` | Fuseau métier `Africa/Tunis` | La date métier pilote l’ouverture et la fermeture | Réussi |
| TA-08 | `planningGenerationWindow.test.js` | Mois cible autorisé | Seul le mois immédiatement suivant est accepté | Réussi |
| TA-09 | `monthlyGroupSelectionWindowGuard.test.js` | Enregistrement du groupe hors fenêtre | Écriture refusée et transaction annulée | Réussi |
| TA-10 | `monthlyGroupSelectionWindowGuard.test.js` | Groupe enregistré pour un autre mois | Requête refusée | Réussi |
| TA-11 | `monthlyGroupSelectionWindowGuard.test.js` | Groupe mensuel valide A/B | Enregistrement simulé, commit et audit confirmés | Réussi |
| TA-12 | `planningServiceGenerationGuard.test.js` | Génération hors fenêtre | Aucun lot de planning inséré | Réussi |
| TA-13 | `planningServiceGenerationGuard.test.js` | Sélection d’un ancien mois | Sélection non réutilisée | Réussi |
| TA-14 | `planningServiceGenerationGuard.test.js` | Absence de sélection mensuelle | Génération refusée | Réussi |
| TA-15 | `planningServiceGenerationGuard.test.js` | Planning mensuel déjà présent | Doublon refusé | Réussi |
| TA-16 | `planningServiceGenerationGuard.test.js` | Génération du groupe A | Lignes limitées au mois autorisé | Réussi |
| TA-17 | `planningServiceGenerationGuard.test.js` | Génération du groupe B | Lignes limitées au mois autorisé | Réussi |

La table regroupe certains tests paramétrés qui parcourent plusieurs dates ou plusieurs mois. Le total du test runner demeure la référence : 19 tests exécutés.

<!-- Sources projet : leoni-planing/tests/monthlyGroupSelectionWindowGuard.test.js, leoni-planing/tests/planningGenerationWindow.test.js, leoni-planing/tests/planningServiceGenerationGuard.test.js -->

## 5. Vérification syntaxique complémentaire

Une vérification syntaxique a également été exécutée sur chaque fichier JavaScript de premier niveau applicatif, hors dépendances :

```text
find leoni-planing -type f -name '*.js' -not -path '*/node_modules/*' -print0 | xargs -0 -n 1 node --check
```

La commande a réussi pour tous les fichiers contrôlés. Cette vérification confirme uniquement la validité syntaxique reconnue par Node.js ; elle ne remplace ni un test fonctionnel ni un essai dans le navigateur.

## 6. Scénarios non couverts par les tests automatisés actuels

L’inventaire du dossier `tests/` ne montre pas de test automatisé dédié aux éléments suivants :

- authentification réelle, cookie de session et déconnexion ;
- changement de mot de passe et blocage de la première connexion ;
- matrice complète des permissions et réponses 401/403 ;
- création, modification et suppression logique des utilisateurs ;
- lecture du planning, filtres et calendrier ;
- tableau de bord ;
- export CSV et XLSX ;
- cycle complet d’une demande de congé ;
- démarrage, heartbeat, pause, reprise, fin et expiration d’une session de travail ;
- contrainte d’unicité d’une session active dans une instance MySQL ;
- journal d’audit ;
- protection CSRF, limitation de requêtes et en-têtes HTTP ;
- comportement des interfaces dans plusieurs navigateurs et tailles d’écran.

Ces éléments sont décrits dans le rapport à partir de l’inspection du code. Ils restent marqués « À valider » lorsqu’un cas de test exige une exécution fonctionnelle ou une base d’essai.

## 7. Conclusion

Les tests actuels exécutés avec succès ciblent les règles les plus sensibles de la fenêtre de génération, de la sélection mensuelle et de la protection contre les générations invalides ou dupliquées. Leur résultat apporte une preuve concrète pour ce périmètre précis. Il ne permet pas d’affirmer que l’ensemble de l’application a fait l’objet d’une validation automatisée ; la couverture reste concentrée sur trois fichiers et doit être complétée pour les autres modules.
