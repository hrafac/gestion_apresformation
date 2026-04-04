# Plateforme d'Évaluation des Formations - Marsa Maroc

Ce projet est une solution complète pour la gestion et l'analyse des évaluations de formation (Chaud et Froid) pour Marsa Maroc.

## Fonctionnalités
- Authentification basée sur les rôles (ADMIN, RH, Formateur, Participant).
- Gestion des formations et des questionnaires dynamiques.
- Analyse quantitative via Graphiques Radar (Chart.js).
- Comparaison de l'évolution des compétences (Chaud vs Froid).
- Analyse intelligente avec IA et Machine Learning.
- Génération automatique de rapports HTML et PDF.

## Architecture
- **Backend**: Spring Boot (Java 17) avec PostgreSQL
- **Frontend**: React 18 avec Tailwind CSS
- **Analyse**: FastAPI (Python 3.11) avec scikit-learn, pandas, matplotlib
- **Base de données**: PostgreSQL 15
- **Reverse Proxy**: Nginx (production)

---

## 🐳 Docker Installation (Recommandé)

### Prérequis
- **Docker** et **Docker Compose** installés
- **Docker Desktop** (Windows/Mac) ou **Docker Engine** (Linux)

### Démarrage rapide

#### 1. Production (avec Nginx)
```bash
# Construire et démarrer tous les services
docker-compose --profile production up -d

# Accès aux applications:
# - Frontend: http://localhost
# - API Backend: http://localhost/api/
# - API Analyse: http://localhost/analyse/
# - Documentation FastAPI: http://localhost/docs
```

#### 2. Développement (sans Nginx)
```bash
# Démarrer les services de développement
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Accès direct aux services:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8080
# - Analyse Python: http://localhost:8000
# - PostgreSQL: localhost:5432
```

#### 3. Outils de développement
```bash
# Démarrer avec PgAdmin pour gérer la base de données
docker-compose --profile tools up -d

# Accès PgAdmin: http://localhost:5050
# Email: admin@marsamaroc.ma
# Password: admin123
```

### Commandes utiles
```bash
# Voir les logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend

# Redémarrer un service
docker-compose restart backend

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (attention: perte de données)
docker-compose down -v

# Mettre à jour les images
docker-compose pull
docker-compose up -d --build
```

### Gestion des volumes
```bash
# Lister les volumes
docker volume ls

# Sauvegarder la base de données
docker exec postgres_db pg_dump -U postgres marsa_eval > backup.sql

# Restaurer la base de données
docker exec -i postgres_db psql -U postgres marsa_eval < backup.sql
```

---

## 📋 Installation Manuelle (Sans Docker)

### Prérequis
- **Java 17** ou supérieur.
- **Node.js 18** ou supérieur.
- **Python 3.11** ou supérieur.
- **PostgreSQL**.

### Installation du Backend
1. Naviguer dans le dossier `backend`.
2. Créer une base de données PostgreSQL nommée `marsa_eval`.
3. Configurer les identifiants dans `src/main/resources/application.properties`.
4. Exécuter le projet :
    `./mvnw spring-boot:run`

Le backend tournera sur `http://localhost:8080`.

### Installation du Frontend
1. Naviguer dans le dossier `frontend`.
2. Installer les dépendances :
    `npm install`
3. Lancer l'application :
    `npm start`

Le frontend sera accessible sur `http://localhost:3000`.

### Installation de l'Analyse Python
1. Naviguer dans le dossier `AnalyseForm`.
2. Créer un environnement virtuel :
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```
3. Installer les dépendances :
    `pip install -r requirements.txt`
4. Lancer l'API :
    `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

L'API d'analyse sera accessible sur `http://localhost:8000` et la documentation sur `http://localhost:8000/docs`.

---

## 🚀 Utilisation

### Accès aux services
- **Frontend React**: `http://localhost:3000` (dev) ou `http://localhost` (prod)
- **API Backend**: `http://localhost:8080` ou `http://localhost/api/`
- **API Analyse**: `http://localhost:8000` ou `http://localhost/analyse/`
- **Documentation FastAPI**: `http://localhost:8000/docs` ou `http://localhost/docs`

### Utilisateur par défaut
Pour le premier accès, vous devrez appeler l'API de registration `/api/auth/register` via Postman ou implémenter une page d'inscription.

### Dashboard RH
Permet de voir les statistiques de satisfaction sous forme d'analyse radar.

### Analyse intelligente
L'API Python offre des fonctionnalités avancées :
- Analyse de sentiment avec NLP
- Détection de thèmes avec Topic Modeling
- Clustering automatique des participants
- Détection d'anomalies
- Génération de rapports automatiques

---

## 📁 Structure du Projet

```
gestion_apresformation/
├── app_default_26_02_11_18_45_54/
│   ├── backend/                 # Spring Boot API
│   │   ├── src/
│   │   ├── pom.xml
│   │   └── Dockerfile
│   └── frontend/                # React SPA
│       ├── src/
│       ├── package.json
│       └── Dockerfile
├── AnalyseForm/                 # FastAPI Analyse
│   ├── app/
│   ├── ana.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml           # Configuration principale
├── docker-compose.dev.yml       # Configuration développement
├── nginx.conf                   # Configuration Nginx
└── README.md
```

---

## 🔧 Configuration

### Variables d'environnement
- `POSTGRES_DB`: Nom de la base de données (défaut: marsa_eval)
- `POSTGRES_USER`: Utilisateur PostgreSQL (défaut: postgres)
- `POSTGRES_PASSWORD`: Mot de passe PostgreSQL (défaut: password)
- `SPRING_PROFILES_ACTIVE`: Profile Spring (dev/prod)

### Ports par défaut
- Frontend: 3000 (dev) / 80 (prod)
- Backend: 8080
- Analyse Python: 8000
- PostgreSQL: 5432
- PgAdmin: 5050 (optionnel)

---

## 🐛 Dépannage

### Problèmes courants
1. **Port déjà utilisé**: Vérifiez qu'aucun autre service n'utilise les ports 3000, 8080, 8000, 5432
2. **Connexion PostgreSQL refusée**: Assurez-vous que le service postgres est démarré
3. **Build échoue**: Vérifiez que Docker a suffisamment de ressources (RAM, CPU)
4. **Permission denied**: Sur Linux/Mac, ajoutez votre utilisateur au groupe docker

### Logs et monitoring
```bash
# Voir l'état des conteneurs
docker-compose ps

# Voir les ressources utilisées
docker stats

# Accéder à un conteneur
docker exec -it <container_name> bash
```

---

## 📝 Développement

### Pour les développeurs
1. Utilisez `docker-compose.dev.yml` pour le développement avec hot-reload
2. Les volumes sont montés pour synchroniser le code local
3. Les logs sont verbeux pour faciliter le débogage

### Contribuer
1. Fork le projet
2. Créer une branche feature
3. Faire les modifications
4. Tester avec Docker
5. Soumettre une Pull Request
