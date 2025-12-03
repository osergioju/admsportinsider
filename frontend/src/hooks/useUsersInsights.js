import useSWR from 'swr';
import { api } from '../services/api'; // o axios que você já usa

export function useUsersInsights() {
  const fetcher = (url) => api.get(url).then(res => res.data);

  const { data, error, isLoading } = useSWR(
    "/admin/insights/users",
    fetcher
  );

  return {
    data,
    error,
    isLoading
  };
}
