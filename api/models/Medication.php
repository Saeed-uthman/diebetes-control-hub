<?php
/**
 * Medication Model
 * 
 * Handles medication and schedule database operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class Medication {
    
    /**
     * Find medication by ID
     */
    public static function findById(int $id): ?array {
        $stmt = Database::query(
            "SELECT * FROM medications WHERE id = ?",
            [$id]
        );
        $medication = $stmt->fetch();
        
        if ($medication) {
            $medication['times'] = json_decode($medication['times'], true);
        }
        
        return $medication ?: null;
    }
    
    /**
     * Get all medications for a user
     */
    public static function getByUserId(int $userId, bool $activeOnly = true): array {
        $sql = "SELECT * FROM medications WHERE user_id = ?";
        $params = [$userId];
        
        if ($activeOnly) {
            $sql .= " AND is_active = TRUE";
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = Database::query($sql, $params);
        $medications = $stmt->fetchAll();
        
        foreach ($medications as &$med) {
            $med['times'] = json_decode($med['times'], true);
        }
        
        return $medications;
    }
    
    /**
     * Create a new medication
     */
    public static function create(array $data): int {
        Database::query(
            "INSERT INTO medications (user_id, name, dosage, frequency, times, instructions, color, start_date, end_date, refill_date, prescribed_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $data['user_id'],
                $data['name'],
                $data['dosage'],
                $data['frequency'],
                json_encode($data['times']),
                $data['instructions'] ?? null,
                $data['color'] ?? 'blue',
                $data['start_date'],
                $data['end_date'] ?? null,
                $data['refill_date'] ?? null,
                $data['prescribed_by'] ?? null,
            ]
        );
        
        $medicationId = (int) Database::lastInsertId();
        
        // Generate initial schedule entries for today
        self::generateSchedule($medicationId, date('Y-m-d'));
        
        return $medicationId;
    }
    
    /**
     * Update medication
     */
    public static function update(int $id, array $data): bool {
        $fields = [];
        $values = [];
        
        $allowedFields = ['name', 'dosage', 'frequency', 'times', 'instructions', 'color', 'start_date', 'end_date', 'refill_date', 'prescribed_by', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = ?";
                $values[] = $field === 'times' ? json_encode($data[$field]) : $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = "UPDATE medications SET " . implode(', ', $fields) . " WHERE id = ?";
        
        Database::query($sql, $values);
        return true;
    }
    
    /**
     * Delete (deactivate) medication
     */
    public static function delete(int $id): bool {
        Database::query("UPDATE medications SET is_active = FALSE WHERE id = ?", [$id]);
        return true;
    }
    
    /**
     * Generate schedule entries for a specific date
     */
    public static function generateSchedule(int $medicationId, string $date): void {
        $medication = self::findById($medicationId);
        
        if (!$medication || !$medication['is_active']) {
            return;
        }
        
        $times = $medication['times'];
        
        foreach ($times as $time) {
            // Check if entry already exists
            $stmt = Database::query(
                "SELECT id FROM medication_schedule 
                 WHERE medication_id = ? AND scheduled_date = ? AND scheduled_time = ?",
                [$medicationId, $date, $time]
            );
            
            if (!$stmt->fetch()) {
                Database::query(
                    "INSERT INTO medication_schedule (medication_id, scheduled_time, scheduled_date, status)
                     VALUES (?, ?, ?, 'pending')",
                    [$medicationId, $time, $date]
                );
            }
        }
    }
    
    /**
     * Get today's schedule for a user
     */
    public static function getTodaySchedule(int $userId): array {
        $today = date('Y-m-d');
        
        // First, generate any missing schedule entries for today
        $medications = self::getByUserId($userId);
        foreach ($medications as $med) {
            self::generateSchedule($med['id'], $today);
        }
        
        // Then fetch the schedule
        $stmt = Database::query(
            "SELECT ms.*, m.name, m.dosage, m.color, m.instructions
             FROM medication_schedule ms
             JOIN medications m ON ms.medication_id = m.id
             WHERE m.user_id = ? AND ms.scheduled_date = ? AND m.is_active = TRUE
             ORDER BY ms.scheduled_time ASC",
            [$userId, $today]
        );
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get schedule for a date range
     */
    public static function getScheduleRange(int $userId, string $startDate, string $endDate): array {
        $stmt = Database::query(
            "SELECT ms.*, m.name, m.dosage, m.color
             FROM medication_schedule ms
             JOIN medications m ON ms.medication_id = m.id
             WHERE m.user_id = ? AND ms.scheduled_date BETWEEN ? AND ? AND m.is_active = TRUE
             ORDER BY ms.scheduled_date ASC, ms.scheduled_time ASC",
            [$userId, $startDate, $endDate]
        );
        
        return $stmt->fetchAll();
    }
    
    /**
     * Update schedule entry status
     */
    public static function updateScheduleStatus(int $scheduleId, string $status, ?string $notes = null): bool {
        $takenAt = $status === 'taken' ? date('Y-m-d H:i:s') : null;
        
        Database::query(
            "UPDATE medication_schedule SET status = ?, taken_at = ?, notes = ? WHERE id = ?",
            [$status, $takenAt, $notes, $scheduleId]
        );
        
        return true;
    }
    
    /**
     * Get schedule entry by ID
     */
    public static function getScheduleById(int $id): ?array {
        $stmt = Database::query(
            "SELECT ms.*, m.user_id, m.name, m.dosage
             FROM medication_schedule ms
             JOIN medications m ON ms.medication_id = m.id
             WHERE ms.id = ?",
            [$id]
        );
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Get adherence statistics
     */
    public static function getAdherenceStats(int $userId, int $days = 7): array {
        $stmt = Database::query(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN ms.status = 'taken' THEN 1 ELSE 0 END) as taken,
                SUM(CASE WHEN ms.status = 'missed' THEN 1 ELSE 0 END) as missed,
                SUM(CASE WHEN ms.status = 'skipped' THEN 1 ELSE 0 END) as skipped,
                SUM(CASE WHEN ms.status = 'pending' THEN 1 ELSE 0 END) as pending
             FROM medication_schedule ms
             JOIN medications m ON ms.medication_id = m.id
             WHERE m.user_id = ? AND ms.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)",
            [$userId, $days]
        );
        
        $stats = $stmt->fetch();
        $stats['adherence_rate'] = $stats['total'] > 0 
            ? round(($stats['taken'] / ($stats['total'] - $stats['pending'])) * 100, 1) 
            : 0;
        
        return $stats;
    }
    
    /**
     * Check if medication belongs to user
     */
    public static function belongsToUser(int $medicationId, int $userId): bool {
        $stmt = Database::query(
            "SELECT id FROM medications WHERE id = ? AND user_id = ?",
            [$medicationId, $userId]
        );
        return (bool) $stmt->fetch();
    }
}
