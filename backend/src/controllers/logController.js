const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const { getRequestOrganization } = require('../utils/organization');

function parseFilterDate(value, endOfDay = false) {
  if (!value) {
    return null;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(
    isDateOnly
      ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
      : value
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

async function createCheckLog(req, res) {
  const organization = getRequestOrganization(req);
  const pass = await Pass.findOne({
    qrToken: req.body.qrToken,
    organization
  });

  if (!pass) {
    return res.status(404).json({ message: 'Pass not found' });
  }

  const log = await CheckLog.create({
    pass: pass._id,
    visitor: pass.visitor,
    organization,
    action: req.body.action,
    location: req.body.location,
    scannedBy: req.user.id
  });

  return res.status(201).json(log);
}

async function getCheckLogs(req, res) {
  const query = { organization: getRequestOrganization(req) };

  if (req.query.action) {
    query.action = req.query.action;
  }

  if (req.query.from || req.query.to) {
    query.createdAt = {};

    const fromDate = parseFilterDate(req.query.from);
    const toDate = parseFilterDate(req.query.to, true);

    if (req.query.from && !fromDate) {
      return res.status(400).json({ message: 'Invalid from date' });
    }

    if (req.query.to && !toDate) {
      return res.status(400).json({ message: 'Invalid to date' });
    }

    if (fromDate) query.createdAt.$gte = fromDate;
    if (req.query.to) {
      query.createdAt.$lte = toDate;
    }
  }

  let logs = await CheckLog.find(query)
    .populate('pass visitor scannedBy', 'qrToken name email')
    .sort('-createdAt');

  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    logs = logs.filter((log) => {
      const values = [
        log.visitor?.name,
        log.visitor?.email,
        log.pass?.qrToken,
        log.location,
        log.scannedBy?.name
      ];

      return values.some((value) => value?.toLowerCase().includes(search));
    });
  }

  res.json(logs);
}

module.exports = { createCheckLog, getCheckLogs };
