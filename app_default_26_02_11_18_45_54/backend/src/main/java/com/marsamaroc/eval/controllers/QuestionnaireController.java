package com.marsamaroc.eval.controllers;

import com.marsamaroc.eval.dto.QuestionnaireDTO;
import com.marsamaroc.eval.repositories.QuestionnaireRepository;
import com.marsamaroc.eval.entities.Questionnaire;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
public class QuestionnaireController {
    @Autowired
    private QuestionnaireRepository questionnaireRepository;

    // Endpoint pour afficher le questionnaire d'une formation
    @GetMapping("/questionnaire")
    public QuestionnaireDTO getQuestionnaireByTraining(@RequestParam Long trainingId) {
        Optional<Questionnaire> questionnaire = questionnaireRepository.findAll().stream()
            .filter(q -> q.getTraining() != null && q.getTraining().getId().equals(trainingId))
            .findFirst();
        if (questionnaire.isPresent()) {
            Questionnaire q = questionnaire.get();
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
        return null;
    }
}
