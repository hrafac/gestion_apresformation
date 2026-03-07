package com.marsamaroc.eval.dto;

import java.time.LocalDateTime;

public class ResponseDTO {
    private Long id;
    private Long questionId;
    private Long userId;
    private Long idTraining;
    private String value;
    private LocalDateTime submittedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getIdTraining() { return idTraining; }
    public void setIdTraining(Long idTraining) { this.idTraining = idTraining; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}
