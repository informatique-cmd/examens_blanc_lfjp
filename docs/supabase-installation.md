# Mise en place Supabase

## Ce qui est déjà préparé

- client Supabase optionnel dans `src/shared/lib/supabase.ts`;
- variables attendues dans `.env.example`;
- schéma SQL dans `supabase/migrations/20260820000000_initial_exam_management.sql` et `supabase/migrations/20260820000001_exam_content.sql`;
- séparation des données par année scolaire;
- authentification administrateur via Supabase Auth;
- RLS : lecture des années publiées, écriture réservée aux administrateurs;
- suppression en cascade d'une année et de ses examens, élèves, enseignants, salles et surveillances;
- convocations élèves, aménagements et annonces publiables.

## Installation

1. Créer un projet sur https://supabase.com/dashboard.
2. Ouvrir **SQL Editor** et exécuter les deux fichiers SQL de migration, dans l'ordre : `20260820000000_initial_exam_management.sql`, puis `20260820000001_exam_content.sql`.
3. Dans **Authentication > Users**, créer le compte administrateur.
4. Copier l'UUID de cet utilisateur.
5. Ajouter son UUID dans `public.admin_users` :

```sql
insert into public.admin_users (user_id)
values ('UUID_DU_COMPTE_ADMIN');
```

6. Dans les paramètres API Supabase, récupérer l'URL du projet et la clé `anon` publique.
7. Créer un fichier `.env.local` à la racine :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

8. Ajouter ces deux variables dans Vercel, dans **Settings > Environment Variables**, pour Production, Preview et Development.
9. Redéployer le projet.

## Sécurité

- Ne jamais utiliser la clé `service_role` dans React ou Vercel côté client.
- Ne jamais committer `.env.local`.
- Ne publier une année qu'après vérification des données.
- Exporter les données avant une suppression définitive.
- La suppression doit être proposée uniquement dans l'espace administrateur.

## Mise en pause du plan gratuit

Le plan gratuit Supabase peut suspendre un projet inactif. Le frontend ne peut pas empêcher cela de façon garantie. Pour une disponibilité permanente, il faudra un plan payant ou un hébergement Supabase auto-administré.
