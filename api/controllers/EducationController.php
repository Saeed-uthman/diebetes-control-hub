<?php
/**
 * Education Controller
 * 
 * Handles education content operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class EducationController {
    
    /**
     * Get education content for current user's role
     * GET /api/education
     */
    public static function index(): void {
        $user = AuthMiddleware::requireAuth();
        
        $filters = [
            'category' => Validator::getQuery('category'),
            'content_type' => Validator::getQuery('content_type'),
            'search' => Validator::getQuery('search'),
        ];
        
        $filters = array_filter($filters, fn($v) => $v !== null);
        
        $pagination = Validator::getPagination();
        
        // Admin sees all, others see role-specific content
        if (AuthMiddleware::isAdmin()) {
            $result = EducationContent::getAll($filters, $pagination['per_page'], $pagination['offset']);
        } else {
            $result = EducationContent::getForRole($user['role'], $filters, $pagination['per_page'], $pagination['offset']);
        }
        
        Response::paginated(
            $result['content'],
            $pagination['page'],
            $pagination['per_page'],
            $result['total']
        );
    }
    
    /**
     * Get single content with user progress
     * GET /api/education/{id}
     */
    public static function show(int $id): void {
        $user = AuthMiddleware::requireAuth();
        
        $content = EducationContent::findById($id);
        
        if (!$content) {
            Response::notFound('Content not found');
        }
        
        // Check if user can access this content (by role or admin)
        if (!AuthMiddleware::isAdmin()) {
            $targetAudience = $content['target_audience'];
            if (!in_array($user['role'], $targetAudience)) {
                Response::forbidden('You do not have access to this content');
            }
        }
        
        // Get user progress
        $progress = EducationContent::getUserProgress($user['id'], $id);
        
        // Increment views
        EducationContent::incrementViews($id);
        
        Response::success([
            'content' => $content,
            'progress' => $progress,
        ]);
    }
    
    /**
     * Update user progress on content
     * PUT /api/education/{id}/progress
     */
    public static function updateProgress(int $id): void {
        $user = AuthMiddleware::requireAuth();
        $data = Validator::getJsonBody();
        
        $content = EducationContent::findById($id);
        
        if (!$content) {
            Response::notFound('Content not found');
        }
        
        $validator = Validator::make($data)
            ->required('progress')
            ->integer('progress')
            ->min('progress', 0)
            ->max('progress', 100);
        
        $validator->validate();
        
        EducationContent::updateProgress($user['id'], $id, $data['progress']);
        
        $progress = EducationContent::getUserProgress($user['id'], $id);
        Response::success(['progress' => $progress], 'Progress updated');
    }
    
    /**
     * Create content (Admin only)
     * POST /api/education
     */
    public static function store(): void {
        $user = AuthMiddleware::requireAdmin();
        $data = Validator::getJsonBody();
        
        $validator = Validator::make($data)
            ->required('title')
            ->maxLength('title', 300)
            ->required('description')
            ->required('content')
            ->required('category')
            ->in('category', ['basics', 'nutrition', 'medication', 'exercise', 'monitoring', 'complications', 'lifestyle', 'prevention'])
            ->required('target_audience')
            ->in('content_type', ['article', 'video', 'infographic', 'quiz', 'guide'])
            ->in('status', ['draft', 'published', 'archived']);
        
        $validator->validate();
        
        // Validate target_audience is an array
        if (!is_array($data['target_audience']) || empty($data['target_audience'])) {
            Response::validationError(['target_audience' => 'Target audience must be a non-empty array']);
        }
        
        $contentData = [
            'title' => Validator::sanitizeString($data['title']),
            'description' => Validator::sanitizeString($data['description']),
            'content' => $data['content'], // Allow HTML content
            'category' => $data['category'],
            'content_type' => $data['content_type'] ?? 'article',
            'target_audience' => $data['target_audience'],
            'author' => $data['author'] ?? $user['name'],
            'author_id' => $user['id'],
            'thumbnail' => $data['thumbnail'] ?? null,
            'video_url' => $data['video_url'] ?? null,
            'read_time' => isset($data['read_time']) ? Validator::sanitizeInt($data['read_time']) : null,
            'status' => $data['status'] ?? 'draft',
        ];
        
        try {
            $contentId = EducationContent::create($contentData);
            $content = EducationContent::findById($contentId);
            
            Response::created(['content' => $content], 'Content created successfully');
        } catch (Exception $e) {
            error_log('Education content create error: ' . $e->getMessage());
            Response::serverError('Failed to create content');
        }
    }
    
    /**
     * Update content (Admin only)
     * PUT /api/education/{id}
     */
    public static function update(int $id): void {
        AuthMiddleware::requireAdmin();
        $data = Validator::getJsonBody();
        
        $content = EducationContent::findById($id);
        
        if (!$content) {
            Response::notFound('Content not found');
        }
        
        $validator = Validator::make($data)
            ->maxLength('title', 300)
            ->in('category', ['basics', 'nutrition', 'medication', 'exercise', 'monitoring', 'complications', 'lifestyle', 'prevention'])
            ->in('content_type', ['article', 'video', 'infographic', 'quiz', 'guide'])
            ->in('status', ['draft', 'published', 'archived']);
        
        $validator->validate();
        
        if (EducationContent::update($id, $data)) {
            $content = EducationContent::findById($id);
            Response::success(['content' => $content], 'Content updated successfully');
        } else {
            Response::error('No changes made', 'NO_CHANGES', 400);
        }
    }
    
    /**
     * Get content categories
     * GET /api/education/categories
     */
    public static function categories(): void {
        AuthMiddleware::requireAuth();
        
        $categories = EducationContent::getCategories();
        Response::success(['categories' => $categories]);
    }
    
    /**
     * Get user's completed content
     * GET /api/education/completed
     */
    public static function completed(): void {
        $user = AuthMiddleware::requireAuth();
        
        $completed = EducationContent::getCompletedByUser($user['id']);
        Response::success(['completed' => $completed]);
    }
}
