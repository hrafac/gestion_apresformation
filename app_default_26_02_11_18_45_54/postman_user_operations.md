# Requêtes Postman pour la gestion des utilisateurs

## Configuration de base
- **URL de base**: `http://localhost:8080/api/auth`
- **Content-Type**: `application/json`

## 1. Modifier un utilisateur (PUT)

### Requête
```
PUT /api/auth/users/{id}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <votre_token_jwt>
```

### Body (JSON)
```json
{
    "username": "nouveau_nom_utilisateur",
    "email": "nouveau.email@example.com",
    "fullName": "Nouveau Nom Complet",
    "role": "PARTICIPANT",
    "password": "nouveau_mot_de_passe"
}
```

### Exemple concret
```
PUT http://localhost:8080/api/auth/users/1
```

**Body:**
```json
{
    "username": "john_doe_updated",
    "email": "john.updated@example.com",
    "fullName": "John Doe Updated",
    "role": "TRAINER",
    "password": "newSecurePassword123"
}
```

### Réponse attendue (200 OK)
```json
{
    "id": 1,
    "username": "john_doe_updated",
    "email": "john.updated@example.com",
    "fullName": "John Doe Updated",
    "role": "TRAINER",
    "password": "$2a$10$encryptedPasswordHash...",
    "authorities": [
        {
            "authority": "ROLE_TRAINER"
        }
    ],
    "accountNonExpired": true,
    "accountNonLocked": true,
    "credentialsNonExpired": true,
    "enabled": true
}
```

### Réponse d'erreur (404 Not Found)
```json
{
    "timestamp": "2024-02-22T10:30:00.000+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "User not found with id: 999",
    "path": "/api/auth/users/999"
}
```

---

## 2. Supprimer un utilisateur (DELETE)

### Requête
```
DELETE /api/auth/users/{id}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <votre_token_jwt>
```

### Exemple concret
```
DELETE http://localhost:8080/api/auth/users/2
```

### Réponse attendue (200 OK)
```json
"User deleted successfully"
```

### Réponse d'erreur (404 Not Found)
```json
{
    "timestamp": "2024-02-22T10:35:00.000+00:00",
    "status": 404,
    "error": "Not Found",
    "message": "User not found with id: 999",
    "path": "/api/auth/users/999"
}
```

---

## 3. Obtenir un token JWT (nécessaire pour l'authentification)

### Requête de connexion
```
POST http://localhost:8080/api/auth/login
```

### Body
```json
{
    "username": "votre_nom_utilisateur",
    "password": "votre_mot_de_passe"
}
```

### Réponse
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "fullName": "Admin User",
        "role": "ADMIN"
    }
}
```

---

## Instructions Postman

### Étape 1: Créer une collection
1. Ouvrir Postman
2. Créer une nouvelle collection "Gestion Utilisateurs"

### Étape 2: Configurer les variables d'environnement
1. Créer un environnement "Dev"
2. Ajouter les variables :
   - `baseUrl`: `http://localhost:8080`
   - `token`: (vide pour le moment)

### Étape 3: Créer les requêtes

#### Requête Login
- **Nom**: Login
- **Méthode**: POST
- **URL**: `{{baseUrl}}/api/auth/login`
- **Body**: raw JSON
```json
{
    "username": "admin",
    "password": "admin123"
}
```
- **Tests** (pour extraire le token):
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
}
```

#### Requête Update User
- **Nom**: Update User
- **Méthode**: PUT
- **URL**: `{{baseUrl}}/api/auth/users/1`
- **Authorization**: Bearer Token `{{token}}`
- **Body**: raw JSON
```json
{
    "username": "updated_user",
    "email": "updated@example.com",
    "fullName": "Updated User Name",
    "role": "TRAINER",
    "password": "newPassword123"
}
```

#### Requête Delete User
- **Nom**: Delete User
- **Méthode**: DELETE
- **URL**: `{{baseUrl}}/api/auth/users/2`
- **Authorization**: Bearer Token `{{token}}`

---

## Notes importantes

1. **Authentification**: Toutes les requêtes PUT et DELETE nécessitent un token JWT valide dans l'en-tête Authorization.
2. **Mot de passe**: Le champ password est optionnel dans la mise à jour. S'il est vide ou null, le mot de passe existant est conservé.
3. **Rôles disponibles**: `ADMIN`, `RH`, `TRAINER`, `PARTICIPANT`
4. **Permissions**: Assurez-vous que l'utilisateur qui fait la demande a les permissions nécessaires pour modifier/supprimer d'autres utilisateurs.

## Tests rapides

### Tester avec curl
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Update user (remplacer TOKEN et ID)
curl -X PUT http://localhost:8080/api/auth/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"username":"updated_user","email":"updated@example.com","fullName":"Updated User","role":"TRAINER"}'

# Delete user (remplacer TOKEN et ID)
curl -X DELETE http://localhost:8080/api/auth/users/2 \
  -H "Authorization: Bearer TOKEN"
```
