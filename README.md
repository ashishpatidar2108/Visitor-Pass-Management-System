# Visitor Pass Management System
video link- https://drive.google.com/file/d/11MTQZX5zK9cNrgIhqr9tOLD9aJxLGxIi/view?usp=sharing

A MERN stack college project for managing digital visitor entry, appointments,
QR passes, PDF badges, and check-in/check-out records.

## Technology

- MongoDB and Mongoose
- Express.js and Node.js
- React and Vite
- JWT authentication
- Email/SMS OTP verification
- QR Code, PDFKit, and Multer
- Docker and Nginx

## Main Features

- Email/password login with JWT
- OTP-based visitor account verification
- Admin, security, employee, and visitor roles
- Multi-organization data isolation
- Visitor registration and photo upload
- Appointment approval and rejection
- QR visitor passes and PDF badges
- QR image download
- Camera-based QR verification
- Check-in/check-out reports and CSV export
- Analytics dashboard
- Staff management
- MongoDB collection summary
- Docker and Nginx deployment setup

## Local Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` in the project root and use your own values:

```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
CLIENT_URL=http://localhost:5173

EMAIL_USER=
EMAIL_PASS=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

OTP_DEMO_MODE=true
OTP_RESEND_SECONDS=10
```

`OTP_DEMO_MODE=true` displays the OTP on screen for local college demos.
Disable it in production and configure Gmail or Twilio.

Never commit `.env` or real credentials.

### 3. Migrate an existing database

Run this once after upgrading an older database:

```bash
cd backend
npm run migrate:organizations
```

### 4. Add demo data

Warning: this resets demo users, visitors, appointments, passes, and logs.

```bash
cd backend
npm run seed
```

## Demo Login

| Role | Email | Password |
|---|---|---|
| Admin | admin@test.com | 123456 |
| Security | security@test.com | 123456 |
| Employee | employee@test.com | 123456 |
| Visitor | visitor@test.com | 123456 |

## Start Project

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm start
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Tests and Execution Proof

Run the focused unit tests:

```bash
cd backend
npm test

cd ../frontend
npm test
npm run build
```

Run the database-backed API smoke test:

```bash
cd backend
npm run test:smoke
```

The smoke test uses the configured MongoDB database and demo login. It verifies:

- API startup and MongoDB connection
- Invalid JWT rejection
- Login and JWT creation
- Protected dashboard access
- Visitor photo upload with Multer
- Multi-organization visitor isolation
- QR pass verification and check-in log creation
- Report filtering
- Visitor registration, demo OTP verification, and visitor login
- Password reset OTP and login with the new password

Temporary smoke-test users and logs are deleted when the test finishes.
Captured command output is stored in the `evidence` folder.

## OTP Flow

1. Visitor registers with email, password, and organization.
2. A 6-digit OTP is generated and only its HMAC hash is stored.
3. The OTP is sent through configured email/SMS.
4. For local demo mode, the OTP is displayed on the verification screen.
5. Login remains blocked until verification succeeds.
6. OTP expires after 10 minutes. Resend requests have a cooldown.

## Multi-Organization Support

The signed-in user's organization is stored in the JWT. Users, visitors,
appointments, passes, reports, dashboard totals, and database summaries are
restricted to that organization.

## Main APIs

| Method | API | Work |
|---|---|---|
| POST | `/api/auth/register` | Register visitor and generate OTP |
| POST | `/api/auth/verify-otp` | Verify account OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/login` | Login |
| GET/POST | `/api/users` | Manage organization staff |
| GET/POST/DELETE | `/api/visitors` | Manage visitors |
| GET/POST/PATCH/DELETE | `/api/appointments` | Manage appointments |
| GET/POST/DELETE | `/api/passes` | Manage QR/PDF passes |
| GET/POST | `/api/logs` | Check-in/out reports |
| GET | `/api/dashboard` | Organization analytics |
| GET | `/api/dashboard/collections` | Organization collection summary |

## Docker + Nginx

The Dockerfile, Nginx config, and compose file are included for local Docker
deployment:

```bash
docker compose up --build
```

Open `http://localhost:8080`.

The Nginx frontend proxies `/api`, `/uploads`, and `/badges` to the backend.
Docker CLI is not installed on the current Windows machine, so Docker runtime
verification is recorded as unavailable in `evidence/environment.txt`. The live
Render deployment should be used as the hosted execution proof for submission.

## Render Deployment

Render deployment files are now included in this same project root. There is no
separate deployment copy of the project.

- `render.yaml` tells Render to use Docker.
- `Dockerfile.render` builds the React frontend and Node backend together.
- The backend serves the built React app in production and exposes
  `/api/health` for Render health checks.

On Render, connect this GitHub repository and deploy from the root folder:

```text
visitor-pass-management/
```

Do not deploy from a separate `visitor-pass-management-render-deploy` folder.

## Project Flow

1. Register and verify OTP, or login with a demo account.
2. Add a visitor.
3. Create and approve an appointment.
4. Issue a QR/PDF pass.
5. Verify the pass and save check-in/check-out.
6. Review reports, dashboard analytics, and database counts.

## Submission Files

The `screenshots` folder contains:

1. Login page
2. Dashboard page
3. Visitors page
4. Appointments page
5. Pass issue page
6. QR verification page
7. MongoDB collections
8. OTP verification page
9. Reports page
10. Staff management page
11. Visitor registration page
12. Forgot password page
13. Visitor portal page

The `evidence` folder contains unit-test, build, environment, API smoke-test,
Render production-serving, and browser sanity-check output captured on
June 18, 2026.

Before resubmitting, record a narrated demo video using the checklist in
`docs/RESUBMISSION.md`. Submit both the live application URL and the source code
repository/files so the mentor can inspect the implemented React pages and test
files.
