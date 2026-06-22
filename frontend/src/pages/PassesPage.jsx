import { useEffect, useState } from 'react';

import api, { getServerAssetUrl } from '../services/api';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function PassesPage() {
  const [visitors, setVisitors] = useState([]);
  const [passes, setPasses] = useState([]);
  const [visitor, setVisitor] = useState('');
  const [message, setMessage] = useState('');

  async function loadPasses() {
    try {
      const { data } = await api.get('/passes');
      setPasses(data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load passes');
    }
  }

  useEffect(() => {
    api
      .get('/visitors')
      .then((response) => setVisitors(response.data))
      .catch((error) =>
        setMessage(error.response?.data?.message || 'Unable to load visitors')
      );
    loadPasses();
  }, []);

  async function issuePass(event) {
    event.preventDefault();
    setMessage('');

    try {
      await api.post('/passes/issue', { visitor });
      setVisitor('');
      setMessage('Pass issued');
      await loadPasses();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to issue pass');
    }
  }

  async function deletePass(id) {
    if (
      !window.confirm(
        'Remove this pass? Its QR, PDF, and related check logs will also be deleted.'
      )
    ) {
      return;
    }

    setMessage('');

    try {
      await api.delete(`/passes/${id}`);
      setMessage('Pass removed');
      await loadPasses();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to remove pass');
    }
  }

  async function downloadQrImage(pass) {
    setMessage('');

    try {
      const response = await fetch(getServerAssetUrl(pass.qrImage));

      if (!response.ok) {
        throw new Error('QR image not found');
      }

      const blob = await response.blob();
      downloadBlob(blob, `${pass.qrToken}.png`);
      setMessage('QR image downloaded');
    } catch (error) {
      setMessage(error.message || 'Unable to download QR image');
    }
  }

  return (
    <>
      <h2>Passes</h2>
      {message && <p>{message}</p>}
      <form className="card form" onSubmit={issuePass}>
        <select
          value={visitor}
          onChange={(event) => setVisitor(event.target.value)}
          required
        >
          <option value="">Select visitor</option>
          {visitors.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="submit">Issue QR + PDF Pass</button>
      </form>

      {passes.map((pass) => (
        <div className="card" key={pass._id}>
          <b>{pass.visitor?.name}</b>
          <p>
            {pass.qrToken} - {pass.status}
          </p>
          {pass.qrImage && (
            <img
              className="qr"
              src={getServerAssetUrl(pass.qrImage)}
              alt={`QR code for ${pass.visitor?.name || 'visitor'}`}
            />
          )}
          <div className="pass-actions">
            {pass.qrImage && (
              <button type="button" onClick={() => downloadQrImage(pass)}>
                Download QR Image
              </button>
            )}
            {pass.pdfPath && (
              <a
                className="button-link"
                href={getServerAssetUrl(pass.pdfPath)}
                target="_blank"
                rel="noreferrer"
              >
                Download PDF Badge
              </a>
            )}
            <button
              className="button-danger"
              type="button"
              onClick={() => deletePass(pass._id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export default PassesPage;
