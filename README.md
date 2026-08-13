# BBU LMS

A Microsoft Teams–inspired Learning Management System for Build Bright University.

**Architecture:** Laravel 13 API-only backend + React 19 + Vite 8 TypeScript SPA, connected via Sanctum cookie auth and Laravel Reverb real-time broadcasts.

---

## Quick Start

### Backend

```bash
cd bbu-lms
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --force
php artisan db:seed
php artisan serve
```

The seeder creates default accounts:

| Role      | Email                   | Password |
|-----------|-------------------------|----------|
| Admin     | `admin@bbu.edu`         | `password` |
| Student   | `student1@bbu.edu`      | `password` |
| Lecturer  | `sophea.lim@bbu.edu`    | `password` |

### Frontend

```bash
cd bbu-lms-frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000` by default. Update `VITE_API_BASE_URL` in `bbu-lms-frontend/.env` if your backend runs elsewhere.

---

## Development Scripts

| Command | Description |
|---------|-------------|
| `composer test` | Run the full PHPUnit test suite |
| `npm run build` | Build the production frontend bundle |
| `php artisan reverb:start` | Start the WebSocket server for chat and notifications |

---

## Key Features

- **Role-based access:** admin, lecturer, student.
- **Course hub:** courses, offerings, materials, assignments, quizzes, grades, attendance, announcements, and calendar.
- **Real-time chat:** direct and course group conversations with messages, replies, edits, deletes, typing indicators, and attachments.
- **Notifications:** in-app and broadcasted notifications for announcements, messages, assignments, grades, attendance, exams, and deadlines.
- **Dashboards:** student dashboard, lecturer dashboard, student analytics, and admin dashboard.
- **Admin tooling:** user management, course management, departments/programs/semesters CRUD, and Excel exports for users, courses, and enrollments.

---

## Environment Notes

- The project is configured for **SQLite** out of the box so development does not require a running MySQL/PostgreSQL server.
- To switch to MySQL/PostgreSQL, update `DB_CONNECTION` and the related `DB_*` variables in `bbu-lms/.env`.
- Real-time features require `BROADCAST_CONNECTION=reverb` and the `REVERB_*` variables set in both backend `.env` and frontend `.env`.

---

## Testing

```bash
cd bbu-lms
php artisan test
```

The backend test suite covers API authorization, business logic, and feature flows. The frontend production build is validated with `npm run build`.

---

## CI / CD

A GitHub Actions workflow is provided in `.github/workflows/ci.yml`. It runs on every push and pull request to `main`:

- Installs PHP dependencies and starts an in-memory SQLite database.
- Runs `php artisan test`.
- Installs Node dependencies, builds the frontend, and fails on TypeScript or build errors.

Deploy the backend to any Laravel-capable host (Forge, VPS with nginx, etc.) and the frontend to a static host (Vercel, Netlify, etc.). Configure `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, and `SESSION_DOMAIN` to match your production domains.

---

## Project Structure

```
D:\year4\LMS System
├── bbu-lms/                 # Laravel API
│   ├── app/
│   ├── database/
│   ├── routes/api.php
│   └── tests/
├── bbu-lms-frontend/        # React SPA
│   ├── src/
│   └── dist/
└── README.md
```

---

## License

This is an academic project. License TBD.
