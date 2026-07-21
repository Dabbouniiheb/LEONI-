# Diagrammes PlantUML

Ce dossier contient les quinze diagrammes demandés, construits uniquement à partir du code applicatif, du schéma SQL et des migrations actuels.

## Contenu

| Fichier | Sujet |
|---|---|
| `01_cas_utilisation_global.puml` | Acteurs, fonctions communes et fonctions réservées au Team Leader |
| `02_architecture_globale.puml` | Flux global du navigateur vers Express et MySQL |
| `03_composants_application.puml` | Dépendances entre interface, routes, contrôleurs, services, modèles et persistance |
| `04_modele_donnees.puml` | Tables, clés et relations du schéma relationnel |
| `05_sequence_authentification.puml` | Connexion par e-mail et création de la session |
| `06_sequence_changement_mot_de_passe.puml` | Changement authentifié du mot de passe |
| `07_sequence_gestion_utilisateur.puml` | Création d'un utilisateur par un Team Leader |
| `08_sequence_selection_groupe.puml` | Sélection mensuelle transactionnelle du groupe A ou B |
| `09_sequence_generation_planning.puml` | Fenêtre métier et génération en lot du planning |
| `10_sequence_consultation_planning.puml` | Consultation filtrée avec portée déterminée par le rôle |
| `11_sequence_demande_conge.puml` | Création d'une demande de congé sans chevauchement actif |
| `12_sequence_traitement_conge.puml` | Approbation ou rejet par un Team Leader |
| `13_sequence_session_travail.puml` | Démarrage, heartbeat, pause, fin et expiration d'une session |
| `14_sequence_export.puml` | Export filtré au format CSV ou XLSX |
| `15_sequence_audit.puml` | Consultation des cent événements d'audit les plus récents |

## Rendu avec PlantUML

Depuis la racine du projet, si la commande PlantUML est déjà disponible localement :

```bash
plantuml -checkonly rapport_stage/diagrams/*.puml
plantuml -tsvg -o rendered rapport_stage/diagrams/*.puml
```

PlantUML interprète `-o rendered` relativement au dossier contenant chaque source ; les fichiers SVG sont donc créés dans `rapport_stage/diagrams/rendered/`.

Pour produire des PNG, remplacer `-tsvg` par `-tpng` :

```bash
plantuml -tpng -o rendered rapport_stage/diagrams/*.puml
```

Si seule une archive PlantUML locale est disponible, indiquer son chemin sans l'ajouter aux dépendances du projet :

```bash
java -jar /chemin/vers/plantuml.jar -checkonly rapport_stage/diagrams/*.puml
java -jar /chemin/vers/plantuml.jar -tsvg -o rendered rapport_stage/diagrams/*.puml
```

Les extensions PlantUML des éditeurs courants peuvent également prévisualiser directement chaque fichier `.puml`. Aucun rendu n'exige de démarrer le serveur Express ni de se connecter à la base de données.

## Conventions de lecture

- Les noms de routes, permissions, classes de service et tables restent alignés sur les identifiants du code.
- Les libellés fonctionnels sont en français.
- Les réponses alternatives représentent uniquement les statuts et règles visibles dans les contrôleurs, services, middlewares et modèles actuels.
- Le champ `planning.horaire` est représenté comme un placeholder nullable, puisqu'aucun flux métier du code actuel ne le calcule.
- Les alertes et toasts de l'interface ne sont pas modélisés comme un service de notifications persistant.
