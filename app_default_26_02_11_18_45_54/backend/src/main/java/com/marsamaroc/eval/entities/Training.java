package com.marsamaroc.eval.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Data
public class Training {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String theme;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    @ManyToOne(fetch = FetchType.EAGER)
    private User trainer;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "training_participants",
        joinColumns = @JoinColumn(name = "training_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> participants;

    public boolean isCompleted() {
        return endDate != null && endDate.isBefore(LocalDateTime.now());
    }
}
