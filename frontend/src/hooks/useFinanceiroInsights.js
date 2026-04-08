import useSWR from 'swr';
import { api } from '../services/api';

export function useFinanceiroInsights() {
  const fetcher = (url) => api.get(url).then(res => res.data);
  const { data, error, isLoading } = useSWR("/admin/insights/financeiro", fetcher);
  return { data, error, isLoading };
}
