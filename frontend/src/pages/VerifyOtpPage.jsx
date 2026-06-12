import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import api from '../services/api';

function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState(location.state?.demoOtp || '');
  const [demoOtp, setDemoOtp] = useState(location.state?.demoOtp || '');
  const [message, setMessage] = useState(location.state?.message || '');
  const [isError, setIsError] = useState(false);

  async function verify(event) {
    event.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      navigate('/login', {
        replace: true,
        state: { message: data.message }
      });
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || 'OTP verification failed');
    }
  }

  async function resend() {
    setMessage('');
    setIsError(false);

    try {
      const { data } = await api.post('/auth/resend-otp', { email });
      setDemoOtp(data.demoOtp || '');
      if (data.demoOtp) setOtp(data.demoOtp);
      setMessage(data.message);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || 'Unable to resend OTP');
    }
  }

  return (
    <main className="auth-page">
      <div className="card narrow">
        <h2>Verify OTP</h2>
        <p className="muted">
          Enter the 6-digit OTP sent to your email/phone or shown below in local
          demo mode.
        </p>
        <form onSubmit={verify}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
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
          <button type="submit">Verify Account</button>
          <button className="button-secondary" type="button" onClick={resend}>
            Resend OTP
          </button>
        </form>
        {demoOtp && (
          <p className="success">
            Local demo OTP: <b>{demoOtp}</b>
          </p>
        )}
        {message && <p className={isError ? 'error' : 'success'}>{message}</p>}
        <p className="auth-link">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </main>
  );
}

export default VerifyOtpPage;
