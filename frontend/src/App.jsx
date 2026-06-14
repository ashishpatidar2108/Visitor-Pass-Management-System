import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleRoute from './components/routing/RoleRoute';
import AppointmentsPage from './pages/AppointmentsPage';
import DashboardPage from './pages/DashboardPage';
import DatabasePage from './pages/DatabasePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import PassesPage from './pages/PassesPage';
import RegisterPage from './pages/RegisterPage';
import ReportsPage from './pages/ReportsPage';
import ScanPage from './pages/ScanPage';
import StaffPage from './pages/StaffPage';
import VisitorPortalPage from './pages/VisitorPortalPage';
import VisitorsPage from './pages/VisitorsPage';
import VerifyOtpPage from './pages/VerifyOtpPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route element={<RoleRoute allowedRoles={['admin', 'security']} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/passes" element={<PassesPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
            <Route
              element={
                <RoleRoute allowedRoles={['admin', 'security', 'employee']} />
              }
            >
              <Route path="/visitors" element={<VisitorsPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/database" element={<DatabasePage />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={['visitor']} />}>
              <Route path="/portal" element={<VisitorPortalPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
