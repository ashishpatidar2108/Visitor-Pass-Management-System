const router = require('express').Router();

const {
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment
} = require('../controllers/appointmentController');
const auth = require('../middleware/auth');

router.post('/', auth(['admin', 'employee', 'visitor']), createAppointment);
router.get('/', auth(['admin', 'security', 'employee']), getAppointments);
router.patch('/:id', auth(['admin', 'employee']), updateAppointment);
router.delete('/:id', auth(['admin', 'employee']), deleteAppointment);

module.exports = router;
