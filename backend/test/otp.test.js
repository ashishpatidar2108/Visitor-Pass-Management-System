const assert = require('node:assert/strict');
const test = require('node:test');

process.env.JWT_SECRET = 'test-secret';

const {
  generateOtp,
  getOtpExpiry,
  hashOtp,
  isOtpExpired
} = require('../src/utils/otp');

test('generateOtp returns a six-digit string', () => {
  assert.match(generateOtp(), /^\d{6}$/);
});

test('hashOtp returns the same hash for the same OTP', () => {
  assert.equal(hashOtp('123456'), hashOtp('123456'));
  assert.notEqual(hashOtp('123456'), hashOtp('654321'));
});

test('OTP expiry is ten minutes after creation', () => {
  const now = Date.parse('2026-06-13T10:00:00.000Z');
  assert.equal(
    getOtpExpiry(now).toISOString(),
    '2026-06-13T10:10:00.000Z'
  );
});

test('isOtpExpired handles future, past, and missing dates', () => {
  const now = Date.parse('2026-06-13T10:00:00.000Z');
  assert.equal(isOtpExpired('2026-06-13T10:01:00.000Z', now), false);
  assert.equal(isOtpExpired('2026-06-13T09:59:00.000Z', now), true);
  assert.equal(isOtpExpired(undefined, now), true);
});
