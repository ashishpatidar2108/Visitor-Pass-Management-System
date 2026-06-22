const fs = require('fs/promises');
const path = require('path');

const { badgesDir, uploadsDir } = require('../config/paths');
const Appointment = require('../models/Appointment');
const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const { getRequestOrganization } = require('../utils/organization');

async function deleteStoredFile(folder, filePath) {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(path.join(folder, path.basename(filePath)));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function createVisitor(req, res) {
  const organization = getRequestOrganization(req);
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  const company = String(req.body.company || '').trim();
  const purpose = String(req.body.purpose || '').trim();
  const idProof = String(req.body.idProof || '').trim();
  let email = String(req.body.email || '').trim().toLowerCase();

  if (req.user.role === 'visitor') {
    email = req.user.email;
  }

  if (!name) {
    await deleteStoredFile(uploadsDir, req.file?.filename);
    return res.status(400).json({ message: 'Visitor name is required' });
  }

  if (req.user.role === 'visitor') {
    const existingProfile = await Visitor.findOne({
      email: req.user.email,
      organization
    });

    if (existingProfile) {
      await deleteStoredFile(uploadsDir, req.file?.filename);
      return res
        .status(400)
        .json({ message: 'Visitor profile already exists' });
    }
  }

  const visitor = await Visitor.create({
    name,
    email,
    phone,
    company,
    purpose,
    idProof,
    photo: req.file ? `/uploads/${req.file.filename}` : undefined,
    organization,
    createdBy: req.user.id
  });

  return res.status(201).json(visitor);
}

async function getVisitors(req, res) {
  const organization = getRequestOrganization(req);
  const visitors = await Visitor.find({ organization }).sort('-createdAt');

  return res.json(visitors);
}

async function getMyVisitorProfile(req, res) {
  const organization = getRequestOrganization(req);
  const visitor = await Visitor.findOne({
    email: req.user.email,
    organization
  });

  return res.json(visitor);
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

  await Appointment.deleteMany({ visitor: visitor._id, organization });
  await CheckLog.deleteMany({
    organization,
    $or: [{ visitor: visitor._id }, { pass: { $in: passIds } }]
  });
  await Pass.deleteMany({ visitor: visitor._id, organization });
  await Visitor.deleteOne({ _id: visitor._id, organization });

  await deleteStoredFile(uploadsDir, visitor.photo);

  for (const pass of passes) {
    await deleteStoredFile(badgesDir, pass.qrImage);
    await deleteStoredFile(badgesDir, pass.pdfPath);
  }

  return res.json({ message: 'Visitor removed' });
}

module.exports = {
  createVisitor,
  deleteVisitor,
  getMyVisitorProfile,
  getVisitors
};
