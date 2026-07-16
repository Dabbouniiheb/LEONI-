# Checklist finale du rapport de stage

Cette checklist distingue les contrôles déjà réalisables sur les fichiers produits des validations qui nécessitent une intervention de l’étudiant, de l’établissement ou de l’encadrant.

## 1. Périmètre et véracité

- [x] Confirmer que le rapport décrit uniquement le code actuel de `leoni-planing/`.
- [x] Vérifier qu’aucun ancien document fonctionnel ou rapport historique n’est cité ou utilisé.
- [x] Vérifier que chaque module présenté possède une route, un contrôleur ou un flux frontend identifiable.
- [x] Vérifier que chaque rôle et permission correspond à `config/constants.js` et `config/permissions.js`.
- [x] Vérifier que chaque table métier correspond à `sql/schema.sql` ou aux migrations actuelles.
- [x] Maintenir la distinction entre mécanisme observé, test exécuté et scénario restant à valider.
- [x] Ne pas présenter une perspective comme une fonction déjà livrée.
- [ ] Ne pas affirmer un déploiement ou un usage en production sans confirmation écrite.

## 2. Informations administratives

- [ ] Compléter le nom, le matricule, l’établissement, la filière et le niveau.
- [ ] Compléter les dates et la durée du stage.
- [ ] Confirmer l’entité, le site, l’adresse et le département d’accueil.
- [ ] Compléter les noms et fonctions des encadrants et du jury.
- [ ] Valider le titre officiel du rapport.
- [ ] Insérer les logos autorisés et vérifier leur qualité d’impression.
- [ ] Personnaliser la dédicace, les remerciements et le bilan de compétences.
- [ ] Confirmer la méthode de travail, les outils réellement utilisés et l’état du déploiement.
- [ ] Confirmer les personnes et profils ayant réellement testé l’application.

## 3. Captures d’écran

- [ ] Connexion.
- [ ] Changement obligatoire du mot de passe.
- [ ] Tableau de bord Team Leader.
- [ ] Tableau de bord Data Cleansing.
- [ ] Liste et création des utilisateurs.
- [ ] Sélection mensuelle du groupe.
- [ ] Fenêtre et commande de génération.
- [ ] Tableau du planning.
- [ ] État visible d’une session de travail distante.
- [ ] Calendrier.
- [ ] Demande de congé personnelle.
- [ ] Traitement des congés par le Team Leader.
- [ ] Export CSV/XLSX.
- [ ] Journal d’audit.
- [ ] Page d’accès interdit, si utile.
- [ ] Masquer les mots de passe, e-mails, matricules, noms, motifs et détails sensibles.
- [ ] Remplacer tous les placeholders `[CAPTURE À INSÉRER : ...]` après validation.

## 4. Diagrammes

- [ ] Rendre les fichiers `.puml` avec PlantUML.
- [ ] Vérifier la lisibilité des libellés français en format A4.
- [ ] Insérer les rendus à l’emplacement des figures correspondantes.
- [x] Contrôler la cohérence des acteurs, composants, routes et tables avec le texte.
- [x] Vérifier la numérotation et les légendes des figures.

## 5. Tests et validation

- [x] Exécuter `node --test tests/*.test.js` dans `leoni-planing/`.
- [x] Reporter 19 tests réussis, 0 échec et 0 test ignoré.
- [x] Distinguer le résultat automatisé de la simple inspection du code.
- [ ] Exécuter les tests fonctionnels marqués « À valider » sur un environnement d’essai autorisé.
- [ ] Tester les permissions des deux rôles et les réponses 401/403.
- [ ] Tester le cycle des congés et des sessions de travail avec une base isolée.
- [ ] Vérifier les exports avec un jeu de données non confidentiel.
- [ ] Réaliser une revue navigateur et responsive.

## 6. Confidentialité et sécurité documentaire

- [x] Rechercher et supprimer toute valeur issue d’un environnement réel.
- [x] Vérifier qu’aucun mot de passe, secret, token, cookie, hôte privé ou adresse IP interne n’apparaît.
- [x] Vérifier qu’aucun identifiant de compte par défaut n’est reproduit.
- [x] Vérifier les propriétés du DOCX et du PDF avant diffusion.
- [ ] Faire relire les détails techniques sensibles par l’encadrant professionnel.
- [ ] Appliquer les règles de confidentialité indiquées par l’entreprise et l’établissement.

## 7. Qualité académique

- [x] Effectuer une relecture orthographique et grammaticale en français.
- [x] Uniformiser « application web », « planning Home Office », « Team Leader » et « Data Cleansing ».
- [x] Vérifier que chaque chapitre possède une introduction et une conclusion.
- [x] Vérifier les transitions entre analyse, conception, réalisation et validation.
- [ ] Mettre à jour la table des matières dans Word ou LibreOffice.
- [x] Mettre à jour la liste des figures et la liste des tableaux.
- [x] Vérifier les renvois, la numérotation des titres, des figures et des tableaux.
- [x] Contrôler les sauts de page, veuves/orphelines et tableaux sur plusieurs pages.
- [x] Vérifier les marges, l’interligne et la police du document généré.
- [ ] Vérifier les règles de mise en page propres à l’établissement.

## 8. Livraison

- [x] Ouvrir le Markdown et vérifier les liens internes.
- [x] Ouvrir le HTML dans un navigateur sans dépendre d’un serveur.
- [x] Ouvrir et rendre le DOCX avec une suite bureautique compatible.
- [x] Ouvrir le PDF et vérifier le nombre de pages et la pagination.
- [x] Vérifier que tous les fichiers finaux sont sous `rapport_stage/`.
- [ ] Conserver une copie de sauvegarde validée.
- [ ] Vérifier les exigences d’impression : recto-verso, couleur, reliure et nombre d’exemplaires.

## 9. Points nécessitant une confirmation humaine

- `[INFORMATION À COMPLÉTER : Contexte métier exact et formulation validée par l’encadrant]`
- `[INFORMATION À COMPLÉTER : Déroulement réel du stage et chronologie]`
- `[INFORMATION À COMPLÉTER : Contributions personnelles et compétences acquises]`
- `[INFORMATION À COMPLÉTER : État réel du déploiement et des essais utilisateurs]`
- `[INFORMATION À COMPLÉTER : Règles de confidentialité et périmètre de diffusion]`
