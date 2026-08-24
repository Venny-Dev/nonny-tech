import apiClient from './apiClient'

export type PaymentStatus = 'pending' | 'paid' | 'returned'
export type SaleSource = 'shop' | 'warehouse'

export interface Sale {
  _id: string
  modelNumber: string
  serialNumber: string
  processor: string
  ram: string
  storage: string
  chargerQuantity: number
  price: number
  condition: string[]
  paymentStatus: PaymentStatus
  source?: SaleSource
  inventoryItem?: string
  warehouseRecord?: string
  customerName: string
  soldAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateSaleInput {
  modelNumber: string
  serialNumber: string
  processor: string
  ram: string
  storage: string
  chargerQuantity: number
  price: number
  condition: string[]
  paymentStatus: PaymentStatus
  inventoryItem?: string
  warehouseRecord?: string
  source?: SaleSource
  customerName: string
}

export interface DailyReport {
  date: string
  shop: { count: number; revenue: number; pendingCount: number; paidCount: number; returnedCount: number }
  warehouse: { count: number; revenue: number; pendingCount: number; paidCount: number; returnedCount: number }
  total: { count: number; revenue: number; pendingCount: number; paidCount: number; returnedCount: number }
  sales: Sale[]
  transfers: DailyTransfer[]
  transferSummary: { count: number; unitsMoved: number }
}

export interface DailyTransferEntry {
  serialNumber: string
  condition: string[]
  modelNumber: string
  processor: string
  ram: string
  storage: string
  chargerQuantity: number
}

export interface DailyTransfer {
  _id: string
  entries: DailyTransferEntry[]
  status: 'approved'
  requestedBy: { _id: string; firstName?: string; lastName?: string; email: string }
  approvedBy?: { _id: string; firstName?: string; lastName?: string; email: string } | null
  requestedAt: string
  respondedAt: string
  note?: string
  createdAt: string
}

const salesService = {
  getAll: (source?: SaleSource) =>
    apiClient.get('api/sales', { searchParams: source ? { source } : {} }).json<{ status: string; data: Sale[] }>(),

  getById: (id: string) =>
    apiClient.get(`api/sales/${id}`).json<{ status: string; data: Sale }>(),

  getBySaleSerialNumber: (sn: string) =>
    apiClient.get('api/sales', { searchParams: { serialNumber: sn } }).json<{ status: string; data: Sale[] }>(),

  create: (data: CreateSaleInput) =>
    apiClient.post('api/sales', { json: data }).json<{ status: string; data: Sale }>(),

  delete: (id: string) => apiClient.delete(`api/sales/${id}`),

  updateStatus: (id: string, paymentStatus: PaymentStatus) =>
    apiClient.patch(`api/sales/${id}/status`, { json: { paymentStatus } }).json<{ status: string; data: Sale }>(),

  dailyReport: (date: string) =>
    apiClient.get('api/analytics/daily', { searchParams: { date } }).json<{ status: string; data: DailyReport }>().then((res) => res.data),
}

export default salesService
