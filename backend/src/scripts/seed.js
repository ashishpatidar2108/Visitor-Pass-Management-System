require('../config/env');

const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');
const Appointment = require('../models/Appointment');
const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const User = require('../models/User');
const Visitor = require('../models/Visitor');

async function seed() {
  await connectDB();
  await Promise.all([
    User.deleteMany(),
    Visitor.deleteMany(),
    Appointment.deleteMany(),
    Pass.deleteMany(),
    CheckLog.deleteMany()
  ]);

  const password = await bcrypt.hash('123456', 10);
  const organization = 'Main Office';
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password,
    role: 'admin',
    organization,
    isVerified: true
  });
  await User.create({
    name: 'Security Staff',
    email: 'security@test.com',
    password,
    role: 'security',
    organization,
    isVerified: true
  });
  const employee = await User.create({
    name: 'Host Employee',
    email: 'employee@test.com',
    password,
    role: 'employee',
    organization,
    isVerified: true
  });
  await User.create({
    name: 'Demo Visitor',
    email: 'visitor@test.com',
    password,
    role: 'visitor',
    organization,
    isVerified: true
  });
  const visitor = await Visitor.create({
    name: 'Rahul Sharma',
    email: 'rahul@test.com',
    phone: '9999999999',
    company: 'ABC Pvt Ltd',
    purpose: 'Meeting',
    organization,
    createdBy: admin._id
  });

  const appointment = await Appointment.create({
    visitor: visitor._id,
    host: employee._id,
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    purpose: 'Project discussion',
    organization,
    status: 'approved'
  });
  const pass = await Pass.create({
    visitor: visitor._id,
    appointment: appointment._id,
    qrToken: `VP-DEMO-${Date.now()}`,
    organization,
    validFrom: new Date(),
    validTo: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'active',
    issuedBy: admin._id
  });
  await CheckLog.create({
    pass: pass._id,
    visitor: visitor._id,
    action: 'checkin',
    organization,
    scannedBy: admin._id,
    location: 'Main Gate'
  });

  console.log(
    'Seed done. Logins: admin@test.com / security@test.com / employee@test.com / visitor@test.com password 123456'
  );
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
