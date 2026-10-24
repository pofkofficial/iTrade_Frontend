import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search, Filter, ShoppingCart, X, ChevronDown,
  Snowflake, Sparkles, Heart, Moon
} from 'lucide-react';
import SideTag from '@components/SideTag';
import ListProducts from '@components/ListProducts';
import SearchResultsViewer from '@components/SearchResultsViewer';
import api from '@utils/api';

// Lazy load heavy components
const FilterPlate = lazy(() => import('@components/FilterPlate'));
const Cart = lazy(() => import('@components/Cart'));

// Debounce hook
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const Shop = () => {
  // State
  const [featuredPhones, setFeaturedPhones] = useState({general: [], google: [], samsung: []});
  const [allPhones, setAllPhones] = useState([]);
  const [googlePhones, setGooglePhones] = useState([]);               // From /phones/
  const [samsungPhones, setSamsungPhones] = useState([]);
  const [filteredPhones, setFilteredPhones] = useState([]);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('all');

  const [filters, setFilters] = useState({
    brands: [],
    storageCapacities: [],
    minPrice: '',
    maxPrice: '',
  });

  const debouncedSearch = useDebounce(search, 300);
  const location = useLocation();
  const incomingCart = location.state?.cart;
  const incomingFeatured = location.state?.featured;

  // Seasonal detection
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();

  const isChristmas = month === 12;
  const isNewYear = month === 1;
  const isValentines = month === 2 && day >= 1 && day <= 14;

  const seasonal = isChristmas ? {
    name: "christmas", title: "Christmas Deals", subtitle: "Gift a Phone This Christmas!", bg: "bg-gradient-to-b from-red-50 to-green-50", tagColor: "red", icon: Snowflake, badge: "CHRISTMAS SALE!", searchPlaceholder: "Find the perfect gift..."
  } : isNewYear ? {
    name: "newyear", title: "New Year Deals", subtitle: `Start ${year} with a New Phone!`, bg: "bg-gradient-to-b from-purple-50 to-blue-50", tagColor: "purple", icon: Sparkles, badge: "NEW YEAR SALE!", searchPlaceholder: `Upgrade for ${year}...`
  } : isValentines ? {
    name: "valentines", title: "Valentine's Gifts", subtitle: "Gift Love in Every Pixel!", bg: "bg-gradient-to-b from-pink-50 to-red-50", tagColor: "pink", icon: Heart, badge: "LOVE SALE!", searchPlaceholder: "Gift for your Valentine..."
  } : null;

  // === FETCH FEATURED PHONES (Best Sellers) ===
  const fetchFeatured = useCallback(async () => {
    try {
      setLoadingFeatured(true);
      const extract = (res) =>
        Array.isArray(res.data) ? res.data : (res.data?.results || []);

      let generalF = [];

      // Validate incomingFeatured first
      if (!Array.isArray(incomingFeatured) || incomingFeatured.length === 0) {
        const generalRes = await api.get('/featured/');
        generalF = extract(generalRes);
      } else {
        generalF = incomingFeatured;
      }

      // Always fetch brand-specific featured phones
      const [googleRes, samsungRes] = await Promise.all([
        api.get('/featured/?brand=google'),
        api.get('/featured/?brand=samsung')
      ]);

      const googleF = extract(googleRes);
      const samsungF = extract(samsungRes);

      setFeaturedPhones({
        general: generalF,
        google: googleF,
        samsung: samsungF,
      });

    } catch (err) {
      console.error('Failed to load featured phones:', err);
    } finally {
      setLoadingFeatured(false);
    }
  }, [incomingFeatured]);
  


  // === FETCH ALL PHONES (For filtering & tabs) ===
  const fetchAllPhones = useCallback(async () => {
    try {
      setLoadingAll(true);
      setError(null);

      const CACHE_KEY = 'shop_all_phones_v2';
      const CACHE_TIME_KEY = 'shop_all_cache_time_v2';
      const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

      const cached = sessionStorage.getItem(CACHE_KEY);
      const timestamp = sessionStorage.getItem(CACHE_TIME_KEY);
      const isFresh = timestamp && Date.now() - parseInt(timestamp) < CACHE_TTL;

      let data = [];
      const extract = (res) => Array.isArray(res.data) ? res.data : (res.data?.results || []);

      if (isFresh && cached) {
        data = JSON.parse(cached);
      } else {
        if (googlePhones.length > 0 || samsungPhones.length > 0){
          if(googlePhones.length > 0){
            const samsungRes = await Promise.all([api.get('/phones/?brand=samsung')]);
            data = [...googlePhones, ...extract(samsungRes)];
          }
          if(samsungPhones.length > 0){
            const googleRes = await Promise.all([api.get('/phones/?brand=google')]);
            data = [...samsungPhones, ...extract(googleRes)];
          }
        }
        else{
          const [googleRes, samsungRes] = await Promise.all([
            api.get('/phones/?brand=google'),
            api.get('/phones/?brand=samsung')
          ])
          data = [...extract(samsungRes), ...extract(googleRes)];
        }

        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      }

      setAllPhones(data);
      setFilteredPhones(data);
    } catch (err) {
      console.error('Failed to fetch all phones:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoadingAll(false);
    }
  }, []);

   const fetchGooglePhones = useCallback(async () => {
    try {
      setLoadingAll(true);
      setError(null);

      const CACHE_KEY = 'shop_google_phones_v2';
      const CACHE_TIME_KEY = 'shop_google_cache_time_v2';
      const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

      const cached = sessionStorage.getItem(CACHE_KEY);
      const timestamp = sessionStorage.getItem(CACHE_TIME_KEY);
      const isFresh = timestamp && Date.now() - parseInt(timestamp) < CACHE_TTL;

      let data = [];

      if (isFresh && cached) {
        data = JSON.parse(cached);
      } else {
        if(allPhones.length > 0){
          data = allPhones.filter(p=> p.brand === 'google')
        }
        else{
          const googleRes = await api.get('/phones/?brand=google')
          const extract = (res) => Array.isArray(res.data) ? res.data : (res.data?.results || []);
          data = extract(googleRes);
        }

        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      }

      setGooglePhones(data);
      setFilteredPhones(data);
    } catch (err) {
      console.error('Failed to fetch all phones:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoadingAll(false);
    }
  }, []);


  const fetchSamsungPhones = useCallback(async () => {
    try {
      setLoadingAll(true);
      setError(null);

      const CACHE_KEY = 'shop_samsung_phones_v2';
      const CACHE_TIME_KEY = 'shop_samsung_cache_time_v2';
      const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

      const cached = sessionStorage.getItem(CACHE_KEY);
      const timestamp = sessionStorage.getItem(CACHE_TIME_KEY);
      const isFresh = timestamp && Date.now() - parseInt(timestamp) < CACHE_TTL;

      let data = [];

      if (isFresh && cached) {
        data = JSON.parse(cached);
      } else {
        if(allPhones.length > 0){
          data = allPhones.filter(p=> p.brand === 'samsung')
        }
        else{
          const samsungRes = await api.get('/phones/?brand=samsung')
          const extract = (res) => Array.isArray(res.data) ? res.data : (res.data?.results || []);
          data = extract(samsungRes);
        }

        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      }

      setSamsungPhones(data);
      setFilteredPhones(data);
    } catch (err) {
      console.error('Failed to fetch all phones:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoadingAll(false);
    }
  }, []);

  
  // Initial load
  useEffect(() => {
    if (activeSection === 'all'){
      fetchFeatured();
      //fetchAllPhones();
    }

    if (activeSection === 'google'){
      fetchGooglePhones();
    }
    if (activeSection === 'samsung'){
      fetchSamsungPhones();
    }

    if (incomingCart?.length > 0) {
      setCart(prev => {
        const newItems = incomingCart.filter(inc =>
          !prev.some(p => p.id === inc.id && p.memory?.id === inc.memory?.id)
        );
        return [...prev, ...newItems];
      });
    }

    window.history.replaceState({}, document.title);
  }, [fetchFeatured, fetchGooglePhones, fetchSamsungPhones, activeSection, incomingCart]);



  // === FILTERING (uses allPhones) ===
  const normalizeStorage = (value) => String(value || '').toLowerCase().replace(/[^0-9]/g, '').trim();

  const applyFilters = useCallback(() => {
    if (!allPhones.length) return;

    const searchTerm = debouncedSearch.toLowerCase().trim();

    const filtered = allPhones.filter(phone => {
      const brand = (phone.brand || '').toString().toLowerCase();
      const model = (phone.model || '').toString().toLowerCase();
      const storages = [
        ...(phone.storage_options || []),
        ...(phone.storage_variants || [])
      ].map(v => String(v?.storage_capacity || '').toLowerCase());

      const matchesSearch = !searchTerm ||
        brand.includes(searchTerm) ||
        model.includes(searchTerm) ||
        storages.some(s => s.includes(searchTerm));

      const sectionMatch = activeSection === 'all' ||
        (activeSection === 'google' && phone.brand === 'Google') ||
        (activeSection === 'samsung' && phone.brand === 'Samsung');

      const matchesBrand = !filters.brands.length || filters.brands.includes(phone.brand);

      const phoneStorages = storages.map(normalizeStorage);
      const filterStorages = filters.storageCapacities.map(normalizeStorage);
      const matchesStorage = !filterStorages.length || phoneStorages.some(ps => filterStorages.includes(ps));

      const prices = storages.map(v => v?.price).filter(Boolean);
      const phoneMin = prices.length ? Math.min(...prices) : (phone.min_price || 0);
      const phoneMax = prices.length ? Math.max(...prices) : (phone.max_price || Infinity);

      const matchesPrice =
        (!filters.minPrice || phoneMax >= parseFloat(filters.minPrice)) &&
        (!filters.maxPrice || phoneMin <= parseFloat(filters.maxPrice));

      return matchesSearch && sectionMatch && matchesBrand && matchesStorage && matchesPrice;
    });

    setFilteredPhones(filtered);
  }, [allPhones, debouncedSearch, activeSection, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // === CART ===
  const updateCart = useCallback((product, add = true) => {
    setCart(prev => {
      if (!add) {
        return prev.filter(p => !(p.id === product.id && p.memory?.id === product.memory?.id));
      }
      const existing = prev.find(p => p.id === product.id && p.memory?.id === product.memory?.id);
      if (existing) {
        return prev.map(p => p === existing ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  // Sections
  const sections = useMemo(() => ({
    all: filteredPhones,
    google: filteredPhones,
    samsung: filteredPhones,
  }), [filteredPhones, featuredPhones]);

  const hasSearch = debouncedSearch.trim().length > 0;
  const hasFilters = Object.values(filters).some(v =>
    (Array.isArray(v) && v.length > 0) || (typeof v === 'string' && v)
  );
  const showResultsViewer = hasSearch || hasFilters;

  const Section = ({ title, phones, color = "#dc2626", targetSection }) => {
    const navigateToTab = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection(targetSection);
    };

    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <SideTag text={title} textColor="#fff" bgColor={color} />
          {title !== "Featured Phones" && (
            <button onClick={navigateToTab} className="text-orange-500 font-medium hover:underline flex items-center gap-1">
              View All <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
            </button>
          )}
        </div>
        <ListProducts phone={phones} updateCart={updateCart} cartFromShop={cart} />
      </section>
    );
  };

  return (
    <>
      <Helmet>
        <title>{seasonal ? `${seasonal.title} | iTrade4Phones` : "Shop Original Phones | iTrade4Phones"}</title>
        <meta name="description" content={seasonal ? seasonal.subtitle : "Browse tested, warrantied Google Pixel & Samsung Galaxy phones."} />
      </Helmet>

      {/* Seasonal Banner */}
      {seasonal && (
        <div className={`fixed top-40 left-0 right-0 z-50 ${seasonal.bg} shadow-lg`}>
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm font-bold text-gray-800">
            <seasonal.icon className="w-5 h-5 animate-pulse" />
            <span>{seasonal.badge}</span>
            <seasonal.icon className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`fixed top-${seasonal ? '12' : '0'} left-0 right-0 bg-white shadow-md z-40 pt-14`}>
        <div className="container mx-auto px-4 py-3 pt-8 flex items-center justify-between gap-3">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={seasonal?.searchPlaceholder || "Search phones..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => {
              if (allPhones.length === 0) fetchAllPhones();
              setShowFilters(true)}} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200">
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            <button onClick={() => setShowCart(true)} className="relative p-2.5 hover:bg-gray-100 rounded-xl">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="border-t bg-white">
          <div className="container mx-auto px-4 py-2 flex gap-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'all', label: seasonal ? seasonal.title : 'All Phones' },
              { id: 'google', label: 'Google Pixel' },
              { id: 'samsung', label: 'Samsung Galaxy' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`pb-2 border-b-2 font-medium transition ${activeSection === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-56 pb-8 px-4 sm:px-6 2xl:px-10 w-full max-w-none mx-auto ${seasonal?.bg || ''}`}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-center">
            {error} <button onClick={fetchFeatured} className="underline font-medium">Retry</button>
          </div>
        )}

        {(loadingFeatured || loadingAll) ? (
          <ProductGridSkeleton />
        ) : showResultsViewer ? (
          <SearchResultsViewer data={sections[activeSection] || []} cartUpdate={updateCart} searchTerm={hasSearch ? debouncedSearch : undefined} />
        ) : activeSection === 'all' ? (
          <>
            {featuredPhones && (
              <Section title={seasonal?.title || "Featured Phones"} phones={featuredPhones.general} color={getColor(seasonal?.tagColor)} targetSection="all" />
            )}
            {sections.google && (
              <Section title="Google Pixel" phones={featuredPhones.google} color="#2962FF" targetSection="google" />
            )}
            {sections.samsung && (
              <Section title="Samsung Galaxy" phones={featuredPhones.samsung} color="#2962FF" targetSection="samsung" />
            )}
          </>
        ) : (
          <SearchResultsViewer data={sections[activeSection] || []} cartUpdate={updateCart} />
        )}
      </main>

      {/* Filter & Cart Modals */}
      {showFilters && (
        <Suspense fallback={<div>Loading filters...</div>}>
          <FilterPlate
            onClose={() => setShowFilters(false)}
            onSearch={(applied) => { setFilters(applied); setShowFilters(false); }}
            filters={filters}
            setFilters={setFilters}
            phones={allPhones}
          />
        </Suspense>
      )}

      {showCart && (
        <Suspense fallback={<div>Loading cart...</div>}>
          <Cart
            cart={cart}
            onClose={() => setShowCart(false)}
            updateCart={updateCart}
            updateCartQuantity={(id, memId, qty) => {
              setCart(prev => prev
                .map(p => p.id === id && p.memory?.id === memId ? { ...p, quantity: qty } : p)
                .filter(p => p.quantity > 0)
              );
            }}
            onRemoveFromCart={(id, memId) => {
              setCart(prev => prev.filter(p => !(p.id === id && p.memory?.id === memId)));
            }}
          />
        </Suspense>
      )}
    </>
  );
};

const getColor = (color) => {
  const map = { red: "#dc2626", purple: "#9333ea", pink: "#ec4899", emerald: "#10b981" };
  return map[color] || "#dc2626";
};

const ProductGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-6">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
        <div className="bg-gray-200 rounded-xl w-full h-40 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-1/2" />
      </div>
    ))}
  </div>
);

export default Shop;