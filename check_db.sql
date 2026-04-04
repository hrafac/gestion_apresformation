-- Script pour vérifier la base de données PostgreSQL

-- Lister toutes les bases de données
\l

-- Se connecter à marsa_eval et lister les tables
\c marsa_eval
\dt

-- Voir les utilisateurs s'ils existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

-- Si la table users existe, voir son contenu
\dt users
SELECT * FROM users LIMIT 5;

-- Voir les formations si elles existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'training';

-- Si la table training existe
\dt training
SELECT * FROM training LIMIT 5;

-- Statistiques de la base de données
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
LIMIT 10;
