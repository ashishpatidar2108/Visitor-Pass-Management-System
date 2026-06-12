const dns = require('dns');
const mongoose = require('mongoose');

const DNS_FALLBACK_SERVERS = ['8.8.8.8', '1.1.1.1'];
const DNS_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEOUT',
  'ENOTFOUND',
  'ESERVFAIL'
]);

function getMongoOptions() {
  return {
    serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 10000
  };
}

function getDnsServers() {
  return (process.env.MONGO_DNS_SERVERS || DNS_FALLBACK_SERVERS.join(','))
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
}

function isSrvDnsError(uri, error) {
  return uri.startsWith('mongodb+srv://') && DNS_ERROR_CODES.has(error.code);
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required');

  try {
    await mongoose.connect(uri, getMongoOptions());
    console.log('MongoDB connected');
  } catch (error) {
    const dnsServers = getDnsServers();
    if (isSrvDnsError(uri, error) && dnsServers.length) {
      await mongoose.disconnect().catch(() => {});
      dns.setServers(dnsServers);
      await mongoose.connect(uri, getMongoOptions());
      console.log(
        `MongoDB connected using DNS fallback (${dnsServers.join(', ')})`
      );
      return;
    }

    throw error;
  }
};

module.exports = connectDB;
