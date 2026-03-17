package com.marsamaroc.eval.controllers;

import com.marsamaroc.eval.dto.ParticipantWithTrainingsDTO;
import com.marsamaroc.eval.services.ParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.marsamaroc.eval.dto.TrainingParticipantCountDTO;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/participants")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ParticipantController {

    private final ParticipantService participantService;

    @GetMapping("/with-trainings-and-responses")
    public ResponseEntity<List<ParticipantWithTrainingsDTO>> getAllParticipantsWithTrainingsAndResponses() {
        List<ParticipantWithTrainingsDTO> participants = participantService.getAllParticipantsWithTrainingsAndResponses();
        return ResponseEntity.ok(participants);
    }

    @GetMapping("/count-by-training")
    public ResponseEntity<List<TrainingParticipantCountDTO>> getParticipantCountByTraining() {
        List<TrainingParticipantCountDTO> counts = participantService.getParticipantCountByTraining();
        return ResponseEntity.ok(counts);
    }
}
