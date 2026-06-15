require('./config/env');

const cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');

const { badgesDir, uploadsDir } = require('./config/paths');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const apiRoutes = require('./routes');

const app = express();
const frontendDistDir = path.resolve(__dirname, '../../frontend/dist');
const frontendIndexPath = path.join(frontendDistDir, 'index.html');
const hasFrontendBuild =
  process.env.NODE_ENV === 'production' && fs.existsSync(frontendIndexPath);

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.use('/uploads', express.static(uploadsDir));
app.use('/badges', express.static(badgesDir));

app.get('/api/health', (req, res) => {
  res.json({ message: 'Visitor Pass Management API running' });
});

app.use('/api', apiRoutes);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistDir));
  app.use((req, res, next) => {
    const isSpaRoute =
      req.method === 'GET' &&
      !req.path.startsWith('/api/') &&
      !path.extname(req.path);

    if (isSpaRoute) {
      return res.sendFile(frontendIndexPath);
    }

    return next();
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Visitor Pass Management API running' });
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
