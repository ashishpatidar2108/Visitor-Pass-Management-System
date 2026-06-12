const router = require('express').Router();

const {
  login,
  register,
  resendOtp,
  verifyOtp
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

module.exports = router;
