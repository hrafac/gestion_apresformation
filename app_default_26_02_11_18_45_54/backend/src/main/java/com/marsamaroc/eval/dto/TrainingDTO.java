package com.marsamaroc.eval.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TrainingDTO {
    private Long id;
    private String title;
    private String theme;
    private String location;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private UserShortDTO trainer;
    private List<UserShortDTO> participants;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public LocalDateTime getStartDateTime() { return startDateTime; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }
    public LocalDateTime getEndDateTime() { return endDateTime; }
    public void setEndDateTime(LocalDateTime endDateTime) { this.endDateTime = endDateTime; }
    public UserShortDTO getTrainer() { return trainer; }
    public void setTrainer(UserShortDTO trainer) { this.trainer = trainer; }
    public List<UserShortDTO> getParticipants() { return participants; }
    public void setParticipants(List<UserShortDTO> participants) { this.participants = participants; }
}