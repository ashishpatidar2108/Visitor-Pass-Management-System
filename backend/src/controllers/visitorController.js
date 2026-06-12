const fs = require('fs/promises');
const path = require('path');

const { badgesDir, uploadsDir } = require('../config/paths');
const Appointment = require('../models/Appointment');
const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const { getRequestOrganization } = require('../utils/organization');

async function deleteStoredFile(rootDir, assetPath) {
  if (!assetPath) {
    return;
  }

  try {
    await fs.unlink(path.join(rootDir, path.basename(assetPath)));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function createVisitor(req, res) {
  const organization = getRequestOrganization(req);
  const email = req.user.role === 'visitor' ? req.user.email : req.body.email;
  const existingVisitor =
    req.user.role === 'visitor'
      ? await Visitor.findOne({ email: req.user.email, organization })
      : null;

  if (existingVisitor) {
    return res.status(400).json({ message: 'Visitor profile already exists' });
  }

  const visitor = await Visitor.create({
    ...req.body,
    email,
    photo: req.file ? `/uploads/${req.file.filename}` : undefined,
    organization,
    createdBy: req.user.id
  });

  res.status(201).json(visitor);
}

async function getVisitors(req, res) {
  const visitors = await Visitor.find({
    organization: getRequestOrganization(req)
  }).sort('-createdAt');
  res.json(visitors);
}

async function getMyVisitorProfile(req, res) {
  const visitor = await Visitor.findOne({
    email: req.user.email,
    organization: getRequestOrganization(req)
  });
  res.json(visitor);
}

async function deleteVisitor(req, res) {
  const organization = getRequestOrganization(req);
  const visitor = await Visitor.findOne({
    _id: req.params.id,
    organization
  });

  if (!visitor) {
    return res.status(404).json({ message: 'Visitor not found' });
  }

  const passes = await Pass.find({ visitor: visitor._id, organization });
  const passIds = passes.map((pass) => pass._id);

  await Promise.all([
    Appointment.deleteMany({ visitor: visitor._id, organization }),
    CheckLog.deleteMany({
      organization,
      $or: [{ visitor: visitor._id }, { pass: { $in: passIds } }]
    }),
    Pass.deleteMany({ visitor: visitor._id, organization }),
    Visitor.deleteOne({ _id: visitor._id, organization })
  ]);

  await Promise.allSettled([
    deleteStoredFile(uploadsDir, visitor.photo),
    ...passes.flatMap((pass) => [
      deleteStoredFile(badgesDir, pass.qrImage),
      deleteStoredFile(badgesDir, pass.pdfPath)
    ])
  ]);

  return res.json({ message: 'Visitor removed' });
}

module.exports = {
  createVisitor,
  deleteVisitor,
  getMyVisitorProfile,
  getVisitors
};
