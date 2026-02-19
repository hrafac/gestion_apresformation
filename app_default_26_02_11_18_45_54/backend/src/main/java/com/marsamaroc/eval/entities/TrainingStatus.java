package com.marsamaroc.eval.entities;

public enum TrainingStatus {
    EN_COURS("encours"),
    TERMINE("termine"),
    PAS_ENCORE("pas encore");

    private final String displayName;

    TrainingStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
