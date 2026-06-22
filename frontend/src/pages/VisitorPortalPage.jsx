import { useEffect, useState } from 'react';

import api, { getServerAssetUrl } from '../services/api';
import { getStoredUser } from '../utils/authStorage';

const initialProfile = {
  name: '',
  phone: '',
  company: '',
  purpose: ''
};

function VisitorPortalPage() {
  const user = getStoredUser();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    ...initialProfile,
    name: user?.name || ''
  });
  const [photo, setPhoto] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [passes, setPasses] = useState([]);
  const [appointment, setAppointment] = useState({
    host: '',
    date: '',
    purpose: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function loadPortal() {
    try {
      const [profileResponse, hostResponse, passResponse] = await Promise.all([
        api.get('/visitors/me'),
        api.get('/users/hosts'),
        api.get('/passes/my')
      ]);
      setProfile(profileResponse.data);
      setHosts(hostResponse.data);
      setPasses(passResponse.data);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || 'Unable to load portal');
    }
  }

  useEffect(() => {
    loadPortal();
  }, []);

  async function createProfile(event) {
    event.preventDefault();
    setIsError(false);
    setMessage('');
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (photo) payload.append('photo', photo);

    try {
      await api.post('/visitors', payload);
      setMessage('Visitor profile created');
      await loadPortal();
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || 'Unable to save profile');
    }
  }

  async function requestAppointment(event) {
    event.preventDefault();
    setIsError(false);
    setMessage('');

    try {
      await api.post('/appointments', {
        ...appointment,
        visitor: profile._id
      });
      setAppointment({ host: '', date: '', purpose: '' });
      setMessage('Appointment request submitted');
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.message || 'Unable to request appointment'
      );
    }
  }

  return (
    <>
      <h2>Visitor Portal</h2>
      {message && <p className={isError ? 'error' : 'success'}>{message}</p>}

      {!profile ? (
        <form className="card form" onSubmit={createProfile}>
          <h3>Complete Your Profile</h3>
          {Object.keys(initialProfile).map((field) => (
            <input
              key={field}
              placeholder={field}
              value={form[field]}
              onChange={(event) =>
                setForm({ ...form, [field]: event.target.value })
              }
              required={field === 'name'}
            />
          ))}
          <label className="file-field">
            Visitor photo
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPhoto(event.target.files[0])}
            />
          </label>
          <button type="submit">Save Profile</button>
        </form>
      ) : (
        <form className="card form" onSubmit={requestAppointment}>
          <h3>Request Appointment</h3>
          <select
            value={appointment.host}
            onChange={(event) =>
              setAppointment({ ...appointment, host: event.target.value })
            }
            required
          >
            <option value="">Select host</option>
            {hosts.map((host) => (
              <option key={host._id} value={host._id}>
                {host.name}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={appointment.date}
            onChange={(event) =>
              setAppointment({ ...appointment, date: event.target.value })
            }
            required
          />
          <input
            placeholder="Purpose"
            value={appointment.purpose}
            onChange={(event) =>
              setAppointment({ ...appointment, purpose: event.target.value })
            }
          />
          <button type="submit">Send Request</button>
        </form>
      )}

      <h3>My Digital Passes</h3>
      <div className="grid">
        {passes.map((pass) => (
          <div className="card" key={pass._id}>
            <b>{pass.qrToken}</b>
            <p className="muted">Status: {pass.status}</p>
            {pass.qrImage && (
              <img
                className="qr"
                src={getServerAssetUrl(pass.qrImage)}
                alt="Pass QR"
              />
            )}
            {pass.pdfPath && (
              <a
                href={getServerAssetUrl(pass.pdfPath)}
                target="_blank"
                rel="noreferrer"
              >
                Download Badge
              </a>
            )}
          </div>
        ))}
        {!passes.length && (
          <p className="muted">No pass has been issued yet.</p>
        )}
      </div>
    </>
  );
}

export default VisitorPortalPage;
