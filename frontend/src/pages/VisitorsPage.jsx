import { useEffect, useState } from 'react';

import DataTable from '../components/common/DataTable';
import api from '../services/api';
import { getStoredUser } from '../utils/authStorage';

const emptyVisitor = {
  name: '',
  email: '',
  phone: '',
  company: '',
  purpose: ''
};

const visitorColumns = ['name', 'email', 'phone', 'company', 'purpose'];

function VisitorsPage() {
  const user = getStoredUser();
  const [visitors, setVisitors] = useState([]);
  const [form, setForm] = useState(emptyVisitor);
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');

  async function loadVisitors() {
    const { data } = await api.get('/visitors');
    setVisitors(data);
  }

  useEffect(() => {
    loadVisitors();
  }, []);

  async function addVisitor(event) {
    event.preventDefault();
    setMessage('');
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (photo) payload.append('photo', photo);

    try {
      await api.post('/visitors', payload);
      setForm(emptyVisitor);
      setPhoto(null);
      event.target.reset();
      setMessage('Visitor added');
      await loadVisitors();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to add visitor');
    }
  }

  async function deleteVisitor(id) {
    if (
      !window.confirm(
        'Remove this visitor? Related appointments, passes, files, and check logs will also be deleted.'
      )
    ) {
      return;
    }

    setMessage('');

    try {
      await api.delete(`/visitors/${id}`);
      setMessage('Visitor removed');
      await loadVisitors();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to remove visitor');
    }
  }

  return (
    <>
      <h2>Visitors</h2>
      {message && <p>{message}</p>}
      <form className="card form" onSubmit={addVisitor}>
        {visitorColumns.map((field) => (
          <input
            key={field}
            type={field === 'email' ? 'email' : 'text'}
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
        <button type="submit">Add Visitor</button>
      </form>
      <DataTable
        data={visitors}
        columns={visitorColumns}
        renderActions={
          ['admin', 'security'].includes(user?.role)
            ? (visitor) => (
                <button
                  className="button-danger"
                  type="button"
                  onClick={() => deleteVisitor(visitor._id)}
                >
                  Remove
                </button>
              )
            : undefined
        }
      />
    </>
  );
}

export default VisitorsPage;
