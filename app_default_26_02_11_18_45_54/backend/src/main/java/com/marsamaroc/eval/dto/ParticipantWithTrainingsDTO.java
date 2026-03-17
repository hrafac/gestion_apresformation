package com.marsamaroc.eval.dto;

import com.marsamaroc.eval.entities.Training;
import com.marsamaroc.eval.entities.Response;
import lombok.Data;
import java.util.List;

@Data
public class ParticipantWithTrainingsDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private List<TrainingWithResponsesDTO> trainings;
    
    @Data
    public static class TrainingWithResponsesDTO {
        private Long id;
        private String title;
        private String theme;
        private String location;
        private String status;
        private List<ResponseDTO> responses;
    }
}
