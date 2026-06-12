require('../config/env');

const connectDB = require('../config/db');
const Appointment = require('../models/Appointment');
const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const { DEFAULT_ORGANIZATION } = require('../utils/organization');

async function migrateOrganizations() {
  await connectDB();

  await User.updateMany(
    { organization: { $in: [null, ''] } },
    { $set: { organization: DEFAULT_ORGANIZATION } }
  );
  await User.updateMany(
    { isVerified: { $exists: false } },
    { $set: { isVerified: true } }
  );

  const visitors = await Visitor.find({
    organization: { $exists: false }
  });
  for (const visitor of visitors) {
    const creator = visitor.createdBy
      ? await User.findById(visitor.createdBy).select('organization')
      : null;
    visitor.organization = creator?.organization || DEFAULT_ORGANIZATION;
    await visitor.save();
  }

  const appointments = await Appointment.find({
    organization: { $exists: false }
  });
  for (const appointment of appointments) {
    const visitor = await Visitor.findById(appointment.visitor).select(
      'organization'
    );
    appointment.organization = visitor?.organization || DEFAULT_ORGANIZATION;
    await appointment.save();
  }

  const passes = await Pass.find({ organization: { $exists: false } });
  for (const pass of passes) {
    const visitor = await Visitor.findById(pass.visitor).select('organization');
    pass.organization = visitor?.organization || DEFAULT_ORGANIZATION;
    await pass.save();
  }

  const logs = await CheckLog.find({ organization: { $exists: false } });
  for (const log of logs) {
    const pass = await Pass.findById(log.pass).select('organization');
    log.organization = pass?.organization || DEFAULT_ORGANIZATION;
    await log.save();
  }

  console.log('Organization migration complete');
  process.exit(0);
}

migrateOrganizations().catch((error) => {
  console.error(error);
  process.exit(1);
});
