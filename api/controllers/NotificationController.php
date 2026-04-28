<?php
/**
 * Notification Controller
 * 
 * Handles notification operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class NotificationController {
    
    /**
     * Get notifications for current user
     * GET /api/notifications
     */
    public static function index(): void {
        $user = AuthMiddleware::requireAuth();
        
        $unreadOnly = Validator::getQuery('unread_only') === 'true';
        $pagination = Validator::getPagination();
        
        $result = Notification::getByUserId(
            $user['id'],
            $unreadOnly,
            $pagination['per_page'],
            $pagination['offset']
        );
        
        Response::success([
            'notifications' => $result['notifications'],
            'unread_count' => $result['unread'],
            'meta' => [
                'page' => $pagination['page'],
                'per_page' => $pagination['per_page'],
                'total' => $result['total'],
            ]
        ]);
    }
    
    /**
     * Mark notification as read
     * PUT /api/notifications/{id}/read
     */
    public static function markRead(int $id): void {
        $user = AuthMiddleware::requireAuth();
        
        $notification = Notification::findById($id);
        
        if (!$notification) {
            Response::notFound('Notification not found');
        }
        
        if ($notification['user_id'] != $user['id']) {
            Response::forbidden('You can only mark your own notifications as read');
        }
        
        Notification::markAsRead($id);
        
        Response::success(null, 'Notification marked as read');
    }
    
    /**
     * Mark all notifications as read
     * PUT /api/notifications/read-all
     */
    public static function markAllRead(): void {
        $user = AuthMiddleware::requireAuth();
        
        $count = Notification::markAllAsRead($user['id']);
        
        Response::success(['marked_count' => $count], 'All notifications marked as read');
    }
    
    /**
     * Get unread count
     * GET /api/notifications/unread-count
     */
    public static function unreadCount(): void {
        $user = AuthMiddleware::requireAuth();
        
        $count = Notification::getUnreadCount($user['id']);
        
        Response::success(['unread_count' => $count]);
    }
    
    /**
     * Delete notification
     * DELETE /api/notifications/{id}
     */
    public static function destroy(int $id): void {
        $user = AuthMiddleware::requireAuth();
        
        $notification = Notification::findById($id);
        
        if (!$notification) {
            Response::notFound('Notification not found');
        }
        
        if ($notification['user_id'] != $user['id']) {
            Response::forbidden('You can only delete your own notifications');
        }
        
        Notification::delete($id);
        
        Response::success(null, 'Notification deleted');
    }
    
    /**
     * Get notification preferences
     * GET /api/notifications/preferences
     */
    public static function preferences(): void {
        $user = AuthMiddleware::requireAuth();
        
        $settings = User::getSettings($user['id']);
        
        $preferences = [
            'email' => $settings['notifications_email'] ?? true,
            'push' => $settings['notifications_push'] ?? true,
            'medication' => $settings['notifications_medication'] ?? true,
            'glucose' => $settings['notifications_glucose'] ?? true,
            'appointments' => $settings['notifications_appointments'] ?? true,
        ];
        
        Response::success(['preferences' => $preferences]);
    }
    
    /**
     * Send medication reminder email
     * POST /api/notifications/medication-reminder
     */
    public static function sendMedicationReminder(): void {
        $user = AuthMiddleware::requireAuth();
        $data = Validator::getJsonBody();
        
        $errors = Validator::validate($data, [
            'medication_name' => 'required',
            'dosage' => 'required',
            'scheduled_time' => 'required',
        ]);
        
        if (!empty($errors)) {
            Response::validationError($errors);
            return;
        }
        
        // Get user email
        $userInfo = User::findById($user['id']);
        if (!$userInfo) {
            Response::error('User not found', 404);
            return;
        }
        
        // Check if user has medication email notifications enabled
        $settings = User::getSettings($user['id']);
        $emailEnabled = $settings['notifications_email'] ?? true;
        $medEnabled = $settings['notifications_medication'] ?? true;
        
        if (!$emailEnabled || !$medEnabled) {
            Response::success(null, 'Email notifications disabled by user preferences');
            return;
        }
        
        $sent = Mailer::sendMedicationReminder(
            $userInfo['email'],
            $userInfo['name'],
            $data['medication_name'],
            $data['dosage'],
            $data['scheduled_time']
        );
        
        if ($sent) {
            // Also create an in-app notification
            Notification::createMedicationReminder($user['id'], $data['medication_name']);
            Response::success(null, 'Medication reminder email sent');
        } else {
            Response::error('Failed to send medication reminder email', 500);
        }
    }

    /**
     * Send glucose alert email
     * POST /api/notifications/glucose-alert
     */
    public static function sendGlucoseAlert(): void {
        $user = AuthMiddleware::requireAuth();
        $data = Validator::getJsonBody();
        
        $errors = Validator::validate($data, [
            'glucose_value' => 'required|numeric',
            'reading_type' => 'required',
            'alert_level' => 'required',
        ]);
        
        if (!empty($errors)) {
            Response::validationError($errors);
            return;
        }
        
        $userInfo = User::findById($user['id']);
        if (!$userInfo) {
            Response::error('User not found', 404);
            return;
        }
        
        // Check preferences
        $settings = User::getSettings($user['id']);
        $emailEnabled = $settings['notifications_email'] ?? true;
        $glucoseEnabled = $settings['notifications_glucose'] ?? true;
        
        if (!$emailEnabled || !$glucoseEnabled) {
            Response::success(null, 'Email notifications disabled by user preferences');
            return;
        }
        
        $sent = Mailer::sendGlucoseAlert(
            $userInfo['email'],
            $userInfo['name'],
            (float) $data['glucose_value'],
            $data['reading_type'],
            $data['alert_level']
        );
        
        if ($sent) {
            Notification::createGlucoseReminder($user['id']);
            Response::success(null, 'Glucose alert email sent');
        } else {
            Response::error('Failed to send glucose alert email', 500);
        }
    }

    /**
     * Update notification preferences
     * PUT /api/notifications/preferences
     */
    public static function updatePreferences(): void {
        $user = AuthMiddleware::requireAuth();
        $data = Validator::getJsonBody();
        
        $settingsData = [];
        
        $prefMapping = [
            'email' => 'notifications_email',
            'push' => 'notifications_push',
            'medication' => 'notifications_medication',
            'glucose' => 'notifications_glucose',
            'appointments' => 'notifications_appointments',
        ];
        
        foreach ($prefMapping as $key => $dbField) {
            if (isset($data[$key])) {
                $settingsData[$dbField] = (bool) $data[$key];
            }
        }
        
        if (!empty($settingsData)) {
            User::updateSettings($user['id'], $settingsData);
        }
        
        $settings = User::getSettings($user['id']);
        
        $preferences = [
            'email' => $settings['notifications_email'] ?? true,
            'push' => $settings['notifications_push'] ?? true,
            'medication' => $settings['notifications_medication'] ?? true,
            'glucose' => $settings['notifications_glucose'] ?? true,
            'appointments' => $settings['notifications_appointments'] ?? true,
        ];
        
        Response::success(['preferences' => $preferences], 'Preferences updated');
    }
}
