import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const requiredPages = [
  'PassesPage',
  'ReportsPage',
  'ScanPage',
  'StaffPage',
  'VisitorPortalPage',
  'VisitorsPage',
  'RegisterPage',
  'VerifyOtpPage',
  'ForgotPasswordPage',
  'DatabasePage'
];

test('all required frontend pages are imported and routed', async () => {
  const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), {
    encoding: 'utf8'
  });

  for (const page of requiredPages) {
    assert.match(appSource, new RegExp(`import ${page} from`));
    assert.ok(appSource.includes(`element={<${page} />}`));
  }
});

test('QR scanner and photo upload UI are connected to pages', async () => {
  const scanSource = await readFile(
    new URL('../src/pages/ScanPage.jsx', import.meta.url),
    { encoding: 'utf8' }
  );
  const visitorsSource = await readFile(
    new URL('../src/pages/VisitorsPage.jsx', import.meta.url),
    { encoding: 'utf8' }
  );

  assert.match(scanSource, /components\/scanner\/QrScanner/);
  assert.match(scanSource, /saveLog\('checkin'\)/);
  assert.match(visitorsSource, /type="file"/);
  assert.doesNotMatch(visitorsSource, /visitorColumns\.map/);
  assert.match(visitorsSource, /visitor-photo-thumb/);
});
