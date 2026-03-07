package com.marsamaroc.eval.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Response {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    private Question question;
    
    @ManyToOne
    private User user; // Can be null for complete anonymity if desired
    
    @ManyToOne
    private Training training;
    
    private String value; // Stores 1-5 for Likert or text for open
    private LocalDateTime submittedAt;
}
