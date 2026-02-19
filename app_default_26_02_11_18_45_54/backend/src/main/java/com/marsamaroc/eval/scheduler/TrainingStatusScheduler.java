package com.marsamaroc.eval.scheduler;

import com.marsamaroc.eval.services.TrainingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TrainingStatusScheduler {

    @Autowired
    private TrainingService trainingService;

    // Exécuter toutes les minutes pour vérifier et mettre à jour les statuts
    @Scheduled(cron = "0 * * * * ?")
    public void updateTrainingStatuses() {
        try {
            var result = trainingService.updateTrainingStatusesAutomatically();
            System.out.println("Scheduler - " + result.get("message"));
            System.out.println("Formations mises à jour EN_COURS: " + result.get("updatedToEnCours"));
            System.out.println("Formations mises à jour TERMINE: " + result.get("updatedToTermine"));
            System.out.println("Total mises à jour: " + result.get("totalUpdated"));
        } catch (Exception e) {
            System.err.println("Erreur lors de la mise à jour automatique des statuts: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Exécuter toutes les heures pour un rapport détaillé
    @Scheduled(cron = "0 0 * * * ?")
    public void hourlyReport() {
        try {
            var result = trainingService.updateTrainingStatusesAutomatically();
            System.out.println("=== RAPPORT HORAIRE DE MISE À JOUR DES FORMATIONS ===");
            System.out.println("Heure: " + result.get("timestamp"));
            System.out.println("Formations passées en cours: " + result.get("updatedToEnCours"));
            System.out.println("Formations terminées: " + result.get("updatedToTermine"));
            System.out.println("Total des mises à jour: " + result.get("totalUpdated"));
            System.out.println("================================================");
        } catch (Exception e) {
            System.err.println("Erreur lors du rapport horaire: " + e.getMessage());
        }
    }
}
