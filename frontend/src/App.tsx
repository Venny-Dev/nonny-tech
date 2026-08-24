import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ShopSales from './pages/ShopSales'
import WarehouseSales from './pages/WarehouseSales'
import SaleDetail from './pages/SaleDetail'
import ShopIncoming from './pages/ShopIncoming'
import ShopIncomingDetail from './pages/ShopIncomingDetail'
import WarehouseIncoming from './pages/WarehouseIncoming'
import WarehouseIncomingDetail from './pages/WarehouseIncomingDetail'
import Transfers from './pages/Transfers'
import DailyReport from './pages/DailyReport'
import StockRequests from './pages/StockRequests'
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
            <Route path="/warehouse-incoming" element={<WarehouseIncoming />} />
            <Route path="/warehouse-incoming/:id" element={<WarehouseIncomingDetail />} />
            <Route path="/shop-incoming" element={<ShopIncoming />} />
            <Route path="/shop-incoming/:id" element={<ShopIncomingDetail />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/sales/shop" element={<ShopSales />} />
            <Route path="/sales/warehouse" element={<WarehouseSales />} />
            <Route path="/sales/:id" element={<SaleDetail />} />
            <Route path="/daily-report" element={<DailyReport />} />
            <Route path="/stock-requests" element={<StockRequests />} />
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
