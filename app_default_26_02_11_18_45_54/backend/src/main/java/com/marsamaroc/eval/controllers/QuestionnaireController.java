package com.marsamaroc.eval.controllers;

import com.marsamaroc.eval.dto.QuestionnaireDTO;
import com.marsamaroc.eval.repositories.QuestionnaireRepository;
import com.marsamaroc.eval.entities.Questionnaire;
import com.marsamaroc.eval.entities.EvaluationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;

@RestController
public class QuestionnaireController {
    @Autowired
    private QuestionnaireRepository questionnaireRepository;

    // Endpoint pour afficher le questionnaire d'une formation
    @GetMapping("/questionnaire")
    public Object getQuestionnaire(@RequestParam(required = false) Long trainingId) {
        if (trainingId != null) {
            // Recherche par trainingId (pour questionnaires CHAUD) - retourne un seul questionnaire
            Optional<Questionnaire> questionnaire = questionnaireRepository.findAll().stream()
                .filter(q -> q.getTraining() != null && q.getTraining().getId().equals(trainingId))
                .findFirst();
            
            if (questionnaire.isPresent()) {
                return convertToDTO(questionnaire.get());
            }
            return null;
        } else {
            // Recherche des questionnaires FROID (sans trainingId) - retourne tous les questionnaires FROID
            List<Questionnaire> questionnaires = questionnaireRepository.findAll().stream()
                .filter(q -> q.getType() == EvaluationType.FROID)
                .collect(java.util.stream.Collectors.toList());
            
            return questionnaires.stream()
                .map(this::convertToDTO)
                .collect(java.util.stream.Collectors.toList());
        }
    }
    
    // Endpoint public pour les questionnaires FROID
    @GetMapping("/public/questionnaireFroid")
    public List<QuestionnaireDTO> getQuestionnairesFroid() {
        List<Questionnaire> questionnaires = questionnaireRepository.findAll().stream()
            .filter(q -> q.getType() == EvaluationType.FROID)
            .collect(java.util.stream.Collectors.toList());
        
        return questionnaires.stream()
            .map(this::convertToDTO)
            .collect(java.util.stream.Collectors.toList());
    }
    
    // Endpoint public pour les questionnaires CHAUD
    @GetMapping("/public/questionnaireChaud")
    public List<QuestionnaireDTO> getQuestionnairesChaud() {
        List<Questionnaire> questionnaires = questionnaireRepository.findAll().stream()
            .filter(q -> q.getType() == EvaluationType.CHAUD)
            .collect(java.util.stream.Collectors.toList());
        
        return questionnaires.stream()
            .map(this::convertToDTO)
            .collect(java.util.stream.Collectors.toList());
    }
    
    private QuestionnaireDTO convertToDTO(Questionnaire q) {
        QuestionnaireDTO dto = new QuestionnaireDTO();
        dto.setId(q.getId());
        dto.setTitle(q.getTitle());
        dto.setType(q.getType() != null ? q.getType().name() : null);
        // Conversion List<Question> -> List<QuestionDTO>
        java.util.List<com.marsamaroc.eval.dto.QuestionDTO> questionDTOs = new java.util.ArrayList<>();
        if (q.getQuestions() != null) {
            for (com.marsamaroc.eval.entities.Question question : q.getQuestions()) {
                com.marsamaroc.eval.dto.QuestionDTO qdto = new com.marsamaroc.eval.dto.QuestionDTO();
                qdto.setId(question.getId());
                qdto.setText(question.getText());
                qdto.setType(question.getType() != null ? question.getType().name() : null);
                qdto.setSortOrder(question.getSortOrder());
                questionDTOs.add(qdto);
            }
        }
        dto.setQuestions(questionDTOs);
        return dto;
    }
}
