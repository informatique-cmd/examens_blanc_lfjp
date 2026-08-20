# Modèles d'import des données

Les modèles sont disponibles dans `public/templates` et téléchargeables depuis l'espace `/admin`.

## Ordre recommandé

1. Créer ou sélectionner l'année scolaire.
2. Remplir et importer `eleves-template.csv`.
3. Remplir et importer `enseignants-template.csv`.
4. Ajouter les salles.
5. Créer les examens.
6. Ajouter les surveillances.
7. Publier les examens, puis publier l'année.

## Élèves

Fichier : `eleves-template.csv`

Colonnes obligatoires :

- `first_name` : prénom de l'élève ;
- `last_name` : nom de famille ;
- `class_name` : classe, par exemple `1ERE1` ou `TERMINALE2`.

```csv
first_name,last_name,class_name
Awa,Diallo,1ERE1
Moussa,Ndiaye,TERMINALE2
```

## Enseignants

Fichier : `enseignants-template.csv`

Colonnes :

- `civility` : uniquement `Madame` ou `Monsieur` ;
- `first_name` : prénom ;
- `last_name` : nom ;
- `email` : facultatif.

```csv
civility,first_name,last_name,email
Madame,Claire,Martin,claire.martin@example.com
Monsieur,Bastien,Capel,bastien.capel@example.com
```

## Examens

Fichier : `examens-template.csv`

Colonnes :

- `title` : nom affiché de l'examen ;
- `exam_type` : type, par exemple `Mathematiques`, `EAF` ou `DNB` ;
- `starts_at` et `ends_at` : format `AAAA-MM-JJTHH:MM` ;
- `is_published` : `true` ou `false`.

L'import automatique des examens sera ajouté dans une prochaine étape. Pour l'instant, utilise le formulaire **Ajouter un examen** dans `/admin`.

## Salles

Fichier : `salles-template.csv`

Colonnes :

- `name` : nom de la salle ;
- `capacity` : capacité numérique.

L'ajout se fait actuellement avec le formulaire **Ajouter la salle**.

## Surveillances

Fichier : `surveillances-template.csv`

Colonnes :

- `exam_title` : titre exact de l'examen déjà créé ;
- `teacher_last_name` et `teacher_first_name` : enseignant déjà enregistré ;
- `room_name` : salle déjà enregistrée ;
- `mission` : libellé de la mission ;
- `starts_at` et `ends_at` : format `AAAA-MM-JJTHH:MM`.

L'ajout se fait actuellement avec le formulaire **Ajouter la surveillance**. L'import automatique sera ajouté ensuite.

## Règles importantes

- Conserver exactement les noms des colonnes de la première ligne.
- Ne pas supprimer la ligne d'en-tête.
- Utiliser un séparateur virgule `,` ou point-virgule `;`.
- Enregistrer le fichier en CSV UTF-8.
- Ne pas mettre de virgule ou point-virgule dans un nom sans entourer la valeur de guillemets.
- Ne pas importer deux fois le même fichier sans vérifier les doublons.
- Toujours vérifier les compteurs après l'import.
- Publier seulement après contrôle des données.
