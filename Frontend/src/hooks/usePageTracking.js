import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackStoreEvent } from './trackEvent';

// Replace the existing usePageTracking implementation with this version.
// Keep it mounted once inside the storefront router to avoid duplicate events.
export default function usePageTracking() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    trackStoreEvent('page_view', { path: pathname });
  }, [pathname]);
}
