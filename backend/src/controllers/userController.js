const bcrypt = require('bcryptjs');

const User = require('../models/User');
const { getRequestOrganization } = require('../utils/organization');

async function getUsers(req, res) {
  const users = await User.find({
    organization: getRequestOrganization(req)
  }).select('-password -verificationOtpHash');
  res.json(users);
}

async function getHosts(req, res) {
  const hosts = await User.find({
    role: 'employee',
    organization: getRequestOrganization(req)
  })
    .select('name email phone organization role')
    .sort('name');

  res.json(hosts);
}

async function createUser(req, res) {
  const { name, password, role, phone } = req.body;
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();
  const organization = getRequestOrganization(req);
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role,
    phone,
    organization,
    isVerified: true
  });

  return res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    organization: user.organization
  });
}

async function updateUser(req, res) {
  const allowedFields = ['name', 'role', 'phone'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findOneAndUpdate(
    {
      _id: req.params.id,
      organization: getRequestOrganization(req)
    },
    updates,
    {
      new: true,
      runValidators: true
    }
  ).select('-password -verificationOtpHash');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(user);
}

async function deleteUser(req, res) {
  if (req.params.id === req.user.id) {
    return res
      .status(400)
      .json({ message: 'You cannot delete your own account' });
  }

  const user = await User.findOneAndDelete({
    _id: req.params.id,
    organization: getRequestOrganization(req)
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ message: 'User deleted' });
}

module.exports = {
  getUsers,
  getHosts,
  createUser,
  updateUser,
  deleteUser
};
