import { useQuery } from '@tanstack/react-query';
import api from '@utils/api';

export const usePhones = (page = 1, filters = {}) => {
  return useQuery({
    queryKey: ['phones', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page, ...filters });
      const response = await api.get(`/phones/?${params}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};