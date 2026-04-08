import useSWR from 'swr';
import { api } from '../services/api';

export function useClubsInsights() {
  const fetcher = (url) => api.get(url).then(res => res.data);
  const { data, error, isLoading } = useSWR("/admin/insights/clubes", fetcher);
  return { data, error, isLoading };
}
