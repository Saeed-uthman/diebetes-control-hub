<?php
/**
 * API Response Helper
 * 
 * Provides standardized JSON responses for the API.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class Response {
    
    /**
     * Send a success response
     */
    public static function success($data = null, string $message = 'Success', int $statusCode = 200, array $meta = []): void {
        http_response_code($statusCode);
        
        $response = [
            'success' => true,
            'message' => $message,
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if (!empty($meta)) {
            $response['meta'] = $meta;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    /**
     * Send an error response
     */
    public static function error(string $message, string $code = 'ERROR', int $statusCode = 400, array $details = []): void {
        http_response_code($statusCode);
        
        $response = [
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ]
        ];
        
        if (!empty($details)) {
            $response['error']['details'] = $details;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    /**
     * Send a 401 Unauthorized response
     */
    public static function unauthorized(string $message = 'Unauthorized access'): void {
        self::error($message, 'UNAUTHORIZED', 401);
    }
    
    /**
     * Send a 403 Forbidden response
     */
    public static function forbidden(string $message = 'Access forbidden'): void {
        self::error($message, 'FORBIDDEN', 403);
    }
    
    /**
     * Send a 404 Not Found response
     */
    public static function notFound(string $message = 'Resource not found'): void {
        self::error($message, 'NOT_FOUND', 404);
    }
    
    /**
     * Send a 422 Validation Error response
     */
    public static function validationError(array $errors, string $message = 'Validation failed'): void {
        self::error($message, 'VALIDATION_ERROR', 422, $errors);
    }
    
    /**
     * Send a 500 Server Error response
     */
    public static function serverError(string $message = 'Internal server error'): void {
        self::error($message, 'SERVER_ERROR', 500);
    }
    
    /**
     * Send a 429 Too Many Requests response
     */
    public static function tooManyRequests(string $message = 'Too many requests. Please try again later.'): void {
        self::error($message, 'RATE_LIMIT_EXCEEDED', 429);
    }
    
    /**
     * Send a 201 Created response
     */
    public static function created($data = null, string $message = 'Resource created successfully'): void {
        self::success($data, $message, 201);
    }
    
    /**
     * Send a 204 No Content response
     */
    public static function noContent(): void {
        http_response_code(204);
        exit;
    }
    
    /**
     * Send a paginated response
     */
    public static function paginated(array $data, int $page, int $perPage, int $total, string $message = 'Success'): void {
        $totalPages = ceil($total / $perPage);
        
        $meta = [
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => $totalPages,
                'has_more' => $page < $totalPages,
            ]
        ];
        
        self::success($data, $message, 200, $meta);
    }
    
    /**
     * Send raw JSON data
     */
    public static function json($data, int $statusCode = 200): void {
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
