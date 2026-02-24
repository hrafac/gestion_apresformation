package com.marsamaroc.eval.repositories;

import com.marsamaroc.eval.entities.Questionnaire;
import com.marsamaroc.eval.entities.EvaluationType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionnaireRepository extends JpaRepository<Questionnaire, Long> {
    List<Questionnaire> findByType(EvaluationType type);
}
