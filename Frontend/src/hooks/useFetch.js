import { useState, useEffect } from 'react';
import api from '@utils/api';

/**
 * Custom hook for API data fetching
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {array} dependencies - useEffect dependencies
 * @returns {{
 *   data: any,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: function
 * }}
 */
export const useFetch = (url, options = {}, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api({
        url,
        ...options
      });
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};
