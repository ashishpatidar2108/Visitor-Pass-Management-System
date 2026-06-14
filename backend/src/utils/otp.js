const crypto = require('crypto');

const OTP_EXPIRY_MINUTES = 10;

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(String(otp))
    .digest('hex');
}

function getOtpExpiry(now = Date.now()) {
  return new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000);
}

function isOtpExpired(expiresAt, now = Date.now()) {
  return !expiresAt || new Date(expiresAt).getTime() <= now;
}

module.exports = {
  generateOtp,
  getOtpExpiry,
  hashOtp,
  isOtpExpired,
  OTP_EXPIRY_MINUTES
};
