import { Navigate, Outlet } from 'react-router-dom';

import { getStoredUser } from '../../utils/authStorage';

function RoleRoute({ allowedRoles }) {
  const user = getStoredUser();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user?.role === 'visitor' ? '/portal' : '/appointments'}
        replace
      />
    );
  }

  return <Outlet />;
}

export default RoleRoute;
