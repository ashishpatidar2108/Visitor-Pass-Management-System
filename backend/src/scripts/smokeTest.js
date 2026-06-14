require('../config/env');

const mongoose = require('mongoose');

const app = require('../app');
const connectDB = require('../config/db');
const CheckLog = require('../models/CheckLog');
const User = require('../models/User');

const smokeEmail = `smoke-${Date.now()}@example.com`;
const smokePassword = 'SmokeTest123!';
let createdLogId;

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
    const root = await request(baseUrl, '/');
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

    await request(baseUrl, '/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: smokeEmail,
        otp: registration.body.demoOtp
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
  } finally {
    if (createdLogId) {
      await CheckLog.deleteOne({ _id: createdLogId });
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
