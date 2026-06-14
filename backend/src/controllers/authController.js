const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { sendEmail, sendSms } = require('../services/notificationService');
const {
  generateOtp,
  getOtpExpiry,
  hashOtp,
  isOtpExpired,
  OTP_EXPIRY_MINUTES
} = require('../utils/otp');
const { normalizeOrganization } = require('../utils/organization');

const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS) || 60;

function isDemoMode() {
  return process.env.OTP_DEMO_MODE === 'true';
}

function canResendOtp(user) {
  if (!user.verificationOtpLastSentAt) {
    return true;
  }

  const elapsed = Date.now() - user.verificationOtpLastSentAt.getTime();
  return elapsed >= OTP_RESEND_SECONDS * 1000;
}

async function deliverOtp(user, otp) {
  const message = `Your Visitor Pass verification OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
  const emailSent = await sendEmail(
    user.email,
    'Visitor Pass Verification OTP',
    message
  );

  if (emailSent) {
    return true;
  }

  return sendSms(user.phone, message);
}

async function issueOtp(user) {
  const otp = generateOtp();
  user.verificationOtpHash = hashOtp(otp);
  user.verificationOtpExpiresAt = getOtpExpiry();
  user.verificationOtpLastSentAt = new Date();
  await user.save();

  if (isDemoMode()) {
    return { sent: false, demoOtp: otp };
  }

  return { sent: await deliverOtp(user, otp) };
}

function createSession(user) {
  const organization = normalizeOrganization(user.organization);
  const sessionUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization
  };
  const token = jwt.sign(sessionUser, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  return { token, user: sessionUser };
}

async function register(req, res) {
  const { name, email, password, phone, organization } = req.body;
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    password: passwordHash,
    role: 'visitor',
    phone,
    organization: normalizeOrganization(organization),
    isVerified: false
  });
  const delivery = await issueOtp(user);

  if (!delivery.sent && !delivery.demoOtp) {
    return res.status(503).json({
      message: 'OTP delivery is not configured. Contact the administrator.',
      email: user.email,
      verificationRequired: true
    });
  }

  return res.status(201).json({
    message: delivery.demoOtp
      ? 'OTP generated for local demo verification'
      : 'OTP sent to your registered email or phone',
    email: user.email,
    verificationRequired: true,
    demoOtp: delivery.demoOtp
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  const passwordMatches =
    user && (await bcrypt.compare(password, user.password));

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.isVerified === false) {
    return res.status(403).json({
      message: 'Please verify your OTP before login',
      email: user.email,
      verificationRequired: true
    });
  }

  return res.json(createSession(user));
}

async function verifyOtp(req, res) {
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();
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

  if (!user.verificationOtpHash || hashOtp(otp) !== user.verificationOtpHash) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.isVerified = true;
  user.verificationOtpHash = undefined;
  user.verificationOtpExpiresAt = undefined;
  user.verificationOtpLastSentAt = undefined;
  await user.save();

  return res.json({ message: 'Account verified. You can now login.' });
}

async function resendOtp(req, res) {
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: 'Account is already verified' });
  }

  if (!canResendOtp(user)) {
    return res.status(429).json({
      message: `Please wait ${OTP_RESEND_SECONDS} seconds before resending`
    });
  }

  const delivery = await issueOtp(user);

  if (!delivery.sent && !delivery.demoOtp) {
    return res.status(503).json({
      message: 'OTP delivery is not configured. Contact the administrator.'
    });
  }

  return res.json({
    message: delivery.demoOtp ? 'New demo OTP generated' : 'New OTP sent',
    demoOtp: delivery.demoOtp
  });
}

module.exports = { login, register, resendOtp, verifyOtp };
