import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import stockRequestService, {
  type CreateStockRequestInput,
  type RespondStockRequestInput,
  type StockRequest,
} from '../services/stockRequestService'

const KEYS = {
  all: ['stockRequests'] as const,
  detail: (id: string) => ['stockRequests', id] as const,
}

export function useStockRequests() {
  const { data, isLoading } = useQuery({
    queryKey: KEYS.all,
    queryFn: () => stockRequestService.getAll(),
  })
  return { requests: (data ?? []) as StockRequest[], isLoading }
}

export function useStockRequestById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => stockRequestService.getById(id),
    enabled: id.length > 0,
  })
  return { request: data ?? null, isLoading }
}

export function useCreateStockRequest() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: CreateStockRequestInput) => stockRequestService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
  return { createRequest: mutate, isCreating: isPending, createError: error }
}

export function usePendingStockRequestCount() {
  const { data } = useQuery({
    queryKey: KEYS.all,
    queryFn: () => stockRequestService.getAll(),
    refetchInterval: 60_000,
  })
  const requests = (data ?? []) as StockRequest[]
  return requests.filter((r) => r.status === 'pending').length
}

export function useRespondedStockRequestCount() {
  const { data } = useQuery({
    queryKey: KEYS.all,
    queryFn: () => stockRequestService.getAll(),
    refetchInterval: 60_000,
  })
  const requests = (data ?? []) as StockRequest[]
  return requests.filter((r) => r.status !== 'pending' && !r.seenByRequester).length
}

export function useMarkStockRequestsAsSeen() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: () => stockRequestService.markAsSeen(),
    onSuccess: () => {
      // Optimistically mark all responded requests as seen in the cache
      queryClient.setQueryData<StockRequest[]>(KEYS.all, (old) =>
        (old ?? []).map((r) => (r.status !== 'pending' ? { ...r, seenByRequester: true } : r)),
      )
      // Then refetch from server to confirm persistence
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
    onError: (err) => {
      console.error('Failed to mark as seen:', err)
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
  return { markAsSeen: mutate, isMarking: isPending }
}

export function useRespondToStockRequest() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RespondStockRequestInput }) =>
      stockRequestService.respond(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
  return { respondToRequest: mutate, isResponding: isPending, respondError: error }
}
