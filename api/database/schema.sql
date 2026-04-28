-- Diabetes Prevention and Control Application Database Schema
-- MySQL 8.0+ / MariaDB 10.5+

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS diabetes_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE diabetes_app;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'infected', 'non-infected') NOT NULL DEFAULT 'non-infected',
    avatar VARCHAR(500) DEFAULT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_verified (verified),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INT UNSIGNED PRIMARY KEY,
    notifications_email BOOLEAN DEFAULT TRUE,
    notifications_push BOOLEAN DEFAULT TRUE,
    notifications_medication BOOLEAN DEFAULT TRUE,
    notifications_glucose BOOLEAN DEFAULT TRUE,
    notifications_appointments BOOLEAN DEFAULT TRUE,
    theme ENUM('light', 'dark', 'system') DEFAULT 'system',
    compact_mode BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- REFRESH TOKENS TABLE (for JWT refresh)
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MEDICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS medications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    times JSON NOT NULL COMMENT 'Array of time strings like ["08:00", "20:00"]',
    instructions TEXT DEFAULT NULL,
    color VARCHAR(50) DEFAULT 'blue',
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    refill_date DATE DEFAULT NULL,
    prescribed_by VARCHAR(200) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_start_date (start_date),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MEDICATION SCHEDULE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS medication_schedule (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    medication_id INT UNSIGNED NOT NULL,
    scheduled_time TIME NOT NULL,
    scheduled_date DATE NOT NULL,
    status ENUM('pending', 'taken', 'missed', 'skipped') DEFAULT 'pending',
    taken_at TIMESTAMP NULL DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_medication_id (medication_id),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_status (status),
    UNIQUE KEY unique_schedule (medication_id, scheduled_time, scheduled_date),
    
    FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- GLUCOSE READINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS glucose_readings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    value DECIMAL(5,1) NOT NULL COMMENT 'Blood glucose in mg/dL',
    reading_type ENUM('fasting', 'before_meal', 'after_meal', 'bedtime', 'random') NOT NULL,
    reading_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_reading_time (reading_time),
    INDEX idx_reading_type (reading_type),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- RECIPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS recipes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    image VARCHAR(500) DEFAULT NULL,
    prep_time INT NOT NULL COMMENT 'Preparation time in minutes',
    cook_time INT NOT NULL COMMENT 'Cooking time in minutes',
    servings INT NOT NULL DEFAULT 4,
    calories INT NOT NULL,
    macros JSON NOT NULL COMMENT '{"protein": 25, "carbs": 30, "fat": 10, "fiber": 5}',
    category ENUM('breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'beverage') NOT NULL,
    tags JSON DEFAULT NULL COMMENT 'Array of tags like ["low-carb", "high-fiber"]',
    ingredients JSON NOT NULL COMMENT 'Array of ingredient objects',
    instructions JSON NOT NULL COMMENT 'Array of instruction steps',
    diabetes_friendly BOOLEAN DEFAULT TRUE,
    glycemic_index ENUM('low', 'medium', 'high') DEFAULT 'low',
    created_by INT UNSIGNED DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_diabetes_friendly (diabetes_friendly),
    INDEX idx_glycemic_index (glycemic_index),
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EXERCISES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS exercises (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    calories_burned INT NOT NULL COMMENT 'Estimated calories burned',
    category ENUM('cardio', 'strength', 'flexibility', 'balance', 'hiit', 'walking', 'swimming') NOT NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
    equipment JSON DEFAULT NULL COMMENT 'Array of required equipment',
    instructions JSON NOT NULL COMMENT 'Array of instruction steps',
    benefits JSON DEFAULT NULL COMMENT 'Array of health benefits',
    precautions TEXT DEFAULT NULL,
    image VARCHAR(500) DEFAULT NULL,
    video_url VARCHAR(500) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    exercise_id INT UNSIGNED DEFAULT NULL,
    activity_type ENUM('exercise', 'steps', 'distance', 'calories', 'custom') NOT NULL,
    activity_name VARCHAR(200) DEFAULT NULL,
    value DECIMAL(10,2) NOT NULL COMMENT 'Duration in minutes, steps count, distance in km, etc.',
    calories_burned INT DEFAULT NULL,
    activity_date DATE NOT NULL,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_activity_date (activity_date),
    INDEX idx_activity_type (activity_type),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- EDUCATION CONTENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS education_content (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    content LONGTEXT NOT NULL COMMENT 'Full article content in HTML or Markdown',
    category ENUM('basics', 'nutrition', 'medication', 'exercise', 'monitoring', 'complications', 'lifestyle', 'prevention') NOT NULL,
    content_type ENUM('article', 'video', 'infographic', 'quiz', 'guide') NOT NULL DEFAULT 'article',
    target_audience JSON NOT NULL COMMENT 'Array of roles: ["infected", "non-infected", "admin"]',
    author VARCHAR(200) DEFAULT NULL,
    author_id INT UNSIGNED DEFAULT NULL,
    thumbnail VARCHAR(500) DEFAULT NULL,
    video_url VARCHAR(500) DEFAULT NULL,
    read_time INT DEFAULT NULL COMMENT 'Estimated read time in minutes',
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP NULL DEFAULT NULL,
    views INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_content_type (content_type),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at),
    
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER PROGRESS TABLE (for education content)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    content_id INT UNSIGNED NOT NULL,
    progress INT DEFAULT 0 COMMENT 'Progress percentage 0-100',
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_content (user_id, content_id),
    INDEX idx_user_id (user_id),
    INDEX idx_completed (completed),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES education_content(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type ENUM('medication', 'glucose', 'appointment', 'education', 'system', 'achievement') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500) DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TRIGGER: Auto-create user settings on user insert
-- =====================================================
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_settings (user_id) VALUES (NEW.id);
END//
DELIMITER ;

-- =====================================================
-- VIEW: User Dashboard Stats
-- =====================================================
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.id AS user_id,
    u.name,
    u.role,
    (SELECT COUNT(*) FROM medications m WHERE m.user_id = u.id AND m.is_active = TRUE) AS active_medications,
    (SELECT COUNT(*) FROM glucose_readings gr WHERE gr.user_id = u.id AND DATE(gr.reading_time) = CURDATE()) AS todays_readings,
    (SELECT AVG(gr.value) FROM glucose_readings gr WHERE gr.user_id = u.id AND gr.reading_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS avg_glucose_7days,
    (SELECT COUNT(*) FROM activity_logs al WHERE al.user_id = u.id AND al.activity_date = CURDATE()) AS todays_activities,
    (SELECT COUNT(*) FROM notifications n WHERE n.user_id = u.id AND n.is_read = FALSE) AS unread_notifications
FROM users u
WHERE u.is_active = TRUE;
