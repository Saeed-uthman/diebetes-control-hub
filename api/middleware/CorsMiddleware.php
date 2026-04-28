<?php
/**
 * CORS Middleware
 * 
 * Handles Cross-Origin Resource Sharing headers.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class CorsMiddleware {
    
    /**
     * Handle CORS headers
     */
    public static function handle(): void {
        global $ALLOWED_ORIGINS;
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Check if origin is allowed
        if (in_array($origin, $ALLOWED_ORIGINS)) {
            header("Access-Control-Allow-Origin: {$origin}");
        } elseif (ENVIRONMENT === 'development') {
            // In development, allow all origins
            header("Access-Control-Allow-Origin: *");
        }
        
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400"); // 24 hours cache for preflight
        
        // Handle preflight OPTIONS request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
        
        // Set JSON content type for all responses
        header("Content-Type: application/json; charset=UTF-8");
    }
}
