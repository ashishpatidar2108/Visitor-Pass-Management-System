import assert from 'node:assert/strict';
import test from 'node:test';

import { createCheckLogsCsv } from '../src/utils/csvExport.mjs';

test('creates a CSV row for a check log', () => {
  const csv = createCheckLogsCsv([
    {
      visitor: { name: 'Asha', email: 'asha@example.com' },
      pass: { qrToken: 'VP-100' },
      action: 'checkin',
      location: 'Main Gate',
      scannedBy: { name: 'Security User' },
      createdAt: '2026-06-13T10:30:00.000Z'
    }
  ]);

  assert.match(csv, /"Visitor","Email","Pass Token"/);
  assert.match(csv, /"Asha","asha@example.com","VP-100"/);
  assert.match(csv, /"2026-06-13T10:30:00.000Z"/);
});

test('escapes quotes and blocks spreadsheet formulas', () => {
  const csv = createCheckLogsCsv([
    {
      visitor: { name: 'Sam "Test"', email: '=HYPERLINK("bad")' },
      createdAt: 'invalid'
    }
  ]);

  assert.match(csv, /"Sam ""Test"""/);
  assert.match(csv, /"'=HYPERLINK\(""bad""\)"/);
});
