import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@utils/api';

export default function usePageTracking() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    api.post('/analytics/track/', {
      path: pathname,
      referrer: document.referrer,
    }).catch(() => {});
  }, [pathname]);
}