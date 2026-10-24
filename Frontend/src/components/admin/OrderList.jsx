import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiEdit, 
  FiEye, 
  FiTrash2, 
  FiChevronLeft, 
  FiChevronRight, 
  FiFilter,
  FiSearch,
  FiCircle,
  FiPackage,
  FiCheckSquare
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
import OrderDetailsModal from './OrderDetailsModal';
import api from '@utils/api';

const statusBadgeClass = {
  pending: 'bg-gray-100 text-gray-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const paymentMethodColors = {
  mobile_money: 'bg-purple-100 text-purple-800',
  credit_card: 'bg-blue-100 text-blue-800',
  btc: 'bg-orange-100 text-orange-800',
  cash_on_delivery: 'bg-green-100 text-green-800'
};

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const bulkStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('Date formatting error:', e);
    return 'N/A';
  }
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
    <td className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
    <td className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
    <td className="px-3 sm:px-6 py-3 hidden xs:table-cell"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
    <td className="px-3 sm:px-6 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
    <td className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
    <td className="px-3 sm:px-6 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
    <td className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div></td>
  </tr>
);

const OrderList = ({ initialOrders = null, disableFetch = false }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [viewedOrders, setViewedOrders] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');

  const params = useMemo(() => ({
    page: currentPage,
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    ordering: `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.key}`
  }), [currentPage, searchTerm, statusFilter, sortConfig]);

  const { data, loading, error, refetch } = useFetch(
    disableFetch ? null : '/orders/',
    { params },
    [currentPage, searchTerm, statusFilter, sortConfig, disableFetch]
  );

  const orders = useMemo(() => {
    if (disableFetch && initialOrders) {
      let filteredOrders = [...initialOrders];
      if (searchTerm) {
        filteredOrders = filteredOrders.filter(order =>
          (order.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (order.order_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (order.customer_email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
      }
      filteredOrders.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      const startIndex = (currentPage - 1) * 10;
      return filteredOrders.slice(startIndex, startIndex + 10);
    }
    return data?.results || data || [];
  }, [data, initialOrders, disableFetch, searchTerm, statusFilter, sortConfig, currentPage]);

  const totalPages = useMemo(() => {
    if (disableFetch && initialOrders) {
      let filteredOrders = [...initialOrders];
      if (searchTerm) {
        filteredOrders = filteredOrders.filter(order =>
          (order.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (order.order_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (order.customer_email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
      }
      if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
      }
      return Math.ceil(filteredOrders.length / 10) || 1;
    }
    return Math.ceil(data?.count / 10) || 1;
  }, [data, initialOrders, disableFetch, searchTerm, statusFilter]);

  useEffect(() => {
    const storedViewedOrders = localStorage.getItem('viewedOrders');
    if (storedViewedOrders) {
      setViewedOrders(new Set(JSON.parse(storedViewedOrders)));
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin/login');
    }
    if (error) {
      toast.error(error);
    }
  }, [user, authLoading, error, navigate]);

  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  const isNewOrder = useCallback((order) => {
    const isRecent = new Date(order.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    return isRecent && !viewedOrders.has(order.id);
  }, [viewedOrders]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/`, { status: newStatus }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        }
      });
      setSelectedOrder(prev => (prev?.id === orderId ? { ...prev, status: newStatus } : prev));
      refetch();
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update order status';
      toast.error(errorMsg);
      console.error(`Update order ${orderId} status failed:`, err.response?.status, err.response?.data);
    }
  }, [refetch]);

  const handleDelete = useCallback(async (orderId) => {
    toast(
      <div>
        <p>Delete order #{orderId}?</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
              try {
                if (!disableFetch) {
                  const response = await api.delete(`/orders/${orderId}/`);
                  console.log('Delete response:', response);
                  refetch();
                }
                if (selectedOrder?.id === orderId) {
                  setSelectedOrder(null);
                }
                setSelectedOrders(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(orderId);
                  return newSet;
                });
                toast.dismiss();
                toast.success('Order deleted successfully');
              } catch (err) {
                toast.dismiss();
                const status = err.response?.status;
                const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete order';
                if (status === 404) {
                  toast.error(`Order #${orderId} not found`);
                } else {
                  toast.error(errorMsg);
                }
                console.error(`Delete order ${orderId} failed:`, status, err.response?.data);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            Cancel
          </button>
        </div>
      </div>,
      { autoClose: false }
    );
  }, [disableFetch, refetch, selectedOrder]);

  const handleBulkDelete = useCallback(() => {
    if (selectedOrders.size === 0) {
      toast.error('No orders selected');
      return;
    }
    toast(
      <div>
        <p>Delete {selectedOrders.size} selected order(s)?</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
              try {
                if (!disableFetch) {
                  for (const orderId of selectedOrders) {
                    await api.delete(`/orders/${orderId}/`);
                  }
                  refetch();
                }
                if (selectedOrder && selectedOrders.has(selectedOrder.id)) {
                  setSelectedOrder(null);
                }
                setSelectedOrders(new Set());
                toast.dismiss();
                toast.success(`${selectedOrders.size} order(s) deleted successfully`);
              } catch (err) {
                toast.dismiss();
                const status = err.response?.status;
                const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete orders';
                if (status === 404) {
                  toast.error('One or more orders not found');
                } else {
                  toast.error(errorMsg);
                }
                console.error('Bulk delete failed:', status, err.response?.data);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            Cancel
          </button>
        </div>
      </div>,
      { autoClose: false }
    );
  }, [disableFetch, refetch, selectedOrder, selectedOrders]);

  const handleBulkStatusChange = useCallback(() => {
    if (selectedOrders.size === 0) {
      toast.error('No orders selected');
      return;
    }
    if (!bulkStatus) {
      toast.error('Please select a status');
      return;
    }
    toast(
      <div>
        <p>Update {selectedOrders.size} selected order(s) to {bulkStatus}?</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
              try {
                if (!disableFetch) {
                  for (const orderId of selectedOrders) {
                    await api.patch(`/orders/${orderId}/`, { status: bulkStatus }, {
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${localStorage.getItem('token')}` }
                    });
                  }
                  refetch();
                }
                if (selectedOrder && selectedOrders.has(selectedOrder.id)) {
                  setSelectedOrder(prev => ({ ...prev, status: bulkStatus }));
                }
                setSelectedOrders(new Set());
                setBulkStatus('');
                toast.dismiss();
                toast.success(`${selectedOrders.size} order(s) updated to ${bulkStatus}`);
              } catch (err) {
                toast.dismiss();
                const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update orders';
                toast.error(errorMsg);
                console.error('Bulk status update failed:', err.response?.status, err.response?.data);
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
          >
            Update
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            Cancel
          </button>
        </div>
      </div>,
      { autoClose: false }
    );
  }, [disableFetch, refetch, selectedOrder, selectedOrders, bulkStatus]);

  const handleSelectOrder = useCallback((orderId) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      const newSelected = new Set(orders.map(order => order.id));
      setSelectedOrders(newSelected);
    }
  }, [orders, selectedOrders]);

  const handleOrderClick = useCallback((order) => {
    const updatedViewedOrders = new Set(viewedOrders);
    updatedViewedOrders.add(order.id);
    setViewedOrders(updatedViewedOrders);
    localStorage.setItem('viewedOrders', JSON.stringify(Array.from(updatedViewedOrders)));
    setSelectedOrder(order);
  }, [viewedOrders]);

  const renderSortIcon = useCallback((key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  }, [sortConfig]);

  if (authLoading || (loading && currentPage === 1)) {
    return (
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="flex gap-3 mb-6">
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/4"></div></th>
                <th className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div></th>
                <th className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div></th>
                <th className="px-3 sm:px-6 py-3 hidden xs:table-cell"><div className="h-4 bg-gray-200 rounded w-1/3"></div></th>
                <th className="px-3 sm:px-6 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-1/4"></div></th>
                <th className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/4"></div></th>
                <th className="px-3 sm:px-6 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-1/4"></div></th>
                <th className="px-3 sm:px-6 py-3"><div className="h-4 bg-gray-200 rounded w-1/4"></div></th>
              </tr>
            </thead>
            <tbody>
              {Array(5).fill().map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <div className="mb-4 sm:mb-6 flex flex-col gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Order Management</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-blue-500 w-full text-sm sm:text-base"
              onChange={(e) => debouncedSetSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" />
            </div>
            <select
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-blue-500 appearance-none w-full text-sm sm:text-base"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <button
            onClick={handleBulkDelete}
            disabled={selectedOrders.size === 0}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center min-w-[100px]"
          >
            <FiTrash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </button>
          <div className="flex gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Status</option>
              {bulkStatusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={handleBulkStatusChange}
              disabled={selectedOrders.size === 0 || !bulkStatus}
              className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center min-w-[100px]"
            >
              Update Status
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-l-4 border-red-400 p-4 mb-4"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                {!disableFetch && (
                  <button 
                    onClick={() => refetch()}
                    className="mt-2 text-sm text-red-700 underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <FiPackage className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-base sm:text-lg font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'No orders have been placed yet'}
          </p>
          {!disableFetch && (
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Refresh
            </button>
          )}
        </motion.div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrders.size === orders.length && orders.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('order_number')}
                    >
                      <div className="flex items-center">
                        Order # {renderSortIcon('order_number')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('customer_name')}
                    >
                      <div className="flex items-center">
                        Customer {renderSortIcon('customer_name')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden xs:table-cell"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Date {renderSortIcon('created_at')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                    >
                      Payment
                    </th>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden sm:table-cell"
                      onClick={() => handleSort('total_price')}
                    >
                      <div className="flex items-center">
                        Total {renderSortIcon('total_price')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <motion.tr 
                      key={order.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`hover:bg-gray-50 cursor-pointer ${isNewOrder(order) ? 'bg-blue-50' : ''}`}
                      onClick={() => handleOrderClick(order)}
                    >
                      <td 
                        className="px-3 sm:px-6 py-3 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          {isNewOrder(order) && (
                            <FiCircle className="text-blue-500 mr-1 h-2 w-2" />
                          )}
                          #{order.order_number || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">{order.customer_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{order.customer_email || 'N/A'}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden xs:table-cell">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentMethodColors[order.payment_method] || 'bg-gray-100 text-gray-800'}`}>
                          {order.get_payment_method_display || 
                           (order.payment_method?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A')}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order.id, e.target.value);
                          }}
                          className={`text-xs leading-5 font-semibold rounded-full px-2 py-1 focus:outline-none focus:ring-1 ${statusBadgeClass[order.status] || 'bg-gray-100 text-gray-800'}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="pending">Pending</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        GHS{(order.total_price || 0)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex justify-end space-x-1 sm:space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderClick(order);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 relative group"
                            title="View Details"
                          >
                            <FiEye className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">View</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${order.id}/edit`);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 p-1 relative group"
                            title="Edit Order"
                          >
                            <FiEdit className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(order.id);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 relative group"
                            title="Delete Order"
                          >
                            <FiTrash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">Delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col xs:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
              <span className="font-medium">{(currentPage - 1) * 10 + orders.length}</span> of{' '}
              <span className="font-medium">{data?.count || (disableFetch ? initialOrders?.length : orders.length)}</span> results
            </div>
            <div className="flex space-x-1 sm:space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-1 sm:p-2 border rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                <FiChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center px-2 text-xs sm:text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-1 sm:p-2 border rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                <FiChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderList;