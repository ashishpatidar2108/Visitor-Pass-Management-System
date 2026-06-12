import { useEffect, useState } from 'react';

import api from '../services/api';
import { getStoredUser } from '../utils/authStorage';

const emptyAppointment = {
  visitor: '',
  host: '',
  date: '',
  purpose: ''
};

const appointmentGroups = [
  {
    key: 'pending',
    title: 'Pending',
    statuses: ['pending']
  },
  {
    key: 'approved',
    title: 'Accepted',
    statuses: ['approved', 'completed']
  },
  {
    key: 'rejected',
    title: 'Rejected',
    statuses: ['rejected']
  }
];

function AppointmentsPage() {
  const user = getStoredUser();
  const [appointments, setAppointments] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyAppointment);
  const [message, setMessage] = useState('');

  async function loadAppointments() {
    const { data } = await api.get('/appointments');
    setAppointments(data);
  }

  useEffect(() => {
    loadAppointments();
    api.get('/visitors').then((response) => setVisitors(response.data));
    api.get('/users/hosts').then((response) => setUsers(response.data));
  }, []);

  async function addAppointment(event) {
    event.preventDefault();
    setMessage('');

    try {
      await api.post('/appointments', form);
      setForm(emptyAppointment);
      setMessage('Appointment created');
      await loadAppointments();
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Unable to create appointment'
      );
    }
  }

  async function updateStatus(id, status) {
    setMessage('');

    try {
      await api.patch(`/appointments/${id}`, { status });
      setMessage(`Appointment ${status}`);
      await loadAppointments();
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Unable to update appointment'
      );
    }
  }

  async function deleteAppointment(id) {
    if (!window.confirm('Remove this appointment?')) return;

    setMessage('');

    try {
      await api.delete(`/appointments/${id}`);
      setMessage('Appointment removed');
      await loadAppointments();
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Unable to remove appointment'
      );
    }
  }

  return (
    <>
      <h2>Appointments</h2>
      {message && <p>{message}</p>}
      {['admin', 'employee'].includes(user?.role) && (
        <form className="card form" onSubmit={addAppointment}>
          <select
            value={form.visitor}
            onChange={(event) =>
              setForm({ ...form, visitor: event.target.value })
            }
            required
          >
            <option value="">Select visitor</option>
            {visitors.map((visitor) => (
              <option key={visitor._id} value={visitor._id}>
                {visitor.name}
              </option>
            ))}
          </select>
          <select
            value={form.host}
            onChange={(event) => setForm({ ...form, host: event.target.value })}
            required
          >
            <option value="">Select host</option>
            {users.map((host) => (
              <option key={host._id} value={host._id}>
                {host.name}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            required
          />
          <input
            placeholder="Purpose"
            value={form.purpose}
            onChange={(event) =>
              setForm({ ...form, purpose: event.target.value })
            }
          />
          <button type="submit">Create</button>
        </form>
      )}

      <div className="appointment-board">
        {appointmentGroups.map((group) => {
          const groupAppointments = appointments.filter((appointment) =>
            group.statuses.includes(appointment.status)
          );

          return (
            <section
              className={`appointment-column appointment-column-${group.key}`}
              key={group.key}
            >
              <div className="appointment-column-heading">
                <h3>{group.title}</h3>
                <span>{groupAppointments.length}</span>
              </div>

              {!groupAppointments.length && (
                <p className="muted appointment-empty">
                  No {group.title.toLowerCase()} appointments
                </p>
              )}

              {groupAppointments.map((appointment) => (
                <article
                  className="card appointment-card"
                  key={appointment._id}
                >
                  <b>{appointment.visitor?.name || 'Visitor'}</b>
                  <p>Host: {appointment.host?.name || '-'}</p>
                  <p>{new Date(appointment.date).toLocaleString()}</p>
                  {appointment.purpose && (
                    <p className="muted">Purpose: {appointment.purpose}</p>
                  )}

                  {['admin', 'employee'].includes(user?.role) && (
                    <div className="appointment-actions">
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(appointment._id, 'approved')
                            }
                          >
                            Accept
                          </button>
                          <button
                            className="button-danger"
                            type="button"
                            onClick={() =>
                              updateStatus(appointment._id, 'rejected')
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => deleteAppointment(appointment._id)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}

export default AppointmentsPage;
