# Rapport de contrôle qualité final

Date du contrôle : 18 juillet 2026  
Document contrôlé : **Développement d'une application web de gestion du planning Home Office pour LEONI Data Management**

## 1. Sources et périmètre

- Les fichiers validés `README_START_HERE.md` puis `00` à `11` ont été lus dans l'ordre prescrit.
- Le cahier des charges de six pages a été extrait et contrôlé visuellement.
- Le code actuel, les cinq fichiers de tests, les deux sorties réelles, le rapport de référence, les documents d'audit, les quinze sources PlantUML et le catalogue des captures ont été inspectés.
- La hiérarchie de vérité imposée a été respectée. Le rapport de référence n'a été utilisé que comme base rédactionnelle.
- Aucun fichier du dossier `sources/` n'a été modifié. Toutes les productions sont placées sous `output/`.

## 2. Identité, couverture et positionnement

- Nom : IHEB DABBOUNI.
- Matricule : 290420.
- Période : du 15 juin au 15 juillet 2026, durée de 30 jours.
- Établissement, niveau, année universitaire, organisme, périmètre métier, site et encadrement professionnel correspondent aux informations validées.
- Aucun rôle d'encadrement supplémentaire, aucune adresse, aucune fonction de l'encadrant, aucune modalité de présence, aucune rubrique de confidentialité et aucun logo n'ont été ajoutés.
- `Material Master Data Management` est présenté comme un périmètre métier, jamais comme la dénomination juridique de LEONI.
- Le produit est décrit comme un prototype fonctionnel avancé, sans déploiement confirmé et sans usage actuel par les employés.

## 3. Tests et qualification des preuves

- Trace automatisée retenue : 17 juillet 2026, Node.js v22.16.0 et npm 10.9.2.
- Résultat reproduit dans le rapport : 33 tests réussis sur 33, sans échec, annulation, test ignoré ni TODO.
- Contrôle syntaxique reproduit : 58 fichiers JavaScript valides sur 58 contrôlés par le script fourni.
- Les cinq fichiers de tests et leurs 33 sous-tests sont détaillés.
- Les limites sont explicites : pas de preuve HTTP de bout en bout, de base MySQL réelle, de navigateur complet, de recette utilisateur ni de déploiement.
- La matrice retient vingt scénarios prioritaires. Chacun porte le statut **Non exécuté** ; aucune capture n'est utilisée comme preuve de réussite métier.
- La référence de tests devenue obsolète a été supprimée des quatre formats.

## 4. Diagrammes et captures

- Quinze diagrammes PNG ont été rendus à partir des sources PlantUML.
- Les contradictions relevées lors de l'audit ont été corrigées uniquement dans des copies sous `output/assets/diagrams/`. Le détail est conservé dans `CORRECTIONS_DIAGRAMMES.md`.
- Les quinze diagrammes ont été inspectés sur une planche de contact et dans le rendu A4.
- Treize captures uniques ont été retenues ; le doublon du changement de mot de passe n'a pas été inséré.
- Les barres du navigateur et les miniatures ont été retirées par recadrage.
- Les identités de session, noms, e-mails, matricules, données personnelles du catalogue, personnes associées aux calendriers et détails du journal d'audit ont été occultés par des masques opaques.
- Les deux champs de la page de connexion sont vides.
- Les PNG traités ne contiennent ni EXIF ni bloc textuel de métadonnées.
- La dernière capture est légendée comme une page 404. Le rapport précise qu'aucune capture 403 réelle n'a été fournie et réserve le contrôle 403 au code et aux essais futurs.

## 5. Structure, renvois et mise en page

- Le rapport contient 64 pages A4 exactement, soit 210 × 297 mm.
- Les 64 pages contiennent du texte extractible.
- La table des matières occupe les pages 6 et 7 et correspond à la pagination finale.
- Le DOCX conserve un champ de table des matières actualisable et utilise les styles hiérarchiques de titres.
- La liste des figures comporte 28 entrées : 15 diagrammes puis 13 captures.
- La liste des tableaux comporte 17 entrées.
- Les 45 champs de légende de figures et de tableaux ont été matérialisés avant le rendu final.
- Les renvois, numéros de figures, numéros de tableaux, en-têtes et pieds de page ont été vérifiés.
- L'audit d'accessibilité du DOCX ne signale aucun problème de niveau élevé, moyen ou faible.

## 6. Contrôle visuel

- Le DOCX final a été rendu en 64 images de page, puis converti en PDF.
- Les 64 pages ont été examinées sur quatre planches de contact.
- Des contrôles en résolution originale ont notamment porté sur la page de couverture, les listes, les pages 10, 23, 28, 41, 54, 55, 59 et 61.
- Aucun débordement, chevauchement, tableau coupé, image manquante, page blanche parasite ou erreur de renvoi n'a été observé.
- La correction finale des champs de connexion et les reformulations de prudence ont été contrôlées après un nouveau rendu.

## 7. Contrôle rédactionnel et confidentialité

- Aucun marqueur de contenu à compléter ou de capture à insérer ne subsiste.
- Aucun message d'erreur de renvoi Word ne subsiste.
- Aucun secret, identifiant d'amorçage, valeur de configuration sensible ou compte d'accès n'est reproduit.
- Le rapport distingue systématiquement le code inspecté, les tests automatisés réussis, les preuves visuelles et les scénarios manuels à exécuter.
- Les observations de sécurité sont qualifiées comme des constats statiques et non comme une certification.
- Les écarts entre le besoin initial et la version finale sont explicités : connexion par e-mail, absence de réinitialisation exposée au Team Leader, alertes visuelles sans canal externe et présence du module de congés.

## 8. Empreintes des quatre documents finaux

| Fichier | SHA-256 |
|---|---|
| `rapport_stage_final.md` | `98c008e8da0e84c56fade92ff86763206fce0d35e1a04c77669b18521ec6d52e` |
| `rapport_stage_final.html` | `b2bffe5de5ed17ade6eb178174b8175cdc6e018f3dbc192ef461fe4a95d61ba3` |
| `rapport_stage_final.docx` | `d3ced20fe49b1c5a476e0321a42751c1d557f9d498fe571b2e812e93a1fd46fe` |
| `rapport_stage_final.pdf` | `2e7cc3771b7fce427d44ea8611bf5b3c32583fca93e629ed1ca6e838f23abcae` |

## 9. Résultat

Les quatre formats présentent le même rapport, les ressources visuelles sont complètes et anonymisées, et le PDF final respecte l'exigence de 64 pages. Les limites restantes sont des limites du prototype ou de la preuve disponible ; elles sont signalées dans le rapport et ne sont pas présentées comme des validations acquises.
