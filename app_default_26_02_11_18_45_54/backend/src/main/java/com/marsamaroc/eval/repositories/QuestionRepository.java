package com.marsamaroc.eval.repositories;

import com.marsamaroc.eval.entities.Question;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
}
