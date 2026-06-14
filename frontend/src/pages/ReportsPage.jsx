import { useEffect, useRef, useState } from 'react';

import api from '../services/api';
import { createCheckLogsCsv, downloadCsv } from '../utils/csvExport.mjs';

const initialFilters = {
  search: '',
  action: '',
  from: '',
  to: ''
};

function getRequestParams(filters) {
  return {
    search: filters.search,
    action: filters.action,
    from: filters.from
      ? new Date(`${filters.from}T00:00:00`).toISOString()
      : '',
    to: filters.to ? new Date(`${filters.to}T23:59:59.999`).toISOString() : ''
  };
}

function ReportsPage() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const firstLoad = useRef(true);

  async function loadLogs(params = filters) {
    setLoading(true);
    setMessage('');

    try {
      const { data } = await api.get('/logs', {
        params: getRequestParams(params)
      });
      setLogs(data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs(initialFilters);
  }, []);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return undefined;
    }

    const timeout = setTimeout(() => loadLogs(filters), 300);
    return () => clearTimeout(timeout);
  }, [filters]);

  function exportCsv() {
    const csv = createCheckLogsCsv(logs);
    downloadCsv(csv, 'visitor-check-logs.csv');
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Reports & Check Logs</h2>
          <p className="muted">
            Only QR check-in and check-out activity appears here. Newly added
            visitors remain on the Visitors page until their pass is scanned.
          </p>
        </div>
        <button type="button" onClick={exportCsv} disabled={!logs.length}>
          Export CSV
        </button>
      </div>

      <form
        className="card form report-filters"
        onSubmit={(event) => {
          event.preventDefault();
          loadLogs();
        }}
      >
        <input
          placeholder="Search visitor, token, or location"
          value={filters.search}
          onChange={(event) =>
            setFilters({ ...filters, search: event.target.value })
          }
        />
        <select
          value={filters.action}
          onChange={(event) =>
            setFilters({ ...filters, action: event.target.value })
          }
        >
          <option value="">All actions</option>
          <option value="checkin">Check in</option>
          <option value="checkout">Check out</option>
        </select>
        <input
          type="date"
          aria-label="From date"
          title="From date"
          value={filters.from}
          onChange={(event) =>
            setFilters({ ...filters, from: event.target.value })
          }
        />
        <input
          type="date"
          aria-label="To date"
          title="To date"
          value={filters.to}
          min={filters.from}
          onChange={(event) =>
            setFilters({ ...filters, to: event.target.value })
          }
        />
        <button type="submit">Apply Filters</button>
        <button
          className="button-secondary"
          type="button"
          onClick={() => {
            setFilters(initialFilters);
            loadLogs(initialFilters);
          }}
        >
          Reset
        </button>
      </form>

      {message && <p className="error">{message}</p>}
      {loading && <p className="muted">Loading check logs...</p>}
      {!loading && !message && !logs.length && (
        <p className="muted">
          Selected filters ke liye koi check log nahi mila.
        </p>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Visitor</th>
              <th>Token</th>
              <th>Action</th>
              <th>Location</th>
              <th>Scanned by</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{log.visitor?.name || '-'}</td>
                <td>{log.pass?.qrToken || '-'}</td>
                <td>
                  <span className={`status status-${log.action}`}>
                    {log.action}
                  </span>
                </td>
                <td>{log.location}</td>
                <td>{log.scannedBy?.name || '-'}</td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ReportsPage;
