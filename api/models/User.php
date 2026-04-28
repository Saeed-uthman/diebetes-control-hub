<?php
/**
 * User Model
 * 
 * Handles user database operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class User {
    
    /**
     * Find user by ID
     */
    public static function findById(int $id): ?array {
        $stmt = Database::query(
            "SELECT id, email, name, role, avatar, verified, created_at, last_login, is_active 
             FROM users WHERE id = ?",
            [$id]
        );
        $user = $stmt->fetch();
        return $user ?: null;
    }
    
    /**
     * Find user by email
     */
    public static function findByEmail(string $email): ?array {
        $stmt = Database::query(
            "SELECT id, email, password_hash, name, role, avatar, verified, created_at, last_login, is_active 
             FROM users WHERE email = ?",
            [strtolower($email)]
        );
        $user = $stmt->fetch();
        return $user ?: null;
    }
    
    /**
     * Create a new user
     */
    public static function create(array $data): int {
        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => PASSWORD_COST]);
        
        Database::query(
            "INSERT INTO users (email, password_hash, name, role, verified, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())",
            [
                strtolower($data['email']),
                $passwordHash,
                $data['name'],
                $data['role'] ?? 'non-infected',
                $data['role'] === 'non-infected' ? 1 : 0, // Auto-verify non-infected users
            ]
        );
        
        return (int) Database::lastInsertId();
    }
    
    /**
     * Verify password
     */
    public static function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }
    
    /**
     * Update last login timestamp
     */
    public static function updateLastLogin(int $userId): void {
        Database::query(
            "UPDATE users SET last_login = NOW() WHERE id = ?",
            [$userId]
        );
    }
    
    /**
     * Update user
     */
    public static function update(int $id, array $data): bool {
        $fields = [];
        $values = [];
        
        $allowedFields = ['name', 'avatar', 'role', 'verified', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = ?";
                $values[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        
        Database::query($sql, $values);
        return true;
    }
    
    /**
     * Update password
     */
    public static function updatePassword(int $id, string $newPassword): bool {
        $hash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => PASSWORD_COST]);
        Database::query(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [$hash, $id]
        );
        return true;
    }
    
    /**
     * Verify user account
     */
    public static function verify(int $id): bool {
        Database::query("UPDATE users SET verified = TRUE WHERE id = ?", [$id]);
        return true;
    }
    
    /**
     * Deactivate user
     */
    public static function deactivate(int $id): bool {
        Database::query("UPDATE users SET is_active = FALSE WHERE id = ?", [$id]);
        return true;
    }
    
    /**
     * Get all users with optional filters
     */
    public static function getAll(array $filters = [], int $limit = 20, int $offset = 0): array {
        $where = ['is_active = TRUE'];
        $params = [];
        
        if (!empty($filters['role'])) {
            $where[] = 'role = ?';
            $params[] = $filters['role'];
        }
        
        if (isset($filters['verified'])) {
            $where[] = 'verified = ?';
            $params[] = $filters['verified'] ? 1 : 0;
        }
        
        if (!empty($filters['search'])) {
            $where[] = '(name LIKE ? OR email LIKE ?)';
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = Database::query(
            "SELECT COUNT(*) as total FROM users WHERE {$whereClause}",
            $params
        );
        $total = $countStmt->fetch()['total'];
        
        // Get paginated results
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = Database::query(
            "SELECT id, email, name, role, avatar, verified, created_at, last_login 
             FROM users WHERE {$whereClause} 
             ORDER BY created_at DESC LIMIT ? OFFSET ?",
            $params
        );
        
        return [
            'users' => $stmt->fetchAll(),
            'total' => (int) $total,
        ];
    }
    
    /**
     * Check if email exists
     */
    public static function emailExists(string $email): bool {
        $stmt = Database::query(
            "SELECT COUNT(*) as count FROM users WHERE email = ?",
            [strtolower($email)]
        );
        return $stmt->fetch()['count'] > 0;
    }
    
    /**
     * Get user settings
     */
    public static function getSettings(int $userId): ?array {
        $stmt = Database::query(
            "SELECT * FROM user_settings WHERE user_id = ?",
            [$userId]
        );
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Update user settings
     */
    public static function updateSettings(int $userId, array $settings): bool {
        $fields = [];
        $values = [];
        
        $allowedFields = [
            'notifications_email', 'notifications_push', 'notifications_medication',
            'notifications_glucose', 'notifications_appointments', 'theme', 
            'compact_mode', 'language'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($settings[$field])) {
                $fields[] = "{$field} = ?";
                $values[] = $settings[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $userId;
        $sql = "UPDATE user_settings SET " . implode(', ', $fields) . " WHERE user_id = ?";
        
        Database::query($sql, $values);
        return true;
    }
    
    /**
     * Get user statistics for admin dashboard
     */
    public static function getStats(): array {
        $stmt = Database::query(
            "SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
                SUM(CASE WHEN role = 'infected' THEN 1 ELSE 0 END) as infected_count,
                SUM(CASE WHEN role = 'non-infected' THEN 1 ELSE 0 END) as non_infected_count,
                SUM(CASE WHEN verified = FALSE THEN 1 ELSE 0 END) as pending_verification,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_this_week
             FROM users WHERE is_active = TRUE"
        );
        
        return $stmt->fetch();
    }
    
    /**
     * Get user registration trends
     */
    public static function getRegistrationTrends(int $days = 30): array {
        $stmt = Database::query(
            "SELECT DATE(created_at) as date, COUNT(*) as count, role
             FROM users 
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(created_at), role
             ORDER BY date ASC",
            [$days]
        );
        
        return $stmt->fetchAll();
    }
    
    /**
     * Format user for API response (exclude sensitive data)
     */
    public static function formatForResponse(array $user): array {
        unset($user['password_hash']);
        unset($user['is_active']);
        return $user;
    }
}
