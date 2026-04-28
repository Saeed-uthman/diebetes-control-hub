<?php
/**
 * Medication Controller
 * 
 * Handles medication CRUD and schedule operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class MedicationController {
    
    /**
     * Get all medications for current user
     * GET /api/medications
     */
    public static function index(): void {
        $user = AuthMiddleware::requireMedicationAccess();
        
        $includeInactive = Validator::getQuery('include_inactive') === 'true';
        $medications = Medication::getByUserId($user['id'], !$includeInactive);
        
        Response::success(['medications' => $medications]);
    }
    
    /**
     * Get single medication
     * GET /api/medications/{id}
     */
    public static function show(int $id): void {
        $user = AuthMiddleware::requireMedicationAccess();
        
        $medication = Medication::findById($id);
        
        if (!$medication) {
            Response::notFound('Medication not found');
        }
        
        // Check ownership (unless admin)
        if (!AuthMiddleware::isAdmin() && $medication['user_id'] != $user['id']) {
            Response::forbidden('You can only view your own medications');
        }
        
        Response::success(['medication' => $medication]);
    }
    
    /**
     * Create new medication
     * POST /api/medications
     */
    public static function store(): void {
        $user = AuthMiddleware::requireMedicationAccess();
        $data = Validator::getJsonBody();
        
        $validator = Validator::make($data)
            ->required('name')
            ->maxLength('name', 200)
            ->required('dosage')
            ->maxLength('dosage', 100)
            ->required('frequency')
            ->required('times')
            ->required('start_date')
            ->date('start_date')
            ->date('end_date')
            ->date('refill_date');
        
        $validator->validate();
        
        // Validate times array
        if (!is_array($data['times']) || empty($data['times'])) {
            Response::validationError(['times' => 'Times must be a non-empty array']);
        }
        
        $medicationData = [
            'user_id' => $user['id'],
            'name' => Validator::sanitizeString($data['name']),
            'dosage' => Validator::sanitizeString($data['dosage']),
            'frequency' => Validator::sanitizeString($data['frequency']),
            'times' => $data['times'],
            'instructions' => isset($data['instructions']) ? Validator::sanitizeString($data['instructions']) : null,
            'color' => $data['color'] ?? 'blue',
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'] ?? null,
            'refill_date' => $data['refill_date'] ?? null,
            'prescribed_by' => isset($data['prescribed_by']) ? Validator::sanitizeString($data['prescribed_by']) : null,
        ];
        
        try {
            $medicationId = Medication::create($medicationData);
            $medication = Medication::findById($medicationId);
            
            Response::created(['medication' => $medication], 'Medication added successfully');
        } catch (Exception $e) {
            error_log('Medication create error: ' . $e->getMessage());
            Response::serverError('Failed to add medication');
        }
    }
    
    /**
     * Update medication
     * PUT /api/medications/{id}
     */
    public static function update(int $id): void {
        $user = AuthMiddleware::requireMedicationAccess();
        $data = Validator::getJsonBody();
        
        $medication = Medication::findById($id);
        
        if (!$medication) {
            Response::notFound('Medication not found');
        }
        
        if (!AuthMiddleware::isAdmin() && $medication['user_id'] != $user['id']) {
            Response::forbidden('You can only update your own medications');
        }
        
        $validator = Validator::make($data)
            ->maxLength('name', 200)
            ->maxLength('dosage', 100)
            ->date('start_date')
            ->date('end_date')
            ->date('refill_date');
        
        $validator->validate();
        
        $updateData = [];
        $allowedFields = ['name', 'dosage', 'frequency', 'times', 'instructions', 'color', 'start_date', 'end_date', 'refill_date', 'prescribed_by'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = is_string($data[$field]) ? Validator::sanitizeString($data[$field]) : $data[$field];
            }
        }
        
        if (Medication::update($id, $updateData)) {
            $medication = Medication::findById($id);
            Response::success(['medication' => $medication], 'Medication updated successfully');
        } else {
            Response::error('No changes made', 'NO_CHANGES', 400);
        }
    }
    
    /**
     * Delete medication
     * DELETE /api/medications/{id}
     */
    public static function destroy(int $id): void {
        $user = AuthMiddleware::requireMedicationAccess();
        
        $medication = Medication::findById($id);
        
        if (!$medication) {
            Response::notFound('Medication not found');
        }
        
        if (!AuthMiddleware::isAdmin() && $medication['user_id'] != $user['id']) {
            Response::forbidden('You can only delete your own medications');
        }
        
        Medication::delete($id);
        Response::success(null, 'Medication removed successfully');
    }
    
    /**
     * Get today's medication schedule
     * GET /api/medications/schedule
     */
    public static function schedule(): void {
        $user = AuthMiddleware::requireMedicationAccess();
        
        $date = Validator::getQuery('date', date('Y-m-d'));
        
        // Validate date format
        $validator = Validator::make(['date' => $date])->date('date');
        $validator->validate();
        
        if ($date === date('Y-m-d')) {
            $schedule = Medication::getTodaySchedule($user['id']);
        } else {
            $schedule = Medication::getScheduleRange($user['id'], $date, $date);
        }
        
        Response::success(['schedule' => $schedule, 'date' => $date]);
    }
    
    /**
     * Update schedule entry status
     * PUT /api/medications/schedule/{id}
     */
    public static function updateSchedule(int $id): void {
        $user = AuthMiddleware::requireMedicationAccess();
        $data = Validator::getJsonBody();
        
        $validator = Validator::make($data)
            ->required('status')
            ->in('status', ['pending', 'taken', 'missed', 'skipped']);
        
        $validator->validate();
        
        $scheduleEntry = Medication::getScheduleById($id);
        
        if (!$scheduleEntry) {
            Response::notFound('Schedule entry not found');
        }
        
        if (!AuthMiddleware::isAdmin() && $scheduleEntry['user_id'] != $user['id']) {
            Response::forbidden('You can only update your own schedule');
        }
        
        Medication::updateScheduleStatus($id, $data['status'], $data['notes'] ?? null);
        
        $updated = Medication::getScheduleById($id);
        Response::success(['schedule' => $updated], 'Schedule updated successfully');
    }
    
    /**
     * Get adherence statistics
     * GET /api/medications/stats
     */
    public static function stats(): void {
        $user = AuthMiddleware::requireMedicationAccess();
        
        $days = Validator::sanitizeInt(Validator::getQuery('days', 7));
        $days = min(max($days, 1), 90); // Clamp between 1 and 90 days
        
        $stats = Medication::getAdherenceStats($user['id'], $days);
        
        Response::success(['stats' => $stats, 'days' => $days]);
    }
}
