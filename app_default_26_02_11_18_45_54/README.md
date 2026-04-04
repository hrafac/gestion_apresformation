# Plateforme d'Évaluation des Formations - Marsa Maroc

Ce projet est une solution complète pour la gestion et l'analyse des évaluations de formation (Chaud et Froid) pour Marsa Maroc.

## Fonctionnalités
- Authentification basée sur les rôles (ADMIN, RH, Formateur, Participant).
- Gestion des formations et des questionnaires dynamiques.
- Analyse quantitative via Graphiques Radar (Chart.js).
- Comparaison de l'évolution des compétences (Chaud vs Froid).

## Prérequis
- **Java 17** ou supérieur.
- **Node.js 18** ou supérieur.
- **PostgreSQL**.

## Installation du Backend
1. Naviguer dans le dossier `backend`.
2. Créer une base de données PostgreSQL nommée `marsa_eval`.
3. Configurer les identifiants dans `src/main/resources/application.properties`.
4. Exécuter le projet :
    `./mvnw spring-boot:run`

Le backend tournera sur `http://localhost:8080`.

## Installation du Frontend
1. Naviguer dans le dossier `frontend`.
2. Installer les dépendances :
    `npm install`
3. Lancer l'application :
    `npm start`

Le frontend sera accessible sur `http://localhost:3000`.

## Utilisation
- **Utilisateur par défaut** : Pour le premier accès, vous devrez appeler l'API de registration `/api/auth/register` via Postman ou implémenter une page d'inscription.
- **Dashboard RH** : Permet de voir les statistiques de satisfaction sous forme d'analyse radar.

## Structure du Projet
- `backend/`: Code source Spring Boot (API REST).
- `frontend/`: Single Page Application (React + Tailwind CSS).
