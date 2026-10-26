import PhoneModal from "./AddPhoneModal";
import api from '@utils/api';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiLoader, FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDebounce } from '@hooks/useDebounce'; // or inline below if not available

// ── inline debounce if you don't have the hook ───────────────────────────────
// import { useDebounce } from '@hooks/useDebounce';
// If the hook doesn't exist yet, add this to your hooks folder:
//
// export const useDebounce = (value, delay = 400) => {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const t = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(t);
//   }, [value, delay]);
//   return debounced;
// };

const PAGE_SIZE = 10;

const PhoneManager = () => {
  const [phones,       setPhones]       = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState(null);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(false);
  const [total,        setTotal]        = useState(0);
  const [searchInput,  setSearchInput]  = useState('');
  const [brandFilter,  setBrandFilter]  = useState('all');
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [currentPhone, setCurrentPhone] = useState(null);

  const search = useDebounce(searchInput, 400);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchPhones = useCallback(async (pageNum = 1, append = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/phones/', {
        params: {
          page,
          page_size: PAGE_SIZE,
          ...(brandFilter !== 'all' && { brand: brandFilter }),
          ...(search && { search }),
        },
      });

      const results = (data.results || data).map(p => ({
        ...p,
        variantCount: p.variant_count ?? p.storage_variants?.length ?? 0,
      }));

      setPhones(prev => append ? [...prev, ...results] : results);
      setHasMore(!!data.next);
      setTotal(data.count ?? results.length);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load phones';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, brandFilter, search]);

  // reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [brandFilter, search]);

  useEffect(() => {
    fetchPhones(page, false);
  }, [fetchPhones]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    if (hasMore && !isLoading) setPage(p => p + 1);
  };

  const handleDelete = useCallback(async (phone) => {
    if (!window.confirm(
      `Delete ${phone.brand} ${phone.model}? This will also delete its variants.`
    )) return;

    try {
      await api.delete(`/phones/${phone.id}/`);
      setPhones(prev => prev.filter(p => p.id !== phone.id));
      setTotal(t => t - 1);
      toast.success('Phone deleted');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete phone');
    }
  }, []);

  const openAdd  = () => { setCurrentPhone(null); setIsModalOpen(true); };
  const openEdit = (phone) => { setCurrentPhone(phone); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setCurrentPhone(null); };

  const handleSaved = () => {
    closeModal();
    setPage(1);
    fetchPhones(1, false);
  };

  // ── render helpers ─────────────────────────────────────────────────────────
  const BrandBadge = ({ brand }) => (
    <span className={`
      px-2 py-0.5 rounded-full text-xs font-medium
      ${brand === 'Samsung'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-green-100 text-green-700'}
    `}>
      {brand}
    </span>
  );

  const AvailabilityDots = ({ variants }) => {
    if (!variants?.length) return <span className="text-neutral-400 text-xs">—</span>;
    const available   = variants.filter(v => v.availability !== false).length;
    const unavailable = variants.length - available;
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-neutral-700 font-medium">{variants.length}</span>
        {unavailable > 0 && (
          <span className="text-red-500">({unavailable} out of stock)</span>
        )}
      </div>
    );
  };

  // ── states ─────────────────────────────────────────────────────────────────
  if (isLoading && phones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-neutral-400">
        <FiLoader className="animate-spin text-3xl text-blue-600" />
        <p className="text-sm">Loading phones...</p>
      </div>
    );
  }

  if (error && phones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => fetchPhones(1)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          <FiRefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Phone Inventory</h2>
          {total > 0 && (
            <p className="text-sm text-neutral-400 mt-0.5">{total} phone{total !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition self-start sm:self-auto"
        >
          <FiPlus size={16} />
          Add Phone
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
          <input
            type="text"
            placeholder="Search model or brand..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative sm:w-44">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Brands</option>
            <option value="Samsung">Samsung</option>
            <option value="Google">Google</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">

        {/* Desktop header */}
        <div className="hidden sm:grid sm:grid-cols-12 px-5 py-3 bg-neutral-50 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <div className="col-span-5">Phone</div>
          <div className="col-span-2">Brand</div>
          <div className="col-span-2 hidden md:block">Display</div>
          <div className="col-span-2">Variants</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Empty state */}
        {phones.length === 0 && !isLoading && (
          <div className="text-center py-16 text-neutral-400">
            {search || brandFilter !== 'all'
              ? 'No phones match your filters'
              : 'No phones yet — add your first one'}
          </div>
        )}

        {/* Rows */}
        <AnimatePresence initial={false}>
          {phones.map((phone, i) => (
            <motion.div
              key={phone.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-1 sm:grid-cols-12 items-center px-5 py-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors gap-3 sm:gap-0"
            >
              {/* Phone */}
              <div className="sm:col-span-5 flex items-center gap-3">
                {phone.thumbnail ? (
                  <img
                    src={phone.thumbnail}
                    alt={`${phone.brand} ${phone.model}`}
                    className="w-10 h-10 object-contain rounded-lg bg-neutral-50 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-neutral-900 text-sm">{phone.model}</p>
                  <p className="sm:hidden mt-0.5">
                    <BrandBadge brand={phone.brand} />
                  </p>
                </div>
              </div>

              {/* Brand */}
              <div className="sm:col-span-2 hidden sm:block">
                <BrandBadge brand={phone.brand} />
              </div>

              {/* Display */}
              <div className="sm:col-span-2 hidden md:block text-sm text-neutral-600">
                {phone.display_size || '—'}
              </div>

              {/* Variants */}
              <div className="sm:col-span-2">
                <AvailabilityDots variants={phone.storage_variants} />
              </div>

              {/* Actions */}
              <div className="sm:col-span-1 flex items-center justify-end gap-1">
                <button
                  onClick={() => openEdit(phone)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                  aria-label={`Edit ${phone.model}`}
                >
                  <FiEdit2 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(phone)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                  aria-label={`Delete ${phone.model}`}
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Inline loading row */}
        {isLoading && phones.length > 0 && (
          <div className="flex items-center justify-center py-6">
            <FiLoader className="animate-spin text-blue-600" size={20} />
          </div>
        )}
      </div>

      {/* ── Load more ── */}
      {hasMore && !isLoading && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            Load more
          </button>
        </div>
      )}

      {/* ── Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <PhoneModal
            phone={currentPhone}
            onClose={closeModal}
            onSave={handleSaved}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default PhoneManager;