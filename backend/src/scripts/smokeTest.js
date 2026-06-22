require('../config/env');

const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const path = require('path');

const app = require('../app');
const { uploadsDir } = require('../config/paths');
const connectDB = require('../config/db');
const CheckLog = require('../models/CheckLog');
const User = require('../models/User');
const Visitor = require('../models/Visitor');

const smokeEmail = `smoke-${Date.now()}@example.com`;
const uploadEmail = `upload-${Date.now()}@example.com`;
const otherOrgEmail = `other-org-${Date.now()}@example.com`;
const smokePassword = 'SmokeTest123!';
const resetPassword = 'ResetTest456!';
let createdLogId;
let uploadedVisitorId;
let uploadedPhoto;
let otherOrgUserId;

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      `${options.method || 'GET'} ${path} returned ${response.status}: ${
        body.message || JSON.stringify(body)
      }`
    );
  }

  return { body, status: response.status };
}

async function run() {
  await connectDB();
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const root = await request(baseUrl, '/api/health');
    console.log(`PASS API health (${root.status})`);

    const invalidTokenResponse = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    if (invalidTokenResponse.status !== 401) {
      throw new Error('Invalid JWT was not rejected');
    }
    console.log('PASS invalid JWT rejected (401)');

    const login = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SMOKE_EMAIL || 'admin@test.com',
        password: process.env.SMOKE_PASSWORD || '123456'
      })
    });
    const authHeaders = { Authorization: `Bearer ${login.body.token}` };
    console.log(`PASS admin login and JWT issue (${login.body.user.role})`);

    await request(baseUrl, '/api/dashboard', { headers: authHeaders });
    console.log('PASS protected dashboard request');

    const photoForm = new FormData();
    photoForm.append('name', 'Smoke Uploaded Visitor');
    photoForm.append('email', uploadEmail);
    photoForm.append('phone', '9999999999');
    photoForm.append('company', 'Smoke Test Company');
    photoForm.append('purpose', 'Photo upload verification');
    photoForm.append(
      'photo',
      new Blob([Buffer.from('smoke-test-photo')], { type: 'image/png' }),
      'smoke-photo.png'
    );

    const uploadedVisitor = await request(baseUrl, '/api/visitors', {
      method: 'POST',
      headers: authHeaders,
      body: photoForm
    });
    uploadedVisitorId = uploadedVisitor.body._id;
    uploadedPhoto = uploadedVisitor.body.photo;
    if (!uploadedPhoto) {
      throw new Error('Visitor photo path was not saved');
    }
    await fs.access(path.join(uploadsDir, path.basename(uploadedPhoto)));
    console.log('PASS visitor photo upload stored');

    const otherOrgUser = await User.create({
      name: 'Other Org Admin',
      email: otherOrgEmail,
      password: await bcrypt.hash('123456', 10),
      role: 'admin',
      organization: 'Branch Office',
      isVerified: true
    });
    otherOrgUserId = otherOrgUser._id;

    const otherOrgLogin = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: otherOrgEmail,
        password: '123456'
      })
    });
    const otherOrgVisitors = await request(baseUrl, '/api/visitors', {
      headers: { Authorization: `Bearer ${otherOrgLogin.body.token}` }
    });
    if (
      otherOrgVisitors.body.some((visitor) => visitor._id === uploadedVisitorId)
    ) {
      throw new Error('Visitor from Main Office was visible in Branch Office');
    }
    console.log('PASS multi-organization visitor isolation');

    const passes = await request(baseUrl, '/api/passes', {
      headers: authHeaders
    });
    if (!passes.body.length) {
      throw new Error('Smoke test needs at least one demo pass');
    }

    const qrToken = passes.body[0].qrToken;
    const verification = await request(
      baseUrl,
      `/api/passes/verify/${encodeURIComponent(qrToken)}`
    );
    if (!verification.body.pass) {
      throw new Error('QR pass verification did not return a pass');
    }
    console.log('PASS QR pass verification');

    const log = await request(baseUrl, '/api/logs', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        qrToken,
        action: 'checkin',
        location: 'Automated smoke test'
      })
    });
    createdLogId = log.body._id;
    console.log('PASS QR check-in log creation');

    const filteredLogs = await request(
      baseUrl,
      '/api/logs?action=checkin&search=Automated%20smoke%20test',
      { headers: authHeaders }
    );
    if (!filteredLogs.body.some((item) => item._id === createdLogId)) {
      throw new Error('Created QR log was not returned by report filters');
    }
    console.log('PASS dashboard report filtering');

    const registration = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Test Visitor',
        email: smokeEmail,
        password: smokePassword,
        phone: '',
        organization: login.body.user.organization
      })
    });
    if (!registration.body.demoOtp) {
      throw new Error('OTP smoke test requires OTP_DEMO_MODE=true');
    }
    console.log('PASS demo OTP generated');

    const unverifiedLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: smokeEmail,
        password: smokePassword
      })
    });
    const unverifiedLogin = await unverifiedLoginResponse.json();
    if (
      unverifiedLoginResponse.status !== 403 ||
      !unverifiedLogin.verificationRequired ||
      !unverifiedLogin.demoOtp
    ) {
      throw new Error('Unverified login did not return a demo OTP');
    }
    console.log('PASS unverified login redirected to OTP verification');

    await request(baseUrl, '/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: smokeEmail,
        otp: unverifiedLogin.demoOtp
      })
    });
    console.log('PASS OTP verification');

    await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: smokeEmail,
        password: smokePassword
      })
    });
    console.log('PASS verified visitor login');

    const forgotPassword = await request(
      baseUrl,
      '/api/auth/forgot-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: smokeEmail })
      }
    );
    if (!forgotPassword.body.demoOtp) {
      throw new Error('Password reset did not return a demo OTP');
    }
    console.log('PASS password reset OTP generated');

    await request(baseUrl, '/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: smokeEmail,
        otp: forgotPassword.body.demoOtp,
        password: resetPassword
      })
    });
    console.log('PASS password reset');

    const oldPasswordResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: smokeEmail,
        password: smokePassword
      })
    });
    if (oldPasswordResponse.status !== 401) {
      throw new Error('Old password still works after password reset');
    }
    console.log('PASS old password rejected');

    await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: smokeEmail,
        password: resetPassword
      })
    });
    console.log('PASS login with reset password');
  } finally {
    if (createdLogId) {
      await CheckLog.deleteOne({ _id: createdLogId });
    }
    if (uploadedVisitorId) {
      await Visitor.deleteOne({ _id: uploadedVisitorId });
    }
    if (uploadedPhoto) {
      await fs.unlink(path.join(uploadsDir, path.basename(uploadedPhoto))).catch(
        () => {}
      );
    }
    if (otherOrgUserId) {
      await User.deleteOne({ _id: otherOrgUserId });
    }
    await User.deleteOne({ email: smokeEmail });
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});
