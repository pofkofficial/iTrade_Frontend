import { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter as FilterIcon, DollarSign, HardDrive, Smartphone } from 'lucide-react';

const FilterPlate = ({ onClose, onSearch, filters = {}, setFilters, phones = [] }) => {
  const popupRef = useRef(null);

  // === NORMALIZE STORAGE ===
  const normalizeStorage = (value) => {
    if (!value) return '';
    return String(value).toLowerCase().replace(/[^0-9]/g, '').trim();
  };

  // === DYNAMIC BRAND & STORAGE FROM PHONES ===
  const { brandOptions, storageOptions } = useMemo(() => {
    const brands = new Set();
    const storages = new Set();

    phones.forEach(phone => {
      // Brand
      if (phone.brand) brands.add(phone.brand.trim());

      // Storage from storage_options
      const addStorage = (val) => {
        const norm = normalizeStorage(val);
        if (norm) storages.add(norm);
      };

      (phone.storage_options || []).forEach(option => {
        if (option?.storage_capacity) addStorage(option.storage_capacity);
      });

      // Optional: support storage_variants
      (phone.storage_variants || []).forEach(v => {
        if (v?.storage_capacity) addStorage(v.storage_capacity);
      });
    });

    const sortedBrands = Array.from(brands).sort();
    const sortedStorages = Array.from(storages)
      .map(n => parseInt(n))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b)
      .map(n => `${n}GB`);

    return { brandOptions: sortedBrands, storageOptions: sortedStorages };
  }, [phones]);

  // === TOGGLE FILTER ===
  const toggleFilter = (type, value) => {
    const norm = type === 'storageCapacities' ? normalizeStorage(value) : value;
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(norm)
        ? prev[type].filter(v => v !== norm)
        : [...prev[type], norm]
    }));
  };

  // === PRICE CHANGE ===
  const updatePrice = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value === '' ? '' : Math.max(0, parseInt(value) || 0)
    }));
  };

  // === APPLY FILTERS ===
  const apply = () => {
    const normalized = {
      ...filters,
      storageCapacities: filters.storageCapacities.map(normalizeStorage)
    };
    onSearch(normalized);
    onClose();
  };

  // === RESET FILTERS ===
  const reset = () => {
    const empty = { brands: [], storageCapacities: [], minPrice: '', maxPrice: '' };
    setFilters(empty);
    onSearch(empty);
    onClose();
  };

  // === CLICK OUTSIDE TO CLOSE ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        ref={popupRef}
        className="fixed sm:absolute w-full max-w-md top-20 sm:top-12 right-0 sm:right-10 rounded-2xl bg-white shadow-2xl z-50 border border-gray-200 overflow-hidden"
      >
        {/* === HEADER === */}
        <div className="p-5 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FilterIcon className="w-5 h-5" />
              <h2 className="text-xl font-bold">Filter Phones</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* === BODY === */}
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* === BRAND === */}
          {brandOptions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-gray-800">
                <Smartphone className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold">Brand</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {brandOptions.map(brand => {
                  const active = filters.brands.includes(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => toggleFilter('brands', brand)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        active
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* === STORAGE === */}
          {storageOptions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-gray-800">
                <HardDrive className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold">Storage</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {storageOptions.map(storage => {
                  const normalized = normalizeStorage(storage);
                  const active = filters.storageCapacities.includes(normalized);
                  return (
                    <button
                      key={storage}
                      onClick={() => toggleFilter('storageCapacities', storage)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        active
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {storage}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* === PRICE RANGE === */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-gray-800">
              <DollarSign className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">Price Range (GHS)</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={filters.minPrice}
                onChange={e => updatePrice('minPrice', e.target.value)}
                placeholder="Min"
                className="px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
              <input
                type="number"
                value={filters.maxPrice}
                onChange={e => updatePrice('maxPrice', e.target.value)}
                placeholder="Max"
                className="px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
            </div>
          </div>
        </div>

        {/* === FOOTER === */}
        <div className="p-5 border-t bg-gray-50 flex gap-3">
          <button
            onClick={reset}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            Reset
          </button>
          <button
            onClick={apply}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium shadow-md transition transform hover:scale-105"
          >
            Apply Filters
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FilterPlate;