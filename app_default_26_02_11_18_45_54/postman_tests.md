# Tests Postman pour les endpoints Training

## 1. Vérifier le statut d'une formation
**Méthode:** GET  
**URL:** `http://localhost:8080/api/training/{trainingId}/status`

**Headers:**
```
Content-Type: application/json
```

**Exemple d'URL:**
```
http://localhost:8080/api/training/1/status
```

**Réponse attendue (formation terminée):**
```json
{
    "trainingId": 1,
    "title": "Formation Java Avancé",
    "isCompleted": true,
    "status": "Terminée",
    "endDate": "2026-02-15T17:00:00",
    "canSendLink": true
}
```

**Réponse attendue (formation en cours):**
```json
{
    "trainingId": 2,
    "title": "Formation Spring Boot",
    "isCompleted": false,
    "status": "En cours",
    "endDate": "2026-02-20T18:00:00",
    "canSendLink": false
}
```

---

## 2. Envoyer le lien questionnaire (formation terminée)
**Méthode:** POST  
**URL:** `http://localhost:8080/api/training/{trainingId}/send-questionnaire-link`

**Headers:**
```
Content-Type: application/json
```

**Exemple d'URL:**
```
http://localhost:8080/api/training/1/send-questionnaire-link
```

**Réponse attendue (succès):**
```json
{
    "message": "Lien du questionnaire envoyé avec succès",
    "link": "http://localhost:8080/questionnaire?trainingId=1",
    "trainingId": 1
}
```

**Réponse attendue (erreur - formation non terminée):**
```json
{
    "error": "La formation n'est pas encore terminée. L'envoi du lien n'est pas autorisé.",
    "trainingId": 2
}
```

---

## 3. Envoyer les liens pour toutes les formations terminées
**Méthode:** POST  
**URL:** `http://localhost:8080/api/training/send-links-completed`

**Headers:**
```
Content-Type: application/json
```

**Réponse attendue:**
```json
{
    "totalTrainings": 5,
    "completedTrainings": 2,
    "linksSent": 2,
    "results": "Formation 'Formation Java Avancé' (ID: 1): Lien prêt pour 15 participants.\nFormation 'Formation React' (ID: 3): Lien prêt pour 8 participants.\n"
}
```

---

## 4. Ajouter des participants à une formation
**Méthode:** POST  
**URL:** `http://localhost:8080/api/training/{trainingId}/participants`

**Headers:**
```
Content-Type: application/json
```

**Exemple d'URL:**
```
http://localhost:8080/api/training/1/participants
```

**Corps de la requête (Body):**
```json
[2, 3, 4]
```

**Réponse attendue (succès):**
```json
{
    "message": "Participants ajoutés avec succès",
    "training": {
        "id": 1,
        "title": "Formation Java Avancé",
        "theme": "Développement",
        "location": "Salle A",
        "startDateTime": "2026-02-10T09:00:00",
        "endDateTime": "2026-02-15T17:00:00",
        "trainer": {
            "id": 1,
            "username": "formateur1",
            "role": "TRAINER"
        },
        "participants": [
            {
                "id": 2,
                "username": "participant1",
                "role": "PARTICIPANT"
            },
            {
                "id": 3,
                "username": "participant2",
                "role": "PARTICIPANT"
            },
            {
                "id": 4,
                "username": "participant3",
                "role": "PARTICIPANT"
            }
        ]
    },
    "participantsCount": 3
}
```

**Réponse attendue (erreur - formation non trouvée):**
```json
{
    "error": "Formation non trouvée avec l'ID: 999",
    "trainingId": 999
}
```

**Réponse attendue (erreur - participants non trouvés):**
```json
{
    "error": "Un ou plusieurs participants n'ont pas été trouvés",
    "trainingId": 1
}
```

---

## 5. Test d'erreur (formation non trouvée)
**Méthode:** GET  
**URL:** `http://localhost:8080/api/training/999/status`

**Réponse attendue:**
```json
{
    "error": "Formation non trouvée avec l'ID: 999",
    "trainingId": 999
}
```

---

## Configuration Postman

### Importer la collection
Vous pouvez importer cette configuration JSON dans Postman :

```json
{
    "info": {
        "name": "Training API Tests",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Get Training Status",
            "request": {
                "method": "GET",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "url": {
                    "raw": "http://localhost:8080/api/training/1/status",
                    "protocol": "http",
                    "host": ["localhost"],
                    "port": "8080",
                    "path": ["api", "training", "1", "status"]
                }
            }
        },
        {
            "name": "Send Questionnaire Link",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "url": {
                    "raw": "http://localhost:8080/api/training/1/send-questionnaire-link",
                    "protocol": "http",
                    "host": ["localhost"],
                    "port": "8080",
                    "path": ["api", "training", "1", "send-questionnaire-link"]
                }
            }
        },
        {
            "name": "Send Links for Completed Trainings",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "url": {
                    "raw": "http://localhost:8080/api/training/send-links-completed",
                    "protocol": "http",
                    "host": ["localhost"],
                    "port": "8080",
                    "path": ["api", "training", "send-links-completed"]
                }
            }
        },
        {
            "name": "Add Participants to Training",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "[2, 3, 4]",
                    "options": {
                        "raw": {
                            "language": "json"
                        }
                    }
                },
                "url": {
                    "raw": "http://localhost:8080/api/training/1/participants",
                    "protocol": "http",
                    "host": ["localhost"],
                    "port": "8080",
                    "path": ["api", "training", "1", "participants"]
                }
            }
        }
    ]
}
```

---

## Étapes de test recommandées

1. **Démarrer l'application Spring Boot**
2. **Tester le statut** d'une formation existante
3. **Tenter d'envoyer un lien** pour une formation en cours (doit échouer)
4. **Tenter d'envoyer un lien** pour une formation terminée (doit réussir)
5. **Tester l'envoi automatique** pour toutes les formations terminées

**Note:** Assurez-vous que votre base de données contient des formations avec des dates passées pour tester les scénarios de formations terminées.
