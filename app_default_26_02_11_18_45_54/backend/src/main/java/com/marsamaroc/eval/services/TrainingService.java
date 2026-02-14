package com.marsamaroc.eval.services;

import com.marsamaroc.eval.dto.TrainingDTO;
import com.marsamaroc.eval.dto.UserShortDTO;
import com.marsamaroc.eval.entities.Training;
import com.marsamaroc.eval.entities.User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TrainingService {
    public TrainingDTO toDTO(Training t) {
        TrainingDTO dto = new TrainingDTO();
        dto.setId(t.getId());
        dto.setTitle(t.getTitle());
        dto.setTheme(t.getTheme());
        dto.setLocation(t.getLocation());
        dto.setStartDate(t.getStartDate() != null ? t.getStartDate().toString() : null);
        dto.setEndDate(t.getEndDate() != null ? t.getEndDate().toString() : null);
        dto.setTrainer(t.getTrainer() != null ? toUserShortDTO(t.getTrainer()) : null);
        dto.setParticipants(t.getParticipants() != null ? toUserShortDTOList(t.getParticipants()) : null);
        return dto;
    }

    public UserShortDTO toUserShortDTO(User user) {
        UserShortDTO dto = new UserShortDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        return dto;
    }

    public List<UserShortDTO> toUserShortDTOList(Set<User> users) {
        return users.stream().map(this::toUserShortDTO).collect(Collectors.toList());
    }

    public List<TrainingDTO> toDTOList(List<Training> trainings) {
        return trainings.stream().map(this::toDTO).collect(Collectors.toList());
    }
}
