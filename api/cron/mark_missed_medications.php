<?php
/**
 * Mark Missed Medications Cron Job
 * 
 * Automatically marks medication schedule entries as 'missed' if they
 * haven't been taken within 2 hours of the scheduled time.
 * Run every 15 minutes via cron:
 *   */15 * * * * php /path/to/api/cron/mark_missed_medications.php
 */

define('API_ACCESS', true);

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

$graceHours = 2;

$now = new DateTime('now', new DateTimeZone('UTC'));
echo "[" . $now->format('Y-m-d H:i:s') . "] Running mark-missed cron...\n";

try {
    $db = Database::getConnection();

    // Mark as missed: pending entries where scheduled_time + 2 hours < now
    $sql = "UPDATE medication_schedule ms
            JOIN medications m ON ms.medication_id = m.id
            SET ms.status = 'missed'
            WHERE ms.status = 'pending'
              AND m.is_active = TRUE
              AND CONCAT(ms.scheduled_date, ' ', ms.scheduled_time) < DATE_SUB(NOW(), INTERVAL ? HOUR)";

    $stmt = $db->prepare($sql);
    $stmt->execute([$graceHours]);
    $affected = $stmt->rowCount();

    echo "Marked {$affected} schedule entry(ies) as missed.\n";

} catch (Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    error_log('Mark-missed cron error: ' . $e->getMessage());
    exit(1);
}
