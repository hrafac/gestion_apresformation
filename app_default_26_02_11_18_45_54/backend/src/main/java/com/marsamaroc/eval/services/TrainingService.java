package com.marsamaroc.eval.services;

import com.marsamaroc.eval.dto.TrainingDTO;
import com.marsamaroc.eval.dto.UserShortDTO;
import com.marsamaroc.eval.entities.Training;
import com.marsamaroc.eval.entities.User;
import com.marsamaroc.eval.repositories.TrainingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TrainingService {
    @Autowired
    private TrainingRepository trainingRepository;
    
    @Autowired
    private EmailService emailService;
    
    // Méthode pour charger les données complètes d'une formation
    public Training getTrainingWithFullUsers(Long trainingId) {
        Training training = trainingRepository.findById(trainingId)
            .orElseThrow(() -> new RuntimeException("Formation non trouvée"));
        
        // Forcer le chargement des données utilisateurs
        if (training.getTrainer() != null) {
            training.getTrainer().getUsername(); // Force le chargement
        }
        
        if (training.getParticipants() != null) {
            training.getParticipants().forEach(p -> p.getUsername()); // Force le chargement
        }
        
        return training;
    }
    
    public TrainingDTO toDTO(Training t) {
        TrainingDTO dto = new TrainingDTO();
        dto.setId(t.getId());
        dto.setTitle(t.getTitle());
        dto.setTheme(t.getTheme());
        dto.setLocation(t.getLocation());
        dto.setStartDateTime(t.getStartDate());
        dto.setEndDateTime(t.getEndDate());
        dto.setTrainer(t.getTrainer() != null ? toUserShortDTO(t.getTrainer()) : null);
        dto.setParticipants(t.getParticipants() != null ? toUserShortDTOList(t.getParticipants()) : null);
        return dto;
    }

    public UserShortDTO toUserShortDTO(User user) {
        UserShortDTO dto = new UserShortDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        return dto;
    }

    public List<UserShortDTO> toUserShortDTOList(Set<User> users) {
        return users.stream().map(this::toUserShortDTO).collect(Collectors.toList());
    }

    public List<TrainingDTO> toDTOList(List<Training> trainings) {
        return trainings.stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Envoi automatique du lien questionnaire à la fin de la formation
    public String sendQuestionnaireLinkToParticipants(Long trainingId) {
        // Récupérer la formation
        Training training = trainingRepository.findById(trainingId)
            .orElseThrow(() -> new RuntimeException("Formation non trouvée avec l'ID: " + trainingId));
        
        // Vérifier si la formation est terminée
        if (!training.isCompleted()) {
            throw new RuntimeException("La formation n'est pas encore terminée. L'envoi du lien n'est pas autorisé.");
        }
        
        // Récupérer les participants
        Set<User> participants = training.getParticipants();
        if (participants == null || participants.isEmpty()) {
            throw new RuntimeException("Aucun participant trouvé pour cette formation.");
        }
        
        // Générer le lien du questionnaire
        String generatedLink = "http://localhost:8080/questionnaire?trainingId=" + trainingId;
        
        // Envoyer le lien par email à chaque participant
        for (User participant : participants) {
            try {
                emailService.sendQuestionnaireLink(
                    participant.getEmail(),
                    participant.getFullName() != null ? participant.getFullName() : participant.getUsername(),
                    training.getTitle(),
                    generatedLink
                );
            } catch (Exception e) {
                System.err.println("Erreur lors de l'envoi de l'email au participant " + participant.getUsername() + ": " + e.getMessage());
            }
        }
        
        return generatedLink;
    }

    // Méthode pour vérifier le statut d'une formation
    public Map<String, Object> getTrainingStatus(Long trainingId) {
        Training training = trainingRepository.findById(trainingId)
            .orElseThrow(() -> new RuntimeException("Formation non trouvée avec l'ID: " + trainingId));
        
        boolean isCompleted = training.isCompleted();
        String status = isCompleted ? "Terminée" : "En cours";
        
        return Map.of(
            "trainingId", trainingId,
            "title", training.getTitle(),
            "isCompleted", isCompleted,
            "status", status,
            "endDate", training.getEndDate(),
            "canSendLink", isCompleted
        );
    }

    // Méthode pour envoyer automatiquement les liens pour toutes les formations terminées
    public Map<String, Object> sendLinksForCompletedTrainings() {
        List<Training> allTrainings = trainingRepository.findAll();
        int completedCount = 0;
        int sentCount = 0;
        StringBuilder results = new StringBuilder();
        
        for (Training training : allTrainings) {
            if (training.isCompleted()) {
                completedCount++;
                try {
                    Set<User> participants = training.getParticipants();
                    if (participants != null && !participants.isEmpty()) {
                        String link = "http://localhost:8080/questionnaire?trainingId=" + training.getId();
                        
                        // Envoyer le lien à chaque participant
                        for (User participant : participants) {
                            try {
                                emailService.sendQuestionnaireLink(
                                    participant.getEmail(),
                                    participant.getFullName() != null ? participant.getFullName() : participant.getUsername(),
                                    training.getTitle(),
                                    link
                                );
                            } catch (Exception e) {
                                System.err.println("Erreur lors de l'envoi au participant " + participant.getUsername() + ": " + e.getMessage());
                            }
                        }
                        
                        sentCount++;
                        results.append("Formation '").append(training.getTitle())
                               .append("' (ID: ").append(training.getId())
                               .append("): Lien envoyé à ").append(participants.size())
                               .append(" participants.\n");
                    }
                } catch (Exception e) {
                    results.append("Erreur pour la formation '").append(training.getTitle())
                           .append("': ").append(e.getMessage()).append("\n");
                }
            }
        }
        
        return Map.of(
            "totalTrainings", allTrainings.size(),
            "completedTrainings", completedCount,
            "linksSent", sentCount,
            "results", results.toString()
        );
    }

            // Sauvegarder les réponses du participant
            public void saveParticipantResponses(java.util.List<com.marsamaroc.eval.dto.ResponseDTO> responses) {
                  // Logique pour enregistrer les réponses dans la table Response
                  // Injection du repository nécessaire
                  // (Exemple de pseudo-code)
                  // for (ResponseDTO dto : responses) {
                  //     Response response = new Response();
                  //     response.setQuestion(questionRepository.findById(dto.getQuestionId()).orElse(null));
                  //     response.setUser(userRepository.findById(dto.getUserId()).orElse(null));
                  //     response.setValue(dto.getValue());
                  //     response.setSubmittedAt(dto.getSubmittedAt());
                  //     responseRepository.save(response);
                  // }
                  // À compléter avec injection des repositories et gestion d'erreur
            }
}
