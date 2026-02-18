# Configuration de l'envoi d'emails pour les formations

## Vue d'ensemble

L'endpoint `http://localhost:8080/api/training/send-links-completed` est maintenant implémenté pour envoyer automatiquement des liens de questionnaire par email aux participants des formations terminées.

## Configuration requise

### 1. Configuration Gmail

1. **Activer l'authentification en deux étapes** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Allez dans les paramètres de votre compte Google
   - Sécurité → Mots de passe des applications
   - Créez un nouveau mot de passe pour "Spring Boot App"
   - Copiez ce mot de passe (16 caractères)

### 2. Mettre à jour application.properties

Modifiez les lignes suivantes dans `src/main/resources/application.properties` :

```properties
# Remplacez avec vos informations
spring.mail.username=votre-email@gmail.com
spring.mail.password=votre-mot-de-passe-application-16-caracteres
```

### 3. Dépendances ajoutées

La dépendance suivante a été ajoutée à `pom.xml` :
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

## Utilisation

### Endpoint principal

**POST** `/api/training/send-links-completed`

Envoie automatiquement les liens de questionnaire à tous les participants des formations terminées.

**Réponse attendue :**
```json
{
  "totalTrainings": 10,
  "completedTrainings": 3,
  "linksSent": 3,
  "results": "Formation 'Java Basics' (ID: 1): Lien envoyé à 5 participants.\nFormation 'Spring Boot' (ID: 2): Lien envoyé à 3 participants.\n..."
}
```

### Endpoint individuel

**POST** `/api/training/{trainingId}/send-questionnaire-link`

Envoie le lien de questionnaire pour une formation spécifique.

**Paramètres :**
- `trainingId` : ID de la formation

**Réponse attendue :**
```json
{
  "message": "Lien du questionnaire envoyé avec succès",
  "link": "http://localhost:8080/questionnaire?trainingId=1",
  "trainingId": 1
}
```

### Vérification du statut

**GET** `/api/training/{trainingId}/status`

Vérifie si une formation est terminée et si le lien peut être envoyé.

## Contenu de l'email

L'email envoyé aux participants contient :

- **Sujet :** "Questionnaire d'évaluation - Formation : [Titre de la formation]"
- **Destinataire :** Email du participant
- **Contenu :** Message personnalisé avec le lien du questionnaire

## Dépannage

### Erreurs courantes

1. **"Authentication failed"** : Vérifiez le mot de passe d'application Gmail
2. **"Connection refused"** : Vérifiez que le port 587 n'est pas bloqué
3. **Formation non trouvée** : Vérifiez que l'ID de la formation existe
4. **Aucun participant trouvé** : Vérifiez que la formation a des participants avec des emails valides

### Logs

Les emails envoyés avec succès sont loggés dans la console :
```
Email envoyé avec succès à participant@example.com
```

Les erreurs sont également loggées :
```
Erreur lors de l'envoi de l'email au participant username: message d'erreur
```

## Démarrage de l'application

1. Configurez `application.properties` avec vos identifiants Gmail
2. Démarrez l'application : `mvn spring-boot:run`
3. Testez l'endpoint : `curl -X POST http://localhost:8080/api/training/send-links-completed`

## Sécurité

- Utilisez toujours des mots de passe d'application plutôt que votre mot de passe principal
- Ne commitez jamais vos identifiants dans le contrôle de version
- En production, utilisez des variables d'environnement ou un service de secrets
