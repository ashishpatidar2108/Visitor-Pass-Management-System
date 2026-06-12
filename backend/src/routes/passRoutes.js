const router = require('express').Router();

const {
  deletePass,
  getMyPasses,
  getPasses,
  issuePass,
  verifyPass
} = require('../controllers/passController');
const auth = require('../middleware/auth');

router.post('/issue', auth(['admin', 'security']), issuePass);
router.get('/', auth(['admin', 'security']), getPasses);
router.get('/my', auth(['visitor']), getMyPasses);
router.get('/verify/:token', verifyPass);
router.delete('/:id', auth(['admin', 'security']), deletePass);

module.exports = router;
