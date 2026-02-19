package com.marsamaroc.eval.repositories;

import com.marsamaroc.eval.entities.Training;
import com.marsamaroc.eval.entities.TrainingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TrainingRepository extends JpaRepository<Training, Long> {
    
    @Query("SELECT t FROM Training t WHERE t.status = :status")
    List<Training> findByStatus(@Param("status") TrainingStatus status);
    
    @Query("SELECT t FROM Training t WHERE t.startDate <= :now AND t.endDate > :now AND t.status != 'TERMINE'")
    List<Training> findOngoingTrainings(@Param("now") LocalDateTime now);
    
    @Query("SELECT t FROM Training t WHERE t.endDate <= :now AND t.status != 'TERMINE'")
    List<Training> findCompletedTrainingsNotUpdated(@Param("now") LocalDateTime now);
}
