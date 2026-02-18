package com.marsamaroc.eval.services;

import com.marsamaroc.eval.dto.QuestionDTO;
import com.marsamaroc.eval.dto.QuestionnaireDTO;
import com.marsamaroc.eval.dto.TrainingDTO;
import com.marsamaroc.eval.entities.Question;
import com.marsamaroc.eval.entities.Questionnaire;
import com.marsamaroc.eval.entities.Training;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuestionnaireService {
    public QuestionnaireDTO toDTO(Questionnaire q) {
        QuestionnaireDTO dto = new QuestionnaireDTO();
        dto.setId(q.getId());
        dto.setTitle(q.getTitle());
        dto.setType(q.getType() != null ? q.getType().name() : null);
        if (q.getTraining() != null) {
            dto.setTraining(toTrainingDTO(q.getTraining()));
        }
        if (q.getQuestions() != null) {
            dto.setQuestions(q.getQuestions().stream().map(this::toQuestionDTO).collect(Collectors.toList()));
        }
        return dto;
    }

    public TrainingDTO toTrainingDTO(Training t) {
        TrainingDTO dto = new TrainingDTO();
        dto.setId(t.getId());
        dto.setTitle(t.getTitle());
        dto.setTheme(t.getTheme());
        dto.setLocation(t.getLocation());
        dto.setStartDateTime(t.getStartDate());
        dto.setEndDateTime(t.getEndDate());
        dto.setTrainer(t.getTrainer() != null ? new com.marsamaroc.eval.dto.UserShortDTO() {{
            setId(t.getTrainer().getId());
            setUsername(t.getTrainer().getUsername());
            setRole(t.getTrainer().getRole() != null ? t.getTrainer().getRole().name() : null);
        }} : null);
        return dto;
    }

    public QuestionDTO toQuestionDTO(Question q) {
        QuestionDTO dto = new QuestionDTO();
        dto.setId(q.getId());
        dto.setText(q.getText());
        dto.setType(q.getType() != null ? q.getType().name() : null);
        dto.setSortOrder(q.getSortOrder());
        return dto;
    }

    public List<QuestionnaireDTO> toDTOList(List<Questionnaire> list) {
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }
}
