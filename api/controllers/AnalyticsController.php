<?php
/**
 * Analytics Controller
 * 
 * Handles admin dashboard analytics.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class AnalyticsController {
    
    /**
     * Get dashboard summary
     * GET /api/analytics/summary
     */
    public static function summary(): void {
        AuthMiddleware::requireAdmin();
        
        $userStats = User::getStats();
        $contentStats = EducationContent::getStats();
        
        // Get recent activity
        $stmt = Database::query(
            "SELECT COUNT(*) as active_users 
             FROM users 
             WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_active = TRUE"
        );
        $activeUsers = $stmt->fetch()['active_users'];
        
        // Get activity stats
        $stmt = Database::query(
            "SELECT 
                COUNT(DISTINCT user_id) as users_with_activity,
                COUNT(*) as total_activities,
                SUM(CASE WHEN activity_type = 'exercise' THEN value ELSE 0 END) as total_exercise_minutes
             FROM activity_logs 
             WHERE activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
        );
        $activityStats = $stmt->fetch();
        
        Response::success([
            'users' => [
                'total' => (int) $userStats['total_users'],
                'by_role' => [
                    'admin' => (int) $userStats['admin_count'],
                    'infected' => (int) $userStats['infected_count'],
                    'non_infected' => (int) $userStats['non_infected_count'],
                ],
                'pending_verification' => (int) $userStats['pending_verification'],
                'new_this_week' => (int) $userStats['new_this_week'],
                'active_this_week' => (int) $activeUsers,
            ],
            'content' => [
                'total' => (int) $contentStats['total_content'],
                'published' => (int) $contentStats['published'],
                'drafts' => (int) $contentStats['drafts'],
                'total_views' => (int) $contentStats['total_views'],
                'total_completions' => (int) $contentStats['total_completions'],
            ],
            'activity' => [
                'users_with_activity' => (int) $activityStats['users_with_activity'],
                'total_activities' => (int) $activityStats['total_activities'],
                'total_exercise_minutes' => (int) $activityStats['total_exercise_minutes'],
            ],
        ]);
    }
    
    /**
     * Get user registration trends
     * GET /api/analytics/users
     */
    public static function userTrends(): void {
        AuthMiddleware::requireAdmin();
        
        $days = Validator::sanitizeInt(Validator::getQuery('days', 30));
        $days = min(max($days, 7), 90);
        
        $trends = User::getRegistrationTrends($days);
        
        // Organize by date with role breakdown
        $organized = [];
        foreach ($trends as $row) {
            $date = $row['date'];
            if (!isset($organized[$date])) {
                $organized[$date] = [
                    'date' => $date,
                    'total' => 0,
                    'admin' => 0,
                    'infected' => 0,
                    'non_infected' => 0,
                ];
            }
            $organized[$date]['total'] += $row['count'];
            $roleKey = str_replace('-', '_', $row['role']);
            $organized[$date][$roleKey] = $row['count'];
        }
        
        Response::success([
            'trends' => array_values($organized),
            'days' => $days,
        ]);
    }
    
    /**
     * Get content engagement metrics
     * GET /api/analytics/content
     */
    public static function contentEngagement(): void {
        AuthMiddleware::requireAdmin();
        
        // Top viewed content
        $stmt = Database::query(
            "SELECT id, title, category, views, 
                    (SELECT COUNT(*) FROM user_progress up WHERE up.content_id = ec.id AND up.completed = TRUE) as completions
             FROM education_content ec
             WHERE status = 'published'
             ORDER BY views DESC
             LIMIT 10"
        );
        $topViewed = $stmt->fetchAll();
        
        // Content by category
        $stmt = Database::query(
            "SELECT category, 
                    COUNT(*) as count,
                    SUM(views) as total_views,
                    AVG(views) as avg_views
             FROM education_content 
             WHERE status = 'published'
             GROUP BY category
             ORDER BY total_views DESC"
        );
        $byCategory = $stmt->fetchAll();
        
        // Completion rate by category
        $stmt = Database::query(
            "SELECT ec.category,
                    COUNT(DISTINCT ec.id) as content_count,
                    COUNT(DISTINCT CASE WHEN up.completed = TRUE THEN up.id END) as completions
             FROM education_content ec
             LEFT JOIN user_progress up ON ec.id = up.content_id
             WHERE ec.status = 'published'
             GROUP BY ec.category"
        );
        $completionRates = $stmt->fetchAll();
        
        Response::success([
            'top_viewed' => $topViewed,
            'by_category' => $byCategory,
            'completion_rates' => $completionRates,
        ]);
    }
    
    /**
     * Get platform activity metrics
     * GET /api/analytics/activity
     */
    public static function platformActivity(): void {
        AuthMiddleware::requireAdmin();
        
        $days = Validator::sanitizeInt(Validator::getQuery('days', 30));
        $days = min(max($days, 7), 90);
        
        // Daily activity breakdown
        $stmt = Database::query(
            "SELECT 
                activity_date as date,
                activity_type,
                COUNT(*) as count,
                SUM(value) as total_value,
                SUM(COALESCE(calories_burned, 0)) as calories
             FROM activity_logs 
             WHERE activity_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY activity_date, activity_type
             ORDER BY activity_date ASC",
            [$days]
        );
        $dailyActivity = $stmt->fetchAll();
        
        // Activity type distribution
        $stmt = Database::query(
            "SELECT 
                activity_type,
                COUNT(*) as count,
                COUNT(DISTINCT user_id) as unique_users,
                SUM(value) as total_value
             FROM activity_logs 
             WHERE activity_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY activity_type",
            [$days]
        );
        $byType = $stmt->fetchAll();
        
        // Most active users
        $stmt = Database::query(
            "SELECT 
                u.id, u.name, u.role,
                COUNT(al.id) as activity_count,
                SUM(al.value) as total_value
             FROM users u
             JOIN activity_logs al ON u.id = al.user_id
             WHERE al.activity_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY u.id
             ORDER BY activity_count DESC
             LIMIT 10",
            [$days]
        );
        $mostActive = $stmt->fetchAll();
        
        Response::success([
            'daily_activity' => $dailyActivity,
            'by_type' => $byType,
            'most_active_users' => $mostActive,
            'days' => $days,
        ]);
    }
    
    /**
     * Get medication adherence metrics
     * GET /api/analytics/medication
     */
    public static function medicationMetrics(): void {
        AuthMiddleware::requireAdmin();
        
        $days = Validator::sanitizeInt(Validator::getQuery('days', 7));
        $days = min(max($days, 1), 30);
        
        // Overall adherence
        $stmt = Database::query(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken,
                SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed,
                SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
             FROM medication_schedule ms
             JOIN medications m ON ms.medication_id = m.id
             WHERE ms.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)",
            [$days]
        );
        $adherence = $stmt->fetch();
        
        // Daily adherence trend
        $stmt = Database::query(
            "SELECT 
                ms.scheduled_date as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken
             FROM medication_schedule ms
             JOIN medications m ON ms.medication_id = m.id
             WHERE ms.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY ms.scheduled_date
             ORDER BY ms.scheduled_date ASC",
            [$days]
        );
        $dailyTrend = $stmt->fetchAll();
        
        Response::success([
            'overall_adherence' => $adherence,
            'daily_trend' => $dailyTrend,
            'days' => $days,
        ]);
    }
    
    /**
     * Get glucose metrics
     * GET /api/analytics/glucose
     */
    public static function glucoseMetrics(): void {
        AuthMiddleware::requireAdmin();
        
        $days = Validator::sanitizeInt(Validator::getQuery('days', 30));
        $days = min(max($days, 7), 90);
        
        // Overall stats
        $stmt = Database::query(
            "SELECT 
                COUNT(*) as total_readings,
                AVG(value) as avg_value,
                MIN(value) as min_value,
                MAX(value) as max_value,
                COUNT(DISTINCT user_id) as users_logging
             FROM glucose_readings 
             WHERE reading_time >= DATE_SUB(NOW(), INTERVAL ? DAY)",
            [$days]
        );
        $overallStats = $stmt->fetch();
        
        // Distribution in ranges
        $stmt = Database::query(
            "SELECT 
                SUM(CASE WHEN value < 70 THEN 1 ELSE 0 END) as low,
                SUM(CASE WHEN value BETWEEN 70 AND 180 THEN 1 ELSE 0 END) as in_range,
                SUM(CASE WHEN value > 180 THEN 1 ELSE 0 END) as high
             FROM glucose_readings 
             WHERE reading_time >= DATE_SUB(NOW(), INTERVAL ? DAY)",
            [$days]
        );
        $distribution = $stmt->fetch();
        
        // Daily averages
        $stmt = Database::query(
            "SELECT 
                DATE(reading_time) as date,
                AVG(value) as avg_value,
                COUNT(*) as readings
             FROM glucose_readings 
             WHERE reading_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY DATE(reading_time)
             ORDER BY date ASC",
            [$days]
        );
        $dailyAverages = $stmt->fetchAll();
        
        Response::success([
            'overall' => $overallStats,
            'distribution' => $distribution,
            'daily_averages' => $dailyAverages,
            'days' => $days,
        ]);
    }
}
