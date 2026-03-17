package com.marsamaroc.eval.repositories;

import com.marsamaroc.eval.entities.Response;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResponseRepository extends JpaRepository<Response, Long> {
    List<Response> findByQuestionQuestionnaireId(Long questionnaireId);
    List<Response> findByQuestionId(Long questionId);
    List<Response> findByUserId(Long userId);
    List<Response> findByUserIdAndTrainingId(Long userId, Long trainingId);
}
