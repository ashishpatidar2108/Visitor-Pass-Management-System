import { useEffect, useState } from 'react';

import api from '../services/api';
import { getStoredUser } from '../utils/authStorage';

function getInitialForm() {
  const user = getStoredUser();

  return {
    name: '',
    email: '',
    password: '123456',
    role: 'employee',
    phone: '',
    organization: user?.organization || 'Main Office'
  };
}

function StaffPage() {
  const initialForm = getInitialForm();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  async function loadUsers() {
    const { data } = await api.get('/users');
    setUsers(data);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createStaff(event) {
    event.preventDefault();
    await api.post('/users', form);
    setForm(initialForm);
    setMessage('Staff account created');
    await loadUsers();
  }

  async function changeRole(id, role) {
    await api.patch(`/users/${id}`, { role });
    await loadUsers();
  }

  async function deleteUser(id) {
    if (!window.confirm('Delete this user account?')) return;
    await api.delete(`/users/${id}`);
    await loadUsers();
  }

  return (
    <>
      <h2>Staff Management</h2>
      <form className="card form" onSubmit={createStaff}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Temporary password"
          value={form.password}
          onChange={(event) =>
            setForm({ ...form, password: event.target.value })
          }
          required
        />
        <select
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value })}
        >
          <option value="employee">Employee</option>
          <option value="security">Security</option>
          <option value="admin">Admin</option>
        </select>
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <input placeholder="Organization" value={form.organization} readOnly />
        <button type="submit">Add Staff</button>
      </form>
      {message && <p className="success">{message}</p>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Organization</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(event) =>
                      changeRole(user._id, event.target.value)
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="security">Security</option>
                    <option value="employee">Employee</option>
                    <option value="visitor">Visitor</option>
                  </select>
                </td>
                <td>{user.organization}</td>
                <td>
                  <button
                    className="button-danger"
                    type="button"
                    onClick={() => deleteUser(user._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default StaffPage;
