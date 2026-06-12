require('./config/env');

const cors = require('cors');
const express = require('express');

const { badgesDir, uploadsDir } = require('./config/paths');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const apiRoutes = require('./routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.use('/uploads', express.static(uploadsDir));
app.use('/badges', express.static(badgesDir));

app.get('/', (req, res) => {
  res.json({ message: 'Visitor Pass Management API running' });
});

app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
