package com.marsamaroc.eval.controllers;

import com.marsamaroc.eval.entities.*;
import com.marsamaroc.eval.repositories.*;
import com.marsamaroc.eval.services.StatsService;
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

    @GetMapping("/trainings")
    public List<Training> getAllTrainings() {
        return trainingRepository.findAll();
    }

    @PostMapping("/trainings")
    public Training createTraining(@RequestBody Training training) {
        return trainingRepository.save(training);
    }

    @PostMapping("/questionnaires")
    public Questionnaire createQuestionnaire(@RequestBody Questionnaire q) {
        q.getQuestions().forEach(question -> question.setQuestionnaire(q));
        return questionnaireRepository.save(q);
    }

    @GetMapping("/stats/{questionnaireId}")
    public Map<String, Double> getStats(@PathVariable Long questionnaireId) {
        return statsService.getAverageScores(questionnaireId);
    }
}
