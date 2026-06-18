import { useQuery } from '@tanstack/react-query'
import analyticsService from '../services/analyticsService'

export function useDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsService.getDashboard(),
  })
  return { dashboard: data?.data ?? null, isLoading }
}
