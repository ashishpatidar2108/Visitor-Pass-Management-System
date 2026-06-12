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

  async function submit(event) {
    event.preventDefault();
    setMessage('');

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
    }
  }

  return (
    <main className="auth-page">
      <div className="card narrow">
        <h2>Login</h2>
        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            required
          />
          <button type="submit">Login</button>
        </form>
        {message && <p className="error">{message}</p>}
        {location.state?.message && (
          <p className="success">{location.state.message}</p>
        )}
        <small>Demo: admin@test.com / 123456</small>
        <p className="auth-link">
          New visitor? <Link to="/register">Create account</Link>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
