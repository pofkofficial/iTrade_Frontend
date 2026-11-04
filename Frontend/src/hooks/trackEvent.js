import api from '@utils/api';

// Random anonymous browser identifier; it is not a customer/account ID.
const VISITOR_STORAGE_KEY = 'itrade_analytics_visitor';
let inMemoryVisitorId = null;

function createVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replaceAll('-', '').slice(0, 40);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.slice(0, 40);
}

export function getAnalyticsVisitorId() {
  if (inMemoryVisitorId) return inMemoryVisitorId;
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing) {
      inMemoryVisitorId = existing.slice(0, 40);
      return inMemoryVisitorId;
    }
    inMemoryVisitorId = createVisitorId();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, inMemoryVisitorId);
    return inMemoryVisitorId;
  } catch {
    // Storage restrictions must never interrupt storefront navigation/checkout.
    inMemoryVisitorId = createVisitorId();
    return inMemoryVisitorId;
  }
}

/**
 * Record an anonymous storefront event through POST /analytics/track/.
 * Use productId for product_view and add_to_cart. For product-level purchase
 * attribution, call once per distinct product after the order is created.
 */
export async function trackStoreEvent(event, { path, productId = null } = {}) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  try {
    await api.post('/analytics/track/', {
      event,
      path: path || window.location.pathname,
      product_id: productId,
      // Backend field is named session_id; this value now persists per browser.
      session_id: getAnalyticsVisitorId(),
      referrer: document.referrer,
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
    });
  } catch (error) {
    // Analytics must never interrupt browsing, cart actions, or checkout.
    if (import.meta.env?.DEV) console.debug('Analytics event was not recorded', error);
  }
}
