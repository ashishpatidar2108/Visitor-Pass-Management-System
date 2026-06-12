import { Link, Outlet, useNavigate } from 'react-router-dom';

import { clearSession, getStoredUser } from '../../utils/authStorage';

function AppLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const role = user?.role;

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <>
      <header className="app-header">
        <b className="app-brand">Visitor Pass Management</b>
        <nav className="app-nav">
          {['admin', 'security'].includes(role) && (
            <Link to="/dashboard">Dashboard</Link>
          )}
          {['admin', 'security', 'employee'].includes(role) && (
            <Link to="/visitors">Visitors</Link>
          )}
          {['admin', 'security', 'employee'].includes(role) && (
            <Link to="/appointments">Appointments</Link>
          )}
          {['admin', 'security'].includes(role) && (
            <Link to="/passes">Passes</Link>
          )}
          {['admin', 'security'].includes(role) && <Link to="/scan">Scan</Link>}
          {['admin', 'security'].includes(role) && (
            <Link to="/reports">Reports</Link>
          )}
          {role === 'admin' && <Link to="/staff">Staff</Link>}
          {role === 'admin' && <Link to="/database">Database</Link>}
          {role === 'visitor' && <Link to="/portal">My Portal</Link>}
          {user?.organization && (
            <span className="organization-badge">{user.organization}</span>
          )}
          <button type="button" onClick={logout}>
            Logout{user?.name ? ` (${user.name})` : ''}
          </button>
        </nav>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;
