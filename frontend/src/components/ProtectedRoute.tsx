import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  // Show a minimal full-page loader while verifying the cookie
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-3xl animate-spin">
            progress_activity
          </span>
          <p className="text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
