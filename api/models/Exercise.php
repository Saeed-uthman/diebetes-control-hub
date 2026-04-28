<?php
/**
 * Exercise Model
 * 
 * Handles exercise and activity database operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class Exercise {
    
    /**
     * Find exercise by ID
     */
    public static function findById(int $id): ?array {
        $stmt = Database::query(
            "SELECT * FROM exercises WHERE id = ? AND is_active = TRUE",
            [$id]
        );
        $exercise = $stmt->fetch();
        
        if ($exercise) {
            $exercise['equipment'] = json_decode($exercise['equipment'], true);
            $exercise['instructions'] = json_decode($exercise['instructions'], true);
            $exercise['benefits'] = json_decode($exercise['benefits'], true);
        }
        
        return $exercise ?: null;
    }
    
    /**
     * Get all exercises with filters
     */
    public static function getAll(array $filters = [], int $limit = 20, int $offset = 0): array {
        $where = ['is_active = TRUE'];
        $params = [];
        
        if (!empty($filters['category'])) {
            $where[] = 'category = ?';
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['difficulty'])) {
            $where[] = 'difficulty = ?';
            $params[] = $filters['difficulty'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = '(name LIKE ? OR description LIKE ?)';
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        if (!empty($filters['max_duration'])) {
            $where[] = 'duration <= ?';
            $params[] = $filters['max_duration'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = Database::query(
            "SELECT COUNT(*) as total FROM exercises WHERE {$whereClause}",
            $params
        );
        $total = $countStmt->fetch()['total'];
        
        // Get exercises
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = Database::query(
            "SELECT id, name, description, duration, calories_burned, category, 
                    difficulty, equipment, image
             FROM exercises WHERE {$whereClause} 
             ORDER BY name ASC LIMIT ? OFFSET ?",
            $params
        );
        
        $exercises = $stmt->fetchAll();
        
        foreach ($exercises as &$exercise) {
            $exercise['equipment'] = json_decode($exercise['equipment'], true);
        }
        
        return [
            'exercises' => $exercises,
            'total' => (int) $total,
        ];
    }
    
    /**
     * Get categories with counts
     */
    public static function getCategories(): array {
        $stmt = Database::query(
            "SELECT category, COUNT(*) as count 
             FROM exercises WHERE is_active = TRUE 
             GROUP BY category ORDER BY category"
        );
        return $stmt->fetchAll();
    }
}

class ActivityLog {
    
    /**
     * Find activity by ID
     */
    public static function findById(int $id): ?array {
        $stmt = Database::query(
            "SELECT al.*, e.name as exercise_name 
             FROM activity_logs al 
             LEFT JOIN exercises e ON al.exercise_id = e.id 
             WHERE al.id = ?",
            [$id]
        );
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Get activities for a user
     */
    public static function getByUserId(int $userId, ?string $startDate = null, ?string $endDate = null, int $limit = 50, int $offset = 0): array {
        $where = ['al.user_id = ?'];
        $params = [$userId];
        
        if ($startDate) {
            $where[] = 'al.activity_date >= ?';
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $where[] = 'al.activity_date <= ?';
            $params[] = $endDate;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = Database::query(
            "SELECT COUNT(*) as total FROM activity_logs al WHERE {$whereClause}",
            $params
        );
        $total = $countStmt->fetch()['total'];
        
        // Get activities
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = Database::query(
            "SELECT al.*, e.name as exercise_name, e.category as exercise_category
             FROM activity_logs al 
             LEFT JOIN exercises e ON al.exercise_id = e.id 
             WHERE {$whereClause} 
             ORDER BY al.activity_date DESC, al.start_time DESC 
             LIMIT ? OFFSET ?",
            $params
        );
        
        return [
            'activities' => $stmt->fetchAll(),
            'total' => (int) $total,
        ];
    }
    
    /**
     * Log a new activity
     */
    public static function create(array $data): int {
        Database::query(
            "INSERT INTO activity_logs (user_id, exercise_id, activity_type, activity_name, 
                                        value, calories_burned, activity_date, start_time, 
                                        end_time, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $data['user_id'],
                $data['exercise_id'] ?? null,
                $data['activity_type'],
                $data['activity_name'] ?? null,
                $data['value'],
                $data['calories_burned'] ?? null,
                $data['activity_date'],
                $data['start_time'] ?? null,
                $data['end_time'] ?? null,
                $data['notes'] ?? null,
            ]
        );
        
        return (int) Database::lastInsertId();
    }
    
    /**
     * Delete activity
     */
    public static function delete(int $id): bool {
        Database::query("DELETE FROM activity_logs WHERE id = ?", [$id]);
        return true;
    }
    
    /**
     * Get weekly summary
     */
    public static function getWeeklySummary(int $userId): array {
        $stmt = Database::query(
            "SELECT 
                activity_date,
                SUM(CASE WHEN activity_type = 'exercise' THEN value ELSE 0 END) as exercise_minutes,
                SUM(CASE WHEN activity_type = 'steps' THEN value ELSE 0 END) as steps,
                SUM(COALESCE(calories_burned, 0)) as total_calories,
                COUNT(CASE WHEN activity_type = 'exercise' THEN 1 END) as workout_count
             FROM activity_logs 
             WHERE user_id = ? AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY activity_date
             ORDER BY activity_date ASC",
            [$userId]
        );
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get activity statistics
     */
    public static function getStats(int $userId, int $days = 7): array {
        $stmt = Database::query(
            "SELECT 
                COUNT(DISTINCT activity_date) as active_days,
                SUM(CASE WHEN activity_type = 'exercise' THEN value ELSE 0 END) as total_exercise_minutes,
                SUM(CASE WHEN activity_type = 'steps' THEN value ELSE 0 END) as total_steps,
                AVG(CASE WHEN activity_type = 'steps' THEN value END) as avg_daily_steps,
                SUM(COALESCE(calories_burned, 0)) as total_calories_burned,
                COUNT(CASE WHEN activity_type = 'exercise' THEN 1 END) as total_workouts
             FROM activity_logs 
             WHERE user_id = ? AND activity_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)",
            [$userId, $days]
        );
        
        return $stmt->fetch();
    }
    
    /**
     * Check if activity belongs to user
     */
    public static function belongsToUser(int $activityId, int $userId): bool {
        $stmt = Database::query(
            "SELECT id FROM activity_logs WHERE id = ? AND user_id = ?",
            [$activityId, $userId]
        );
        return (bool) $stmt->fetch();
    }
}
