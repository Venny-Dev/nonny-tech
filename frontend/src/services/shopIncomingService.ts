import apiClient from './apiClient'

export interface ISerialNumberEntry {
  _id: string
  serialNumber: string
  condition: string[]
  status: 'available' | 'sold'
  dateSold: string | null
}

export interface ShopIncomingRecord {
  _id: string
  modelNumber: string
  processor: string
  ram: string
  storage: string
  quantity: number
  chargerQuantity: number
  serialNumberEntries: ISerialNumberEntry[]
  filledCount: number
  pendingSlots: number
  availableCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateShopIncomingInput {
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

export interface UpdateEntryInput {
  condition?: string[]
  status?: 'available' | 'sold'
  dateSold?: string | null
}

export interface TypeaheadResult {
  serialNumber: string
  entryId: string
  parentId: string
  modelNumber: string
  processor: string
  ram: string
  storage: string
  chargerQuantity: number
  condition: string[]
}

const shopIncomingService = {
  getAll: () =>
    apiClient
      .get('api/shop-incoming')
      .json<{ status: string; data: ShopIncomingRecord[] }>()
      .then((res) => res.data),

  getById: (id: string) =>
    apiClient
      .get(`api/shop-incoming/${id}`)
      .json<{ status: string; data: ShopIncomingRecord }>()
      .then((res) => res.data),

  create: (data: CreateShopIncomingInput) =>
    apiClient
      .post('api/shop-incoming', { json: data })
      .json<{ status: string; data: ShopIncomingRecord }>()
      .then((res) => res.data),

  update: (id: string, data: Partial<CreateShopIncomingInput>) =>
    apiClient
      .patch(`api/shop-incoming/${id}`, { json: data })
      .json<{ status: string; data: ShopIncomingRecord }>()
      .then((res) => res.data),

  deleteRecord: (id: string) =>
    apiClient
      .delete(`api/shop-incoming/${id}`)
      .json<{ status: string }>()
      .then((res) => res),

  addEntries: (id: string, input: AddEntriesInput) =>
    apiClient
      .post(`api/shop-incoming/${id}/entries`, { json: input })
      .json<{ status: string; data: ShopIncomingRecord }>()
      .then((res) => res.data),

  updateEntry: (id: string, serialNumber: string, data: UpdateEntryInput) =>
    apiClient
      .patch(`api/shop-incoming/${id}/entries/${serialNumber}`, { json: data })
      .json<{ status: string; data: ShopIncomingRecord }>()
      .then((res) => res.data),

  deleteEntry: (id: string, serialNumber: string) =>
    apiClient
      .delete(`api/shop-incoming/${id}/entries/${serialNumber}`)
      .json<{ status: string }>()
      .then((res) => res),

  search: (q: string) =>
    apiClient
      .get('api/shop-incoming/search', { searchParams: { q } })
      .json<{ status: string; data: TypeaheadResult[] }>()
      .then((res) => res.data),

  getAvailable: () =>
    apiClient
      .get('api/shop-incoming/available')
      .json<{ status: string; data: ShopIncomingRecord[] }>()
      .then((res) => res.data),
}

export default shopIncomingService
