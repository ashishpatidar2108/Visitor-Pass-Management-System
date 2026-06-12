const router = require('express').Router();

const {
  createCheckLog,
  getCheckLogs
} = require('../controllers/logController');
const auth = require('../middleware/auth');

router.post('/', auth(['admin', 'security']), createCheckLog);
router.get('/', auth(['admin', 'security']), getCheckLogs);

module.exports = router;
