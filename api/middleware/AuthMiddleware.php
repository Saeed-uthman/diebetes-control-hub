<?php
/**
 * Authentication Middleware
 * 
 * Handles JWT authentication and role-based access control.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class AuthMiddleware {
    private static ?array $currentUser = null;
    
    /**
     * Authenticate the current request
     * Returns user data if authenticated, null otherwise
     */
    public static function authenticate(): ?array {
        $token = JwtHandler::extractTokenFromHeader();
        
        if ($token === null) {
            return null;
        }
        
        $payload = JwtHandler::validateToken($token);
        
        if ($payload === false) {
            return null;
        }
        
        // Check if it's an access token (not refresh token)
        if (isset($payload['type']) && $payload['type'] === 'refresh') {
            return null;
        }
        
        // Fetch user from database to ensure they still exist and are active
        try {
            $stmt = Database::query(
                "SELECT id, email, name, role, avatar, verified, is_active 
                 FROM users WHERE id = ? AND is_active = TRUE",
                [$payload['user_id']]
            );
            $user = $stmt->fetch();
            
            if ($user) {
                self::$currentUser = $user;
                return $user;
            }
        } catch (Exception $e) {
            error_log('Auth middleware error: ' . $e->getMessage());
        }
        
        return null;
    }
    
    /**
     * Require authentication - sends error response if not authenticated
     */
    public static function requireAuth(): array {
        $user = self::authenticate();
        
        if ($user === null) {
            Response::unauthorized('Authentication required. Please log in.');
        }
        
        return $user;
    }
    
    /**
     * Require specific role(s)
     */
    public static function requireRole(array $allowedRoles): array {
        $user = self::requireAuth();
        
        if (!in_array($user['role'], $allowedRoles)) {
            Response::forbidden('You do not have permission to access this resource.');
        }
        
        return $user;
    }
    
    /**
     * Require admin role
     */
    public static function requireAdmin(): array {
        return self::requireRole(['admin']);
    }
    
    /**
     * Require medication access (admin or infected users)
     */
    public static function requireMedicationAccess(): array {
        return self::requireRole(['admin', 'infected']);
    }
    
    /**
     * Require verified account
     */
    public static function requireVerified(): array {
        $user = self::requireAuth();
        
        if (!$user['verified']) {
            Response::forbidden('Your account is pending verification.');
        }
        
        return $user;
    }
    
    /**
     * Get currently authenticated user
     */
    public static function getCurrentUser(): ?array {
        return self::$currentUser;
    }
    
    /**
     * Get current user ID
     */
    public static function getCurrentUserId(): ?int {
        return self::$currentUser['id'] ?? null;
    }
    
    /**
     * Check if current user has role
     */
    public static function hasRole(string $role): bool {
        return self::$currentUser !== null && self::$currentUser['role'] === $role;
    }
    
    /**
     * Check if current user is admin
     */
    public static function isAdmin(): bool {
        return self::hasRole('admin');
    }
    
    /**
     * Optional authentication - doesn't fail if not authenticated
     */
    public static function optionalAuth(): ?array {
        return self::authenticate();
    }
}
