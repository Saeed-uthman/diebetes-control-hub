<?php
/**
 * JWT Token Handler
 * 
 * Handles JWT token generation and validation.
 * Uses HMAC SHA-256 for signing.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class JwtHandler {
    
    /**
     * Generate a new JWT token
     */
    public static function generateToken(array $payload, int $expiry = null): string {
        $expiry = $expiry ?? JWT_EXPIRY;
        
        $header = [
            'alg' => JWT_ALGORITHM,
            'typ' => 'JWT'
        ];
        
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiry;
        
        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac(
            'sha256',
            $headerEncoded . '.' . $payloadEncoded,
            JWT_SECRET,
            true
        );
        $signatureEncoded = self::base64UrlEncode($signature);
        
        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }
    
    /**
     * Generate a refresh token
     */
    public static function generateRefreshToken(int $userId): string {
        $payload = [
            'user_id' => $userId,
            'type' => 'refresh',
            'jti' => bin2hex(random_bytes(16)) // Unique token ID
        ];
        
        return self::generateToken($payload, JWT_REFRESH_EXPIRY);
    }
    
    /**
     * Validate and decode a JWT token
     */
    public static function validateToken(string $token): array|false {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }
        
        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;
        
        // Verify signature
        $expectedSignature = hash_hmac(
            'sha256',
            $headerEncoded . '.' . $payloadEncoded,
            JWT_SECRET,
            true
        );
        $expectedSignatureEncoded = self::base64UrlEncode($expectedSignature);
        
        if (!hash_equals($expectedSignatureEncoded, $signatureEncoded)) {
            return false;
        }
        
        // Decode payload
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        
        if ($payload === null) {
            return false;
        }
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
    
    /**
     * Extract token from Authorization header
     */
    public static function extractTokenFromHeader(): string|null {
        $headers = self::getAuthorizationHeader();
        
        if ($headers === null) {
            return null;
        }
        
        if (preg_match('/Bearer\s+(.+)$/i', $headers, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
    
    /**
     * Get Authorization header
     */
    private static function getAuthorizationHeader(): string|null {
        // Check various sources for the authorization header
        if (isset($_SERVER['Authorization'])) {
            return $_SERVER['Authorization'];
        }
        
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }
        
        // Apache specific
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                return $headers['Authorization'];
            }
            if (isset($headers['authorization'])) {
                return $headers['authorization'];
            }
        }
        
        // Check for rewritten header (common with mod_rewrite)
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        
        return null;
    }
    
    /**
     * Base64 URL-safe encoding
     */
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64 URL-safe decoding
     */
    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
    
    /**
     * Get token expiry timestamp
     */
    public static function getTokenExpiry(string $token): int|false {
        $payload = self::validateToken($token);
        
        if ($payload === false) {
            return false;
        }
        
        return $payload['exp'] ?? false;
    }
    
    /**
     * Check if token is about to expire (within 5 minutes)
     */
    public static function isTokenExpiring(string $token, int $threshold = 300): bool {
        $expiry = self::getTokenExpiry($token);
        
        if ($expiry === false) {
            return true;
        }
        
        return ($expiry - time()) < $threshold;
    }
}
