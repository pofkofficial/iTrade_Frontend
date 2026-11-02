import PhoneModal from "./AddPhoneModal";
import api from '@utils/api';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiEdit2, FiTrash2, FiPlus, FiLoader,
  FiSearch, FiRefreshCw, FiEyeOff, FiEye,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

// ── debounce hook ─────────────────────────────────────────────────────────────
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const PAGE_SIZE = 10;

// ── sub-components ────────────────────────────────────────────────────────────
const BrandBadge = ({ brand }) => (
  <span className={`
    px-2 py-0.5 rounded-full text-xs font-medium
    ${brand === 'Samsung' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
  `}>
    {brand}
  </span>
);

const VariantSummary = ({ variants }) => {
  if (!variants?.length) return <span className="text-neutral-400 text-xs">—</span>;
  const outOfStock = variants.filter(v => v.availability === false).length;
  return (
    <div className="text-xs text-neutral-700">
      <span className="font-medium">{variants.length}</span>
      {outOfStock > 0 && (
        <span className="text-red-500 ml-1">({outOfStock} out)</span>
      )}
    </div>
  );
};

const StatusBadge = ({ isActive }) => (
  isActive ? null : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-500">
      <FiEyeOff size={10} /> Inactive
    </span>
  )
);

// ── main component ────────────────────────────────────────────────────────────
const PhoneManager = () => {
  const [phones,       setPhones]       = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState(null);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(false);
  const [total,        setTotal]        = useState(0);
  const [searchInput,  setSearchInput]  = useState('');
  const [brandFilter,  setBrandFilter]  = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [currentPhone, setCurrentPhone] = useState(null);
  const [actionId,     setActionId]     = useState(null); // tracks which row is mid-action

  const search      = useDebounce(searchInput, 400);
  const searchRef   = useRef(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchPhones = useCallback(async (pageNum = 1, append = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/phones/', {
        params: {
          page:      pageNum,
          page_size: PAGE_SIZE,
          ...(brandFilter !== 'all' && { brand: brandFilter }),
          ...(search                && { search }),
          ...(showInactive          && { include_inactive: true }),
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
  }, [brandFilter, search, showInactive]);

  // reset page when filters change
  useEffect(() => { setPage(1); }, [brandFilter, search, showInactive]);

  // fetch when page or filters change
  useEffect(() => {
    fetchPhones(page, page > 1);
  }, [page, fetchPhones]);

  // ── actions ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (phone) => {
    if (!window.confirm(
      `Deactivate "${phone.brand} ${phone.model}"?\n\nThe phone will be hidden from the shop. Orders are unaffected.`
    )) return;

    setActionId(phone.id);
    try {
      await api.delete(`/phones/${phone.id}/`);
      // update in-place so the row stays visible with inactive badge
      setPhones(prev => prev.map(p =>
        p.id === phone.id ? { ...p, is_active: false } : p
      ));
      setTotal(t => t - 1);
      toast.success(`${phone.model} deactivated`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to deactivate phone');
    } finally {
      setActionId(null);
    }
  }, []);

  const handleRestore = useCallback(async (phone) => {
    setActionId(phone.id);
    try {
      await api.post(`/admin/phones/${phone.id}/restore/`);
      setPhones(prev => prev.map(p =>
        p.id === phone.id ? { ...p, is_active: true } : p
      ));
      setTotal(t => t + 1);
      toast.success(`${phone.model} restored`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to restore phone');
    } finally {
      setActionId(null);
    }
  }, []);

  const openAdd    = () => { setCurrentPhone(null); setIsModalOpen(true); };
  const openEdit   = (phone) => { setCurrentPhone(phone); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setCurrentPhone(null); };

  const handleSaved = useCallback(() => {
    closeModal();
    fetchPhones(1, false);
    setPage(1);
  }, [fetchPhones]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) setPage(p => p + 1);
  };

  // ── keyboard shortcut: / to focus search ──────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ── loading / error states ─────────────────────────────────────────────────
  if (isLoading && phones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <FiLoader className="animate-spin text-blue-600" size={28} />
        <p className="text-sm text-neutral-400">Loading inventory...</p>
      </div>
    );
  }

  if (error && phones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={() => fetchPhones(1)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          <FiRefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Phone Inventory</h2>
          {total > 0 && (
            <p className="text-sm text-neutral-400 mt-0.5">
              {total} phone{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition self-start sm:self-auto">
          <FiPlus size={16} /> Add Phone
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search phones… (/)"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700">
              ×
            </button>
          )}
        </div>

        {/* Brand filter */}
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
          className="sm:w-36 px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Brands</option>
          <option value="Samsung">Samsung</option>
          <option value="Google">Google</option>
        </select>

        {/* Show inactive toggle */}
        <button
          onClick={() => setShowInactive(v => !v)}
          className={`
            flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition
            ${showInactive
              ? 'border-neutral-800 bg-neutral-900 text-white'
              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}
          `}
        >
          {showInactive ? <FiEye size={14} /> : <FiEyeOff size={14} />}
          {showInactive ? 'Hiding inactive' : 'Show inactive'}
        </button>

      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">

        {/* Column header */}
        <div className="hidden sm:grid sm:grid-cols-12 px-5 py-3 bg-neutral-50 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <div className="col-span-4">Phone</div>
          <div className="col-span-2">Brand</div>
          <div className="col-span-2 hidden md:block">Display</div>
          <div className="col-span-2">Variants</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Empty */}
        {phones.length === 0 && !isLoading && (
          <div className="text-center py-16 text-sm text-neutral-400">
            {search || brandFilter !== 'all'
              ? 'No phones match your filters'
              : 'No phones yet — add your first one'}
          </div>
        )}

        {/* Rows */}
        <AnimatePresence initial={false}>
          {phones.map((phone, i) => {
            const isInAction = actionId === phone.id;
            const inactive   = !phone.is_active;

            return (
              <motion.div
                key={phone.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ delay: i * 0.025 }}
                className={`
                  grid grid-cols-1 sm:grid-cols-12 items-center
                  px-5 py-4 border-b border-neutral-100 last:border-0
                  hover:bg-neutral-50 transition-colors gap-3 sm:gap-0
                  ${inactive ? 'opacity-50' : ''}
                `}
              >
                {/* Phone name + status */}
                <div className="sm:col-span-4 flex items-center gap-3">
                  {phone.thumbnail
                    ? <img src={phone.thumbnail} alt={phone.model}
                        className="w-10 h-10 object-contain rounded-lg bg-neutral-50 shrink-0" />
                    : <div className="w-10 h-10 rounded-lg bg-neutral-100 shrink-0" />
                  }
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-neutral-900 text-sm truncate">{phone.model}</p>
                      <StatusBadge isActive={phone.is_active} />
                    </div>
                    <p className="sm:hidden mt-0.5"><BrandBadge brand={phone.brand} /></p>
                  </div>
                </div>

                {/* Brand */}
                <div className="sm:col-span-2 hidden sm:block">
                  <BrandBadge brand={phone.brand} />
                </div>

                {/* Display */}
                <div className="sm:col-span-2 hidden md:block text-sm text-neutral-500">
                  {phone.display_size || '—'}
                </div>

                {/* Variants */}
                <div className="sm:col-span-2">
                  <VariantSummary variants={phone.storage_variants} />
                </div>

                {/* Actions */}
                <div className="sm:col-span-2 flex items-center justify-end gap-1">
                  {isInAction ? (
                    <FiLoader className="animate-spin text-neutral-400 mr-2" size={16} />
                  ) : (
                    <>
                      <button onClick={() => openEdit(phone)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                        aria-label={`Edit ${phone.model}`}>
                        <FiEdit2 size={15} />
                      </button>

                      {inactive ? (
                        <button onClick={() => handleRestore(phone)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition"
                          title="Restore phone"
                          aria-label={`Restore ${phone.model}`}>
                          <FiEye size={15} />
                        </button>
                      ) : (
                        <button onClick={() => handleDelete(phone)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                          title="Deactivate phone"
                          aria-label={`Deactivate ${phone.model}`}>
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Pagination loading */}
        {isLoading && phones.length > 0 && (
          <div className="flex items-center justify-center py-5">
            <FiLoader className="animate-spin text-blue-600" size={18} />
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && !isLoading && (
        <div className="text-center">
          <button onClick={handleLoadMore}
            className="px-6 py-2.5 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition">
            Load more
          </button>
        </div>
      )}

      {/* Modal */}
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