const Appointment = require('../models/Appointment');
const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const { getRequestOrganization } = require('../utils/organization');

async function getDashboard(req, res) {
  const organization = getRequestOrganization(req);
  const organizationMatch = { organization };
  const [
    users,
    visitors,
    appointments,
    passes,
    logs,
    appointmentStatus,
    passStatus,
    recentLogs
  ] = await Promise.all([
    User.countDocuments(organizationMatch),
    Visitor.countDocuments(organizationMatch),
    Appointment.countDocuments(organizationMatch),
    Pass.countDocuments(organizationMatch),
    CheckLog.countDocuments(organizationMatch),
    Appointment.aggregate([
      { $match: organizationMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Pass.aggregate([
      { $match: organizationMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    CheckLog.find(organizationMatch)
      .populate('visitor scannedBy', 'name')
      .sort('-createdAt')
      .limit(5)
  ]);

  res.json({
    summary: { users, visitors, appointments, passes, logs },
    appointmentStatus: Object.fromEntries(
      appointmentStatus.map((item) => [item._id, item.count])
    ),
    passStatus: Object.fromEntries(
      passStatus.map((item) => [item._id, item.count])
    ),
    recentLogs
  });
}

async function getCollectionSummary(req, res) {
  const organization = getRequestOrganization(req);
  const models = [
    ['users', User],
    ['visitors', Visitor],
    ['appointments', Appointment],
    ['passes', Pass],
    ['checklogs', CheckLog]
  ];
  const collections = await Promise.all(
    models.map(async ([name, model]) => ({
      name,
      documents: await model.countDocuments({ organization }),
      database: model.db.name
    }))
  );

  res.json(collections);
}

module.exports = { getDashboard, getCollectionSummary };
