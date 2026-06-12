const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const { sendEmail, sendSms } = require('../services/notificationService');
const { getRequestOrganization } = require('../utils/organization');

async function createAppointment(req, res) {
  const organization = getRequestOrganization(req);
  const visitor = await Visitor.findOne({
    _id: req.body.visitor,
    organization
  });
  const host = await User.findOne({
    _id: req.body.host,
    role: 'employee',
    organization
  });

  if (!visitor) {
    return res.status(404).json({ message: 'Visitor not found' });
  }

  if (!host) {
    return res.status(404).json({ message: 'Host not found' });
  }

  if (req.user.role === 'visitor' && visitor.email !== req.user.email) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const appointment = await Appointment.create({
    visitor: visitor._id,
    host: host._id,
    date: req.body.date,
    purpose: req.body.purpose,
    notes: req.body.notes,
    organization
  });
  res.status(201).json(appointment);
}

async function getAppointments(req, res) {
  const appointments = await Appointment.find({
    organization: getRequestOrganization(req)
  })
    .populate('visitor host', 'name email phone')
    .sort('-date');

  res.json(appointments);
}

async function updateAppointment(req, res) {
  const allowedFields = ['status', 'notes', 'date', 'purpose'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const appointment = await Appointment.findOneAndUpdate(
    {
      _id: req.params.id,
      organization: getRequestOrganization(req)
    },
    updates,
    { new: true, runValidators: true }
  );

  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

  if (updates.status && ['approved', 'rejected'].includes(updates.status)) {
    const populatedAppointment = await appointment.populate('visitor host');
    const visitor = populatedAppointment.visitor;
    const host = populatedAppointment.host;
    const message = `Your appointment with ${host?.name || 'the host'} is ${updates.status}.`;

    await Promise.allSettled([
      sendEmail(visitor?.email, 'Appointment Status Update', message),
      sendSms(visitor?.phone, message)
    ]);
  }

  return res.json(appointment);
}

async function deleteAppointment(req, res) {
  const organization = getRequestOrganization(req);
  const appointment = await Appointment.findOneAndDelete({
    _id: req.params.id,
    organization
  });

  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

  await Pass.updateMany(
    { appointment: appointment._id, organization },
    { $unset: { appointment: 1 } }
  );

  return res.json({ message: 'Appointment deleted' });
}

module.exports = {
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment
};
