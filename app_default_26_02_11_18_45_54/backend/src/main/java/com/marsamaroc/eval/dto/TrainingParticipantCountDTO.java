package com.marsamaroc.eval.dto;

import lombok.Data;

@Data
public class TrainingParticipantCountDTO {
    private Long trainingId;
    private String trainingTitle;
    private String trainingTheme;
    private String trainingStatus;
    private Integer participantCount;
}
