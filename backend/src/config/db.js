const dns = require('dns');
const mongoose = require('mongoose');

function getDnsServers() {
  return (process.env.MONGO_DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is required');
  }

  const dnsServers = getDnsServers();
  if (uri.startsWith('mongodb+srv://') && dnsServers.length) {
    dns.setServers(dnsServers);
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 10000
  });
  console.log('MongoDB connected');
};

module.exports = connectDB;
