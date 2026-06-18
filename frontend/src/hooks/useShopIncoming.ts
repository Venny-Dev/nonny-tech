import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import shopIncomingService, {
  type CreateShopIncomingInput,
  type AddEntriesInput,
  type UpdateEntryInput,
} from '../services/shopIncomingService'

const KEYS = {
  all: ['shopIncoming'] as const,
  detail: (id: string) => ['shopIncoming', id] as const,
  search: (q: string) => ['shopIncoming', 'search', q] as const,
}

export function useShopIncoming() {
  const { data, isLoading } = useQuery({
    queryKey: KEYS.all,
    queryFn: () => shopIncomingService.getAll(),
  })
  return { records: data ?? [], isLoading }
}

export function useShopIncomingById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => shopIncomingService.getById(id),
    enabled: id.length > 0,
  })
  return { record: data ?? null, isLoading }
}

export function useCreateShopIncoming() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateShopIncomingInput) => shopIncomingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
  return { createRecord: mutate, isCreating: isPending }
}

export function useUpdateShopIncoming() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateShopIncomingInput> }) =>
      shopIncomingService.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
  return { updateRecord: mutate, isUpdating: isPending }
}

export function useDeleteShopIncoming() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => shopIncomingService.deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
  return { deleteRecord: mutate, isDeleting: isPending }
}

export function useAddEntries() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, entries }: { id: string } & AddEntriesInput) =>
      shopIncomingService.addEntries(id, { entries }),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
  return { addEntries: mutate, isAdding: isPending }
}

export function useUpdateEntry() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: ({
      id,
      serialNumber,
      data,
    }: {
      id: string
      serialNumber: string
      data: UpdateEntryInput
    }) => shopIncomingService.updateEntry(id, serialNumber, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
  return { updateEntry: mutate, isUpdating: isPending }
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, serialNumber }: { id: string; serialNumber: string }) =>
      shopIncomingService.deleteEntry(id, serialNumber),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
  return { deleteEntry: mutate, isDeleting: isPending }
}

export function useSearchShopIncoming(q: string) {
  const { data, isLoading } = useQuery({
    queryKey: KEYS.search(q),
    queryFn: () => shopIncomingService.search(q),
    enabled: q.trim().length > 0,
  })
  return { results: data ?? [], isLoading }
}
