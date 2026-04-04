#!/usr/bin/env python3

import requests
import json

# Configuration de la base de données pour l'API
db_config = {
    "host": "postgres",
    "database": "marsa_eval", 
    "user": "postgres",
    "password": "password",
    "port": 5432
}

# Requête d'analyse
analysis_request = {
    "database_config": db_config,
    "analysis_type": "full",
    "n_topics": 3,
    "contamination": 0.1
}

# Test de l'API
try:
    print("Envoi de la requête d'analyse...")
    print(f"Configuration envoyée: {db_config}")
    response = requests.post(
        "http://localhost:8000/analyze",
        json=analysis_request,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
except Exception as e:
    print(f"Erreur: {e}")
