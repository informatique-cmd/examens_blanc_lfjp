# Modèles d'import des données

Les modèles sont conservés dans `public/templates` pour préparer les fichiers hors de l'application. L'interface admin affiche uniquement les colonnes attendues et ne contient pas de menu de modèles.

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

- `prénom` : prénom de l'élève ;
- `nom` : nom de famille ;
- `classe` : classe, par exemple `1ERE1` ou `TERMINALE2`.

```csv
prénom,nom,classe
Awa,Diallo,1ERE1
Moussa,Ndiaye,TERMINALE2
```

## Enseignants

Fichier : `enseignants-template.csv`

Colonnes :

- `civilité` : uniquement `Madame` ou `Monsieur` ;
- `prénom` : prénom ;
- `nom` : nom ;
- `email` : facultatif.

```csv
civilité,prénom,nom,email
Madame,Claire,Martin,claire.martin@example.com
Monsieur,Bastien,Capel,bastien.capel@example.com
```

## Examens

Fichier : `examens-template.csv`

Colonnes :

- `intitulé` : nom affiché de l'examen ;
- `type` : type, par exemple `Mathématiques`, `EAF` ou `DNB` ;
- `date_début` et `date_fin` : format `AAAA-MM-JJTHH:MM` ;
- `publié` : `true` ou `false`.

L'import des examens est disponible dans la section **Examens** de `/admin`. Le fichier est analysé avant confirmation.

## Salles

Fichier : `salles-template.csv`

Colonnes :

- `nom` : nom de la salle ;
- `capacité` : capacité numérique.

L'import des salles est disponible dans la section **Salles** de `/admin`. Le fichier est analysé avant confirmation.

## Surveillances

Fichier : `surveillances-template.csv`

Colonnes :

- `examen` : titre exact de l'examen déjà créé ;
- `nom_enseignant` et `prénom_enseignant` : enseignant déjà enregistré ;
- `salle` : salle déjà enregistrée ;
- `mission` : libellé de la mission ;
- `date_début` et `date_fin` : format `AAAA-MM-JJTHH:MM`.

L'import des surveillances est disponible dans la section **Surveillances** de `/admin`. Les examens, enseignants et salles doivent déjà exister dans l'année sélectionnée.

## Règles importantes

- Conserver exactement les noms français des colonnes de la première ligne.
- Ne pas supprimer la ligne d'en-tête.
- Utiliser un séparateur virgule `,` ou point-virgule `;`.
- Enregistrer le fichier en CSV UTF-8.
- Ne pas mettre de virgule ou point-virgule dans un nom sans entourer la valeur de guillemets.
- Ne pas importer deux fois le même fichier sans vérifier les doublons.
- Toujours vérifier les compteurs après l'import.
- Publier seulement après contrôle des données.
