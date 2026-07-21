# Corrections apportées aux copies PlantUML

Les sources originales n'ont pas été modifiées. Seules les copies listées ci-dessous ont été corrigées dans ce dossier, après comparaison avec les routes, contrôleurs, services et modèles du projet.

| Diagramme | Correction vérifiée dans le code |
|---|---|
| `03_composants_application.puml` | La direction de mise en page a été changée en vertical afin de préserver la lisibilité sur une page A4, sans modifier les composants ni les dépendances. |
| `04_modele_donnees.puml` | Les relations ont été réécrites avec des multiplicités équivalentes pour le moteur local sans Graphviz. La note précise que `active_slot` est un invariant applicatif et que l'unicité dépend d'un `planning_id` non nul. |
| `06_sequence_changement_mot_de_passe.puml` | `bcrypt.compare` renvoie son résultat au contrôleur, qui produit ensuite la réponse 401. |
| `07_sequence_gestion_utilisateur.puml` | La recherche de conflits revient au contrôleur ; la base ne répond pas directement à la page. |
| `08_sequence_selection_groupe.puml` | Seuls l'utilisateur et la sélection sont verrouillés ; la présence d'un planning n'interdit qu'un changement de groupe. L'audit est écrit après le commit et seulement si la valeur change. |
| `09_sequence_generation_planning.puml` | La transaction de génération est validée par le service avant que le contrôleur écrive l'événement d'audit. |
| `10_sequence_consultation_planning.puml` | La route calendrier exacte est `/api/planning/calendar`. |
| `11_sequence_demande_conge.puml` | Le service de création n'ouvre pas de transaction. Le contrôle de chevauchement et l'insertion sont des requêtes distinctes ; l'audit est écrit ensuite par le contrôleur. |
| `12_sequence_traitement_conge.puml` | Le traitement n'utilise ni transaction ni `FOR UPDATE`. La protection concurrente est assurée par `UPDATE ... WHERE status = 'pending'`, puis l'audit est écrit par le contrôleur. |
| `13_sequence_session_travail.puml` | Les commits de session précèdent les audits de démarrage/reprise ; les appels heartbeat/pause/fin passent par le contrôleur. Une coupure de ligne PlantUML ambiguë a aussi été normalisée. |
| `14_sequence_export.puml` | L'audit est écrit avant l'envoi du CSV ou du flux XLSX. |

Les diagrammes `01`, `02`, `05` et `15` restent rendus depuis les sources originales : aucune contradiction manifeste avec le code inspecté n'y a été relevée.
