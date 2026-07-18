import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import SaleDetail from './pages/SaleDetail'
import ShopIncoming from './pages/ShopIncoming'
import ShopIncomingDetail from './pages/ShopIncomingDetail'
import Parts from './pages/Parts'

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/shop-incoming" element={<ShopIncoming />} />
            <Route path="/shop-incoming/:id" element={<ShopIncomingDetail />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/:id" element={<SaleDetail />} />
            <Route path="/parts" element={<Parts />} />
          </Route>
        </Route>

        {/* Catch-all: redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
