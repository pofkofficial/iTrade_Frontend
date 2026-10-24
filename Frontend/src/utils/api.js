// utils/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Cache configuration
const CACHE_CONFIG = {
  maxAge: 5 * 60 * 1000, // 5 minutes cache
  enabled: true,
};

// Simple in-memory cache
const cache = new Map();

// Cache key generator
const generateCacheKey = (config) => {
  return `${config.method?.toUpperCase()}:${config.url}:${JSON.stringify(config.params)}:${JSON.stringify(config.data)}`;
};

// Check if request is cacheable
const isCacheable = (config) => {
  return config.method?.toLowerCase() === 'get' && 
         config.cache !== false && 
         CACHE_CONFIG.enabled;
};

// Clear cache utility
const clearApiCache = (pattern = null) => {
  if (pattern) {
    for (const [key] of cache) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

// Unauthenticated API instance with optimized defaults
const api = axios.create({
  baseURL: API_URL,
  timeout: 300000, // Reduced to 30 seconds for better UX
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  // Optimized for CORS
  withCredentials: false,
  // Axios performance optimizations
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024, // 50MB
});

// Request interceptor for caching and authentication
api.interceptors.request.use(
  (config) => {
    // Add cache busting for GET requests if explicitly disabled
    if (config.method?.toLowerCase() === 'get' && config.cache === false) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // Check cache for GET requests
    if (isCacheable(config)) {
      const cacheKey = generateCacheKey(config);
      const cached = cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_CONFIG.maxAge) {
        // Return cached response
        return {
          ...config,
          adapter: () => Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          }),
          fromCache: true,
        };
      }
    }

    // Add authentication token if available
    const token = localStorage.getItem('token'); // Consistent naming
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: Date.now() };

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for caching and error handling
api.interceptors.response.use(
  (response) => {
    const { config, data } = response;
    
    // Cache successful GET responses
    if (isCacheable(config) && !config.fromCache) {
      const cacheKey = generateCacheKey(config);
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }

    // Log performance for non-cached requests
    if (config.metadata?.startTime && !config.fromCache) {
      const duration = Date.now() - config.metadata.startTime;
      if (duration > 1000) { // Log slow requests
        console.warn(`Slow API request: ${config.url} took ${duration}ms`);
      }
    }

    return response;
  },
  (error) => {
    const { config, response } = error;
    
    // Log error details for debugging
    if (config) {
      console.error('API Error:', {
        url: config.url,
        method: config.method,
        status: response?.status,
        message: error.message,
        duration: config.metadata ? Date.now() - config.metadata.startTime : 'unknown',
      });
    }

    // Handle specific error cases
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
      return Promise.reject(error);
    }

    const originalRequest = config || {};
    const isLoginPage = window.location.pathname.includes('/login');

    switch (response?.status) {
      case 401:
        if (!isLoginPage) {
          localStorage.removeItem('token');
          // Use replace instead of href to avoid adding to history
          window.location.replace('/admin/login?session_expired=true');
        }
        break;

      case 403:
        if (!isLoginPage) {
          const errorMsg = response?.data?.message || 'Access denied';
          window.location.replace(`/admin/login?error=${encodeURIComponent(errorMsg)}`);
        }
        break;

      case 429:
        console.warn('Rate limit exceeded, please try again later');
        break;

      case 500:
        console.error('Server error, please try again later');
        break;

      case 502:
      case 503:
      case 504:
        console.error('Service temporarily unavailable, please try again later');
        break;

      default:
        // Network errors
        if (!response) {
          console.error('Network error - please check your connection');
        }
        break;
    }

    return Promise.reject(error);
  }
);

// Enhanced API methods with caching support
export const apiWithCache = {
  get: (url, config = {}) => api.get(url, { ...config, cache: true }),
  
  getNoCache: (url, config = {}) => api.get(url, { ...config, cache: false }),
  
  post: (url, data, config) => api.post(url, data, config),
  
  put: (url, data, config) => api.put(url, data, config),
  
  patch: (url, data, config) => api.patch(url, data, config),
  
  delete: (url, config) => api.delete(url, config),
};

// Cancel token utility for canceling requests
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

// Batch request utility
export const batchRequests = (requests, options = {}) => {
  const { concurrency = 5, timeout = 30000 } = options;
  
  return new Promise((resolve, reject) => {
    const results = [];
    let currentIndex = 0;
    let activeRequests = 0;
    let hasError = false;

    const processNext = () => {
      if (hasError || currentIndex >= requests.length) {
        if (activeRequests === 0) {
          hasError ? reject(results.find(r => r.error)) : resolve(results);
        }
        return;
      }

      while (activeRequests < concurrency && currentIndex < requests.length) {
        const index = currentIndex++;
        activeRequests++;

        const request = requests[index];
        const cancelToken = axios.CancelToken.source();
        
        // Set timeout for individual request
        const timeoutId = setTimeout(() => {
          cancelToken.cancel(`Request timeout after ${timeout}ms`);
        }, timeout);

        request(cancelToken.token)
          .then(response => {
            results[index] = { data: response.data, index };
          })
          .catch(error => {
            if (!axios.isCancel(error)) {
              hasError = true;
            }
            results[index] = { error, index };
          })
          .finally(() => {
            clearTimeout(timeoutId);
            activeRequests--;
            processNext();
          });
      }
    };

    processNext();
  });
};

// Retry utility for failed requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Don't retry on 4xx errors (except 429)
      if (error.response?.status && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
        throw error;
      }
      
      console.warn(`Request failed, retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt)); // Exponential backoff
    }
  }
};

// Prefetch utility
export const prefetch = (urls) => {
  urls.forEach(url => {
    if (!cache.has(generateCacheKey({ method: 'get', url }))) {
      api.get(url, { cache: true }).catch(() => {
        // Silent fail for prefetch requests
      });
    }
  });
};

// Export the main API instance and utilities
export default api;
export { clearApiCache, cache as apiCache };