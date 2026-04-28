# Diabetes Prevention API - Setup Guide

## Requirements

- PHP 8.0+ with PDO MySQL extension
- MySQL 8.0+ or MariaDB 10.5+
- Apache with mod_rewrite OR Nginx

## Local Development Setup

### 1. Create MySQL Database

```sql
CREATE DATABASE diabetes_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'diabetes_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON diabetes_app.* TO 'diabetes_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Import Schema and Seed Data

```bash
mysql -u diabetes_user -p diabetes_app < api/database/schema.sql
mysql -u diabetes_user -p diabetes_app < api/database/seed.sql
```

### 3. Configure API

Edit `api/config/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'diabetes_app');
define('DB_USER', 'diabetes_user');
define('DB_PASS', 'your_password');
define('JWT_SECRET', 'your-super-secret-key-change-this');
```

### 4. Start PHP Server

```bash
cd api
php -S localhost:8000
```

### 5. Test API

```bash
curl http://localhost:8000/api/health
```

## cPanel Deployment

### 1. Create MySQL Database

1. Log into cPanel → MySQL Databases
2. Create new database (e.g., `username_diabetes`)
3. Create new user with strong password
4. Add user to database with ALL PRIVILEGES

### 2. Upload Files

1. Upload `api/` folder to `public_html/api/`
2. Set permissions: 755 for directories, 644 for files

### 3. Import Database

1. Go to phpMyAdmin
2. Select your database
3. Import `schema.sql` then `seed.sql`

### 4. Configure API

Update `api/config/config.php` with cPanel credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'username_diabetes');
define('DB_USER', 'username_dbuser');
define('DB_PASS', 'your_cpanel_db_password');
define('JWT_SECRET', 'generate-a-random-64-char-string');
define('ENVIRONMENT', 'production');
```

### 5. Update CORS Origins

Add your domain to `$ALLOWED_ORIGINS` in `config.php`.

### 6. Test API

Visit: `https://yourdomain.com/api/health`

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@diabetescare.com | password123 |
| Patient | patient@example.com | password123 |
| Prevention | user@example.com | password123 |

## API Endpoints

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register  
- `GET /api/auth/me` - Current user
- `GET /api/medications` - List medications
- `GET /api/glucose` - List glucose readings
- `GET /api/recipes` - List recipes
- `GET /api/exercises` - List exercises
- `GET /api/education` - List education content
- `GET /api/notifications` - List notifications
- `GET /api/analytics/summary` - Admin dashboard

See full API documentation in the plan file.
