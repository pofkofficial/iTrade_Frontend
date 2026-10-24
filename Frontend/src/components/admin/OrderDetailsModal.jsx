import { useState, useCallback, useMemo } from 'react';
import { FiX, FiCheckCircle, FiPackage, FiCreditCard, FiUser, FiMapPin, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { toast } from 'react-toastify';

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

const paymentMethodIcons = {
  mobile_money: <FiCreditCard className="text-purple-500" size={18} />,
  credit_card: <FiCreditCard className="text-blue-500" size={18} />,
  btc: <FiCreditCard className="text-orange-500" size={18} />,
  cash_on_delivery: <FiCreditCard className="text-green-500" size={18} />
};

const SkeletonLoader = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-4">
      <div className="animate-pulse">
        <div className="flex justify-between items-center border-b p-3 sm:p-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="h-4 bg-gray-200 rounded w-1/4"></th>
                  <th className="h-4 bg-gray-200 rounded w-1/4 hidden sm:table-cell"></th>
                  <th className="h-4 bg-gray-200 rounded w-1/6"></th>
                  <th className="h-4 bg-gray-200 rounded w-1/6"></th>
                  <th className="h-4 bg-gray-200 rounded w-1/6"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="h-16 bg-gray-200 rounded w-full"></td>
                  <td className="h-4 bg-gray-200 rounded w-1/4 hidden sm:table-cell"></td>
                  <td className="h-4 bg-gray-200 rounded w-1/6"></td>
                  <td className="h-4 bg-gray-200 rounded w-1/6"></td>
                  <td className="h-4 bg-gray-200 rounded w-1/6"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const OrderDetailsModal = ({ order, onClose, onStatusChange, onDelete }) => {
  const { user, loading: authLoading } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const { execute: updateStatus } = useFetch(`/orders/${order?.id}/`, {
    method: 'PATCH',
    immediate: false
  });

  const formattedDate = useMemo(() => formatDate(order?.created_at), [order?.created_at]);

  const handleStatusUpdate = useCallback(async (newStatus) => {
    setIsUpdating(true);
    setError(null);
    try {
      await updateStatus({ body: { status: newStatus } });
      await onStatusChange(order.id, newStatus);
      toast.success(`Order #${order.order_number} status updated to ${newStatus}`);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update status';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  }, [order, onStatusChange, updateStatus]);

  const handleDeleteClick = useCallback(() => {
    onDelete(order.id);
    onClose(); // Close modal after triggering delete confirmation
  }, [order, onDelete, onClose]);

  if (authLoading) return <SkeletonLoader />;
  if (!user || !order) return null;

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b p-3 sm:p-4 h-16 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold truncate">Order #{order.order_number}</h2>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 p-1"
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Order Summary */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-md sm:text-lg font-semibold flex items-center">
                    <FiPackage className="mr-2" /> Order Summary
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Order Date</p>
                      <p className="text-sm sm:text-base">{formattedDate}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(e.target.value)}
                        disabled={isUpdating}
                        className={`block w-full pl-3 pr-8 py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-1 ${
                          order.status === 'delivered' ? 'border-green-300 focus:ring-green-500' :
                          order.status === 'cancelled' ? 'border-red-300 focus:ring-red-500' :
                          'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-2 sm:p-3 bg-red-50 text-red-700 rounded-md text-xs sm:text-sm flex items-center"
                        >
                          {error}
                          <button
                            onClick={() => handleStatusUpdate(order.status)}
                            className="ml-2 text-red-700 underline"
                          >
                            Retry
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Payment Method</p>
                      <div className="flex items-center mt-1">
                        {paymentMethodIcons[order.payment_method] || <FiCreditCard className="text-gray-500" size={18} />}
                        <span className="ml-2 text-sm sm:text-base capitalize">
                          {order.payment_method?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Total Amount</p>
                      <p className="text-md sm:text-lg font-semibold">
                        GHS{order.total_price || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-md sm:text-lg font-semibold flex items-center">
                    <FiUser className="mr-2" /> Customer
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Name</p>
                      <p className="text-sm sm:text-base">{order.customer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Email</p>
                      <p className="text-sm sm:text-base">{order.customer_email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                      <p className="text-sm sm:text-base">{order.customer_phone_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="md:col-span-2">
                  <h3 className="text-md sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                    <FiMapPin className="mr-2" /> Delivery
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Street Address</p>
                      <p className="text-sm sm:text-base">{order.street_address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Town/City</p>
                      <p className="text-sm sm:text-base">{order.town || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Region</p>
                      <p className="text-sm sm:text-base">{order.region || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Postal Code</p>
                      <p className="text-sm sm:text-base">{order.postal_code || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="md:col-span-2">
                  <h3 className="text-md sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                    <FiPackage className="mr-2" /> Items
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Variant</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.items?.map((item, index) => (
                          <motion.tr
                            key={`${item.phone?.id || 'phone'}-${item.memory_variant?.id || 'variant'}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <img 
                                  src={item.phone?.thumbnail || '/placeholder.png'} 
                                  alt={`${item.phone?.brand || 'N/A'} ${item.phone?.model || 'N/A'}`}
                                  className="w-10 h-10 sm:w-16 sm:h-16 object-contain"
                                  onError={(e) => { e.target.src = '/placeholder.png'; }}
                                />
                                <div className="ml-2 sm:ml-4">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900">
                                    {`${item.phone?.brand || 'N/A'} ${item.phone?.model || 'N/A'}`}
                                  </div>
                                  <div className="text-xs text-gray-500 sm:hidden">
                                    {item.memory_variant?.storage_capacity || 'Standard'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                              {item.memory_variant?.storage_capacity || 'Standard'}
                            </td>
                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {item.quantity || 0}
                            </td>
                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              GHS{(item.memory_variant?.price || 0)}
                            </td>
                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              GHS{(item.quantity * (item.memory_variant?.price || 0)).toFixed(2)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-3 sm:p-4 h-16 flex-shrink-0 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="px-3 py-1 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 min-w-[80px]"
              >
                Close
              </button>
              {order.status !== 'delivered' && (
                <button
                  onClick={() => handleStatusUpdate('delivered')}
                  disabled={isUpdating}
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center min-w-[100px]"
                >
                  {isUpdating && (
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {isUpdating ? 'Updating...' : 'Mark Delivered'}
                </button>
              )}
              <button
                onClick={handleDeleteClick}
                disabled={isUpdating}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center min-w-[80px]"
              >
                <FiTrash2 className="mr-2 h-4 w-4" />
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderDetailsModal;