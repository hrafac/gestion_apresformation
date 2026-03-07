package com.marsamaroc.eval.services;



import com.marsamaroc.eval.dto.TrainingDTO;

import com.marsamaroc.eval.dto.UserShortDTO;

import com.marsamaroc.eval.dto.ResponseDTO;

import com.marsamaroc.eval.entities.Training;

import com.marsamaroc.eval.entities.TrainingStatus;

import com.marsamaroc.eval.entities.User;

import com.marsamaroc.eval.entities.Response;

import com.marsamaroc.eval.entities.Question;

import com.marsamaroc.eval.repositories.TrainingRepository;

import com.marsamaroc.eval.repositories.UserRepository;

import com.marsamaroc.eval.repositories.QuestionnaireRepository;

import com.marsamaroc.eval.repositories.ResponseRepository;

import com.marsamaroc.eval.repositories.QuestionRepository;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;



import java.time.LocalDateTime;

import java.util.List;

import java.util.Map;

import java.util.Set;

import java.util.stream.Collectors;



@Service

public class TrainingService {

    @Autowired

    private TrainingRepository trainingRepository;

    

    @Autowired

    private QuestionnaireRepository questionnaireRepository;

    

    @Autowired

    private ResponseRepository responseRepository;

    

    @Autowired

    private QuestionRepository questionRepository;

    

    @Autowired

    private EmailService emailService;

    

    @Autowired

    private UserRepository userRepository;

    

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

        String generatedLink;

        

        // Vérifier si le questionnaire est de type FROID pour générer l'URL sans trainingId

        // Utiliser une requête directe pour éviter les problèmes de lazy loading

        java.util.List<com.marsamaroc.eval.entities.Questionnaire> froidQuestionnaires = 

            questionnaireRepository.findByType(com.marsamaroc.eval.entities.EvaluationType.FROID);

        

        // Vérifier s'il y a des questionnaires FROID associés à cette formation

        boolean hasFroidQuestionnaire = froidQuestionnaires.stream()

            .anyMatch(q -> q.getTraining() != null && q.getTraining().getId().equals(trainingId));

        

        if (hasFroidQuestionnaire) {

            generatedLink = "http://localhost:8080/questionnaire";

        } else {

            generatedLink = "http://localhost:8080/questionnaire?trainingId=" + trainingId;

        }

        

        // Envoyer le lien par email à chaque participant

