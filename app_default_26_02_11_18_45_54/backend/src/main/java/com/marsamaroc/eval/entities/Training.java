package com.marsamaroc.eval.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
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
    private LocalDate startDate;
    private LocalDate endDate;

    @ManyToOne
    private User trainer;

    @ManyToMany
    @JoinTable(
        name = "training_participants",
        joinColumns = @JoinColumn(name = "training_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> participants;
}
