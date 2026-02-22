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

    @ManyToMany(fetch = FetchType.EAGER, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "training_participants",
        joinColumns = @JoinColumn(name = "training_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_training_participants_user"))
    )
    private Set<User> participants;

    @Enumerated(EnumType.STRING)
    private TrainingStatus status = TrainingStatus.PAS_ENCORE;

    public boolean isCompleted() {
        return endDate != null && endDate.isBefore(LocalDateTime.now());
    }
}
