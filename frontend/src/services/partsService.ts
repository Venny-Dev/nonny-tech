import apiClient from './apiClient'

export interface PartsLog {
  _id: string
  serialNumber: string
  shopIncomingId: string
  partType: 'ram' | 'storage'
  originalValue: string
  soldValue: string
  removedValue: string
  removedAt: string
  createdAt: string
  updatedAt: string
}

const partsService = {
  getAll: (filters?: { shopIncomingId?: string; serialNumber?: string }) =>
    apiClient
      .get('api/parts', { searchParams: filters ?? {} })
      .json<{ status: string; data: PartsLog[] }>(),
}

export default partsService
