package com.marsamaroc.eval.services;

import com.marsamaroc.eval.dto.ParticipantWithTrainingsDTO;
import com.marsamaroc.eval.dto.ResponseDTO;
import com.marsamaroc.eval.entities.Role;
import com.marsamaroc.eval.entities.Training;
import com.marsamaroc.eval.entities.User;
import com.marsamaroc.eval.entities.Response;
import com.marsamaroc.eval.repositories.UserRepository;
import com.marsamaroc.eval.repositories.TrainingRepository;
import com.marsamaroc.eval.repositories.ResponseRepository;
import com.marsamaroc.eval.dto.TrainingParticipantCountDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParticipantService {

    private final UserRepository userRepository;
    private final TrainingRepository trainingRepository;
    private final ResponseRepository responseRepository;

    public List<ParticipantWithTrainingsDTO> getAllParticipantsWithTrainingsAndResponses() {
        List<User> participants = userRepository.findByRole(Role.PARTICIPANT);
        
        return participants.stream().map(participant -> {
            ParticipantWithTrainingsDTO dto = new ParticipantWithTrainingsDTO();
            dto.setId(participant.getId());
            dto.setUsername(participant.getUsername());
            dto.setEmail(participant.getEmail());
            dto.setFullName(participant.getFullName());
            dto.setRole(participant.getRole().name());
            
            List<Training> trainings = trainingRepository.findByParticipantId(participant.getId());
            List<ParticipantWithTrainingsDTO.TrainingWithResponsesDTO> trainingDTOs = trainings.stream().map(training -> {
                ParticipantWithTrainingsDTO.TrainingWithResponsesDTO trainingDTO = 
                    new ParticipantWithTrainingsDTO.TrainingWithResponsesDTO();
                trainingDTO.setId(training.getId());
                trainingDTO.setTitle(training.getTitle());
                trainingDTO.setTheme(training.getTheme());
                trainingDTO.setLocation(training.getLocation());
                trainingDTO.setStatus(training.getStatus().name());
                
                List<Response> responses = responseRepository.findByUserIdAndTrainingId(
                    participant.getId(), training.getId());
                List<ResponseDTO> responseDTOs = responses.stream().map(response -> {
                    ResponseDTO responseDTO = new ResponseDTO();
                    responseDTO.setId(response.getId());
                    responseDTO.setValue(response.getValue());
                    responseDTO.setSubmittedAt(response.getSubmittedAt());
                    responseDTO.setQuestionId(response.getQuestion().getId());
                    responseDTO.setIdTraining(response.getTraining().getId());
                    responseDTO.setUserId(response.getUser().getId());
                    return responseDTO;
                }).collect(Collectors.toList());
                
                trainingDTO.setResponses(responseDTOs);
                return trainingDTO;
            }).collect(Collectors.toList());
            
            dto.setTrainings(trainingDTOs);
            return dto;
        }).collect(Collectors.toList());
    }

    public List<TrainingParticipantCountDTO> getParticipantCountByTraining() {
        List<Object[]> results = trainingRepository.countParticipantsByTraining();
        
        return results.stream().map(result -> {
            TrainingParticipantCountDTO dto = new TrainingParticipantCountDTO();
            dto.setTrainingId((Long) result[0]);
            dto.setTrainingTitle((String) result[1]);
            dto.setTrainingTheme((String) result[2]);
            dto.setTrainingStatus(result[3] != null ? result[3].toString() : null);
            dto.setParticipantCount(((Number) result[4]).intValue());
            return dto;
        }).collect(Collectors.toList());
    }
}
