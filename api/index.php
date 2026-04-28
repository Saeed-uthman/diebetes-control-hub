<?php
/**
 * API Router / Entry Point
 * 
 * Handles all incoming API requests and routes them to appropriate controllers.
 */

define('API_ACCESS', true);

// Load configuration
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';

// Load utilities
require_once __DIR__ . '/utils/JwtHandler.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/Validator.php';
require_once __DIR__ . '/utils/Mailer.php';

// Load middleware
require_once __DIR__ . '/middleware/CorsMiddleware.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// Load models
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/models/Medication.php';
require_once __DIR__ . '/models/GlucoseReading.php';
require_once __DIR__ . '/models/Recipe.php';
require_once __DIR__ . '/models/Exercise.php';
require_once __DIR__ . '/models/EducationContent.php';
require_once __DIR__ . '/models/Notification.php';

// Load controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/MedicationController.php';
require_once __DIR__ . '/controllers/GlucoseController.php';
require_once __DIR__ . '/controllers/RecipeController.php';
require_once __DIR__ . '/controllers/ExerciseController.php';
require_once __DIR__ . '/controllers/EducationController.php';
require_once __DIR__ . '/controllers/NotificationController.php';
require_once __DIR__ . '/controllers/AnalyticsController.php';

// Handle CORS
CorsMiddleware::handle();

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove /api prefix if present
$uri = preg_replace('#^/api#', '', $uri);
$uri = rtrim($uri, '/');

// Route the request
try {
    route($method, $uri);
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    Response::serverError(ENVIRONMENT === 'development' ? $e->getMessage() : 'An error occurred');
}

/**
 * Main router function
 */
