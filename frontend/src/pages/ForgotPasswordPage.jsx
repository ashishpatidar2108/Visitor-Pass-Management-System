import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../services/api';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function requestOtp(event) {
    event.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setOtpRequested(true);
      setDemoOtp(data.demoOtp || '');
      if (data.demoOtp) setOtp(data.demoOtp);
      setMessage(data.message);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || 'Unable to request OTP');
    }
  }

  async function submitNewPassword(event) {
    event.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      const { data } = await api.post('/auth/reset-password', {
        email,
        otp,
        password
      });
      navigate('/login', {
        replace: true,
        state: { message: data.message }
      });
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || 'Password reset failed');
    }
  }

  return (
    <main className="auth-page">
      <div className="card narrow">
        <h2>Forgot Password</h2>
        <p className="muted">
          Enter your registered email to receive a password reset OTP.
        </p>

        {!otpRequested ? (
          <form onSubmit={requestOtp}>
            <input
              type="email"
              placeholder="Registered email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button type="submit">Send Reset OTP</button>
          </form>
        ) : (
          <form onSubmit={submitNewPassword}>
            <input type="email" value={email} readOnly />
            <input
              inputMode="numeric"
              maxLength="6"
              pattern="\d{6}"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              required
            />
            <input
              type="password"
              minLength="6"
              placeholder="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button type="submit">Reset Password</button>
            <button
              className="button-secondary"
              type="button"
              onClick={() => {
                setOtpRequested(false);
                setOtp('');
                setDemoOtp('');
                setMessage('');
              }}
            >
              Change Email
            </button>
          </form>
        )}

        {demoOtp && (
          <p className="success">
            Local demo OTP: <b>{demoOtp}</b>
          </p>
        )}
        {message && <p className={isError ? 'error' : 'success'}>{message}</p>}
        <p className="muted">
          Forgot your email? Contact the administrator because account emails
          are not displayed for security.
        </p>
        <p className="auth-link">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </main>
  );
}

export default ForgotPasswordPage;
