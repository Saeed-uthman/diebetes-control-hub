<?php
/**
 * Recipe Model
 * 
 * Handles recipe database operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class Recipe {
    
    /**
     * Find recipe by ID
     */
    public static function findById(int $id): ?array {
        $stmt = Database::query(
            "SELECT * FROM recipes WHERE id = ? AND is_active = TRUE",
            [$id]
        );
        $recipe = $stmt->fetch();
        
        if ($recipe) {
            $recipe['macros'] = json_decode($recipe['macros'], true);
            $recipe['tags'] = json_decode($recipe['tags'], true);
            $recipe['ingredients'] = json_decode($recipe['ingredients'], true);
            $recipe['instructions'] = json_decode($recipe['instructions'], true);
        }
        
        return $recipe ?: null;
    }
    
    /**
     * Get all recipes with filters
     */
    public static function getAll(array $filters = [], int $limit = 20, int $offset = 0): array {
        $where = ['is_active = TRUE'];
        $params = [];
        
        if (!empty($filters['category'])) {
            $where[] = 'category = ?';
            $params[] = $filters['category'];
        }
        
        if (isset($filters['diabetes_friendly'])) {
            $where[] = 'diabetes_friendly = ?';
            $params[] = $filters['diabetes_friendly'] ? 1 : 0;
        }
        
        if (!empty($filters['glycemic_index'])) {
            $where[] = 'glycemic_index = ?';
            $params[] = $filters['glycemic_index'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = '(name LIKE ? OR description LIKE ?)';
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        if (!empty($filters['max_calories'])) {
            $where[] = 'calories <= ?';
            $params[] = $filters['max_calories'];
        }
        
        if (!empty($filters['max_prep_time'])) {
            $where[] = '(prep_time + cook_time) <= ?';
            $params[] = $filters['max_prep_time'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = Database::query(
            "SELECT COUNT(*) as total FROM recipes WHERE {$whereClause}",
            $params
        );
        $total = $countStmt->fetch()['total'];
        
        // Get recipes
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = Database::query(
            "SELECT id, name, description, image, prep_time, cook_time, servings, 
                    calories, macros, category, tags, diabetes_friendly, glycemic_index
             FROM recipes WHERE {$whereClause} 
             ORDER BY name ASC LIMIT ? OFFSET ?",
            $params
        );
        
        $recipes = $stmt->fetchAll();
        
        foreach ($recipes as &$recipe) {
            $recipe['macros'] = json_decode($recipe['macros'], true);
            $recipe['tags'] = json_decode($recipe['tags'], true);
        }
        
        return [
            'recipes' => $recipes,
            'total' => (int) $total,
        ];
    }
    
    /**
     * Create a new recipe
     */
    public static function create(array $data): int {
        Database::query(
            "INSERT INTO recipes (name, description, image, prep_time, cook_time, servings, 
                                  calories, macros, category, tags, ingredients, instructions, 
                                  diabetes_friendly, glycemic_index, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $data['name'],
                $data['description'],
                $data['image'] ?? null,
                $data['prep_time'],
                $data['cook_time'],
                $data['servings'] ?? 4,
                $data['calories'],
                json_encode($data['macros']),
                $data['category'],
                json_encode($data['tags'] ?? []),
                json_encode($data['ingredients']),
                json_encode($data['instructions']),
                $data['diabetes_friendly'] ?? true,
                $data['glycemic_index'] ?? 'low',
                $data['created_by'] ?? null,
            ]
        );
        
        return (int) Database::lastInsertId();
    }
    
    /**
     * Update recipe
     */
    public static function update(int $id, array $data): bool {
        $fields = [];
        $values = [];
        
        $allowedFields = ['name', 'description', 'image', 'prep_time', 'cook_time', 
                          'servings', 'calories', 'macros', 'category', 'tags', 
                          'ingredients', 'instructions', 'diabetes_friendly', 'glycemic_index'];
        
        $jsonFields = ['macros', 'tags', 'ingredients', 'instructions'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = ?";
                $values[] = in_array($field, $jsonFields) ? json_encode($data[$field]) : $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = "UPDATE recipes SET " . implode(', ', $fields) . " WHERE id = ?";
        
        Database::query($sql, $values);
        return true;
    }
    
    /**
     * Delete (deactivate) recipe
     */
    public static function delete(int $id): bool {
        Database::query("UPDATE recipes SET is_active = FALSE WHERE id = ?", [$id]);
        return true;
    }
    
    /**
     * Get categories with counts
     */
    public static function getCategories(): array {
        $stmt = Database::query(
            "SELECT category, COUNT(*) as count 
             FROM recipes WHERE is_active = TRUE 
             GROUP BY category ORDER BY category"
        );
        return $stmt->fetchAll();
    }
}
