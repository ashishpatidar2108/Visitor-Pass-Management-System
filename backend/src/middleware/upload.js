const fs = require('fs');
const multer = require('multer');

const { uploadsDir } = require('../config/paths');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadsDir),
  filename: (req, file, callback) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    callback(null, `${Date.now()}-${safeName}`);
  }
});

module.exports = multer({ storage });
