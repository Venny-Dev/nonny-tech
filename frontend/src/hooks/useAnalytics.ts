import { useQuery } from '@tanstack/react-query'
import analyticsService from '../services/analyticsService'
import salesService from '../services/salesService'

export function useDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsService.getDashboard(),
  })
  return { dashboard: data?.data ?? null, isLoading }
}

export function useDailyReport(date: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'daily', date],
    queryFn: () => salesService.dailyReport(date),
    enabled: date.length > 0,
  })
  return { report: data ?? null, isLoading }
}
