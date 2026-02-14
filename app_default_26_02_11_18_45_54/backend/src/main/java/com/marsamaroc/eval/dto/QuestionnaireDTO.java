package com.marsamaroc.eval.dto;

import java.util.List;

public class QuestionnaireDTO {
    private Long id;
    private String title;
    private String type;
    private TrainingDTO training;
    private List<QuestionDTO> questions;

    // Getters et setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public TrainingDTO getTraining() { return training; }
    public void setTraining(TrainingDTO training) { this.training = training; }
    public List<QuestionDTO> getQuestions() { return questions; }
    public void setQuestions(List<QuestionDTO> questions) { this.questions = questions; }
}
