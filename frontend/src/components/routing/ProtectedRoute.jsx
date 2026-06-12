import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { getToken } from '../../utils/authStorage';

function ProtectedRoute() {
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
