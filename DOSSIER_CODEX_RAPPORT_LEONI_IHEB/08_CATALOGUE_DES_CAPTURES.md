# Catalogue des captures fournies

## Captures uniques utilisables

| Fichier | Contenu | Utilisation recommandée | Précautions |
|---|---|---|---|
| `capture_01_login.png` | Page de connexion | Authentification | Conserver les champs vides |
| `capture_02_changement_mot_de_passe.png` | Changement de mot de passe Team Leader | Sécurité et onboarding | Champs vides ; recadrer le navigateur |
| `capture_03_dashboard_team_leader.png` | Dashboard Team Leader | Statistiques et suivi | Les chiffres sont des données de démonstration |
| `capture_04_gestion_utilisateurs.png` | Liste des utilisateurs | Administration | Masquer noms, e-mails et matricules avec des rectangles opaques |
| `capture_05_planning_team_leader.png` | Génération et suivi côté Team Leader | Fenêtre de génération et rôle | Écran pris quand la fenêtre est fermée |
| `capture_06_planning_data_cleansing_suivi_actif.png` | Suivi distant actif | Sessions de travail | Masquer l'identité affichée |
| `capture_07_calendrier_team_leader.png` | Calendrier Team Leader | Consultation globale | Masquer le nom |
| `capture_08_calendrier_data_cleansing.png` | Calendrier personnel | Consultation personnelle | Masquer le nom |
| `capture_09_conges_team_leader.png` | Congés côté Team Leader | Traitement global | Masquer dates, motifs et identités |
| `capture_10_conges_data_cleansing.png` | Congés côté Data Cleansing | Création et suivi personnel | Masquer dates, identité et réviseur |
| `capture_11_export.png` | Page d'export | CSV/XLSX | Aucun filtre personnel sélectionné |
| `capture_12_audit_logs.png` | Journal d'audit | Traçabilité | Masquer utilisateurs, identifiants et détails |
| `capture_13_page_404.png` | Page 404 | Gestion des erreurs | La barre d'adresse affiche `/403`, mais le contenu est une page 404 |

## Doublon

`capture_02b_changement_mot_de_passe_doublon.png` est une seconde capture presque identique. Ne pas insérer les deux sauf justification de mise en page.

## Traitement obligatoire avant insertion

1. recadrer la barre d'onglets, la barre d'adresse et les favoris ;
2. supprimer du cadrage la miniature vidéo/incrustation située en bas à droite ;
3. conserver le titre de la page et la zone fonctionnelle ;
4. anonymiser les données avec des rectangles opaques, jamais avec un flou léger ;
5. garder un format et une largeur homogènes ;
6. vérifier la lisibilité après insertion dans une page A4 ;
7. utiliser une légende académique sous chaque capture.

## Captures non fournies

- dashboard Data Cleansing ;
- modale de création d'utilisateur ;
- modification ou suppression d'un utilisateur ;
- sélecteur A/B ouvert pendant la fenêtre ;
- tableau complet du planning ;
- page 403 réelle.

Ne pas fabriquer ces captures. Le fichier `capture_13_page_404.png` ne doit pas être légendé comme une page 403. Le rapport peut expliquer que la capture disponible confirme le traitement 404, tandis que la réponse 403 est décrite à partir du code.
