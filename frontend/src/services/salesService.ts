import apiClient from './apiClient'

export type PaymentStatus = 'pending' | 'paid' | 'returned'

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
  inventoryItem?: string
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
  inventoryItem: string
  customerName: string
}

const salesService = {
  getAll: () =>
    apiClient.get('api/sales').json<{ status: string; data: Sale[] }>(),

  getById: (id: string) =>
    apiClient.get(`api/sales/${id}`).json<{ status: string; data: Sale }>(),

  getBySaleSerialNumber: (sn: string) =>
    apiClient.get('api/sales', { searchParams: { serialNumber: sn } }).json<{ status: string; data: Sale[] }>(),

  create: (data: CreateSaleInput) =>
    apiClient.post('api/sales', { json: data }).json<{ status: string; data: Sale }>(),

  delete: (id: string) => apiClient.delete(`api/sales/${id}`),

  updateStatus: (id: string, paymentStatus: PaymentStatus) =>
    apiClient.patch(`api/sales/${id}/status`, { json: { paymentStatus } }).json<{ status: string; data: Sale }>(),
}

export default salesService
