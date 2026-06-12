const router = require('express').Router();

const {
  getCollectionSummary,
  getDashboard
} = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.get('/', auth(['admin', 'security']), getDashboard);
router.get('/collections', auth(['admin']), getCollectionSummary);

module.exports = router;
