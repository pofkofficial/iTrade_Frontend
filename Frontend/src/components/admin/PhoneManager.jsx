import PhoneModal from "./AddPhoneModal";
import api from '@utils/api';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiLoader, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';

const PhoneManager = () => {
  const [phones, setPhones] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPhone, setCurrentPhone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'model', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPhones = useCallback(async (pageNum = 1, append = false) => {
    try {
      setIsLoading(true);
      const response = await api.get('/phones/', {
        params: { page: pageNum, page_size: 10 },
      });
      const phonesData = response.data.results || response.data;

      const phonesWithVariants = await Promise.all(
        phonesData.map(async (phone) => {
          try {
            const variantResponse = await api.get(`/phone/storage-selector/${phone.id}/`);
            return {
              ...phone,
              variants: variantResponse.data.storage_variants || [],
              variantCount: variantResponse.data.storage_variants?.length || 0,
            };
          } catch (err) {
            console.error(`Failed to load variants for phone ${phone.id}:`, err);
            return { ...phone, variants: [], variantCount: 0 };
          }
        })
      );

      setPhones((prev) => (append ? [...prev, ...phonesWithVariants] : phonesWithVariants));
      setHasMore(!!response.data.next);
    } catch (err) {
      console.error('Error fetching phones:', err);
      setError(err.response?.data?.detail || 'Failed to load phones');
      toast.error('Failed to load phones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhones(1);
  }, [fetchPhones]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
      fetchPhones(page + 1, true);
    }
  }, [hasMore, isLoading, page, fetchPhones]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  }, []);

  const handleSave = useCallback(async (formData, phoneId = null) => {
    try {
      let response;
      if (phoneId) {
        response = await api.put(`/phones/${phoneId}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post('/phones/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      await fetchPhones(1);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to save phone';
      toast.error(errorMsg);
      throw err;
    }
  }, [fetchPhones]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this phone? This will also delete its variants.')) return;
    try {
      setIsLoading(true);
      await api.delete(`/phones/${id}/`);
      setPhones((prev) => prev.filter((p) => p.id !== id));
      toast.success('Phone deleted successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete phone';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredPhones = useMemo(() => {
    return phones.filter((phone) => {
      const matchesSearch =
        (phone.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (phone.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = brandFilter === 'all' || phone.brand === brandFilter;
      return matchesSearch && matchesBrand;
    });
  }, [phones, searchTerm, brandFilter]);

  const sortedPhones = useMemo(() => {
    return [...filteredPhones].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPhones, sortConfig]);

  if (isLoading && phones.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <FiLoader className="animate-spin text-4xl text-blue-600" aria-label="Loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        Error loading phones: {error}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Phone Inventory</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1 min-w-[150px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search phones..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search phones"
            />
          </div>
          <div className="relative flex-1 sm:flex-none sm:w-40">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" aria-hidden="true" />
            </div>
            <select
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              aria-label="Filter by brand"
            >
              <option value="all">All Brands</option>
              <option value="Samsung">Samsung</option>
              <option value="Google">Google</option>
              {/* Add more brands if needed */}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setCurrentPhone(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center sm:w-auto"
            disabled={isLoading}
            aria-label="Add new phone"
          >
            <FiPlus className="mr-2" />
            <span className="whitespace-nowrap">Add New Phone</span>
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="hidden sm:grid sm:grid-cols-12 bg-gray-50 p-4 font-medium text-gray-500">
          <div
            className="sm:col-span-4 md:col-span-3 cursor-pointer flex items-center"
            onClick={() => handleSort('model')}
            role="button"
            aria-label="Sort by model"
          >
            Model {sortConfig.key === 'model' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </div>
          <div
            className="sm:col-span-2 cursor-pointer flex items-center"
            onClick={() => handleSort('brand')}
            role="button"
            aria-label="Sort by brand"
          >
            Brand {sortConfig.key === 'brand' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </div>
          <div className="sm:col-span-2 hidden md:block">Display</div>
          <div className="sm:col-span-2">Variants</div>
          <div className="sm:col-span-2 text-right">Actions</div>
        </div>

        {sortedPhones.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 text-center text-gray-500"
          >
            {searchTerm || brandFilter !== 'all'
              ? 'No phones match your search criteria'
              : 'No phones found. Add your first phone!'}
          </motion.div>
        ) : (
          <motion.ul initial="hidden" animate="visible" role="list">
            <AnimatePresence>
              {sortedPhones.map((phone, i) => (
                <motion.li
                  key={phone.id}
                  custom={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-1 sm:grid-cols-12 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors gap-2 sm:gap-0"
                >
                  <div className="sm:col-span-4 md:col-span-3 font-medium flex items-center">
                    {phone.thumbnail && (
                      <img
                        src={phone.thumbnail}
                        alt={`${phone.brand} ${phone.model}`}
                        className="w-10 h-10 object-contain mr-3"
                      />
                    )}
                    <div>
                      <div className="font-medium">{phone.model || 'Unknown'}</div>
                      <div className="sm:hidden text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            phone.brand === 'Samsung'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {phone.brand || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2 hidden sm:block">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        phone.brand === 'Samsung'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {phone.brand || 'Unknown'}
                    </span>
                  </div>
                  <div className="sm:col-span-2 hidden md:block">
                    {phone.display_size || 'N/A'}
                  </div>
                  <div className="sm:col-span-2">
                    <div className="sm:hidden text-sm text-gray-500 mb-1">Variants:</div>
                    {phone.variantCount || 0} variants
                  </div>
                  <div className="sm:col-span-2 flex justify-end sm:justify-end space-x-2 mt-2 sm:mt-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setCurrentPhone(phone);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      disabled={isLoading}
                      aria-label={`Edit ${phone.brand} ${phone.model}`}
                    >
                      <FiEdit2 />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(phone.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      disabled={isLoading}
                      aria-label={`Delete ${phone.brand} ${phone.model}`}
                    >
                      <FiTrash2 />
                    </motion.button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLoadMore}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            disabled={isLoading}
            aria-label="Load more phones"
          >
            {isLoading ? <FiLoader className="animate-spin inline mr-2" /> : 'Load More'}
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <PhoneModal
            phone={currentPhone}
            onClose={() => {
              setIsModalOpen(false);
              setCurrentPhone(null);
            }}
            onSave={(formData) => handleSave(formData, currentPhone?.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhoneManager;