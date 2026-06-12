const DEFAULT_ORGANIZATION = 'Main Office';

function normalizeOrganization(value) {
  return String(value || DEFAULT_ORGANIZATION).trim() || DEFAULT_ORGANIZATION;
}

function getRequestOrganization(req) {
  return normalizeOrganization(req.user?.organization);
}

module.exports = {
  DEFAULT_ORGANIZATION,
  getRequestOrganization,
  normalizeOrganization
};
