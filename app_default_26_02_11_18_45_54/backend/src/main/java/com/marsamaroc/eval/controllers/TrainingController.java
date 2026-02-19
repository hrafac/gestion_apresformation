package com.marsamaroc.eval.controllers;

import com.marsamaroc.eval.entities.Training;
import com.marsamaroc.eval.repositories.TrainingRepository;
import com.marsamaroc.eval.services.TrainingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/training")
public class TrainingController {
    @Autowired
    private TrainingService trainingService;
    
    @Autowired
    private TrainingRepository trainingRepository;

    // Endpoint pour récupérer toutes les formations
    @GetMapping
    public ResponseEntity<List<Training>> getAllTrainings() {
        List<Training> trainings = trainingRepository.findAll();
        return ResponseEntity.ok(trainings);
    }

    // Endpoint pour déclencher l'envoi du lien questionnaire à la fin de la formation
    @PostMapping("/{trainingId}/send-questionnaire-link")
    public ResponseEntity<?> sendQuestionnaireLink(@PathVariable Long trainingId) {
        try {
            String link = trainingService.sendQuestionnaireLinkToParticipants(trainingId);
            return ResponseEntity.ok(Map.of(
                "message", "Lien du questionnaire envoyé avec succès",
                "link", link,
                "trainingId", trainingId
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", e.getMessage(),
                "trainingId", trainingId
            ));
        }
    }

    // Endpoint pour vérifier si une formation est terminée
    @GetMapping("/{trainingId}/status")
    public ResponseEntity<?> getTrainingStatus(@PathVariable Long trainingId) {
        try {
            Map<String, Object> status = trainingService.getTrainingStatus(trainingId);
            return ResponseEntity.ok(status);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", e.getMessage(),
                "trainingId", trainingId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Erreur lors de la vérification du statut de la formation"
            ));
        }
    }

    // Endpoint pour envoyer automatiquement les liens à toutes les formations terminées
    @PostMapping("/send-links-completed")
    public ResponseEntity<?> sendLinksForCompletedTrainings() {
        try {
            Map<String, Object> result = trainingService.sendLinksForCompletedTrainings();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Erreur lors de l'envoi automatique des liens: " + e.getMessage()
            ));
        }
    }

    // Endpoint pour ajouter des participants à une formation
    @PostMapping("/{trainingId}/participants")
    public ResponseEntity<?> addParticipantsToTraining(@PathVariable Long trainingId, @RequestBody List<Long> participantIds) {
        try {
            var updatedTraining = trainingService.ajouterDesParticipantsDansUnFormation(trainingId, participantIds);
            return ResponseEntity.ok(Map.of(
                "message", "Participants ajoutés avec succès",
                "training", updatedTraining,
                "participantsCount", participantIds.size()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", e.getMessage(),
                "trainingId", trainingId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Erreur lors de l'ajout des participants: " + e.getMessage(),
                "trainingId", trainingId
            ));
        }
    }

    // Endpoint pour déclencher manuellement la mise à jour des statuts
    @PostMapping("/update-statuses")
    public ResponseEntity<?> updateTrainingStatusesManually() {
        try {
            var result = trainingService.updateTrainingStatusesAutomatically();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Erreur lors de la mise à jour des statuts: " + e.getMessage()
            ));
        }
    }
}
