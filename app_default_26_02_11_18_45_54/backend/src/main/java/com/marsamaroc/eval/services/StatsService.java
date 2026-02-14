package com.marsamaroc.eval.services;

import com.marsamaroc.eval.entities.Response;
import com.marsamaroc.eval.repositories.ResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {
    private final ResponseRepository responseRepository;

    public Map<String, Double> getAverageScores(Long questionnaireId) {
        List<Response> responses = responseRepository.findByQuestionQuestionnaireId(questionnaireId);
        
        return responses.stream()
            .filter(r -> r.getQuestion().getType().name().equals("LIKERT"))
            .collect(Collectors.groupingBy(
                r -> r.getQuestion().getText(),
                Collectors.averagingInt(r -> Integer.parseInt(r.getValue()))
            ));
    }
}
