const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { sendEmail, sendSms } = require('../services/notificationService');
const { normalizeOrganization } = require('../utils/organization');

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS) || 60;
const MAX_OTP_ATTEMPTS = 5;

function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto
    .createHash('sha256')
    .update(`${otp}:${process.env.JWT_SECRET}`)
    .digest('hex');
}

function canShowDemoOtp() {
  return (
    process.env.OTP_DEMO_MODE === 'true' ||
    process.env.NODE_ENV !== 'production'
  );
}

function canSendOtpNow(user) {
  return (
    !user.verificationOtpLastSentAt ||
    Date.now() - user.verificationOtpLastSentAt.getTime() >=
      OTP_RESEND_SECONDS * 1000
  );
}

async function issueVerificationOtp(user) {
  const otp = createOtp();
  user.verificationOtpHash = hashOtp(otp);
  user.verificationOtpExpiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );
  user.verificationOtpAttempts = 0;
  user.verificationOtpLastSentAt = new Date();
  await user.save();

  const message = `Your Visitor Pass verification OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
  const deliveryResults = await Promise.allSettled([
    sendEmail(user.email, 'Visitor Pass Verification OTP', message),
    sendSms(user.phone, message)
  ]);
  const delivered = deliveryResults.some(
    (result) => result.status === 'fulfilled' && result.value === true
  );

  return {
    delivered,
    demoOtp: !delivered && canShowDemoOtp() ? otp : undefined
  };
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
    if (!existingUser.isVerified && canShowDemoOtp()) {
      const delivery = await issueVerificationOtp(existingUser);
      return res.json({
        message: 'New local demo OTP generated for this unverified account',
        email: existingUser.email,
        verificationRequired: true,
        demoOtp: delivery.demoOtp
      });
    }

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
  const delivery = await issueVerificationOtp(user);

  if (!delivery.delivered && !delivery.demoOtp) {
    return res.status(503).json({
      message: 'OTP delivery is not configured. Contact the administrator.',
      email: user.email,
      verificationRequired: true
    });
  }

  return res.status(201).json({
    message: delivery.delivered
      ? 'OTP sent to your registered email or phone'
      : 'OTP generated for local demo verification',
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
    let demoOtp;

    if (canShowDemoOtp()) {
      const delivery = await issueVerificationOtp(user);
      demoOtp = delivery.demoOtp;
    }

    return res.status(403).json({
      message: demoOtp
        ? 'Enter the local demo OTP shown on the verification page'
        : 'Please verify your OTP before login',
      email: user.email,
      verificationRequired: true,
      demoOtp
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

  if (
    !user.verificationOtpHash ||
    !user.verificationOtpExpiresAt ||
    user.verificationOtpExpiresAt < new Date()
  ) {
    return res.status(400).json({ message: 'OTP expired. Request a new OTP.' });
  }

  if (user.verificationOtpAttempts >= MAX_OTP_ATTEMPTS) {
    return res.status(429).json({ message: 'Too many attempts. Resend OTP.' });
  }

  if (hashOtp(otp) !== user.verificationOtpHash) {
    user.verificationOtpAttempts += 1;
    await user.save();
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.isVerified = true;
  user.verificationOtpHash = undefined;
  user.verificationOtpExpiresAt = undefined;
  user.verificationOtpAttempts = 0;
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

  if (!canSendOtpNow(user)) {
    return res.status(429).json({
      message: `Please wait ${OTP_RESEND_SECONDS} seconds before resending`
    });
  }

  const delivery = await issueVerificationOtp(user);

  if (!delivery.delivered && !delivery.demoOtp) {
    return res.status(503).json({
      message: 'OTP delivery is not configured. Contact the administrator.'
    });
  }

  return res.json({
    message: delivery.delivered ? 'New OTP sent' : 'New demo OTP generated',
    demoOtp: delivery.demoOtp
  });
}

module.exports = { login, register, resendOtp, verifyOtp };
