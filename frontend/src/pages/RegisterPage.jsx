import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../services/api';

const initialForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  organization: 'Main Office'
};

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const { data } = await api.post('/auth/register', form);
      navigate('/verify-otp', {
        state: {
          email: data.email,
          demoOtp: data.demoOtp,
          message: data.message
        }
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <main className="auth-page">
      <div className="card narrow">
        <h2>Visitor Registration</h2>
        <form onSubmit={submit}>
          {Object.keys(initialForm).map((field) => (
            <input
              key={field}
              type={
                field === 'password'
                  ? 'password'
                  : field === 'email'
                    ? 'email'
                    : 'text'
              }
              placeholder={field}
              value={form[field]}
              onChange={(event) =>
                setForm({ ...form, [field]: event.target.value })
              }
              required={['name', 'email', 'password', 'organization'].includes(
                field
              )}
            />
          ))}
          <button type="submit">Create Visitor Account</button>
        </form>
        {message && <p className="error">{message}</p>}
        <p className="auth-link">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}

export default RegisterPage;
