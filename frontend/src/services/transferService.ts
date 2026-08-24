import apiClient from './apiClient'

export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type TransferDirection = 'warehouse_to_shop' | 'shop_to_warehouse'

export interface TransferEntry {
  serialNumber: string
  condition: string[]
  modelNumber: string
  processor: string
  ram: string
  storage: string
  chargerQuantity: number
  warehouseEntryId?: string
  shopEntryId?: string
}

export interface TransferRequest {
  _id: string
  warehouseRecordId?: string | { _id: string; modelNumber: string; processor: string; ram: string; storage: string }
  shopRecordId?: string | { _id: string; modelNumber: string; processor: string; ram: string; storage: string }
  direction: TransferDirection
  entries: TransferEntry[]
  status: TransferStatus
  requestedBy: { _id: string; firstName?: string; lastName?: string; email: string }
  approvedBy?: { _id: string; firstName?: string; lastName?: string; email: string } | null
  requestedAt: string
  respondedAt?: string | null
  note?: string
  reason?: string
  count: number
  requestedByName?: string
  approvedByName?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTransferInput {
  warehouseRecordId?: string
  shopRecordId?: string
  serialNumbers: string[]
  note?: string
  reason?: string
  direction?: TransferDirection
}

export interface TransferDateFilter {
  dateFrom?: string
  dateTo?: string
}

const transferService = {
  getAll: (filters?: TransferDateFilter) => {
    const params = new URLSearchParams()
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters?.dateTo) params.set('dateTo', filters.dateTo)
    const qs = params.toString()
    return apiClient
      .get(`api/transfers${qs ? `?${qs}` : ''}`)
      .json<{ status: string; data: TransferRequest[] }>()
      .then((res) => res.data)
  },

  getById: (id: string) =>
    apiClient.get(`api/transfers/${id}`).json<{ status: string; data: TransferRequest }>().then((res) => res.data),

  create: (data: CreateTransferInput) =>
    apiClient.post('api/transfers', { json: data }).json<{ status: string; data: TransferRequest }>().then((res) => res.data),

  approve: (id: string) =>
    apiClient.patch(`api/transfers/${id}/approve`).json<{ status: string; data: TransferRequest }>().then((res) => res.data),

  reject: (id: string) =>
    apiClient.patch(`api/transfers/${id}/reject`).json<{ status: string; data: TransferRequest }>().then((res) => res.data),

  cancel: (id: string) =>
    apiClient.patch(`api/transfers/${id}/cancel`).json<{ status: string; data: TransferRequest }>().then((res) => res.data),
}

export default transferService