        for (User participant : participants) {

            try {

                emailService.sendQuestionnaireLink(

                    participant.getEmail(),

                    participant.getFullName() != null ? participant.getFullName() : participant.getUsername(),

                    training.getTitle(),

                    participant.getId()  // Passer l'ID utilisateur

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

                        // Vérifier si le questionnaire est de type FROID pour générer l'URL sans trainingId

                        // Utiliser une requête directe pour éviter les problèmes de lazy loading

                        java.util.List<com.marsamaroc.eval.entities.Questionnaire> froidQuestionnaires = 

                            questionnaireRepository.findByType(com.marsamaroc.eval.entities.EvaluationType.FROID);

                        

                        // Vérifier s'il y a des questionnaires FROID associés à cette formation

                        boolean hasFroidQuestionnaire = froidQuestionnaires.stream()

                            .anyMatch(q -> q.getTraining() != null && q.getTraining().getId().equals(training.getId()));

                        

                        String link;

                        if (hasFroidQuestionnaire) {

                            link = "http://localhost:8080/questionnaire";

                        } else {

                            link = "http://localhost:8080/questionnaire?trainingId=" + training.getId();

                        }

                        

                        // Envoyer le lien à chaque participant

                        for (User participant : participants) {

                            try {

                                emailService.sendQuestionnaireLink(

                                    participant.getEmail(),

                                    participant.getFullName() != null ? participant.getFullName() : participant.getUsername(),

                                    training.getTitle(),

                                    participant.getId()  // Passer l'ID utilisateur

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



    // Méthode pour ajouter des participants à une formation

    public TrainingDTO ajouterDesParticipantsDansUnFormation(Long trainingId, List<Long> participantIds) {

        Training training = trainingRepository.findById(trainingId)

            .orElseThrow(() -> new RuntimeException("Formation non trouvée avec l'ID: " + trainingId));

        

        // Récupérer les utilisateurs à ajouter

        List<User> participantsToAdd = userRepository.findAllById(participantIds);

        

        // Vérifier que tous les participants existent

        if (participantsToAdd.size() != participantIds.size()) {

            throw new RuntimeException("Un ou plusieurs participants n'ont pas été trouvés");

        }

        

        // Initialiser la collection des participants si elle est null

        if (training.getParticipants() == null) {

            training.setParticipants(new java.util.HashSet<>());

        }

        

        // Ajouter les participants à la formation

        for (User participant : participantsToAdd) {

            training.getParticipants().add(participant);

        }

        

        // Sauvegarder la formation mise à jour

        Training updatedTraining = trainingRepository.save(training);

        

        return toDTO(updatedTraining);

    }



            // Sauvegarder les réponses du participant

    public void saveParticipantResponses(java.util.List<com.marsamaroc.eval.dto.ResponseDTO> responses) {

        for (com.marsamaroc.eval.dto.ResponseDTO responseDTO : responses) {

            try {

                // Créer une nouvelle réponse

                Response response = new Response();

                

                // Récupérer la question

                Question question = questionRepository.findById(responseDTO.getQuestionId())

                    .orElseThrow(() -> new RuntimeException("Question non trouvée avec l'ID: " + responseDTO.getQuestionId()));

                response.setQuestion(question);

                

                // Récupérer l'utilisateur

                User user = userRepository.findById(responseDTO.getUserId())

                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + responseDTO.getUserId()));

                response.setUser(user);

                

                // Définir la valeur de la réponse

                response.setValue(responseDTO.getValue());

                

                // Définir la date de soumission

                response.setSubmittedAt(LocalDateTime.now());

                

                // Sauvegarder la réponse

                responseRepository.save(response);

                

            } catch (Exception e) {

                // Log l'erreur mais continuer avec les autres réponses

                System.err.println("Erreur lors de la sauvegarde de la réponse pour la question " + 

                    responseDTO.getQuestionId() + " et l'utilisateur " + responseDTO.getUserId() + ": " + e.getMessage());

                throw new RuntimeException("Erreur lors de la sauvegarde des réponses", e);

            }

        }

    }



    // Méthode automatique pour mettre à jour les statuts des formations

    public Map<String, Object> updateTrainingStatusesAutomatically() {

        LocalDateTime now = LocalDateTime.now();

        int updatedToEnCours = 0;

        int updatedToTermine = 0;

        

        // Récupérer les formations qui devraient être en cours mais ne le sont pas encore

        List<Training> ongoingTrainings = trainingRepository.findOngoingTrainings(now);

        

        // Récupérer les formations qui sont terminées mais pas encore marquées comme telles

        List<Training> completedTrainings = trainingRepository.findCompletedTrainingsNotUpdated(now);

        

        // Mettre à jour les formations en cours

        for (Training training : ongoingTrainings) {

            if (training.getStatus() == TrainingStatus.PAS_ENCORE) {

                training.setStatus(TrainingStatus.EN_COURS);

                trainingRepository.save(training);

                updatedToEnCours++;

                System.out.println("Formation '" + training.getTitle() + "' mise à jour: EN_COURS");

            }

        }

        

        // Mettre à jour les formations terminées

        for (Training training : completedTrainings) {

            training.setStatus(TrainingStatus.TERMINE);

            trainingRepository.save(training);

            updatedToTermine++;

            System.out.println("Formation '" + training.getTitle() + "' mise à jour: TERMINE");

            

            // Envoyer automatiquement le lien du questionnaire aux participants

            try {

                sendQuestionnaireLinkToParticipants(training.getId());

            } catch (Exception e) {

                System.err.println("Erreur lors de l'envoi du questionnaire pour la formation '" + 

                    training.getTitle() + "': " + e.getMessage());

            }

        }

        

        return Map.of(

            "timestamp", now.toString(),

            "updatedToEnCours", updatedToEnCours,

            "updatedToTermine", updatedToTermine,

            "totalUpdated", updatedToEnCours + updatedToTermine,

            "message", "Mise à jour automatique des statuts terminée"

        );

    }



    // Créer une nouvelle formation

    public TrainingDTO createTraining(Training training) {

        // Valider les dates

        if (training.getStartDate() == null || training.getEndDate() == null) {

            throw new RuntimeException("Les dates de début et de fin sont obligatoires");

        }

        if (training.getStartDate().isAfter(training.getEndDate())) {

            throw new RuntimeException("La date de début doit être antérieure à la date de fin");

        }

        if (training.getTitle() == null || training.getTitle().trim().isEmpty()) {

            throw new RuntimeException("Le titre de la formation est obligatoire");

        }

        

        // Définir le statut par défaut

        if (training.getStatus() == null) {

            training.setStatus(TrainingStatus.PAS_ENCORE);

        }

        

        Training savedTraining = trainingRepository.save(training);

        return toDTO(savedTraining);

    }



    // Mettre à jour une formation existante

    public TrainingDTO updateTraining(Long trainingId, Training trainingDetails) {

        Training existingTraining = trainingRepository.findById(trainingId)

            .orElseThrow(() -> new RuntimeException("Formation non trouvée avec l'ID: " + trainingId));

        

        // Mettre à jour les champs

        if (trainingDetails.getTitle() != null && !trainingDetails.getTitle().trim().isEmpty()) {

            existingTraining.setTitle(trainingDetails.getTitle());

        }

        if (trainingDetails.getTheme() != null) {

            existingTraining.setTheme(trainingDetails.getTheme());

        }

        if (trainingDetails.getLocation() != null) {

            existingTraining.setLocation(trainingDetails.getLocation());

        }

        if (trainingDetails.getStartDate() != null) {

            existingTraining.setStartDate(trainingDetails.getStartDate());

        }

        if (trainingDetails.getEndDate() != null) {

            existingTraining.setEndDate(trainingDetails.getEndDate());

        }

        if (trainingDetails.getTrainer() != null) {

            existingTraining.setTrainer(trainingDetails.getTrainer());

        }

        if (trainingDetails.getParticipants() != null) {

            existingTraining.setParticipants(trainingDetails.getParticipants());

        }

        if (trainingDetails.getStatus() != null) {

            existingTraining.setStatus(trainingDetails.getStatus());

        }

        

        // Valider les dates après mise à jour

        if (existingTraining.getStartDate().isAfter(existingTraining.getEndDate())) {

            throw new RuntimeException("La date de début doit être antérieure à la date de fin");

        }

        

        Training updatedTraining = trainingRepository.save(existingTraining);

        return toDTO(updatedTraining);

    }



    // Supprimer une formation

    public void deleteTraining(Long trainingId) {

        Training training = trainingRepository.findById(trainingId)

            .orElseThrow(() -> new RuntimeException("Formation non trouvée avec l'ID: " + trainingId));

        

        trainingRepository.delete(training);

    }



    // Récupérer une formation par son ID

    public TrainingDTO getTrainingById(Long trainingId) {

        Training training = trainingRepository.findById(trainingId)

            .orElseThrow(() -> new RuntimeException("Formation non trouvée avec l'ID: " + trainingId));

        return toDTO(training);

    }



    // Méthode pour supprimer un participant d'une formation

    public TrainingDTO removeParticipantFromTraining(Long trainingId, Long participantId) {

        Training training = trainingRepository.findById(trainingId)

            .orElseThrow(() -> new RuntimeException("Formation non trouvée avec l'ID: " + trainingId));

        

        // Vérifier si la formation a des participants

        if (training.getParticipants() == null || training.getParticipants().isEmpty()) {

            throw new RuntimeException("Aucun participant trouvé dans cette formation");

        }

        

        // Vérifier si le participant existe dans la formation

        boolean participantExists = training.getParticipants().stream()

            .anyMatch(participant -> participant.getId().equals(participantId));

        

        if (!participantExists) {

            throw new RuntimeException("Participant avec l'ID " + participantId + " non trouvé dans cette formation");

        }

        

        // Supprimer le participant

        training.getParticipants().removeIf(participant -> participant.getId().equals(participantId));

        

        // Sauvegarder la formation mise à jour

        Training updatedTraining = trainingRepository.save(training);

        

        return toDTO(updatedTraining);

    }

    

    // Récupérer les formations par participant

    public List<TrainingDTO> getFormationsByParticipant(Long participantId) {

        // Vérifier si le participant existe

        User participant = userRepository.findById(participantId)

            .orElseThrow(() -> new RuntimeException("Participant non trouvé avec l'ID: " + participantId));

        

        // Récupérer les formations du participant

        List<Training> trainings = trainingRepository.findByParticipantId(participantId);

        

        // Convertir en DTO

        return toDTOList(trainings);

    }

    

    // Récupérer les formations par formateur

    public List<TrainingDTO> getFormationsByFormateur(Long formateurId) {

        // Vérifier si le formateur existe

        User formateur = userRepository.findById(formateurId)

            .orElseThrow(() -> new RuntimeException("Formateur non trouvé avec l'ID: " + formateurId));

        

        // Récupérer les formations du formateur

        List<Training> trainings = trainingRepository.findByTrainerId(formateurId);

        

        // Convertir en DTO

        return toDTOList(trainings);

    }

}

