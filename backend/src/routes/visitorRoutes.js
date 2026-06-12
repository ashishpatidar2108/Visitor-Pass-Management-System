const router = require('express').Router();

const {
  createVisitor,
  deleteVisitor,
  getMyVisitorProfile,
  getVisitors
} = require('../controllers/visitorController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post(
  '/',
  auth(['admin', 'security', 'employee', 'visitor']),
  upload.single('photo'),
  createVisitor
);
router.get('/', auth(['admin', 'security', 'employee']), getVisitors);
router.get('/me', auth(['visitor']), getMyVisitorProfile);
router.delete('/:id', auth(['admin', 'security']), deleteVisitor);

module.exports = router;
