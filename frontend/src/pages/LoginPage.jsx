import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import api from '../services/api';
import { saveSession } from '../utils/authStorage';

const initialForm = {
  email: 'admin@test.com',
  password: '123456'
};

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm({ ...form, [field]: value });
    if (message) setMessage('');
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);
      saveSession(data);
      navigate(
        location.state?.from?.pathname ||
          (data.user.role === 'visitor' ? '/portal' : '/dashboard'),
        { replace: true }
      );
    } catch (error) {
      if (error.response?.data?.verificationRequired) {
        navigate('/verify-otp', {
          state: {
            email: error.response.data.email || form.email,
            demoOtp: error.response.data.demoOtp,
            message: error.response.data.message
          }
        });
        return;
      }

      setMessage(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page login-page">
      <span className="login-shape login-shape-one" aria-hidden="true" />
      <span className="login-shape login-shape-two" aria-hidden="true" />

      <div className="card narrow login-card">
        <div className="login-heading">
          <span className="login-mark" aria-hidden="true">
            VP
          </span>
          <div>
            <h2>Welcome back</h2>
            <p className="muted">Sign in to manage visitor access.</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <label className="login-field">
            <span>Email</span>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              disabled={loading}
              required
            />
          </label>
          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              disabled={loading}
              required
            />
          </label>
          <button className="login-submit" type="submit" disabled={loading}>
            {loading && <span className="login-spinner" aria-hidden="true" />}
            <span>{loading ? 'Signing in...' : 'Login'}</span>
          </button>
        </form>

        {loading && (
          <p className="login-status" role="status" aria-live="polite">
            Checking your account securely...
          </p>
        )}
        {message && (
          <div className="login-alert login-alert-error" role="alert">
            <span className="login-alert-icon" aria-hidden="true">
              !
            </span>
            <div>
              <strong>Login unsuccessful</strong>
              <p>{message}</p>
            </div>
          </div>
        )}
        {location.state?.message && (
          <div
            className="login-alert login-alert-success"
            role="status"
            aria-live="polite"
          >
            <span className="login-alert-icon" aria-hidden="true">
              OK
            </span>
            <p>{location.state.message}</p>
          </div>
        )}

        <div className="login-links">
          <Link to="/forgot-password">Forgot email or password?</Link>
          <p>
            New visitor? <Link to="/register">Create account</Link>
          </p>
        </div>

        <small className="demo-login">
          Demo login: admin@test.com / 123456
        </small>
      </div>
    </main>
  );
}

export default LoginPage;
