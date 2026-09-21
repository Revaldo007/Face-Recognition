import { Navigate, Outlet } from 'react-router-dom'
import { homePathFor, useAuth } from '../context/AuthContext'

// Only users with one of the allowed roles may pass; others go to their own dashboard
export default function RoleRoute({ roles }) {
  const { user } = useAuth()
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />
  return <Outlet />
}
