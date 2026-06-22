import { useEffect, useState } from 'react';

import api from '../services/api';

function DashboardPage() {
  const [dashboard, setDashboard] = useState({
    summary: {},
    appointmentStatus: {},
    passStatus: {},
    recentLogs: []
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then((response) => setDashboard(response.data))
      .catch((error) =>
        setMessage(error.response?.data?.message || 'Unable to load dashboard')
      );
  }, []);

  return (
    <>
      <h2>Dashboard</h2>
      {message && <p className="error">{message}</p>}
      <div className="grid">
        {Object.entries(dashboard.summary).map(([label, value]) => (
          <div className="stat" key={label}>
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="dashboard-sections">
        <section className="card">
          <h3>Appointment Analytics</h3>
          {Object.entries(dashboard.appointmentStatus).map(
            ([status, count]) => (
              <div className="metric-row" key={status}>
                <span>{status}</span>
                <b>{count}</b>
              </div>
            )
          )}
        </section>
        <section className="card">
          <h3>Pass Analytics</h3>
          {Object.entries(dashboard.passStatus).map(([status, count]) => (
            <div className="metric-row" key={status}>
              <span>{status}</span>
              <b>{count}</b>
            </div>
          ))}
        </section>
        <section className="card">
          <h3>Recent Activity</h3>
          {dashboard.recentLogs.map((log) => (
            <div className="metric-row" key={log._id}>
              <span>
                {log.visitor?.name || 'Visitor'} - {log.action}
              </span>
              <small>{new Date(log.createdAt).toLocaleDateString()}</small>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

export default DashboardPage;
