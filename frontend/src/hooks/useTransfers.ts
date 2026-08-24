import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import transferService, {
  type CreateTransferInput,
  type TransferRequest,
  type TransferDateFilter,
} from '../services/transferService'

const KEYS = {
  all: ['transfers'] as const,
  detail: (id: string) => ['transfers', id] as const,
}

export function useTransfers(filters?: TransferDateFilter) {
  const { data, isLoading } = useQuery({
    queryKey: [...KEYS.all, filters] as const,
    queryFn: () => transferService.getAll(filters),
  })
  return { transfers: (data ?? []) as TransferRequest[], isLoading }
}

export function usePendingTransferCount() {
  const { data } = useQuery({
    queryKey: KEYS.all,
    queryFn: () => transferService.getAll(),
    // Refetch every 60s so the badge stays fresh without hammering the server
    refetchInterval: 60_000,
  })
  const count = (data ?? []).filter((t) => t.status === 'pending').length
  return count
}

export function useTransferById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => transferService.getById(id),
    enabled: id.length > 0,
  })
  return { transfer: data ?? null, isLoading }
}

export function useCreateTransfer() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: CreateTransferInput) => transferService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['warehouseIncoming'] })
      queryClient.invalidateQueries({ queryKey: ['shopIncoming'] })
    },
  })
  return { createTransfer: mutate, isCreating: isPending, createError: error }
}

export function useApproveTransfer() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: (id: string) => transferService.approve(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: ['shopIncoming'] })
      queryClient.invalidateQueries({ queryKey: ['warehouseIncoming'] })
    },
  })
  return { approveTransfer: mutate, isApproving: isPending, approveError: error }
}

export function useRejectTransfer() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: (id: string) => transferService.reject(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
  return { rejectTransfer: mutate, isRejecting: isPending, rejectError: error }
}

export function useCancelTransfer() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: (id: string) => transferService.cancel(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
  return { cancelTransfer: mutate, isCancelling: isPending, cancelError: error }
}
