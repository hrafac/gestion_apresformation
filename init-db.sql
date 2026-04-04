-- Script d'initialisation pour la base de données PostgreSQL
-- Ce script est exécuté automatiquement au premier démarrage du conteneur PostgreSQL

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Création des schémas s'ils n'existent pas
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Configuration des permissions
GRANT ALL PRIVILEGES ON SCHEMA app TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA analytics TO postgres;

-- Tables de base (seront créées automatiquement par Spring Boot avec Hibernate)
-- Mais nous pouvons ajouter des tables d'analyse ici

-- Table pour stocker les résultats d'analyse
CREATE TABLE IF NOT EXISTS analytics.analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    results JSONB NOT NULL,
    metadata JSONB
);

-- Table pour les logs d'analyse
CREATE TABLE IF NOT EXISTS analytics.analysis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES analytics.analysis_results(id),
    log_level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_analysis_results_type ON analytics.analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created ON analytics.analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_analysis_id ON analytics.analysis_logs(analysis_id);

-- Commentaires
COMMENT ON SCHEMA app IS 'Schéma principal pour l''application Marsa Maroc';
COMMENT ON SCHEMA analytics IS 'Schéma pour les données d''analyse et reporting';
COMMENT ON TABLE analytics.analysis_results IS 'Résultats des analyses intelligentes';
COMMENT ON TABLE analytics.analysis_logs IS 'Logs des processus d''analyse';
