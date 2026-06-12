const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/visitors', require('./visitorRoutes'));
router.use('/appointments', require('./appointmentRoutes'));
router.use('/passes', require('./passRoutes'));
router.use('/logs', require('./logRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

module.exports = router;
