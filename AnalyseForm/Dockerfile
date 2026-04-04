FROM python:3.11-slim

WORKDIR /app

# Installation des dépendances système pour les packages Python
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier les dépendances Python
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Créer les répertoires pour les rapports et visualisations
RUN mkdir -p /app/reports

# Définir les variables d'environnement
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Exposer le port FastAPI
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Commande de démarrage
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
