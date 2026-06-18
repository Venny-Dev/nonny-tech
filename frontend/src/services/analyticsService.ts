import apiClient from './apiClient'

export interface MonthlySale {
  month: string
  count: number
}

export interface RecentSale {
  _id: string
  name: string
  modelNumber: string
  serialNumber: string
  paymentStatus: 'paid' | 'returned'
  quantity: number
  createdAt: string
}

export interface DashboardData {
  totalSales: number
  revenue: number
  itemsInStock: number
  lowStockCount: number
  monthlySales: MonthlySale[]
  recentSales: RecentSale[]
}

const analyticsService = {
  getDashboard: () =>
    apiClient.get('api/analytics/dashboard').json<{ status: string; data: DashboardData }>(),
}

export default analyticsService
