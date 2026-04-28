-- Migration: Medication Reminder Log
-- Tracks which schedule entries have already received email reminders
-- to prevent duplicate sends.

USE diabetes_app;

CREATE TABLE IF NOT EXISTS medication_reminder_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_user_id (user_id),
    UNIQUE KEY unique_reminder (schedule_id),
    
    FOREIGN KEY (schedule_id) REFERENCES medication_schedule(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
