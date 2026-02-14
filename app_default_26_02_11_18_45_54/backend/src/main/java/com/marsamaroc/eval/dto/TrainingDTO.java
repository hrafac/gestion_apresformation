package com.marsamaroc.eval.dto;

import java.util.List;

public class TrainingDTO {
    private Long id;
    private String title;
    private String theme;
    private String location;
    private String startDate;
    private String endDate;
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
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public UserShortDTO getTrainer() { return trainer; }
    public void setTrainer(UserShortDTO trainer) { this.trainer = trainer; }
    public List<UserShortDTO> getParticipants() { return participants; }
    public void setParticipants(List<UserShortDTO> participants) { this.participants = participants; }
}