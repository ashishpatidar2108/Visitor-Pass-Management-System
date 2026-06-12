const router = require('express').Router();

const {
  createUser,
  deleteUser,
  getHosts,
  getUsers,
  updateUser
} = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/', auth(['admin']), getUsers);
router.get(
  '/hosts',
  auth(['admin', 'security', 'employee', 'visitor']),
  getHosts
);
router.post('/', auth(['admin']), createUser);
router.patch('/:id', auth(['admin']), updateUser);
router.delete('/:id', auth(['admin']), deleteUser);

module.exports = router;
