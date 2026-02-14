package com.marsamaroc.eval.controllers;

import com.marsamaroc.eval.entities.*;
import com.marsamaroc.eval.repositories.*;
import com.marsamaroc.eval.services.StatsService;
import com.marsamaroc.eval.services.QuestionnaireService;
import com.marsamaroc.eval.services.TrainingService;
import com.marsamaroc.eval.dto.QuestionnaireDTO;
import com.marsamaroc.eval.dto.TrainingDTO;
import com.marsamaroc.eval.dto.ResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rh")
@RequiredArgsConstructor
public class RHController {
    private final TrainingRepository trainingRepository;
    private final QuestionnaireRepository questionnaireRepository;
    private final StatsService statsService;
    private final QuestionnaireService questionnaireService;
    private final TrainingService trainingService;
    private final ResponseRepository responseRepository;


    @GetMapping("/trainings")
    public List<TrainingDTO> getAllTrainings() {
        return trainingService.toDTOList(trainingRepository.findAll());
    }


    @PostMapping("/trainings")
    public Training createTraining(@RequestBody Training training) {
        return trainingRepository.save(training);
    }

    @PostMapping("/questionnaires")
    public QuestionnaireDTO createQuestionnaire(@RequestBody Questionnaire q) {
        // Charger l'entité Training complète si présente
        if (q.getTraining() != null && q.getTraining().getId() != null) {
            Training training = trainingRepository.findById(q.getTraining().getId()).orElse(null);
            q.setTraining(training);
        }
        if (q.getQuestions() != null) {
            q.getQuestions().forEach(question -> question.setQuestionnaire(q));
        }
        Questionnaire saved = questionnaireRepository.save(q);
        return questionnaireService.toDTO(saved);
    }
    @GetMapping("/questionnaires")
    public List<QuestionnaireDTO> getAllQuestionnaires() {
        return questionnaireService.toDTOList(questionnaireRepository.findAll());
    }

    @GetMapping("/stats/{questionnaireId}")
    public Map<String, Double> getStats(@PathVariable Long questionnaireId) {
        return statsService.getAverageScores(questionnaireId);
    }

    // --- CRUD Response ---
    @GetMapping("/responses")
    public List<ResponseDTO> getAllResponses() {
        return responseRepository.findAll().stream().map(this::toDTO).toList();
    }

    @GetMapping("/responses/{id}")
    public ResponseEntity<ResponseDTO> getResponse(@PathVariable Long id) {
        return responseRepository.findById(id)
            .map(r -> ResponseEntity.ok(toDTO(r)))
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/responses")
    public ResponseDTO createResponse(@RequestBody ResponseDTO dto) {
        Response r = toEntity(dto);
        r.setSubmittedAt(java.time.LocalDateTime.now());
        return toDTO(responseRepository.save(r));
    }

    @PutMapping("/responses/{id}")
    public ResponseEntity<ResponseDTO> updateResponse(@PathVariable Long id, @RequestBody ResponseDTO dto) {
        return responseRepository.findById(id).map(r -> {
            r.setValue(dto.getValue());
            // Optionally update question/user if needed
            return ResponseEntity.ok(toDTO(responseRepository.save(r)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/responses/{id}")
    public ResponseEntity<Void> deleteResponse(@PathVariable Long id) {
        if (!responseRepository.existsById(id)) return ResponseEntity.notFound().build();
        responseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Modifier et supprimer Training ---
    @PutMapping("/trainings/{id}")
    public ResponseEntity<Training> updateTraining(@PathVariable Long id, @RequestBody Training training) {
        return trainingRepository.findById(id).map(t -> {
            t.setTitle(training.getTitle());
            t.setTheme(training.getTheme());
            t.setLocation(training.getLocation());
            t.setStartDate(training.getStartDate());
            t.setEndDate(training.getEndDate());
            t.setTrainer(training.getTrainer());
            t.setParticipants(training.getParticipants());
            return ResponseEntity.ok(trainingRepository.save(t));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/trainings/{id}")
    public ResponseEntity<Void> deleteTraining(@PathVariable Long id) {
        if (!trainingRepository.existsById(id)) return ResponseEntity.notFound().build();
        trainingRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Modifier et supprimer Questionnaire ---
    @PutMapping("/questionnaires/{id}")
    public ResponseEntity<QuestionnaireDTO> updateQuestionnaire(@PathVariable Long id, @RequestBody Questionnaire questionnaire) {
        return questionnaireRepository.findById(id).map(q -> {
            q.setTitle(questionnaire.getTitle());
            q.setType(questionnaire.getType());
            q.setTraining(questionnaire.getTraining());
            q.setQuestions(questionnaire.getQuestions());
            Questionnaire saved = questionnaireRepository.save(q);
            return ResponseEntity.ok(questionnaireService.toDTO(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/questionnaires/{id}")
    public ResponseEntity<Void> deleteQuestionnaire(@PathVariable Long id) {
        if (!questionnaireRepository.existsById(id)) return ResponseEntity.notFound().build();
        questionnaireRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Mapping helpers ---
    private ResponseDTO toDTO(Response r) {
        ResponseDTO dto = new ResponseDTO();
        dto.setId(r.getId());
        dto.setQuestionId(r.getQuestion() != null ? r.getQuestion().getId() : null);
        dto.setUserId(r.getUser() != null ? r.getUser().getId() : null);
        dto.setValue(r.getValue());
        dto.setSubmittedAt(r.getSubmittedAt());
        return dto;
    }

    private Response toEntity(ResponseDTO dto) {
        Response r = new Response();
        r.setId(dto.getId());
        if (dto.getQuestionId() != null) {
            Question q = new Question();
            q.setId(dto.getQuestionId());
            r.setQuestion(q);
        }
        if (dto.getUserId() != null) {
            User u = new User();
            u.setId(dto.getUserId());
            r.setUser(u);
        }
        r.setValue(dto.getValue());
        r.setSubmittedAt(dto.getSubmittedAt());
        return r;
    }
}
