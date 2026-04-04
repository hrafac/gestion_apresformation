FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Installer Maven
RUN apk add --no-cache maven

# Copier les fichiers Maven
COPY pom.xml .
COPY src ./src

# Builder l'application
RUN mvn package -DskipTests

# Exposer le port
EXPOSE 8080

# Lancer l'application
ENTRYPOINT ["java", "-jar", "target/eval-0.0.1-SNAPSHOT.jar"]
