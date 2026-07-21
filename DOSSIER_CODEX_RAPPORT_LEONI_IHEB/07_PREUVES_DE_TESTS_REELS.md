# Preuves de tests réels

## Exécution du 17 juillet 2026

| Élément | Résultat |
|---|---|
| Commande | `node --test tests/*.test.js` |
| Node.js | `v22.16.0` |
| npm | `10.9.2` |
| Fichiers de tests | 5 |
| Tests détectés | **33** |
| Tests réussis | **33** |
| Tests échoués | **0** |
| Tests annulés | 0 |
| Tests ignorés | 0 |
| Tests TODO | 0 |

La sortie intégrale est disponible dans `sources/tests_reels/test_run_2026-07-17.txt`.

## Répartition

| Fichier | Nombre de tests |
|---|---:|
| `dashboardTargetMonth.test.js` | 2 |
| `frontendPhase2.test.js` | 7 |
| `monthlyGroupSelectionWindowGuard.test.js` | 3 |
| `planningGenerationWindow.test.js` | 11 |
| `planningServiceGenerationGuard.test.js` | 10 |
| **Total** | **33** |

## Périmètre couvert

- calcul de la fenêtre du 25 au dernier jour du mois ;
- mois de 28, 29, 30 et 31 jours ;
- passage décembre-janvier ;
- fuseau `Africa/Tunis` ;
- refus des mois non autorisés ;
- sélection mensuelle du groupe ;
- transaction et audit simulés pour la sélection ;
- refus de génération hors fenêtre ;
- erreurs typées ;
- refus d'accès au planning d'un autre utilisateur ;
- refus du doublon mensuel ;
- génération des groupes A et B ;
- mois cible du dashboard ;
- échappement HTML et réduction du risque XSS dans les interfaces testées ;
- absence de requêtes de session répétées sur les pages protégées.

## Vérification syntaxique

Commande : `npm run check:syntax`

Résultat : **58 fichiers JavaScript valides sur 58**.

La sortie est disponible dans `sources/tests_reels/syntax_check_2026-07-17.txt`.

## Limites à rédiger honnêtement

Ces tests ne constituent pas une validation de production et n'utilisent pas une instance MySQL réelle pour tous les scénarios. Ils ne prouvent pas à eux seuls :

- le cycle complet d'authentification avec cookie et base réelle ;
- toutes les opérations d'administration des utilisateurs ;
- le téléchargement et le contenu de tous les exports ;
- le cycle complet des congés ;
- toutes les transitions des sessions de travail en conditions réelles ;
- la sécurité dynamique du serveur ;
- la compatibilité multi-navigateur ;
- le déploiement.

Le rapport de référence mentionne 19 tests. Cette valeur est obsolète et doit être remplacée partout par **33/33**.

Il est interdit de fabriquer les 50 scénarios manuels. On peut fournir une matrice de scénarios à exécuter, mais son statut doit rester « non exécuté » sauf preuve réelle.
