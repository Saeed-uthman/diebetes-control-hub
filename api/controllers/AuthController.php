<?php
/**
 * Authentication Controller
 * 
 * Handles login, register, logout, and token refresh.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class AuthController {
    
    /**
     * Handle login request
     * POST /api/auth/login
     */
    public static function login(): void {
        $data = Validator::getJsonBody();
        
        // Validate input
        $validator = Validator::make($data)
            ->required('email')
            ->email('email')
            ->required('password');
        
        $validator->validate();
        
        // Find user
        $user = User::findByEmail($data['email']);
        
        if (!$user) {
            Response::error('Invalid email or password', 'INVALID_CREDENTIALS', 401);
        }
        
        // Verify password
        if (!User::verifyPassword($data['password'], $user['password_hash'])) {
            Response::error('Invalid email or password', 'INVALID_CREDENTIALS', 401);
        }
        
        // Check if user is active
        if (!$user['is_active']) {
            Response::error('Your account has been deactivated', 'ACCOUNT_DEACTIVATED', 401);
        }
        
        // Generate tokens
        $accessToken = JwtHandler::generateToken([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
        ]);
        
        $refreshToken = JwtHandler::generateRefreshToken($user['id']);
        
        // Store refresh token
        self::storeRefreshToken($user['id'], $refreshToken);
        
        // Update last login
        User::updateLastLogin($user['id']);
        
        // Return response
        Response::success([
            'user' => User::formatForResponse($user),
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => JWT_EXPIRY,
        ], 'Login successful');
    }
    
    /**
     * Handle registration request
     * POST /api/auth/register
     */
    public static function register(): void {
        $data = Validator::getJsonBody();
        
        // Validate input
        $validator = Validator::make($data)
            ->required('email')
            ->email('email')
            ->maxLength('email', 255)
            ->required('password')
            ->password('password')
            ->required('name')
            ->minLength('name', 2)
            ->maxLength('name', 100)
            ->required('role')
            ->in('role', ['admin', 'infected', 'non-infected']);
        
        $validator->validate();
        
        // Check if email exists
        if (User::emailExists($data['email'])) {
            Response::error('An account with this email already exists', 'EMAIL_EXISTS', 409);
        }
        
        // Create user
        try {
            $userId = User::create([
                'email' => $data['email'],
                'password' => $data['password'],
                'name' => $data['name'],
                'role' => $data['role'],
            ]);
            
            // Fetch created user
            $user = User::findById($userId);
            
            // Generate email verification token
            $verificationToken = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            Database::query(
                "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
                [$userId, $verificationToken, $expiresAt]
            );
            
            // Send verification email
            Mailer::sendEmailVerification($user['email'], $user['name'], $verificationToken);
            
            // Generate tokens (user can log in but verified=false until email confirmed)
            $accessToken = JwtHandler::generateToken([
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
            ]);
            
            $refreshToken = JwtHandler::generateRefreshToken($user['id']);
            
            // Store refresh token
            self::storeRefreshToken($userId, $refreshToken);
            
            Response::created([
                'user' => User::formatForResponse($user),
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_in' => JWT_EXPIRY,
                'requires_verification' => true,
            ], 'Registration successful. Please check your email to verify your account.');
            
        } catch (Exception $e) {
            error_log('Registration error: ' . $e->getMessage());
            Response::serverError('Registration failed. Please try again.');
        }
    }
    
    /**
     * Verify email address using token
     * POST /api/auth/verify-email
     */
    public static function verifyEmail(): void {
        $data = Validator::getJsonBody();
        
        $validator = Validator::make($data)
            ->required('token');
        $validator->validate();
        
        $token = $data['token'];
        
        // Find valid token
        $stmt = Database::query(
            "SELECT * FROM email_verification_tokens 
             WHERE token = ? AND expires_at > NOW() AND used_at IS NULL 
             LIMIT 1",
            [$token]
        );
        $tokenRow = $stmt->fetch();
        
        if (!$tokenRow) {
            Response::error('Invalid or expired verification token', 'INVALID_TOKEN', 400);
        }
        
        // Mark user as verified
        User::verify($tokenRow['user_id']);
        
        // Mark token as used
        Database::query(
            "UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?",
            [$tokenRow['id']]
        );
        
        Response::success(null, 'Email verified successfully');
    }

    /**
     * Resend email verification
     * POST /api/auth/resend-verification
     */
    public static function resendVerification(): void {
        $user = AuthMiddleware::requireAuth();
        
        $fullUser = User::findById($user['id']);
        
        if ($fullUser['verified']) {
            Response::error('Email is already verified', 'ALREADY_VERIFIED', 400);
        }
        
        // Invalidate old tokens
        Database::query(
            "UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
            [$user['id']]
        );
        
        // Generate new token
        $verificationToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        Database::query(
            "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            [$user['id'], $verificationToken, $expiresAt]
        );
        
        // Send verification email
        Mailer::sendEmailVerification($fullUser['email'], $fullUser['name'], $verificationToken);
        
        Response::success(null, 'Verification email sent');
    }

    /**
     * Get current authenticated user
     * GET /api/auth/me
     */
    public static function me(): void {
        $user = AuthMiddleware::requireAuth();
        
        // Get full user details
        $fullUser = User::findById($user['id']);
        $settings = User::getSettings($user['id']);
        
        Response::success([
            'user' => User::formatForResponse($fullUser),
            'settings' => $settings,
        ]);
    }
    
    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    public static function refresh(): void {
        $data = Validator::getJsonBody();
        
        if (empty($data['refresh_token'])) {
            Response::error('Refresh token is required', 'MISSING_TOKEN', 400);
        }
        
        $payload = JwtHandler::validateToken($data['refresh_token']);
        
        if ($payload === false) {
            Response::error('Invalid or expired refresh token', 'INVALID_TOKEN', 401);
        }
        
        if (!isset($payload['type']) || $payload['type'] !== 'refresh') {
            Response::error('Invalid token type', 'INVALID_TOKEN', 401);
        }
        
        // Verify token is in database and not revoked
        $stmt = Database::query(
            "SELECT * FROM refresh_tokens 
             WHERE user_id = ? AND token = ? AND revoked = FALSE AND expires_at > NOW()",
            [$payload['user_id'], $data['refresh_token']]
        );
        
        if (!$stmt->fetch()) {
            Response::error('Refresh token has been revoked', 'TOKEN_REVOKED', 401);
        }
        
        // Get user
        $user = User::findById($payload['user_id']);
        
        if (!$user || !$user['is_active']) {
            Response::error('User not found or inactive', 'USER_INACTIVE', 401);
        }
        
        // Generate new access token
        $accessToken = JwtHandler::generateToken([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
        ]);
        
        Response::success([
            'access_token' => $accessToken,
            'expires_in' => JWT_EXPIRY,
        ], 'Token refreshed successfully');
    }
    
    /**
     * Logout user
     * POST /api/auth/logout
     */
    public static function logout(): void {
        $user = AuthMiddleware::requireAuth();
        $data = Validator::getJsonBody();
        
        // Revoke refresh token if provided
        if (!empty($data['refresh_token'])) {
            Database::query(
                "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ? AND token = ?",
                [$user['id'], $data['refresh_token']]
            );
        } else {
            // Revoke all refresh tokens for this user
            Database::query(
                "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?",
                [$user['id']]
            );
        }
        
        Response::success(null, 'Logged out successfully');
    }
    
    /**
     * Store refresh token in database
     */
    private static function storeRefreshToken(int $userId, string $token): void {
        $payload = JwtHandler::validateToken($token);
        $expiresAt = date('Y-m-d H:i:s', $payload['exp']);
        
        Database::query(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            [$userId, $token, $expiresAt]
        );
        
        // Clean up old expired tokens
        Database::query(
            "DELETE FROM refresh_tokens WHERE expires_at < NOW() OR (user_id = ? AND revoked = TRUE)",
            [$userId]
        );
    }
    
    /**
     * Update current user profile
     * PUT /api/auth/profile
     */
    public static function updateProfile(): void {
        $user = AuthMiddleware::requireAuth();
        $data = Validator::getJsonBody();
        
        $validator = Validator::make($data)
            ->minLength('name', 2)
            ->maxLength('name', 100)
            ->url('avatar');
        
        $validator->validate();
        
        $updateData = [];
        if (isset($data['name'])) {
            $updateData['name'] = Validator::sanitizeString($data['name']);
        }
        if (isset($data['avatar'])) {
            $updateData['avatar'] = $data['avatar'];
        }
        
        if (!empty($updateData)) {
            User::update($user['id'], $updateData);
        }
        
        $updatedUser = User::findById($user['id']);
        Response::success(['user' => User::formatForResponse($updatedUser)], 'Profile updated successfully');
    }
    
    /**
     * Update current user password
     * PUT /api/auth/password
     */
    public static function updatePassword(): void {
        $user = AuthMiddleware::requireAuth();
        $data = Validator::getJsonBody();
        
        $validator = Validator::make($data)
            ->required('current_password')
            ->required('new_password')
            ->password('new_password');
        
        $validator->validate();
        
        // Get user with password hash
        $fullUser = User::findByEmail($user['email']);
        
        // Verify current password
        if (!User::verifyPassword($data['current_password'], $fullUser['password_hash'])) {
            Response::error('Current password is incorrect', 'INVALID_PASSWORD', 400);
        }
        
        // Update password
        User::updatePassword($user['id'], $data['new_password']);
        
        // Revoke all refresh tokens (force re-login on other devices)
        Database::query(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?",
            [$user['id']]
        );
        
        Response::success(null, 'Password updated successfully');
    }
    
    /**
     * Update user settings
     * PUT /api/auth/settings
     */
    public static function updateSettings(): void {
        $user = AuthMiddleware::requireAuth();
        $data = Validator::getJsonBody();
        
        $validator = Validator::make($data)
            ->boolean('notifications_email')
            ->boolean('notifications_push')
            ->boolean('notifications_medication')
            ->boolean('notifications_glucose')
            ->boolean('notifications_appointments')
            ->in('theme', ['light', 'dark', 'system'])
            ->boolean('compact_mode');
        
        $validator->validate();
        
        User::updateSettings($user['id'], $data);
        
        $settings = User::getSettings($user['id']);
        Response::success(['settings' => $settings], 'Settings updated successfully');
    }

    /**
     * Request password reset
     * POST /api/auth/forgot-password
     */
    public static function forgotPassword(): void {
        $data = Validator::getJsonBody();

        $validator = Validator::make($data)
            ->required('email')
            ->email('email');
        $validator->validate();

        $user = User::findByEmail($data['email']);

        // Always return success to prevent email enumeration
        if (!$user || !$user['is_active']) {
            Response::success(null, 'If an account with that email exists, a password reset link has been sent.');
            return;
        }

        // Generate a secure random token
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Delete any existing tokens for this user
        Database::query(
            "DELETE FROM password_reset_tokens WHERE user_id = ?",
            [$user['id']]
        );

        // Store new token
        Database::query(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            [$user['id'], $token, $expiresAt]
        );

        // Send password reset email
        $emailSent = Mailer::sendPasswordReset($user['email'], $user['name'], $token);

        if (!$emailSent) {
            error_log("Failed to send password reset email to {$data['email']}. Token: {$token}");
        }

        Response::success([
            'token' => ENVIRONMENT === 'development' ? $token : null,
        ], 'If an account with that email exists, a password reset link has been sent.');
    }

    /**
     * Reset password using token
     * POST /api/auth/reset-password
     */
    public static function resetPassword(): void {
        $data = Validator::getJsonBody();

        $validator = Validator::make($data)
            ->required('token')
            ->required('password')
            ->password('password');
        $validator->validate();

        // Look up token
        $stmt = Database::query(
            "SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()",
            [$data['token']]
        );
        $resetToken = $stmt->fetch();

        if (!$resetToken) {
            Response::error('Invalid or expired reset token', 'INVALID_TOKEN', 400);
            return;
        }

        // Update password
        User::updatePassword($resetToken['user_id'], $data['password']);

        // Mark token as used
        Database::query(
            "UPDATE password_reset_tokens SET used = TRUE WHERE id = ?",
            [$resetToken['id']]
        );

        // Revoke all refresh tokens
        Database::query(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?",
            [$resetToken['user_id']]
        );

        Response::success(null, 'Password has been reset successfully. Please log in with your new password.');
    }
}
