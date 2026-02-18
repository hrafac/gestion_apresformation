package com.marsamaroc.eval.controllers;

import com.marsamaroc.eval.dto.ResponseDTO;
import com.marsamaroc.eval.services.TrainingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/response")
public class ResponseController {
    @Autowired
    private TrainingService trainingService;

    // Endpoint pour recevoir les réponses du participant
    @PostMapping("/submit")
    public void submitResponses(@RequestBody List<ResponseDTO> responses) {
        trainingService.saveParticipantResponses(responses);
    }
}
