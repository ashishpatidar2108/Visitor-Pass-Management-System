const jwt = require('jsonwebtoken');
const { normalizeOrganization } = require('../utils/organization');

function auth(roles = []) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      req.user.organization = normalizeOrganization(req.user.organization);

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      return next();
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

module.exports = auth;
