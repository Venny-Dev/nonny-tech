import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import warehouseIncomingService, {
  type CreateWarehouseIncomingInput,
  type AddEntriesInput,
  type RestockInput,
} from '../services/warehouseIncomingService'

const KEYS = {
  all: (page: number, limit: number) => ['warehouseIncoming', { page, limit }] as const,
  detail: (id: string) => ['warehouseIncoming', id] as const,
}

export function useWarehouseIncoming(page: number = 1, limit: number = 10) {
  const { data, isLoading } = useQuery({
    queryKey: KEYS.all(page, limit),
    queryFn: () => warehouseIncomingService.getAll(page, limit),
  })
  return {
    records: data?.records ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    isLoading,
  }
}

export function useWarehouseIncomingPagination(initialPage: number = 1, initialLimit: number = 10) {
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  const info = useWarehouseIncoming(page, limit)

  const goToPage = useCallback((p: number) => {
    setPage(p)
  }, [])

  return {
    ...info,
    page,
    goToPage,
    hasNext: page < info.totalPages,
    hasPrev: page > 1,
  }
}

export function useWarehouseIncomingById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => warehouseIncomingService.getById(id),
    enabled: id.length > 0,
  })
  return { record: data ?? null, isLoading }
}

export function useCreateWarehouseIncoming() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateWarehouseIncomingInput) => warehouseIncomingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseIncoming'] })
    },
  })
  return { createRecord: mutate, isCreating: isPending }
}

export function useUpdateWarehouseIncoming() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWarehouseIncomingInput> }) =>
      warehouseIncomingService.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['warehouseIncoming'] })
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
  return { updateRecord: mutate, isUpdating: isPending }
}

export function useDeleteWarehouseIncoming() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => warehouseIncomingService.deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseIncoming'] })
    },
  })
  return { deleteRecord: mutate, isDeleting: isPending }
}

export function useRestockWarehouseIncoming() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RestockInput }) =>
      warehouseIncomingService.restock(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['warehouseIncoming'] })
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
  return { restockRecord: mutate, isRestocking: isPending, restockError: error }
}

export function useAddWarehouseEntries() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, entries }: { id: string } & AddEntriesInput) =>
      warehouseIncomingService.addEntries(id, { entries }),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: ['warehouseIncoming'] })
    },
  })
  return { addEntries: mutate, isAdding: isPending }
}

export function useUpdateWarehouseEntry() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: ({
      recordId,
      serialNumber,
      data,
    }: {
      recordId: string
      serialNumber: string
      data: { condition?: string[]; serialNumber?: string }
    }) => warehouseIncomingService.updateEntry(recordId, serialNumber, data),
    onSuccess: (_result, { recordId }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(recordId) })
      queryClient.invalidateQueries({ queryKey: ['warehouseIncoming'] })
    },
  })
  return { updateEntry: mutate, isUpdating: isPending, updateError: error }
}

export function useDeleteWarehouseEntry() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: ({ recordId, serialNumber }: { recordId: string; serialNumber: string }) =>
      warehouseIncomingService.deleteEntry(recordId, serialNumber),
    onSuccess: (_result, { recordId }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(recordId) })
      queryClient.invalidateQueries({ queryKey: ['warehouseIncoming'] })
    },
  })
  return { deleteEntry: mutate, isDeleting: isPending, deleteError: error }
}
