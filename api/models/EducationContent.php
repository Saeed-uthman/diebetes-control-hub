<?php
/**
 * Education Content Model
 * 
 * Handles education content database operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class EducationContent {
    
    /**
     * Find content by ID
     */
    public static function findById(int $id): ?array {
        $stmt = Database::query(
            "SELECT ec.*, u.name as author_name
             FROM education_content ec
             LEFT JOIN users u ON ec.author_id = u.id
             WHERE ec.id = ?",
            [$id]
        );
        $content = $stmt->fetch();
        
        if ($content) {
            $content['target_audience'] = json_decode($content['target_audience'], true);
        }
        
        return $content ?: null;
    }
    
    /**
     * Get content for a specific role
     */
    public static function getForRole(string $role, array $filters = [], int $limit = 20, int $offset = 0): array {
        $where = ["status = 'published'", "JSON_CONTAINS(target_audience, ?)"];
        $params = [json_encode($role)];
        
        if (!empty($filters['category'])) {
            $where[] = 'category = ?';
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['content_type'])) {
            $where[] = 'content_type = ?';
            $params[] = $filters['content_type'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = '(title LIKE ? OR description LIKE ?)';
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = Database::query(
            "SELECT COUNT(*) as total FROM education_content WHERE {$whereClause}",
            $params
        );
        $total = $countStmt->fetch()['total'];
        
        // Get content
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = Database::query(
            "SELECT id, title, description, category, content_type, target_audience, 
                    author, thumbnail, read_time, published_at, views
             FROM education_content WHERE {$whereClause} 
             ORDER BY published_at DESC LIMIT ? OFFSET ?",
            $params
        );
        
        $content = $stmt->fetchAll();
        
        foreach ($content as &$item) {
            $item['target_audience'] = json_decode($item['target_audience'], true);
        }
        
        return [
            'content' => $content,
            'total' => (int) $total,
        ];
    }
    
    /**
     * Get all content (for admin)
     */
    public static function getAll(array $filters = [], int $limit = 20, int $offset = 0): array {
        $where = ['1=1'];
        $params = [];
        
        if (!empty($filters['status'])) {
            $where[] = 'status = ?';
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['category'])) {
            $where[] = 'category = ?';
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = '(title LIKE ? OR description LIKE ?)';
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = Database::query(
            "SELECT COUNT(*) as total FROM education_content WHERE {$whereClause}",
            $params
        );
        $total = $countStmt->fetch()['total'];
        
        // Get content
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = Database::query(
            "SELECT ec.*, u.name as author_name
             FROM education_content ec
             LEFT JOIN users u ON ec.author_id = u.id
             WHERE {$whereClause} 
             ORDER BY ec.created_at DESC LIMIT ? OFFSET ?",
            $params
        );
        
        $content = $stmt->fetchAll();
        
        foreach ($content as &$item) {
            $item['target_audience'] = json_decode($item['target_audience'], true);
        }
        
        return [
            'content' => $content,
            'total' => (int) $total,
        ];
    }
    
    /**
     * Create content
     */
    public static function create(array $data): int {
        $publishedAt = $data['status'] === 'published' ? date('Y-m-d H:i:s') : null;
        
        Database::query(
            "INSERT INTO education_content (title, description, content, category, content_type,
                                            target_audience, author, author_id, thumbnail, 
                                            video_url, read_time, status, published_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $data['title'],
                $data['description'],
                $data['content'],
                $data['category'],
                $data['content_type'] ?? 'article',
                json_encode($data['target_audience']),
                $data['author'] ?? null,
                $data['author_id'] ?? null,
                $data['thumbnail'] ?? null,
                $data['video_url'] ?? null,
                $data['read_time'] ?? null,
                $data['status'] ?? 'draft',
                $publishedAt,
            ]
        );
        
        return (int) Database::lastInsertId();
    }
    
    /**
     * Update content
     */
    public static function update(int $id, array $data): bool {
        $fields = [];
        $values = [];
        
        $allowedFields = ['title', 'description', 'content', 'category', 'content_type',
                          'target_audience', 'author', 'thumbnail', 'video_url', 
                          'read_time', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = ?";
                $values[] = $field === 'target_audience' ? json_encode($data[$field]) : $data[$field];
            }
        }
        
        // Handle publishing
        if (isset($data['status']) && $data['status'] === 'published') {
            $existing = self::findById($id);
            if ($existing && $existing['status'] !== 'published') {
                $fields[] = 'published_at = NOW()';
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = "UPDATE education_content SET " . implode(', ', $fields) . " WHERE id = ?";
        
        Database::query($sql, $values);
        return true;
    }
    
    /**
     * Increment view count
     */
    public static function incrementViews(int $id): void {
        Database::query("UPDATE education_content SET views = views + 1 WHERE id = ?", [$id]);
    }
    
    /**
     * Get user progress for content
     */
    public static function getUserProgress(int $userId, int $contentId): ?array {
        $stmt = Database::query(
            "SELECT * FROM user_progress WHERE user_id = ? AND content_id = ?",
            [$userId, $contentId]
        );
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Update user progress
     */
    public static function updateProgress(int $userId, int $contentId, int $progress): void {
        $completed = $progress >= 100;
        $completedAt = $completed ? date('Y-m-d H:i:s') : null;
        
        Database::query(
            "INSERT INTO user_progress (user_id, content_id, progress, completed, completed_at)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                progress = VALUES(progress),
                completed = VALUES(completed),
                completed_at = COALESCE(completed_at, VALUES(completed_at))",
            [$userId, $contentId, min($progress, 100), $completed, $completedAt]
        );
    }
    
    /**
     * Get user's completed content
     */
    public static function getCompletedByUser(int $userId): array {
        $stmt = Database::query(
            "SELECT ec.id, ec.title, ec.category, up.completed_at
             FROM user_progress up
             JOIN education_content ec ON up.content_id = ec.id
             WHERE up.user_id = ? AND up.completed = TRUE
             ORDER BY up.completed_at DESC",
            [$userId]
        );
        return $stmt->fetchAll();
    }
    
    /**
     * Get content categories
     */
    public static function getCategories(): array {
        $stmt = Database::query(
            "SELECT category, COUNT(*) as count 
             FROM education_content WHERE status = 'published' 
             GROUP BY category ORDER BY category"
        );
        return $stmt->fetchAll();
    }
    
    /**
     * Get content statistics for analytics
     */
    public static function getStats(): array {
        $stmt = Database::query(
            "SELECT 
                COUNT(*) as total_content,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
                SUM(views) as total_views,
                (SELECT COUNT(*) FROM user_progress WHERE completed = TRUE) as total_completions
             FROM education_content"
        );
        return $stmt->fetch();
    }
}
