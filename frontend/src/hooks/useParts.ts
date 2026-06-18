import { useQuery } from '@tanstack/react-query'
import partsService from '../services/partsService'

export function useParts(filters?: { shopIncomingId?: string; serialNumber?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['parts', filters],
    queryFn: () => partsService.getAll(filters),
  })
  return { parts: data?.data ?? [], isLoading }
}
