const fs = require('fs/promises');
const path = require('path');

const { badgesDir } = require('../config/paths');
const Appointment = require('../models/Appointment');
const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const generateBadge = require('../services/badgeService');
const { sendEmail, sendSms } = require('../services/notificationService');
const { getRequestOrganization } = require('../utils/organization');

async function deleteBadgeFile(assetPath) {
  if (!assetPath) {
    return;
  }

  const filePath = path.join(badgesDir, path.basename(assetPath));

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function issuePass(req, res) {
  const organization = getRequestOrganization(req);
  const visitor = await Visitor.findOne({
    _id: req.body.visitor,
    organization
  });

  if (!visitor) {
    return res.status(404).json({ message: 'Visitor not found' });
  }

  if (req.body.appointment) {
    const appointment = await Appointment.findOne({
      _id: req.body.appointment,
      visitor: visitor._id,
      organization
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
  }

  const qrToken = `VP-${Date.now()}`;
  let pass = await Pass.create({
    visitor: visitor._id,
    appointment: req.body.appointment,
    qrToken,
    organization,
    issuedBy: req.user.id,
    validFrom: new Date(),
    validTo: req.body.validTo || new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  const badgeFiles = await generateBadge(pass, visitor);
  pass = await Pass.findByIdAndUpdate(pass._id, badgeFiles, { new: true });

  await Promise.allSettled([
    sendEmail(
      visitor.email,
      'Your Visitor Pass',
      `Your visitor pass token is ${qrToken}`
    ),
    sendSms(
      visitor.phone,
      `Your visitor pass token is ${qrToken}. It is valid for 24 hours.`
    )
  ]);

  return res.status(201).json(pass);
}

async function getPasses(req, res) {
  const passes = await Pass.find({
    organization: getRequestOrganization(req)
  })
    .populate('visitor appointment')
    .sort('-createdAt');

  res.json(passes);
}

async function verifyPass(req, res) {
  const pass = await Pass.findOne({ qrToken: req.params.token }).populate(
    'visitor'
  );

  if (!pass) {
    return res.status(404).json({ valid: false, message: 'Invalid pass' });
  }

  const valid =
    pass.status === 'active' &&
    (!pass.validTo || new Date(pass.validTo) > new Date());

  return res.json({ valid, pass });
}

async function getMyPasses(req, res) {
  const organization = getRequestOrganization(req);
  const visitor = await Visitor.findOne({
    email: req.user.email,
    organization
  });

  if (!visitor) {
    return res.json([]);
  }

  const passes = await Pass.find({ visitor: visitor._id, organization })
    .populate('visitor appointment')
    .sort('-createdAt');

  return res.json(passes);
}

async function deletePass(req, res) {
  const organization = getRequestOrganization(req);
  const pass = await Pass.findOneAndDelete({
    _id: req.params.id,
    organization
  });

  if (!pass) {
    return res.status(404).json({ message: 'Pass not found' });
  }

  await Promise.all([
    CheckLog.deleteMany({ pass: pass._id, organization }),
    deleteBadgeFile(pass.qrImage),
    deleteBadgeFile(pass.pdfPath)
  ]);

  return res.json({ message: 'Pass removed' });
}

module.exports = {
  deletePass,
  getMyPasses,
  getPasses,
  issuePass,
  verifyPass
};
