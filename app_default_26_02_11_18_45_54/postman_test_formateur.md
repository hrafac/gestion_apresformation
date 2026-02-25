### Test Postman pour getFormationsByFormateur

## Configuration de la requête

**Méthode:** `GET`
**URL:** `http://localhost:8080/api/training/formateur/{formateurId}`

**Headers:**
- `Content-Type`: `application/json`
- `Accept`: `application/json`

## Exemples de tests

### 1. Test avec un ID de formateur valide
```http
GET http://localhost:8080/api/training/formateur/1
```

**Réponse attendue (200 OK):**
```json
{
    "formateurId": 1,
    "formations": [
        {
            "id": 1,
            "title": "Formation Java Avancé",
            "theme": "Développement",
            "location": "Salle A",
            "startDateTime": "2026-01-15T09:00:00",
            "endDateTime": "2026-01-15T17:00:00",
            "trainer": {
                "id": 1,
                "username": "formateur1",
                "role": "FORMATEUR"
            },
            "participants": [
                {
                    "id": 2,
                    "username": "participant1",
                    "role": "STAGIAIRE"
                }
            ]
        }
    ],
    "count": 1
}
```

### 2. Test avec un ID de formateur inexistant
```http
GET http://localhost:8080/api/training/formateur/999
```

**Réponse attendue (404 Not Found):**
```json
{
    "error": "Formateur non trouvé avec l'ID: 999",
    "formateurId": 999
}
```

### 3. Test avec un formateur qui n'a aucune formation
```http
GET http://localhost:8080/api/training/formateur/2
```

**Réponse attendue (200 OK):**
```json
{
    "formateurId": 2,
    "formations": [],
    "count": 0
}
```

## Étapes pour tester dans Postman

1. **Démarrer l'application Spring Boot**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Ouvrir Postman et créer une nouvelle requête**

3. **Configurer la requête:**
   - Méthode: GET
   - URL: `http://localhost:8080/api/training/formateur/1`
   - Onglet Headers: Ajouter `Content-Type` = `application/json`

4. **Envoyer la requête**

5. **Vérifier la réponse**

## Tests supplémentaires recommandés

### Test avec différents paramètres
- Tester avec l'ID 1 (si vous avez des données de test)
- Tester avec un ID qui n'existe pas
- Tester avec un ID négatif (devrait retourner une erreur)

### Test via curl (alternative)
```bash
# Test avec un ID valide
curl -X GET "http://localhost:8080/api/training/formateur/1" -H "Content-Type: application/json"

# Test avec un ID inexistant
curl -X GET "http://localhost:8080/api/training/formateur/999" -H "Content-Type: application/json"
```

## Vérification des résultats

1. **Code de statut:**
   - 200 OK pour les requêtes réussies
   - 404 Not Found si le formateur n'existe pas
   - 500 Internal Server Error pour les erreurs serveur

2. **Structure de la réponse:**
   - `formateurId`: L'ID du formateur demandé
   - `formations`: Tableau des formations (peut être vide)
   - `count`: Nombre de formations trouvées

3. **Données des formations:**
   - Vérifiez que tous les champs sont présents
   - Vérifiez que le trainer correspond à l'ID demandé
   - Vérifiez les participants si présents
