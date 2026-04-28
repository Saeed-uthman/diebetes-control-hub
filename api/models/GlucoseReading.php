<?php
/**
 * Glucose Reading Model
 * 
 * Handles glucose reading database operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class GlucoseReading {
    
    /**
     * Find reading by ID
     */
    public static function findById(int $id): ?array {
        $stmt = Database::query(
            "SELECT * FROM glucose_readings WHERE id = ?",
            [$id]
        );
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Get readings for a user with date range
     */
    public static function getByUserId(int $userId, ?string $startDate = null, ?string $endDate = null, int $limit = 100, int $offset = 0): array {
        $where = ['user_id = ?'];
        $params = [$userId];
        
        if ($startDate) {
            $where[] = 'reading_time >= ?';
            $params[] = $startDate . ' 00:00:00';
        }
        
        if ($endDate) {
            $where[] = 'reading_time <= ?';
            $params[] = $endDate . ' 23:59:59';
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = Database::query(
            "SELECT COUNT(*) as total FROM glucose_readings WHERE {$whereClause}",
            $params
        );
        $total = $countStmt->fetch()['total'];
        
        // Get readings
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = Database::query(
            "SELECT * FROM glucose_readings WHERE {$whereClause} 
             ORDER BY reading_time DESC LIMIT ? OFFSET ?",
            $params
        );
        
        return [
            'readings' => $stmt->fetchAll(),
            'total' => (int) $total,
        ];
    }
    
    /**
     * Create a new reading
     */
    public static function create(array $data): int {
        Database::query(
            "INSERT INTO glucose_readings (user_id, value, reading_type, reading_time, notes)
             VALUES (?, ?, ?, ?, ?)",
            [
                $data['user_id'],
                $data['value'],
                $data['reading_type'],
                $data['reading_time'] ?? date('Y-m-d H:i:s'),
                $data['notes'] ?? null,
            ]
        );
        
        return (int) Database::lastInsertId();
    }
    
    /**
     * Delete a reading
     */
    public static function delete(int $id): bool {
        Database::query("DELETE FROM glucose_readings WHERE id = ?", [$id]);
        return true;
    }
    
    /**
     * Get statistics for a user
     */
    public static function getStats(int $userId, int $days = 7): array {
        $stmt = Database::query(
            "SELECT 
                COUNT(*) as total_readings,
                AVG(value) as average,
                MIN(value) as min_value,
                MAX(value) as max_value,
                STDDEV(value) as std_deviation
             FROM glucose_readings 
             WHERE user_id = ? AND reading_time >= DATE_SUB(NOW(), INTERVAL ? DAY)",
            [$userId, $days]
        );
        
        $stats = $stmt->fetch();
        
        // Get readings by type
        $typeStmt = Database::query(
            "SELECT reading_type, COUNT(*) as count, AVG(value) as avg_value
             FROM glucose_readings 
             WHERE user_id = ? AND reading_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY reading_type",
            [$userId, $days]
        );
        
        $stats['by_type'] = $typeStmt->fetchAll();
        
        // Calculate time in range (70-180 mg/dL is typically considered target range)
        $rangeStmt = Database::query(
            "SELECT 
                SUM(CASE WHEN value < 70 THEN 1 ELSE 0 END) as low,
                SUM(CASE WHEN value BETWEEN 70 AND 180 THEN 1 ELSE 0 END) as in_range,
                SUM(CASE WHEN value > 180 THEN 1 ELSE 0 END) as high
             FROM glucose_readings 
             WHERE user_id = ? AND reading_time >= DATE_SUB(NOW(), INTERVAL ? DAY)",
            [$userId, $days]
        );
        
        $ranges = $rangeStmt->fetch();
        $total = $ranges['low'] + $ranges['in_range'] + $ranges['high'];
        
        $stats['ranges'] = [
            'low' => (int) $ranges['low'],
            'in_range' => (int) $ranges['in_range'],
            'high' => (int) $ranges['high'],
            'time_in_range_percent' => $total > 0 ? round(($ranges['in_range'] / $total) * 100, 1) : 0,
        ];
        
        return $stats;
    }
    
    /**
     * Get daily averages for charting
     */
    public static function getDailyAverages(int $userId, int $days = 30): array {
        $stmt = Database::query(
            "SELECT DATE(reading_time) as date, 
                    AVG(value) as average,
                    MIN(value) as min_value,
                    MAX(value) as max_value,
                    COUNT(*) as readings_count
             FROM glucose_readings 
             WHERE user_id = ? AND reading_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(reading_time)
             ORDER BY date ASC",
            [$userId, $days]
        );
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get today's readings
     */
    public static function getTodayReadings(int $userId): array {
        $stmt = Database::query(
            "SELECT * FROM glucose_readings 
             WHERE user_id = ? AND DATE(reading_time) = CURDATE()
             ORDER BY reading_time DESC",
            [$userId]
        );
        
        return $stmt->fetchAll();
    }
    
    /**
     * Check if reading belongs to user
     */
    public static function belongsToUser(int $readingId, int $userId): bool {
        $stmt = Database::query(
            "SELECT id FROM glucose_readings WHERE id = ? AND user_id = ?",
            [$readingId, $userId]
        );
        return (bool) $stmt->fetch();
    }
}
