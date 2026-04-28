<?php
/**
 * Medication Reminder Cron Job
 * 
 * Sends email reminders for medications scheduled within the next 15 minutes.
 * Run this script every 5 minutes via cron:
 *   * /5 * * * * php /path/to/api/cron/medication_reminders.php
 */

define('API_ACCESS', true);

// Load dependencies
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Mailer.php';

// Reminder window: look ahead 15 minutes
$windowMinutes = 15;

$now = new DateTime('now', new DateTimeZone('UTC'));
$today = $now->format('Y-m-d');
$currentTime = $now->format('H:i:s');
$windowEnd = (clone $now)->modify("+{$windowMinutes} minutes")->format('H:i:s');

echo "[" . $now->format('Y-m-d H:i:s') . "] Running medication reminder cron...\n";

try {
    $db = Database::getConnection();

    // Find pending schedule entries within the reminder window that haven't been reminded yet
    $sql = "SELECT ms.id AS schedule_id, ms.scheduled_time, ms.scheduled_date,
                   m.name AS medication_name, m.dosage, m.id AS medication_id,
                   u.id AS user_id, u.name AS user_name, u.email AS user_email
            FROM medication_schedule ms
            JOIN medications m ON ms.medication_id = m.id
            JOIN users u ON m.user_id = u.id
            LEFT JOIN medication_reminder_log rl 
                ON rl.schedule_id = ms.id
            WHERE ms.scheduled_date = ?
              AND ms.scheduled_time BETWEEN ? AND ?
              AND ms.status = 'pending'
              AND m.is_active = TRUE
              AND u.is_active = TRUE
              AND rl.id IS NULL
            ORDER BY ms.scheduled_time ASC";

    $stmt = $db->prepare($sql);
    $stmt->execute([$today, $currentTime, $windowEnd]);
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($entries)) {
        echo "No upcoming medication reminders to send.\n";
        exit(0);
    }

    echo "Found " . count($entries) . " reminder(s) to send.\n";

    // Check user notification preferences in bulk
    $userPrefs = [];

    $sentCount = 0;
    $failCount = 0;

    foreach ($entries as $entry) {
        $userId = $entry['user_id'];

        // Cache user preferences
        if (!isset($userPrefs[$userId])) {
            $prefStmt = $db->prepare(
                "SELECT notifications_medication, notifications_email 
                 FROM user_settings WHERE user_id = ?"
            );
            $prefStmt->execute([$userId]);
            $userPrefs[$userId] = $prefStmt->fetch(PDO::FETCH_ASSOC) ?: [
                'notifications_medication' => 1,
                'notifications_email' => 1
            ];
        }

        $prefs = $userPrefs[$userId];

        // Skip if user has disabled medication or email notifications
        if (!$prefs['notifications_medication'] || !$prefs['notifications_email']) {
            echo "  Skipping {$entry['medication_name']} for {$entry['user_email']} (notifications disabled)\n";
            continue;
        }

        // Send the reminder email
        $timeFormatted = date('g:i A', strtotime($entry['scheduled_time']));
        
        try {
            $sent = Mailer::sendMedicationReminder(
                $entry['user_email'],
                $entry['user_name'],
                $entry['medication_name'],
                $entry['dosage'],
                $timeFormatted
            );

            if ($sent) {
                // Log that we sent this reminder
                $logStmt = $db->prepare(
                    "INSERT INTO medication_reminder_log (schedule_id, user_id, sent_at) VALUES (?, ?, NOW())"
                );
                $logStmt->execute([$entry['schedule_id'], $userId]);

                echo "  ✓ Sent reminder: {$entry['medication_name']} ({$entry['dosage']}) to {$entry['user_email']} at {$timeFormatted}\n";
                $sentCount++;
            } else {
                echo "  ✗ Failed to send to {$entry['user_email']}\n";
                $failCount++;
            }
        } catch (Exception $e) {
            echo "  ✗ Error sending to {$entry['user_email']}: " . $e->getMessage() . "\n";
            $failCount++;
        }
    }

    echo "\nCompleted: {$sentCount} sent, {$failCount} failed.\n";

} catch (Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    error_log('Medication reminder cron error: ' . $e->getMessage());
    exit(1);
}
