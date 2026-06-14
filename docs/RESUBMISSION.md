# Resubmission Checklist

## What Changed

The mentor-flagged sections were reduced to smaller, testable code:

- `backend/src/config/db.js` now sets optional DNS servers once and calls
  `mongoose.connect` once.
- `backend/src/utils/otp.js` contains the four OTP operations: generate, hash,
  calculate expiry, and check expiry.
- `backend/src/controllers/authController.js` follows one path:
  generate -> save hash -> deliver/show demo OTP -> verify.
- `frontend/src/utils/csvExport.mjs` converts report rows to CSV separately from
  the React page.
- `backend/src/scripts/smokeTest.js` exercises the real API and cleans up its
  temporary database records.

Read these files and explain the flow in your own words during the demo.

## Verified on June 13, 2026

```text
Backend unit tests:  4 passed, 0 failed
Frontend unit tests: 2 passed, 0 failed
Frontend build:      passed
API smoke test:      passed
Browser login:       passed
Reports page load:   passed
```

See the exact command output in `evidence/`.

## Demo Video Order

1. Show the source folder and the `evidence` files.
2. Run `npm test` in `backend`.
3. Run `npm test` and `npm run build` in `frontend`.
4. Run `npm run test:smoke` in `backend`.
5. Start backend and frontend in separate terminals.
6. Register a visitor and explain that the database stores the OTP hash, not
   the six-digit OTP.
7. Verify the demo OTP, then log in.
8. Log in as admin and show dashboard data.
9. Open a pass, copy its QR token, verify it, and save a check-in.
10. Open Reports, filter the new log, and export CSV.
11. Show the downloaded CSV in a spreadsheet or text editor.
12. If Docker is installed, run `docker compose up --build`, open
    `http://localhost:8080`, and show `docker compose ps`.

Keep the terminal visible when commands run. Narrate what each command proves.

## Still Required Before Submission

- Record and upload the narrated demo video.
- Replace the Google Drive file URL in the "Deployed Project URL" field with an
  actual live web application URL.
- Run Docker on a machine with Docker Desktop and capture the output.
- Real email/SMS delivery requires valid Gmail or Twilio credentials.
  Otherwise, state clearly that the demonstrated flow uses
  `OTP_DEMO_MODE=true`.
