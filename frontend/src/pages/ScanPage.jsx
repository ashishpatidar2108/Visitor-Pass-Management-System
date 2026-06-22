import { lazy, Suspense, useCallback, useState } from 'react';

import api from '../services/api';

const QrScanner = lazy(() => import('../components/scanner/QrScanner'));

function ScanPage() {
  const [token, setToken] = useState('');
  const [location, setLocation] = useState('Main Gate');
  const [message, setMessage] = useState('');

  const handleScan = useCallback((decodedText) => {
    try {
      const parsed = JSON.parse(decodedText);
      setToken(parsed.token || decodedText);
    } catch {
      setToken(decodedText);
    }
    setMessage('QR code scanned. Verify or check the visitor in.');
  }, []);

  async function verifyPass() {
    const qrToken = token.trim();

    try {
      const { data } = await api.get(
        `/passes/verify/${encodeURIComponent(qrToken)}`
      );
      setMessage(
        data.valid ? `Valid Pass: ${data.pass.visitor.name}` : 'Invalid/Expired'
      );
    } catch (error) {
      setMessage(error.response?.data?.message || 'Invalid pass');
    }
  }

  async function saveLog(action) {
    const qrToken = token.trim();

    try {
      await api.post('/logs', {
        qrToken,
        action,
        location: location.trim() || 'Main Gate'
      });
      setMessage(`${action === 'checkin' ? 'Check in' : 'Check out'} saved`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save log');
    }
  }

  return (
    <>
      <h2>QR Verification</h2>
      <div className="scanner-layout">
        <div className="card">
          <h3>Camera Scanner</h3>
          <Suspense
            fallback={<p className="muted">Loading camera scanner...</p>}
          >
            <QrScanner onScan={handleScan} />
          </Suspense>
        </div>
        <div className="card">
          <h3>Pass Actions</h3>
          <input
            placeholder="Paste QR token e.g. VP-..."
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <input
            placeholder="Gate / desk location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
          <button type="button" onClick={verifyPass} disabled={!token.trim()}>
            Verify
          </button>
          <button
            type="button"
            onClick={() => saveLog('checkin')}
            disabled={!token.trim()}
          >
            Check In
          </button>
          <button
            type="button"
            onClick={() => saveLog('checkout')}
            disabled={!token.trim()}
          >
            Check Out
          </button>
          {message && <p>{message}</p>}
        </div>
      </div>
    </>
  );
}

export default ScanPage;
