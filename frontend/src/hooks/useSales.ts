import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import salesService, { type CreateSaleInput, type PaymentStatus } from '../services/salesService'

const KEYS = {
  all: ['sales'] as const,
  detail: (id: string) => ['sales', id] as const,
}

export function useSales() {
  const { data, isLoading } = useQuery({
    queryKey: KEYS.all,
    queryFn: () => salesService.getAll(),
  })
  return { sales: data?.data ?? [], isLoading }
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateSaleInput) => salesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      // Also invalidate shopIncoming since serial entry status changes to sold
      queryClient.invalidateQueries({ queryKey: ['shopIncoming'] })
    },
  })
  return { recordSale: mutate, isRecording: isPending }
}

export function useDeleteSale() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => salesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['shopIncoming'] })
    },
  })
  return { deleteSale: mutate, isDeleting: isPending }
}

export function useSaleById(id: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => salesService.getById(id),
    enabled: !!id,
  })
  return { sale: data?.data ?? null, isLoading, isError }
}

export function useSalesBySerialNumber(serialNumber: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['sales', 'serialNumber', serialNumber],
    queryFn: () => salesService.getBySaleSerialNumber(serialNumber),
    enabled: !!serialNumber,
  })
  return { sales: data?.data ?? [], isLoading }
}

export function useUpdateSaleStatus() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: PaymentStatus }) =>
      salesService.updateStatus(id, paymentStatus),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
  return { updateStatus: mutate, isUpdating: isPending }
}
