import apiClient from './apiClient'

export type StockRequestStatus = 'pending' | 'available' | 'unavailable'

export interface StockRequest {
  _id: string
  modelNumber: string
  quantity?: number
  note?: string
  status: StockRequestStatus
  availableCount?: number
  responseNote?: string
  requestedBy: { _id: string; firstName?: string; lastName?: string; email: string }
  respondedBy?: { _id: string; firstName?: string; lastName?: string; email: string } | null
  requestedAt: string
  respondedAt?: string | null
  seenByRequester: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateStockRequestInput {
  modelNumber: string
  quantity?: number
  note?: string
}

export interface RespondStockRequestInput {
  status: 'available' | 'unavailable'
  availableCount?: number
  responseNote?: string
}

const stockRequestService = {
  getAll: () =>
    apiClient
      .get('api/stock-requests')
      .json<{ status: string; data: StockRequest[] }>()
      .then((res) => res.data),

  getById: (id: string) =>
    apiClient
      .get(`api/stock-requests/${id}`)
      .json<{ status: string; data: StockRequest }>()
      .then((res) => res.data),

  create: (data: CreateStockRequestInput) =>
    apiClient
      .post('api/stock-requests', { json: data })
      .json<{ status: string; data: StockRequest }>()
      .then((res) => res.data),

  respond: (id: string, data: RespondStockRequestInput) =>
    apiClient
      .patch(`api/stock-requests/${id}/respond`, { json: data })
      .json<{ status: string; data: StockRequest }>()
      .then((res) => res.data),

  markAsSeen: () =>
    apiClient
      .post('api/stock-requests/seen')
      .json<{ status: string }>(),
}

export default stockRequestService
