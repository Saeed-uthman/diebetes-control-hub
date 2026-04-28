<?php
/**
 * Application Configuration
 * 
 * This file contains all environment-specific configuration.
 * For production, update these values or use environment variables.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

// Environment: 'development' or 'production'
define('ENVIRONMENT', getenv('APP_ENV') ?: 'development');

// Database Configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'diabetes_app');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// JWT Configuration
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'your-super-secret-jwt-key-change-in-production');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRY', 3600); // 1 hour in seconds
define('JWT_REFRESH_EXPIRY', 604800); // 7 days in seconds

// API Configuration
define('API_VERSION', '1.0.0');
define('API_BASE_URL', getenv('API_BASE_URL') ?: 'http://localhost/api');

// CORS Configuration - Add your frontend URLs
$ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
    'https://id-preview--0d454082-53f0-44f9-ad24-888d586b5109.lovable.app',
    'https://glycemic-wellness-hub.lovable.app',
];

// Password Hashing
define('PASSWORD_COST', 12);

// Pagination Defaults
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// File Upload Configuration
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_FILE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// Rate Limiting (requests per minute)
define('RATE_LIMIT_ENABLED', ENVIRONMENT === 'production');
define('RATE_LIMIT_REQUESTS', 60);
define('RATE_LIMIT_WINDOW', 60); // seconds

// Error Reporting based on environment
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', __DIR__ . '/../logs/error.log');
}

// Timezone
date_default_timezone_set('UTC');

// Session Configuration
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_secure', ENVIRONMENT === 'production' ? '1' : '0');
ini_set('session.use_strict_mode', '1');

// SMTP / Email Configuration
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp.gmail.com');
define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: 587));
define('SMTP_USERNAME', getenv('SMTP_USERNAME') ?: '');
define('SMTP_PASSWORD', getenv('SMTP_PASSWORD') ?: '');
define('SMTP_ENCRYPTION', getenv('SMTP_ENCRYPTION') ?: 'tls'); // 'tls' or 'ssl'
define('MAIL_FROM_ADDRESS', getenv('MAIL_FROM_ADDRESS') ?: 'noreply@diabetescare.com');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'DiabetesCare');

// Frontend URL for email links
define('FRONTEND_URL', getenv('FRONTEND_URL') ?: 'http://localhost:5173');
