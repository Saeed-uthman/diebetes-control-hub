# DiabetesCare App — Complete Setup & Integration Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Setup (PHP API)](#backend-setup)
4. [Frontend Setup (React)](#frontend-setup)
5. [Endpoint Mapping Reference](#endpoint-mapping-reference)
6. [Authentication Flow](#authentication-flow)
7. [Deployment Guide](#deployment-guide)
8. [Test Credentials](#test-credentials)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────┐     HTTP/JSON      ┌──────────────────────┐     PDO      ┌─────────────┐
│  React Frontend     │ ◄──────────────────► │   PHP REST API       │ ◄───────────► │   MySQL DB  │
│  (Vite + TypeScript)│   JWT Auth Bearer   │   (index.php router) │  Parameterized│             │
│                     │                      │                      │   Queries     │             │
└─────────────────────┘                      └──────────────────────┘               └─────────────┘
```

**Frontend:** React 18 + TypeScript + Tailwind CSS + Vite  
**Backend:** PHP 8.0+ REST API with JWT (HS256) authentication  
**Database:** MySQL 8.0+ / MariaDB 10.5+  

---

## Prerequisites

| Component | Version | Notes |
|-----------|---------|-------|
| PHP | 8.0+ | With PDO MySQL extension |
| MySQL | 8.0+ | Or MariaDB 10.5+ |
| Apache | 2.4+ | With `mod_rewrite` enabled |
| Node.js | 18+ | For frontend development |
| Bun / npm | Latest | Package manager |

---

## Backend Setup

### Step 1: Create MySQL Database

```sql
CREATE DATABASE diabetes_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'diabetes_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON diabetes_app.* TO 'diabetes_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Import Schema and Seed Data

```bash
mysql -u diabetes_user -p diabetes_app < api/database/schema.sql
mysql -u diabetes_user -p diabetes_app < api/database/seed.sql
```

### Step 3: Configure API

Edit `api/config/config.php`:

```php
// Database
define('DB_HOST', 'localhost');
define('DB_NAME', 'diabetes_app');
define('DB_USER', 'diabetes_user');
define('DB_PASS', 'your_secure_password');

// JWT Secret — generate a random 64-character string for production
define('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production');

// Environment
define('ENVIRONMENT', 'development'); // Change to 'production' for live

// CORS — add your frontend URL
$ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://your-production-domain.com',
];
```

### Step 4: Configure Apache

Ensure `mod_rewrite` is enabled. The `.htaccess` file in `api/` handles URL rewriting automatically:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

### Step 5: Verify API

```bash
# Using PHP built-in server (for development)
cd api
php -S localhost:8000

# Test health check
curl http://localhost:8000/health
# Expected: {"success":true,"data":{"status":"ok","version":"1.0.0"},"message":"API is running"}
```

---

## Frontend Setup

### Step 1: Install Dependencies

```bash
bun install
# or
npm install
```

### Step 2: Configure Environment

Create a `.env` file in the project root:

```env
# Local development with XAMPP/MAMP
VITE_API_URL=http://localhost/diabetes-api/api

# Or with PHP built-in server
VITE_API_URL=http://localhost:8000

# For production
VITE_API_URL=https://your-domain.com/api
```

### Step 3: Start Development Server

```bash
bun run dev
# or
npm run dev
```

---

## Endpoint Mapping Reference

Every frontend service method maps directly to a backend route. Here is the **complete mapping**:

### Authentication (`authService` → `AuthController`)

| Frontend Method | HTTP | Backend Endpoint | Description |
|----------------|------|-----------------|-------------|
| `authService.login()` | `POST` | `/auth/login` | Login with email/password |
| `authService.register()` | `POST` | `/auth/register` | Register new user |
| `authService.getCurrentUser()` | `GET` | `/auth/me` | Get authenticated user profile |
| `authService.refreshToken()` | `POST` | `/auth/refresh` | Refresh JWT access token |
| `authService.logout()` | `POST` | `/auth/logout` | Invalidate refresh token |
| `authService.updateProfile()` | `PUT` | `/auth/profile` | Update name, email, avatar |
| `authService.updatePassword()` | `PUT` | `/auth/password` | Change password |
| `authService.updateSettings()` | `PUT` | `/auth/settings` | Update theme, notifications |

### User Management (`userService` → `UserController`) — Admin Only

| Frontend Method | HTTP | Backend Endpoint | Description |
|----------------|------|-----------------|-------------|
| `userService.getAll()` | `GET` | `/users` | List all users (paginated, filterable) |
| `userService.getById(id)` | `GET` | `/users/{id}` | Get single user |
| `userService.update(id, data)` | `PUT` | `/users/{id}` | Update user |
| `userService.delete(id)` | `DELETE` | `/users/{id}` | Deactivate user |
| `userService.verify(id)` | `PUT` | `/users/{id}/verify` | Verify user account |
| `userService.changeRole(id, role)` | `PUT` | `/users/{id}/role` | Change user role |
| `userService.getStats()` | `GET` | `/users/stats` | Get user statistics |
| `userService.getPending()` | `GET` | `/users/pending` | Get unverified users |

### Medications (`medicationService` → `MedicationController`) — Patient/Admin

| Frontend Method | HTTP | Backend Endpoint | Description |
|----------------|------|-----------------|-------------|
| `medicationService.getAll()` | `GET` | `/medications` | List user's medications |
| `medicationService.getById(id)` | `GET` | `/medications/{id}` | Get single medication |
| `medicationService.create(data)` | `POST` | `/medications` | Add new medication |
| `medicationService.update(id, data)` | `PUT` | `/medications/{id}` | Update medication |
| `medicationService.delete(id)` | `DELETE` | `/medications/{id}` | Delete medication |
| `medicationService.getTodaySchedule()` | `GET` | `/medications/schedule` | Get today's schedule |
| `medicationService.updateSchedule(id, data)` | `PUT` | `/medications/schedule/{id}` | Mark taken/skipped |
| `medicationService.getStats()` | `GET` | `/medications/stats` | Get adherence stats |

### Glucose Readings (`glucoseService` → `GlucoseController`) — Patient/Admin

| Frontend Method | HTTP | Backend Endpoint | Description |
|----------------|------|-----------------|-------------|
| `glucoseService.getAll(params)` | `GET` | `/glucose` | List readings (filterable) |
| `glucoseService.create(data)` | `POST` | `/glucose` | Log new reading |
| `glucoseService.delete(id)` | `DELETE` | `/glucose/{id}` | Delete reading |
| `glucoseService.getStats()` | `GET` | `/glucose/stats` | Get glucose statistics |
| `glucoseService.getTrends(days)` | `GET` | `/glucose/trends` | Get trend data |
| `glucoseService.getToday()` | `GET` | `/glucose/today` | Get today's readings |

### Recipes (`recipeService` → `RecipeController`)

| Frontend Method | HTTP | Backend Endpoint | Description |
|----------------|------|-----------------|-------------|
| `recipeService.getAll(params)` | `GET` | `/recipes` | List recipes (filterable) |
| `recipeService.getById(id)` | `GET` | `/recipes/{id}` | Get single recipe |
| `recipeService.create(data)` | `POST` | `/recipes` | Create recipe (Admin) |
| `recipeService.update(id, data)` | `PUT` | `/recipes/{id}` | Update recipe (Admin) |
| `recipeService.delete(id)` | `DELETE` | `/recipes/{id}` | Delete recipe (Admin) |
| `recipeService.getCategories()` | `GET` | `/recipes/categories` | List categories |

### Exercises & Activity (`exerciseService` → `ExerciseController`)

| Frontend Method | HTTP | Backend Endpoint | Description |
|----------------|------|-----------------|-------------|
| `exerciseService.getAll(params)` | `GET` | `/exercises` | List exercises |
| `exerciseService.getById(id)` | `GET` | `/exercises/{id}` | Get single exercise |
| `exerciseService.getCategories()` | `GET` | `/exercises/categories` | List categories |
| `exerciseService.getActivityLog()` | `GET` | `/activity` | Get user's activity log |
| `exerciseService.logActivity(data)` | `POST` | `/activity` | Log new activity |
| `exerciseService.deleteActivity(id)` | `DELETE` | `/activity/{id}` | Delete activity |
| `exerciseService.getWeeklySummary()` | `GET` | `/activity/weekly` | Weekly summary |
| `exerciseService.getStats()` | `GET` | `/activity/stats` | Activity statistics |

### Education (`educationService` → `EducationController`)

| Frontend Method | HTTP | Backend Endpoint | Description |
|----------------|------|-----------------|-------------|
| `educationService.getAll(params)` | `GET` | `/education` | List content (role-filtered) |
| `educationService.getById(id)` | `GET` | `/education/{id}` | Get single content |
| `educationService.create(data)` | `POST` | `/education` | Create content (Admin) |
| `educationService.update(id, data)` | `PUT` | `/education/{id}` | Update content (Admin) |
| `educationService.delete(id)` | `DELETE` | `/education/{id}` | Delete content (Admin) |
| `educationService.getCategories()` | `GET` | `/education/categories` | List categories |
| `educationService.updateProgress(id, data)` | `PUT` | `/education/{id}/progress` | Update user progress |
| `educationService.getCompleted()` | `GET` | `/education/completed` | Get completed content |

### Notifications (`notificationService` → `NotificationController`)

| Frontend Method | HTTP | Backend Endpoint | Description |
|----------------|------|-----------------|-------------|
| `notificationService.getAll(params)` | `GET` | `/notifications` | List notifications |
| `notificationService.markAsRead(id)` | `PUT` | `/notifications/{id}/read` | Mark as read |
| `notificationService.markAllAsRead()` | `PUT` | `/notifications/read-all` | Mark all read |
| `notificationService.delete(id)` | `DELETE` | `/notifications/{id}` | Delete notification |
| `notificationService.getUnreadCount()` | `GET` | `/notifications/unread-count` | Get unread count |
| `notificationService.getPreferences()` | `GET` | `/notifications/preferences` | Get preferences |
| `notificationService.updatePreferences(data)` | `PUT` | `/notifications/preferences` | Update preferences |

### Analytics (`analyticsService` → `AnalyticsController`) — Admin Only

| Frontend Method | HTTP | Backend Endpoint | Description |
|----------------|------|-----------------|-------------|
| `analyticsService.getSummary()` | `GET` | `/analytics/summary` | Dashboard summary |
| `analyticsService.getUserTrends()` | `GET` | `/analytics/users` | User growth trends |
| `analyticsService.getContentEngagement()` | `GET` | `/analytics/content` | Content engagement |
| `analyticsService.getPlatformActivity()` | `GET` | `/analytics/activity` | Platform activity |
| `analyticsService.getMedicationMetrics()` | `GET` | `/analytics/medication` | Medication metrics |
| `analyticsService.getGlucoseMetrics()` | `GET` | `/analytics/glucose` | Glucose metrics |

---

## Authentication Flow

```
1. User submits login form
   └─► POST /auth/login { email, password }
       └─► API returns { user, tokens: { access_token, refresh_token, expires_in } }
           └─► Frontend stores tokens in localStorage

2. Subsequent API requests
   └─► Authorization: Bearer <access_token>

3. Token expires (401 Unauthorized)
   └─► Frontend automatically calls POST /auth/refresh { refresh_token }
       ├─► Success: New tokens stored, original request retried
       └─► Failure: User redirected to /login

4. Logout
   └─► POST /auth/logout (invalidates refresh token server-side)
       └─► Frontend clears localStorage tokens
```

**JWT Configuration:**
- Algorithm: HS256
- Access Token TTL: 1 hour (3600s)
- Refresh Token TTL: 7 days (604800s)
- Password Hashing: bcrypt, cost factor 12

---

## Deployment Guide

### cPanel Deployment

1. **Create MySQL Database** via cPanel → MySQL Databases
2. **Upload files:**
   - `api/` folder → `public_html/api/`
   - Frontend build (`dist/`) → `public_html/` (or subdomain)
3. **Import database:**
   - phpMyAdmin → Import `schema.sql` then `seed.sql`
4. **Configure API:**
   - Update `api/config/config.php` with production credentials
   - Set `ENVIRONMENT` to `'production'`
   - Add production domain to `$ALLOWED_ORIGINS`
5. **Set permissions:**
   - Directories: 755
   - Files: 644
6. **Build frontend:**
   ```bash
   VITE_API_URL=https://yourdomain.com/api bun run build
   ```

### VPS / Cloud Deployment

1. Install LAMP stack (Apache, MySQL, PHP 8.0+)
2. Enable `mod_rewrite`: `sudo a2enmod rewrite`
3. Configure virtual host with `AllowOverride All`
4. Clone repo and configure as above
5. Set up SSL with Let's Encrypt

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@diabetescare.com | password123 |
| **Patient** (Infected) | patient@example.com | password123 |
| **Prevention** (Non-infected) | user@example.com | password123 |
| **Pending** (Unverified) | pending@example.com | password123 |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Add frontend URL to `$ALLOWED_ORIGINS` in `config.php` |
| 404 on API routes | Enable `mod_rewrite` and verify `.htaccess` is active |
| JWT errors | Ensure `JWT_SECRET` matches between requests |
| Database connection failed | Verify credentials in `config.php` and MySQL is running |
| 401 on all requests | Check `Authorization` header passes through Apache (see `.htaccess`) |
| Empty responses | Check PHP error log: `tail -f /var/log/apache2/error.log` |

### Verify Integration

```bash
# 1. Health check
curl http://localhost:8000/health

# 2. Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com","password":"password123"}'

# 3. Authenticated request (use token from step 2)
curl http://localhost:8000/medications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Data Flow Summary

| Page | Services Used | Key Endpoints |
|------|--------------|---------------|
| **Login/Register** | `authService` | `/auth/login`, `/auth/register` |
| **Patient Dashboard** | `medicationService`, `glucoseService`, `educationService` | `/medications/schedule`, `/glucose/today` |
| **Prevention Dashboard** | `exerciseService`, `recipeService`, `educationService` | `/activity/weekly`, `/recipes` |
| **Admin Dashboard** | `analyticsService`, `userService`, `educationService` | `/analytics/summary`, `/users/stats`, `/users/pending` |
| **Medication** | `medicationService`, `glucoseService` | `/medications`, `/medications/schedule`, `/glucose` |
| **Diet** | `recipeService` | `/recipes`, `/recipes/categories` |
| **Activity** | `exerciseService` | `/exercises`, `/activity`, `/activity/weekly` |
| **Education** | `educationService` | `/education`, `/education/{id}/progress` |
| **Notifications** | `notificationService` | `/notifications`, `/notifications/unread-count`, `/notifications/medication-reminder`, `/notifications/glucose-alert` |
| **Settings** | `authService`, `notificationService` | `/auth/profile`, `/auth/settings`, `/notifications/preferences` |
| **User Management** | `userService` | `/users`, `/users/{id}/verify`, `/users/{id}/role` |
| **Content Management** | `educationService` | `/education` (CRUD) |
| **Analytics** | `analyticsService`, `userService` | `/analytics/*`, `/users/stats` |

---

## Email Notification Testing Guide

### Prerequisites
1. **SMTP configured** in `api/config/config.php` (Gmail, Mailtrap, or any SMTP provider)
2. **PHPMailer installed** via `composer require phpmailer/phpmailer` in the `api/` directory
3. **Database migrations** applied: `schema.sql`, `seed.sql`, `migration_email_verification.sql`

### Testing Registration & Email Verification Flow

```bash
# 1. Register a new user
curl -X POST http://localhost/diabetes-api/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"your-real-email@gmail.com","password":"Test1234!","role":"prevention"}'
# ✅ Should return success + send verification email

# 2. Check your email inbox for the verification link
# Click the link or extract the token and call:
curl -X POST http://localhost/diabetes-api/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_EMAIL"}'
# ✅ Should return success + user is now verified

# 3. Resend verification (if needed)
curl -X POST http://localhost/diabetes-api/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"your-real-email@gmail.com"}'
```

### Testing Medication Reminder Emails

```bash
# Login first to get a token
TOKEN=$(curl -s -X POST http://localhost/diabetes-api/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com","password":"password123"}' | jq -r '.data.access_token')

# Send medication reminder
curl -X POST http://localhost/diabetes-api/api/notifications/medication-reminder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"medication_name":"Metformin","dosage":"500mg","scheduled_time":"8:00 AM"}'
# ✅ Should send email + create in-app notification
```

### Testing Glucose Alert Emails

```bash
# Log a high glucose reading (auto-triggers alert if value > 180 or < 70)
curl -X POST http://localhost/diabetes-api/api/glucose \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"value":250,"reading_type":"after_meal","notes":"After heavy meal"}'
# ✅ Frontend auto-triggers glucose alert email for abnormal readings

# Or trigger manually:
curl -X POST http://localhost/diabetes-api/api/notifications/glucose-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"glucose_value":250,"reading_type":"after_meal","alert_level":"high"}'
```

### Automated Medication Reminders (Cron Job)

The system includes a cron script that automatically sends email reminders for medications
scheduled within the next 15 minutes. No manual clicks needed!

**Setup:**

1. Apply the migration:
   ```bash
   mysql -u root diabetes_app < api/database/migration_reminder_log.sql
   ```

2. Test the script manually first:
   ```bash
   php api/cron/medication_reminders.php
   ```

3. Add to your server's crontab (runs every 5 minutes):
   ```bash
   crontab -e
   # Add this line:
   */5 * * * * php /path/to/api/cron/medication_reminders.php >> /path/to/logs/reminders.log 2>&1
   ```

4. On cPanel: Go to **Cron Jobs** → set interval to every 5 minutes → command:
   ```
   php /home/username/public_html/api/cron/medication_reminders.php
   ```

The script respects user notification preferences — if a user has disabled medication
or email notifications, reminders are skipped. Each schedule entry only gets one reminder
(tracked via `medication_reminder_log` table).

### Auto-Mark Missed Medications

A second cron script automatically marks medications as **missed** if they remain in `pending` status more than 2 hours past the scheduled time.

1. Test manually:
   ```bash
   php api/cron/mark_missed_medications.php
   ```

2. Add to crontab (every 15 minutes):
   ```bash
   crontab -e
   # Add this line:
   */15 * * * * php /path/to/api/cron/mark_missed_medications.php >> /path/to/logs/missed.log 2>&1
   ```

3. On cPanel: Go to **Cron Jobs** → set interval to every 15 minutes → command:
   ```
   php /home/username/public_html/api/cron/mark_missed_medications.php
   ```


### Using Mailtrap for Testing (Recommended)
1. Sign up at [mailtrap.io](https://mailtrap.io) (free tier)
2. Update `api/config/config.php`:
   ```php
   define('SMTP_HOST', 'sandbox.smtp.mailtrap.io');
   define('SMTP_PORT', 2525);
   define('SMTP_USERNAME', 'your-mailtrap-username');
   define('SMTP_PASSWORD', 'your-mailtrap-password');
   ```
3. All emails will appear in Mailtrap inbox without sending to real addresses
