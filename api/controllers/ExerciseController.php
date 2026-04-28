<?php
/**
 * Exercise Controller
 * 
 * Handles exercise and activity operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class ExerciseController {
    
    /**
     * Get all exercises
     * GET /api/exercises
     */
    public static function index(): void {
        AuthMiddleware::requireAuth();
        
        $filters = [
            'category' => Validator::getQuery('category'),
            'difficulty' => Validator::getQuery('difficulty'),
            'search' => Validator::getQuery('search'),
            'max_duration' => Validator::getQuery('max_duration'),
        ];
        
        $filters = array_filter($filters, fn($v) => $v !== null);
        
        $pagination = Validator::getPagination();
        
        $result = Exercise::getAll($filters, $pagination['per_page'], $pagination['offset']);
        
        Response::paginated(
            $result['exercises'],
            $pagination['page'],
            $pagination['per_page'],
            $result['total']
        );
    }
    
    /**
     * Get single exercise
     * GET /api/exercises/{id}
     */
    public static function show(int $id): void {
        AuthMiddleware::requireAuth();
        
        $exercise = Exercise::findById($id);
        
        if (!$exercise) {
            Response::notFound('Exercise not found');
        }
        
        Response::success(['exercise' => $exercise]);
    }
    
    /**
     * Get exercise categories
     * GET /api/exercises/categories
     */
    public static function categories(): void {
        AuthMiddleware::requireAuth();
        
        $categories = Exercise::getCategories();
        Response::success(['categories' => $categories]);
    }
    
    /**
     * Get user's activity log
     * GET /api/activity
     */
    public static function activityIndex(): void {
        $user = AuthMiddleware::requireAuth();
        
        $startDate = Validator::getQuery('start_date');
        $endDate = Validator::getQuery('end_date');
        $pagination = Validator::getPagination();
        
        $result = ActivityLog::getByUserId(
            $user['id'],
            $startDate,
            $endDate,
            $pagination['per_page'],
            $pagination['offset']
        );
        
        Response::paginated(
            $result['activities'],
            $pagination['page'],
            $pagination['per_page'],
            $result['total']
        );
    }
    
    /**
     * Log a new activity
     * POST /api/activity
     */
    public static function logActivity(): void {
        $user = AuthMiddleware::requireAuth();
        $data = Validator::getJsonBody();
        
        $validator = Validator::make($data)
            ->required('activity_type')
            ->in('activity_type', ['exercise', 'steps', 'distance', 'calories', 'custom'])
            ->required('value')
            ->numeric('value')
            ->min('value', 0)
            ->required('activity_date')
            ->date('activity_date');
        
        $validator->validate();
        
        // If it's an exercise activity, validate exercise_id exists
        if ($data['activity_type'] === 'exercise' && !empty($data['exercise_id'])) {
            $exercise = Exercise::findById($data['exercise_id']);
            if (!$exercise) {
                Response::validationError(['exercise_id' => 'Exercise not found']);
            }
        }
        
        $activityData = [
            'user_id' => $user['id'],
            'exercise_id' => $data['exercise_id'] ?? null,
            'activity_type' => $data['activity_type'],
            'activity_name' => isset($data['activity_name']) ? Validator::sanitizeString($data['activity_name']) : null,
            'value' => Validator::sanitizeFloat($data['value']),
            'calories_burned' => isset($data['calories_burned']) ? Validator::sanitizeInt($data['calories_burned']) : null,
            'activity_date' => $data['activity_date'],
            'start_time' => $data['start_time'] ?? null,
            'end_time' => $data['end_time'] ?? null,
            'notes' => isset($data['notes']) ? Validator::sanitizeString($data['notes']) : null,
        ];
        
        try {
            $activityId = ActivityLog::create($activityData);
            $activity = ActivityLog::findById($activityId);
            
            Response::created(['activity' => $activity], 'Activity logged successfully');
        } catch (Exception $e) {
            error_log('Activity create error: ' . $e->getMessage());
            Response::serverError('Failed to log activity');
        }
    }
    
    /**
     * Delete activity
     * DELETE /api/activity/{id}
     */
    public static function deleteActivity(int $id): void {
        $user = AuthMiddleware::requireAuth();
        
        $activity = ActivityLog::findById($id);
        
        if (!$activity) {
            Response::notFound('Activity not found');
        }
        
        if (!AuthMiddleware::isAdmin() && $activity['user_id'] != $user['id']) {
            Response::forbidden('You can only delete your own activities');
        }
        
        ActivityLog::delete($id);
        Response::success(null, 'Activity deleted successfully');
    }
    
    /**
     * Get weekly activity summary
     * GET /api/activity/weekly
     */
    public static function weeklySummary(): void {
        $user = AuthMiddleware::requireAuth();
        
        $summary = ActivityLog::getWeeklySummary($user['id']);
        
        Response::success(['summary' => $summary]);
    }
    
    /**
     * Get activity statistics
     * GET /api/activity/stats
     */
    public static function stats(): void {
        $user = AuthMiddleware::requireAuth();
        
        $days = Validator::sanitizeInt(Validator::getQuery('days', 7));
        $days = min(max($days, 1), 90);
        
        $stats = ActivityLog::getStats($user['id'], $days);
        
        Response::success(['stats' => $stats, 'days' => $days]);
    }
}
