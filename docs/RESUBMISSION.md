Use this file while recording the final demo video and while preparing the
submission notes.

## Feedback Addressed

- Frontend pages are implemented and routed in `frontend/src/App.jsx`:
  `PassesPage`, `ReportsPage`, `ScanPage`, `StaffPage`,
  `VisitorPortalPage`, `VisitorsPage`, `RegisterPage`, `VerifyOtpPage`,
  `ForgotPasswordPage`, and `DatabasePage`.
- `ScanPage` lazy-loads `QrScanner`, accepts camera scan output, allows manual
  token entry, and records check-in/check-out logs with a location.
- `VisitorsPage` and `VisitorPortalPage` submit `multipart/form-data` photos.
  Uploaded photos are shown as thumbnails in the visitors table.
- `authController.js` and `visitorController.js` were rewritten with simple
  request validation, explicit OTP handling, organization filtering, and file
  cleanup.
- `backend/src/scripts/smokeTest.js` now verifies photo upload storage and
  multi-organization isolation.
- Actual frontend and backend test files are included under `frontend/test`
  and `backend/test`.

## Commands To Show

Run these commands and keep the terminal visible in the video:

```bash
cd backend
npm test
npm run test:smoke

cd ../frontend
npm test
npm run build
```

The latest captured output is in the `evidence` folder.

## Demo Video Flow

1. Open the deployed app and login as `admin@test.com / 123456`.
2. Show Dashboard, Visitors, Appointments, Passes, Scan, Reports, Staff, and
   Database pages from the navigation.
3. Add a visitor with a photo and show the uploaded thumbnail.
4. Issue a QR/PDF pass and show the QR image/PDF badge action.
5. Open Scan, verify a token, then save check-in and check-out.
6. Open Reports and show the scan log plus CSV export button.
7. Register a visitor account, show OTP verification, and login as visitor.
8. Mention that the smoke test verifies multi-organization isolation.
9. Show the visitor portal after logging in as `visitor@test.com / 123456`.
10. Mention Docker config is included, but Docker CLI is unavailable on this
   machine; hosted proof is the Render deployment.
