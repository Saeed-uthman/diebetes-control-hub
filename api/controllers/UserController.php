<?php
/**
 * User Controller
 * 
 * Handles admin user management operations.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class UserController {
    
    /**
     * Get all users (Admin only)
     * GET /api/users
     */
    public static function index(): void {
        AuthMiddleware::requireAdmin();
        
        $filters = [
            'role' => Validator::getQuery('role'),
            'verified' => Validator::getQuery('verified') !== null 
                ? Validator::getQuery('verified') === 'true' 
                : null,
            'search' => Validator::getQuery('search'),
        ];
        
        $filters = array_filter($filters, fn($v) => $v !== null);
        
        $pagination = Validator::getPagination();
        
        $result = User::getAll($filters, $pagination['per_page'], $pagination['offset']);
        
        Response::paginated(
            $result['users'],
            $pagination['page'],
            $pagination['per_page'],
            $result['total']
        );
    }
    
    /**
     * Get single user (Admin only)
     * GET /api/users/{id}
     */
    public static function show(int $id): void {
        AuthMiddleware::requireAdmin();
        
        $user = User::findById($id);
        
        if (!$user) {
            Response::notFound('User not found');
        }
        
        $settings = User::getSettings($id);
        
        Response::success([
            'user' => User::formatForResponse($user),
            'settings' => $settings,
        ]);
    }
    
    /**
     * Update user (Admin only)
     * PUT /api/users/{id}
     */
    public static function update(int $id): void {
        AuthMiddleware::requireAdmin();
        $data = Validator::getJsonBody();
        
        $user = User::findById($id);
        
        if (!$user) {
            Response::notFound('User not found');
        }
        
        $validator = Validator::make($data)
            ->minLength('name', 2)
            ->maxLength('name', 100)
            ->in('role', ['admin', 'infected', 'non-infected'])
            ->boolean('verified');
        
        $validator->validate();
        
        $updateData = [];
        $allowedFields = ['name', 'avatar', 'role', 'verified'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = is_string($data[$field]) ? Validator::sanitizeString($data[$field]) : $data[$field];
            }
        }
        
        if (!empty($updateData)) {
            User::update($id, $updateData);
        }
        
        $updatedUser = User::findById($id);
        Response::success(['user' => User::formatForResponse($updatedUser)], 'User updated successfully');
    }
    
    /**
     * Verify user (Admin only)
     * PUT /api/users/{id}/verify
     */
    public static function verify(int $id): void {
        AuthMiddleware::requireAdmin();
        
        $user = User::findById($id);
        
        if (!$user) {
            Response::notFound('User not found');
        }
        
        if ($user['verified']) {
            Response::error('User is already verified', 'ALREADY_VERIFIED', 400);
        }
        
        User::verify($id);
        
        // Send notification to user
        Notification::createSystemNotification(
            $id,
            'Account Verified',
            'Your account has been verified. You now have full access to all features.',
            '/'
        );
        
        $updatedUser = User::findById($id);
        Response::success(['user' => User::formatForResponse($updatedUser)], 'User verified successfully');
    }
    
    /**
     * Change user role (Admin only)
     * PUT /api/users/{id}/role
     */
    public static function changeRole(int $id): void {
        $currentUser = AuthMiddleware::requireAdmin();
        $data = Validator::getJsonBody();
        
        // Prevent admin from changing their own role
        if ($id == $currentUser['id']) {
            Response::error('You cannot change your own role', 'SELF_ROLE_CHANGE', 400);
        }
        
        $user = User::findById($id);
        
        if (!$user) {
            Response::notFound('User not found');
        }
        
        $validator = Validator::make($data)
            ->required('role')
            ->in('role', ['admin', 'infected', 'non-infected']);
        
        $validator->validate();
        
        User::update($id, ['role' => $data['role']]);
        
        $updatedUser = User::findById($id);
        Response::success(['user' => User::formatForResponse($updatedUser)], 'User role changed successfully');
    }
    
    /**
     * Deactivate user (Admin only)
     * DELETE /api/users/{id}
     */
    public static function destroy(int $id): void {
        $currentUser = AuthMiddleware::requireAdmin();
        
        // Prevent admin from deleting themselves
        if ($id == $currentUser['id']) {
            Response::error('You cannot deactivate your own account', 'SELF_DEACTIVATE', 400);
        }
        
        $user = User::findById($id);
        
        if (!$user) {
            Response::notFound('User not found');
        }
        
        User::deactivate($id);
        Response::success(null, 'User deactivated successfully');
    }
    
    /**
     * Get user statistics (Admin only)
     * GET /api/users/stats
     */
    public static function stats(): void {
        AuthMiddleware::requireAdmin();
        
        $stats = User::getStats();
        Response::success(['stats' => $stats]);
    }
    
    /**
     * Get pending verifications (Admin only)
     * GET /api/users/pending
     */
    public static function pending(): void {
        AuthMiddleware::requireAdmin();
        
        $pagination = Validator::getPagination();
        
        $result = User::getAll(
            ['verified' => false],
            $pagination['per_page'],
            $pagination['offset']
        );
        
        Response::paginated(
            $result['users'],
            $pagination['page'],
            $pagination['per_page'],
            $result['total']
        );
    }
}
