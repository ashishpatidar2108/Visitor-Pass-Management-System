const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { sendEmail, sendSms } = require('../services/notificationService');
const { generateOtp, getOtpExpiry,
  hashOtp,
  isOtpExpired,
  OTP_EXPIRY_MINUTES
} = require('../utils/otp');

const { normalizeOrganization } = require('../utils/organization');

const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS) || 60;

function cleanEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function makeLoginResponse(user) {
  const organization = normalizeOrganization(user.organization);
  const tokenUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization
  };

  return {
    token: jwt.sign(tokenUser, process.env.JWT_SECRET, { expiresIn: '7d' }),
    user: tokenUser
  };
}

function secondsLeftBeforeOtpResend(user) {
  if (!user.verificationOtpLastSentAt) {
    return 0;
  }

  const sentAt = user.verificationOtpLastSentAt.getTime();
  const passedSeconds = Math.floor((Date.now() - sentAt) / 1000);
  return Math.max(OTP_RESEND_SECONDS - passedSeconds, 0);
}

function removeOtpFromUser(user) {
  user.verificationOtpHash = undefined;
  user.verificationOtpExpiresAt = undefined;
  user.verificationOtpLastSentAt = undefined;
  user.verificationOtpPurpose = undefined;
}

async function saveAndSendOtp(user, purpose) {
  const otp = generateOtp();
  const isReset = purpose === 'password-reset';
  const text = `Your Visitor Pass ${
    isReset ? 'password reset' : 'verification'
  } OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;

  user.verificationOtpHash = hashOtp(otp);
  user.verificationOtpExpiresAt = getOtpExpiry();
  user.verificationOtpLastSentAt = new Date();
  user.verificationOtpPurpose = purpose;
  await user.save();

  if (process.env.OTP_DEMO_MODE === 'true') {
    return { sent: true, demoOtp: otp };
  }

  const emailSent = await sendEmail(
    user.email,
    isReset
      ? 'Visitor Pass Password Reset OTP'
      : 'Visitor Pass Verification OTP',
    text
  );
  const smsSent = emailSent ? false : await sendSms(user.phone, text);

  return { sent: emailSent || smsSent };
}

function otpMatches(user, enteredOtp, purpose) {
  if (!enteredOtp || !user.verificationOtpHash) {
    return false;
  }

  if (user.verificationOtpPurpose !== purpose) {
    return false;
  }

  return hashOtp(enteredOtp) === user.verificationOtpHash;
}

async function register(req, res) {
  const name = String(req.body.name || '').trim();
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || '');
  const phone = String(req.body.phone || '').trim();
  const organization = normalizeOrganization(req.body.organization);

  if (!name || !email || password.length < 6) {
    return res.status(400).json({
      message: 'Name, valid email, and 6 character password are required'
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: 'visitor',
    phone,
    organization,
    isVerified: false
  });
  const otpResult = await saveAndSendOtp(user, 'verification');

  if (!otpResult.sent) {
    return res.status(503).json({
      message: 'OTP delivery is not configured. Contact the administrator.',
      email: user.email,
      verificationRequired: true
    });
  }

  return res.status(201).json({
    message: otpResult.demoOtp
      ? 'OTP generated for local demo verification'
      : 'OTP sent to your registered email or phone',
    email: user.email,
    verificationRequired: true,
    demoOtp: otpResult.demoOtp
  });
}

async function login(req, res) {
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || '');
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordOk = await bcrypt.compare(password, user.password);
  if (!passwordOk) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.isVerified === false) {
    const otpResult = await saveAndSendOtp(user, 'verification');

    return res.status(403).json({
      message: otpResult.demoOtp
        ? 'A new demo OTP was generated. Verify your account to continue.'
        : otpResult.sent
          ? 'A new OTP was sent. Verify your account to continue.'
          : 'OTP delivery is not configured. Contact the administrator.',
      email: user.email,
      verificationRequired: true,
      demoOtp: otpResult.demoOtp
    });
  }

  return res.json(makeLoginResponse(user));
}

async function verifyOtp(req, res) {
  const email = cleanEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isVerified) {
    return res.json({ message: 'Account is already verified' });
  }

  if (isOtpExpired(user.verificationOtpExpiresAt)) {
    return res.status(400).json({ message: 'OTP expired. Request a new OTP.' });
  }

  if (!otpMatches(user, otp, 'verification')) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.isVerified = true;
  removeOtpFromUser(user);
  await user.save();

  return res.json({ message: 'Account verified. You can now login.' });
}

async function resendOtp(req, res) {
  const email = cleanEmail(req.body.email);
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: 'Account is already verified' });
  }

  const waitSeconds = secondsLeftBeforeOtpResend(user);
  if (waitSeconds > 0) {
    return res.status(429).json({
      message: `Please wait ${waitSeconds} seconds before resending`
    });
  }

  const otpResult = await saveAndSendOtp(user, 'verification');
  if (!otpResult.sent) {
    return res.status(503).json({
      message: 'OTP delivery is not configured. Contact the administrator.'
    });
  }

  return res.json({
    message: otpResult.demoOtp ? 'New demo OTP generated' : 'New OTP sent',
    demoOtp: otpResult.demoOtp
  });
}

async function forgotPassword(req, res) {
  const email = cleanEmail(req.body.email);
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'No account found with this email' });
  }

  const waitSeconds = secondsLeftBeforeOtpResend(user);
  if (waitSeconds > 0) {
    return res.status(429).json({
      message: `Please wait ${waitSeconds} seconds before requesting another OTP`
    });
  }

  const otpResult = await saveAndSendOtp(user, 'password-reset');
  if (!otpResult.sent) {
    return res.status(503).json({
      message: 'OTP delivery is not configured. Contact the administrator.'
    });
  }

  return res.json({
    message: otpResult.demoOtp
      ? 'Password reset demo OTP generated'
      : 'Password reset OTP sent',
    email: user.email,
    demoOtp: otpResult.demoOtp
  });
}

async function resetPassword(req, res) {
  const email = cleanEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 6 characters' });
  }

  if (isOtpExpired(user.verificationOtpExpiresAt)) {
    return res.status(400).json({ message: 'OTP expired. Request a new OTP.' });
  }

  if (!otpMatches(user, otp, 'password-reset')) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.password = await bcrypt.hash(password, 10);
  removeOtpFromUser(user);
  await user.save();

  return res.json({ message: 'Password reset successful. Please login.' });
}

module.exports = {
  forgotPassword,
  login,
  register,
  resendOtp,
  resetPassword,
  verifyOtp
};
