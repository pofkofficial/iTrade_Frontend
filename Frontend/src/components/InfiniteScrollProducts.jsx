import { useState, useEffect, useCallback } from 'react';
import { throttle } from 'lodash';
import ListProducts from './ListProducts';

const InfiniteScrollProducts = ({ initialPhones = [] }) => {
  const [phones, setPhones] = useState(initialPhones);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/phones/?page=${page}&page_size=20`);
      const newPhones = response.data.results || [];
      
      setPhones(prev => [...prev, ...newPhones]);
      setPage(prev => prev + 1);
      setHasMore(!!response.data.next);
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  const handleScroll = throttle(() => {
    if (window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 500) {
      loadMore();
    }
  }, 200);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div>
      <ListProducts phone={phones} />
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollProducts;