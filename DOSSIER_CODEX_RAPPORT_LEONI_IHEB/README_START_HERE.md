# Dossier de régénération du rapport de stage LEONI

Ce dossier contient les sources nécessaires pour produire le rapport final d'Iheb Dabbouni sans modifier l'application.

## Instruction à donner à Codex

Ouvrir ce dossier comme espace de travail, puis demander :

> Lis intégralement `PROMPT_CODEX_GENERATION_RAPPORT_FINAL.md` et exécute-le. Ne réalise aucune opération Git.

## Ordre de lecture recommandé

1. `PROMPT_CODEX_GENERATION_RAPPORT_FINAL.md`
2. `00_CONSIGNES_ET_HIERARCHIE_DES_SOURCES.md`
3. `01_INFORMATIONS_ETUDIANT_ET_STAGE.md`
4. `02_CONTEXTE_METIER_ET_OBJECTIFS.md`
5. `03_PERIMETRE_INITIAL_ET_VERSION_FINALE.md`
6. `04_TRAVAIL_PERSONNEL_METHODE_COMPETENCES.md`
7. `05_CHRONOLOGIE_STAGE.md`
8. `06_DEDICACE_ET_REMERCIEMENTS.md`
9. `07_PREUVES_DE_TESTS_REELS.md`
10. `08_CATALOGUE_DES_CAPTURES.md`
11. `09_EXIGENCES_DU_RAPPORT_FINAL.md`
12. `10_DECISIONS_REDACTIONNELLES.md`

## Contenu des sources

- `sources/projet/leoni-planing/` : copie propre du projet actuel, sans `node_modules`, sans `.git` et sans `.env`.
- `sources/cahier_des_charges_LEONI_Data_Management.pdf` : périmètre initial.
- `sources/rapport_reference/` : rapport de référence, documents d'audit et diagrammes PlantUML.
- `sources/captures/` : 14 fichiers, dont 13 captures uniques et un doublon identifié.
- `sources/tests_reels/` : sorties réelles des tests exécutés le 17 juillet 2026.
- `output/` : seul emplacement autorisé pour les livrables générés.

Le rapport de référence contient des informations anciennes, notamment un résultat de 19 tests. Le projet actuel contient cinq fichiers de tests et le résultat réel à utiliser est **33 tests réussis sur 33**.
