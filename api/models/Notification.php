<?php
/**
 * Notification Model
 * 
 * Handles notification database operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class Notification {
    
    /**
     * Find notification by ID
     */
    public static function findById(int $id): ?array {
        $stmt = Database::query("SELECT * FROM notifications WHERE id = ?", [$id]);
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Get notifications for a user
     */
    public static function getByUserId(int $userId, bool $unreadOnly = false, int $limit = 50, int $offset = 0): array {
        $where = ['user_id = ?'];
        $params = [$userId];
        
        if ($unreadOnly) {
            $where[] = 'is_read = FALSE';
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = Database::query(
            "SELECT COUNT(*) as total FROM notifications WHERE {$whereClause}",
            $params
        );
        $total = $countStmt->fetch()['total'];
        
        // Get unread count
        $unreadStmt = Database::query(
            "SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = FALSE",
            [$userId]
        );
        $unread = $unreadStmt->fetch()['unread'];
        
        // Get notifications
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = Database::query(
            "SELECT * FROM notifications WHERE {$whereClause} 
             ORDER BY created_at DESC LIMIT ? OFFSET ?",
            $params
        );
        
        return [
            'notifications' => $stmt->fetchAll(),
            'total' => (int) $total,
            'unread' => (int) $unread,
        ];
    }
    
    /**
     * Create notification
     */
    public static function create(array $data): int {
        Database::query(
            "INSERT INTO notifications (user_id, type, title, message, link)
             VALUES (?, ?, ?, ?, ?)",
            [
                $data['user_id'],
                $data['type'],
                $data['title'],
                $data['message'],
                $data['link'] ?? null,
            ]
        );
        
        return (int) Database::lastInsertId();
    }
    
    /**
     * Mark notification as read
     */
    public static function markAsRead(int $id): bool {
        Database::query(
            "UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?",
            [$id]
        );
        return true;
    }
    
    /**
     * Mark all notifications as read for a user
     */
    public static function markAllAsRead(int $userId): int {
        $stmt = Database::query(
            "UPDATE notifications SET is_read = TRUE, read_at = NOW() 
             WHERE user_id = ? AND is_read = FALSE",
            [$userId]
        );
        return $stmt->rowCount();
    }
    
    /**
     * Delete notification
     */
    public static function delete(int $id): bool {
        Database::query("DELETE FROM notifications WHERE id = ?", [$id]);
        return true;
    }
    
    /**
     * Delete old notifications (cleanup)
     */
    public static function deleteOld(int $daysOld = 30): int {
        $stmt = Database::query(
            "DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND is_read = TRUE",
            [$daysOld]
        );
        return $stmt->rowCount();
    }
    
    /**
     * Check if notification belongs to user
     */
    public static function belongsToUser(int $notificationId, int $userId): bool {
        $stmt = Database::query(
            "SELECT id FROM notifications WHERE id = ? AND user_id = ?",
            [$notificationId, $userId]
        );
        return (bool) $stmt->fetch();
    }
    
    /**
     * Get unread count for a user
     */
    public static function getUnreadCount(int $userId): int {
        $stmt = Database::query(
            "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
            [$userId]
        );
        return (int) $stmt->fetch()['count'];
    }
    
    /**
     * Create medication reminder notification
     */
    public static function createMedicationReminder(int $userId, string $medicationName): int {
        return self::create([
            'user_id' => $userId,
            'type' => 'medication',
            'title' => 'Medication Reminder',
            'message' => "Time to take your {$medicationName}",
            'link' => '/medication',
        ]);
    }
    
    /**
     * Create glucose reminder notification
     */
    public static function createGlucoseReminder(int $userId): int {
        return self::create([
            'user_id' => $userId,
            'type' => 'glucose',
            'title' => 'Log Your Glucose',
            'message' => "Don't forget to log your glucose reading",
            'link' => '/medication',
        ]);
    }
    
    /**
     * Create system notification
     */
    public static function createSystemNotification(int $userId, string $title, string $message, ?string $link = null): int {
        return self::create([
            'user_id' => $userId,
            'type' => 'system',
            'title' => $title,
            'message' => $message,
            'link' => $link,
        ]);
    }
}
