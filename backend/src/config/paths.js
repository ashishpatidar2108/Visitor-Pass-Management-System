const path = require('path');

const storageDir = path.resolve(__dirname, '../../storage');

module.exports = {
  storageDir,
  uploadsDir: path.join(storageDir, 'uploads'),
  badgesDir: path.join(storageDir, 'badges')
};
