# Health Guardian Hub

A full-stack diabetes prevention and care platform with role-based access for admins, patients (infected), and prevention users (non-infected).

## Overview

Health Guardian Hub combines:

- A modern React frontend for dashboards, education, diet, activity, medications, and notifications
- A PHP REST API with JWT auth and role-based authorization
- A MySQL database with seeded demo content and test users
- Optional scheduled jobs for medication reminders and missed-dose automation

## Core Features

- Role-aware experience for `admin`, `infected`, and `non-infected` users
- Authentication flows: register, login, refresh token, logout, forgot/reset password, email verification
- Medication management with schedule tracking and adherence statistics
- Glucose logging with trends and daily summaries
- Nutrition and recipe browsing with diabetes-friendly metadata
- Exercise catalog and activity logging
- Education content management and progress tracking
- In-app notifications and notification preferences
- Admin analytics and user/content management

## Tech Stack

### Frontend

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- TanStack Query
- React Router
- Vitest + Testing Library

### Backend

- PHP 8+ (PDO)
- MySQL 8+ / MariaDB 10.5+
- JWT (access + refresh tokens)

## Architecture

```text
React (Vite/TS) -> PHP API Router (api/index.php) -> MySQL
```

- Frontend services in `src/services/*` map to backend endpoints under `api/index.php`
- JWT access token is attached to API requests and automatically refreshed when needed

## Repository Layout

```text
.
|- src/                     # React app (pages, components, services, context)
|- api/                     # PHP REST API (controllers, models, middleware, utils)
|  |- config/               # App and DB configuration
|  |- database/             # Schema, seed data, and SQL migrations
|  |- cron/                 # Scheduled jobs for reminders and missed medications
|- public/                  # Static frontend assets
|- SETUP_GUIDE.md           # Extended integration reference
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or Bun)
- PHP 8.0+
- MySQL 8.0+ or MariaDB 10.5+
- Apache/XAMPP (optional) or PHP built-in server

### 1) Frontend Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173` by default.

### 2) Backend Setup

1. Create/import database:

```sql
CREATE DATABASE diabetes_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
mysql -u root -p diabetes_app < api/database/schema.sql
mysql -u root -p diabetes_app < api/database/seed.sql
mysql -u root -p diabetes_app < api/database/migration_email_verification.sql
mysql -u root -p diabetes_app < api/database/migration_password_reset.sql
mysql -u root -p diabetes_app < api/database/migration_reminder_log.sql
```

2. Configure backend env values (or edit defaults in `api/config/config.php`).
3. Start API:

```bash
cd api
php -S localhost:8000
```

4. Point frontend to API in `.env`:

```env
VITE_API_URL=http://localhost:8000
```

If using XAMPP and serving API from `htdocs/diabetes-api/api`, use:

```env
VITE_API_URL=http://localhost/diabetes-api/api
```

### 3) Health Check

- Built-in PHP server: `http://localhost:8000/health`
- Apache path-based setup: `http://localhost/diabetes-api/api/health`

## Environment Variables

### Frontend (`.env`)

| Variable | Required | Example | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `http://localhost:8000` | Base URL for API requests (no trailing slash recommended). |

### Backend (`api/config/config.php` via `getenv`)

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | App environment (`development` or `production`) |
| `DB_HOST` | `localhost` | Database host |
| `DB_NAME` | `diabetes_app` | Database name |
| `DB_USER` | `root` | Database user |
| `DB_PASS` | `` | Database password |
| `JWT_SECRET` | `your-super-secret...` | JWT signing secret (change in production) |
| `API_BASE_URL` | `http://localhost/api` | API base URL metadata |
| `FRONTEND_URL` | `http://localhost:5173` | Used for email action links |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `587` | SMTP server config |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | empty | SMTP credentials |
| `SMTP_ENCRYPTION` | `tls` | `tls` or `ssl` |
| `MAIL_FROM_ADDRESS` | `noreply@diabetescare.com` | Sender email |
| `MAIL_FROM_NAME` | `DiabetesCare` | Sender display name |

## Default Seed Accounts

Imported from `api/database/seed.sql`:

- Admin: `admin@diabetescare.com` / `password123`
- Patient: `patient@example.com` / `password123`
- Prevention user: `user@example.com` / `password123`

## API Overview

Primary route groups:

- `POST /auth/*`, `GET /auth/me`
- `GET|PUT|DELETE /users*` (admin)
- `GET|POST|PUT|DELETE /medications*`
- `GET|POST|DELETE /glucose*`
- `GET|POST|PUT|DELETE /recipes*`
- `GET /exercises*`, `GET|POST|DELETE /activity*`
- `GET|POST|PUT /education*`
- `GET|PUT|POST|DELETE /notifications*`
- `GET /analytics/*` (admin)

See [SETUP_GUIDE.md](/C:/Users/dell/desktop/health-guardian-hub-main/SETUP_GUIDE.md) for detailed endpoint mapping.

## Scheduled Jobs (Optional)

For production reminder workflows:

- `api/cron/medication_reminders.php`: sends medication reminder emails
- `api/cron/mark_missed_medications.php`: marks overdue pending doses as missed

Example cron schedule from script headers:

- Every 5 minutes: medication reminders
- Every 15 minutes: mark missed doses

## Scripts

Frontend scripts from `package.json`:

- `npm run dev` - Start Vite dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - ESLint checks
- `npm run test` - Run Vitest once
- `npm run test:watch` - Run Vitest in watch mode

Latest local test status:

- `npm run test` passed (`1` test, `1` test file)

## Deployment Notes

- Set `APP_ENV=production` in backend environment
- Use a strong `JWT_SECRET`
- Configure production database credentials and SMTP settings
- Restrict CORS origins in `api/config/config.php`
- Ensure API is served behind HTTPS

## Security Checklist

- Replace all default passwords and seed accounts before go-live
- Rotate JWT and SMTP secrets
- Disable verbose error output in production
- Enforce least-privilege DB users
- Review allowed CORS origins regularly

## Additional Documentation

- Full setup and integration guide: [SETUP_GUIDE.md](/C:/Users/dell/desktop/health-guardian-hub-main/SETUP_GUIDE.md)
- Backend-specific setup notes: [api/README.md](/C:/Users/dell/desktop/health-guardian-hub-main/api/README.md)

## License

No license file is currently included. Add a `LICENSE` file to define usage terms.
