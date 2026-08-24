import apiClient from './apiClient'

export interface ReturnHistoryEntry {
  reason: string
  returnedAt: string
  returnedBy: { _id: string; firstName?: string; lastName?: string; email: string }
}

export interface WarehouseSerialNumberEntry {
  _id: string
  serialNumber: string
  condition: string[]
  status: 'available' | 'transferred' | 'sold'
  dateSold: string | null
  returnHistory: ReturnHistoryEntry[]
}

export interface WarehouseIncomingRecord {
  _id: string
  modelNumber: string
  processor: string
  ram: string
  storage: string
  quantity: number
  chargerQuantity: number
  serialNumberEntries: WarehouseSerialNumberEntry[]
  filledCount: number
  pendingSlots: number
  availableCount: number
  transferredCount: number
  soldCount: number
  createdAt: string
  updatedAt: string
}

export interface PaginatedResult {
  records: WarehouseIncomingRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateWarehouseIncomingInput {
  modelNumber: string
  processor: string
  ram: string
  storage: string
  quantity: number
  chargerQuantity?: number
  serialNumberEntries?: { serialNumber: string; condition?: string[] }[]
}

export interface AddEntriesInput {
  entries: { serialNumber: string; condition?: string[] }[]
}

export interface RestockInput {
  additionalQuantity: number
  serialNumberEntries?: { serialNumber: string; condition?: string[] }[]
}

const warehouseIncomingService = {
  getAll: (page: number = 1, limit: number = 10) =>
    apiClient
      .get('api/warehouse-incoming', { searchParams: { page, limit } })
      .json<{ status: string } & PaginatedResult>()
      .then((res) => res),

  getById: (id: string) =>
    apiClient
      .get(`api/warehouse-incoming/${id}`)
      .json<{ status: string; data: WarehouseIncomingRecord }>()
      .then((res) => res.data),

  create: (data: CreateWarehouseIncomingInput) =>
    apiClient
      .post('api/warehouse-incoming', { json: data })
      .json<{ status: string; data: WarehouseIncomingRecord }>()
      .then((res) => res.data),

  update: (id: string, data: Partial<CreateWarehouseIncomingInput>) =>
    apiClient
      .patch(`api/warehouse-incoming/${id}`, { json: data })
      .json<{ status: string; data: WarehouseIncomingRecord }>()
      .then((res) => res.data),

  deleteRecord: (id: string) => apiClient.delete(`api/warehouse-incoming/${id}`),

  addEntries: (id: string, input: AddEntriesInput) =>
    apiClient
      .post(`api/warehouse-incoming/${id}/entries`, { json: input })
      .json<{ status: string; data: WarehouseIncomingRecord }>()
      .then((res) => res.data),

  restock: (id: string, data: RestockInput) =>
    apiClient
      .patch(`api/warehouse-incoming/${id}/restock`, { json: data })
      .json<{ status: string; data: WarehouseIncomingRecord }>()
      .then((res) => res.data),

  updateEntry: (id: string, serialNumber: string, data: { condition?: string[]; serialNumber?: string }) =>
    apiClient
      .patch(`api/warehouse-incoming/${id}/entries/${serialNumber}`, { json: data })
      .json<{ status: string; data: WarehouseIncomingRecord }>()
      .then((res) => res.data),

  deleteEntry: (id: string, serialNumber: string) =>
    apiClient.delete(`api/warehouse-incoming/${id}/entries/${serialNumber}`),

  search: (q: string) =>
    apiClient
      .get('api/warehouse-incoming/search', { searchParams: { q } })
      .json<{ status: string; data: any[] }>()
      .then((res) => res.data),

  getAvailable: () =>
    apiClient
      .get('api/warehouse-incoming/available')
      .json<{ status: string; data: WarehouseIncomingRecord[] }>()
      .then((res) => res.data),

  migrateFromShop: () =>
    apiClient
      .post('api/warehouse-incoming/migrate-from-shop')
      .json<{ status: string; data: { migrated: number; deleted: number; failed: string[] } }>()
      .then((res) => res.data),
}

export default warehouseIncomingService