function route(string $method, string $uri): void {
    // Health check
    if ($uri === '' || $uri === '/health') {
        Response::success(['status' => 'ok', 'version' => API_VERSION], 'API is running');
    }

    // Auth routes
    if (preg_match('#^/auth/(.+)$#', $uri, $matches)) {
        $action = $matches[1];
        switch ("$method:$action") {
            case 'POST:login': AuthController::login(); break;
            case 'POST:register': AuthController::register(); break;
            case 'GET:me': AuthController::me(); break;
            case 'POST:refresh': AuthController::refresh(); break;
            case 'POST:logout': AuthController::logout(); break;
            case 'PUT:profile': AuthController::updateProfile(); break;
            case 'PUT:password': AuthController::updatePassword(); break;
            case 'PUT:settings': AuthController::updateSettings(); break;
            case 'POST:forgot-password': AuthController::forgotPassword(); break;
            case 'POST:reset-password': AuthController::resetPassword(); break;
            case 'POST:verify-email': AuthController::verifyEmail(); break;
            case 'POST:resend-verification': AuthController::resendVerification(); break;
            default: Response::notFound('Auth endpoint not found');
        }
        return;
    }

    // Users routes (Admin)
    if (preg_match('#^/users(?:/(\d+))?(?:/(.+))?$#', $uri, $matches)) {
        $id = isset($matches[1]) ? (int)$matches[1] : null;
        $action = $matches[2] ?? null;
        
        if ($id === null && $action === null) {
            if ($method === 'GET') { UserController::index(); return; }
        } elseif ($id !== null && $action === null) {
            switch ($method) {
                case 'GET': UserController::show($id); return;
                case 'PUT': UserController::update($id); return;
                case 'DELETE': UserController::destroy($id); return;
            }
        } elseif ($id !== null && $action === 'verify' && $method === 'PUT') {
            UserController::verify($id); return;
        } elseif ($id !== null && $action === 'role' && $method === 'PUT') {
            UserController::changeRole($id); return;
        } elseif ($id === null && $action === 'stats' && $method === 'GET') {
            UserController::stats(); return;
        } elseif ($id === null && $action === 'pending' && $method === 'GET') {
            UserController::pending(); return;
        }
        Response::notFound('Users endpoint not found');
        return;
    }

    // Medications routes
    if (preg_match('#^/medications(?:/schedule)?(?:/(\d+))?$#', $uri, $matches)) {
        $hasSchedule = strpos($uri, '/schedule') !== false;
        $id = isset($matches[1]) ? (int)$matches[1] : null;
        
        if ($hasSchedule) {
            if ($id === null && $method === 'GET') { MedicationController::schedule(); return; }
            if ($id !== null && $method === 'PUT') { MedicationController::updateSchedule($id); return; }
        } else {
            if ($id === null && $method === 'GET') { MedicationController::index(); return; }
            if ($id === null && $method === 'POST') { MedicationController::store(); return; }
            if ($id !== null && $method === 'GET') { MedicationController::show($id); return; }
            if ($id !== null && $method === 'PUT') { MedicationController::update($id); return; }
            if ($id !== null && $method === 'DELETE') { MedicationController::destroy($id); return; }
        }
        Response::notFound('Medications endpoint not found');
        return;
    }
    
    if ($uri === '/medications/stats' && $method === 'GET') {
        MedicationController::stats(); return;
    }

    // Glucose routes
    if (preg_match('#^/glucose(?:/(\d+|stats|trends|today))?$#', $uri, $matches)) {
        $param = $matches[1] ?? null;
        
        if ($param === null && $method === 'GET') { GlucoseController::index(); return; }
        if ($param === null && $method === 'POST') { GlucoseController::store(); return; }
        if ($param === 'stats' && $method === 'GET') { GlucoseController::stats(); return; }
        if ($param === 'trends' && $method === 'GET') { GlucoseController::trends(); return; }
        if ($param === 'today' && $method === 'GET') { GlucoseController::today(); return; }
        if (is_numeric($param) && $method === 'DELETE') { GlucoseController::destroy((int)$param); return; }
        
        Response::notFound('Glucose endpoint not found');
        return;
    }

    // Recipes routes
    if (preg_match('#^/recipes(?:/(\d+|categories))?$#', $uri, $matches)) {
        $param = $matches[1] ?? null;
        
        if ($param === null && $method === 'GET') { RecipeController::index(); return; }
        if ($param === null && $method === 'POST') { RecipeController::store(); return; }
        if ($param === 'categories' && $method === 'GET') { RecipeController::categories(); return; }
        if (is_numeric($param) && $method === 'GET') { RecipeController::show((int)$param); return; }
        if (is_numeric($param) && $method === 'PUT') { RecipeController::update((int)$param); return; }
        if (is_numeric($param) && $method === 'DELETE') { RecipeController::destroy((int)$param); return; }
        
        Response::notFound('Recipes endpoint not found');
        return;
    }

    // Exercises routes
    if (preg_match('#^/exercises(?:/(\d+|categories))?$#', $uri, $matches)) {
        $param = $matches[1] ?? null;
        
        if ($param === null && $method === 'GET') { ExerciseController::index(); return; }
        if ($param === 'categories' && $method === 'GET') { ExerciseController::categories(); return; }
        if (is_numeric($param) && $method === 'GET') { ExerciseController::show((int)$param); return; }
        
        Response::notFound('Exercises endpoint not found');
        return;
    }

    // Activity routes
    if (preg_match('#^/activity(?:/(\d+|weekly|stats))?$#', $uri, $matches)) {
        $param = $matches[1] ?? null;
        
        if ($param === null && $method === 'GET') { ExerciseController::activityIndex(); return; }
        if ($param === null && $method === 'POST') { ExerciseController::logActivity(); return; }
        if ($param === 'weekly' && $method === 'GET') { ExerciseController::weeklySummary(); return; }
        if ($param === 'stats' && $method === 'GET') { ExerciseController::stats(); return; }
        if (is_numeric($param) && $method === 'DELETE') { ExerciseController::deleteActivity((int)$param); return; }
        
        Response::notFound('Activity endpoint not found');
        return;
    }

    // Education routes
    if (preg_match('#^/education(?:/(\d+|categories|completed))?(?:/progress)?$#', $uri, $matches)) {
        $param = $matches[1] ?? null;
        $hasProgress = strpos($uri, '/progress') !== false;
        
        if ($param === null && $method === 'GET') { EducationController::index(); return; }
        if ($param === null && $method === 'POST') { EducationController::store(); return; }
        if ($param === 'categories' && $method === 'GET') { EducationController::categories(); return; }
        if ($param === 'completed' && $method === 'GET') { EducationController::completed(); return; }
        if (is_numeric($param) && !$hasProgress && $method === 'GET') { EducationController::show((int)$param); return; }
        if (is_numeric($param) && !$hasProgress && $method === 'PUT') { EducationController::update((int)$param); return; }
        if (is_numeric($param) && $hasProgress && $method === 'PUT') { EducationController::updateProgress((int)$param); return; }
        
        Response::notFound('Education endpoint not found');
        return;
    }

    // Notifications routes
    if (preg_match('#^/notifications(?:/(\d+|read-all|unread-count|preferences|medication-reminder|glucose-alert))?(?:/read)?$#', $uri, $matches)) {
        $param = $matches[1] ?? null;
        $hasRead = strpos($uri, '/read') !== false && $param !== 'read-all';
        
        if ($param === null && $method === 'GET') { NotificationController::index(); return; }
        if ($param === 'read-all' && $method === 'PUT') { NotificationController::markAllRead(); return; }
        if ($param === 'unread-count' && $method === 'GET') { NotificationController::unreadCount(); return; }
        if ($param === 'preferences' && $method === 'GET') { NotificationController::preferences(); return; }
        if ($param === 'preferences' && $method === 'PUT') { NotificationController::updatePreferences(); return; }
        if ($param === 'medication-reminder' && $method === 'POST') { NotificationController::sendMedicationReminder(); return; }
        if ($param === 'glucose-alert' && $method === 'POST') { NotificationController::sendGlucoseAlert(); return; }
        if (is_numeric($param) && $hasRead && $method === 'PUT') { NotificationController::markRead((int)$param); return; }
        if (is_numeric($param) && !$hasRead && $method === 'DELETE') { NotificationController::destroy((int)$param); return; }
        
        Response::notFound('Notifications endpoint not found');
        return;
    }

    // Analytics routes (Admin)
    if (preg_match('#^/analytics/(.+)$#', $uri, $matches)) {
        $action = $matches[1];
        if ($method === 'GET') {
            switch ($action) {
                case 'summary': AnalyticsController::summary(); return;
                case 'users': AnalyticsController::userTrends(); return;
                case 'content': AnalyticsController::contentEngagement(); return;
                case 'activity': AnalyticsController::platformActivity(); return;
                case 'medication': AnalyticsController::medicationMetrics(); return;
                case 'glucose': AnalyticsController::glucoseMetrics(); return;
            }
        }
        Response::notFound('Analytics endpoint not found');
        return;
    }

    Response::notFound('Endpoint not found');
}
