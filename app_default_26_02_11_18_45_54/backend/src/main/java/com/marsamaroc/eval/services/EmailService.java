package com.marsamaroc.eval.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendQuestionnaireLink(String toEmail, String participantName, String trainingTitle, Long userId, Long formationId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Questionnaire d'évaluation - Formation : " + trainingTitle);
        
        // Générer le lien vers le frontend avec l'ID utilisateur et l'ID de formation
        String questionnaireLink = "http://localhost:3000/questionnaire?userId=" + userId + "&formationId=" + formationId;
        
        String emailBody = String.format(
            "Bonjour %s,\n\n" +
            "Nous espérons que vous avez apprécié la formation \"%s\".\n\n" +
            "Afin d'améliorer nos futures formations, nous vous invitons à répondre à notre questionnaire d'évaluation en cliquant sur le lien ci-dessous :\n\n" +
            "%s\n\n" +
            "Votre avis est très important pour nous et ne prendra que quelques minutes.\n\n" +
            "Cordialement,\n" +
            "L'équipe de formation",
            participantName, trainingTitle, questionnaireLink
        );
        
        message.setText(emailBody);
        
        try {
            mailSender.send(message);
            System.out.println("Email envoyé avec succès à " + toEmail + " avec le lien: " + questionnaireLink);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'email à " + toEmail + ": " + e.getMessage());
            throw new RuntimeException("Impossible d'envoyer l'email à " + toEmail, e);
        }
    }

    public void sendSimpleEmail(String toEmail, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        
        try {
            mailSender.send(message);
            System.out.println("Email simple envoyé avec succès à " + toEmail);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'email simple à " + toEmail + ": " + e.getMessage());
            throw new RuntimeException("Impossible d'envoyer l'email à " + toEmail, e);
        }
    }
}
