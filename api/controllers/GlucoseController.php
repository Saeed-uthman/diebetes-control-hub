<?php
/**
 * Glucose Controller
 * 
 * Handles glucose reading operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class GlucoseController {
    
    /**
     * Get glucose readings
     * GET /api/glucose
     */
    public static function index(): void {
        $user = AuthMiddleware::requireMedicationAccess();
        
        $startDate = Validator::getQuery('start_date');
        $endDate = Validator::getQuery('end_date');
        $pagination = Validator::getPagination();
        
        $result = GlucoseReading::getByUserId(
            $user['id'],
            $startDate,
            $endDate,
            $pagination['per_page'],
            $pagination['offset']
        );
        
        Response::paginated(
            $result['readings'],
            $pagination['page'],
            $pagination['per_page'],
            $result['total']
        );
    }
    
    /**
     * Log a new glucose reading
     * POST /api/glucose
     */
    public static function store(): void {
        $user = AuthMiddleware::requireMedicationAccess();
        $data = Validator::getJsonBody();
        
        $validator = Validator::make($data)
            ->required('value')
            ->numeric('value')
            ->min('value', 20)
            ->max('value', 600)
            ->required('reading_type')
            ->in('reading_type', ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random']);
        
        $validator->validate();
        
        $readingData = [
            'user_id' => $user['id'],
            'value' => Validator::sanitizeFloat($data['value']),
            'reading_type' => $data['reading_type'],
            'reading_time' => $data['reading_time'] ?? date('Y-m-d H:i:s'),
            'notes' => isset($data['notes']) ? Validator::sanitizeString($data['notes']) : null,
        ];
        
        try {
            $readingId = GlucoseReading::create($readingData);
            $reading = GlucoseReading::findById($readingId);
            
            Response::created(['reading' => $reading], 'Glucose reading logged successfully');
        } catch (Exception $e) {
            error_log('Glucose create error: ' . $e->getMessage());
            Response::serverError('Failed to log reading');
        }
    }
    
    /**
     * Delete a reading
     * DELETE /api/glucose/{id}
     */
    public static function destroy(int $id): void {
        $user = AuthMiddleware::requireMedicationAccess();
        
        $reading = GlucoseReading::findById($id);
        
        if (!$reading) {
            Response::notFound('Reading not found');
        }
        
        if (!AuthMiddleware::isAdmin() && $reading['user_id'] != $user['id']) {
            Response::forbidden('You can only delete your own readings');
        }
        
        GlucoseReading::delete($id);
        Response::success(null, 'Reading deleted successfully');
    }
    
    /**
     * Get glucose statistics
     * GET /api/glucose/stats
     */
    public static function stats(): void {
        $user = AuthMiddleware::requireMedicationAccess();
        
        $days = Validator::sanitizeInt(Validator::getQuery('days', 7));
        $days = min(max($days, 1), 90);
        
        $stats = GlucoseReading::getStats($user['id'], $days);
        
        Response::success(['stats' => $stats, 'days' => $days]);
    }
    
    /**
     * Get daily averages for charts
     * GET /api/glucose/trends
     */
    public static function trends(): void {
        $user = AuthMiddleware::requireMedicationAccess();
        
        $days = Validator::sanitizeInt(Validator::getQuery('days', 30));
        $days = min(max($days, 7), 90);
        
        $trends = GlucoseReading::getDailyAverages($user['id'], $days);
        
        Response::success(['trends' => $trends, 'days' => $days]);
    }
    
    /**
     * Get today's readings
     * GET /api/glucose/today
     */
    public static function today(): void {
        $user = AuthMiddleware::requireMedicationAccess();
        
        $readings = GlucoseReading::getTodayReadings($user['id']);
        
        Response::success(['readings' => $readings, 'date' => date('Y-m-d')]);
    }
}
