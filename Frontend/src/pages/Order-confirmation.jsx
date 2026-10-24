import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaShoppingBag, 
  FaMapMarkerAlt, 
  FaCreditCard, 
  FaWhatsapp,
  FaBoxOpen,
  FaTruck,
  FaHome,
  FaUser,
  FaEnvelope,
  FaPhone
} from 'react-icons/fa';
import PropTypes from 'prop-types';
import ErrorBoundary from '@components/ErrorBoundary';

const Order_Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeOrder = () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get all data from location state (passed from checkout)
        const locationOrder = location.state?.order; // { order_number, total_price, message, status }
        const cart = location.state?.cart; // Array of cart items
        const formData = location.state?.formData; // Customer and delivery info

        console.log('Location state received:', { locationOrder, cart, formData });

        if (locationOrder && cart && formData) {
          // Build complete order object from checkout data
          const completeOrder = {
            // Order metadata from API response
            order_number: locationOrder.order_number,
            total_price: parseFloat(locationOrder.total_price),
            message: locationOrder.message,
            status: locationOrder.status,
            
            // Customer information from form
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            customer_phone_number: formData.customer_phone_number,
            
            // Delivery information from form
            street_address: formData.street_address,
            town: formData.town,
            region: formData.region,
            postal_code: formData.postal_code,
            
            // Payment information from form
            payment_method: formData.payment_method,
            payment_status: formData.payment_status || 'pending',
            
            // Items from cart
            items: cart.map(item => ({
              id: item.id,
              brand: item.brand,
              model: item.model,
              thumbnail: item.thumbnail,
              memory: item.memory,
              quantity: item.quantity,
              price_at_purchase: item.memory?.price || 0,
              total_price: (item.memory?.price || 0) * (item.quantity || 1)
            })),
            
            // Generated fields
            delivery_address: `${formData.street_address}, ${formData.town}, ${formData.region}${formData.postal_code ? `, ${formData.postal_code}` : ''}`,
            is_paid: formData.payment_method === 'cash_on_delivery' ? false : true,
            created_at: new Date().toISOString()
          };

          console.log('Complete order built:', completeOrder);
          setOrder(completeOrder);

          // Track conversion
          if (window.location.hostname !== 'localhost' && window.gtag) {
            window.gtag('event', 'purchase', {
              transaction_id: completeOrder.order_number,
              value: completeOrder.total_price,
              currency: 'GHS',
              items: cart.map(item => ({
                item_id: item.id,
                item_name: `${item.brand} ${item.model}`,
                quantity: item.quantity,
                price: item.memory?.price || 0,
              })),
            });
          }
        } else {
          throw new Error('Incomplete order data. Please ensure all information was provided during checkout.');
        }
      } catch (err) {
        console.error('Order initialization error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeOrder();
  }, [location.state]);

  const getDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 3) + 3);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getSecureImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/150';
    return url.startsWith('http') ? url : `https://api.itrade4phones.com${url}`;
  };

  const formatPaymentMethod = (method) => {
    const methods = {
      'mobile_money': 'Mobile Money',
      'credit_card': 'Credit Card',
      'btc': 'Bitcoin',
      'cash_on_delivery': 'Cash on Delivery'
    };
    return methods[method] || method.replace(/_/g, ' ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Preparing your order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Order Not Found</h2>
          <p className="text-gray-600 mt-2">{error || 'Unable to load order details.'}</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/shop')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              Go to Shop
            </button>
            <a
              href="https://wa.me/233502921324?text=Hi%20there,%20I%20need%20help%20with%20my%20order"
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp /> Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = getDeliveryDate();
  const steps = [
    { 
      id: 1,
      title: 'Order Confirmed', 
      icon: <FaCheckCircle className="text-blue-500" />,
      description: `Confirmed on ${new Date().toLocaleDateString()}`,
      active: true
    },
    { 
      id: 2,
      title: 'Processing', 
      icon: <FaBoxOpen className="text-yellow-500" />,
      description: 'Preparing your items',
      active: false
    },
    { 
      id: 3,
      title: 'Shipped', 
      icon: <FaTruck className="text-purple-500" />,
      description: `Estimated by ${formattedDate}`,
      active: false
    },
    { 
      id: 4,
      title: 'Delivered', 
      icon: <FaHome className="text-green-500" />,
      description: 'To your doorstep',
      active: false
    }
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8 pt-20">
        <Helmet>
          <title>Order Confirmation - iTrade4Phones</title>
          <meta name="description" content="Thank you for your order at iTrade4Phones. View your order details and track delivery." />
        </Helmet>

        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Success Alert */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 text-xl mr-3" />
                <div>
                  <h3 className="text-green-800 font-semibold">Order Confirmed!</h3>
                  <p className="text-green-600 text-sm">{order.message}</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Order Details - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Summary Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                          <FaCheckCircle className="text-green-300" />
                          Order Confirmed!
                        </h1>
                        <p className="text-blue-100 mt-1">Thank you for your purchase, {order.customer_name}!</p>
                      </div>
                      <div className="bg-white/20 rounded-lg px-4 py-2 text-center sm:text-right">
                        <p className="text-sm font-medium">Order #</p>
                        <p className="font-bold text-lg">{order.order_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaShoppingBag className="text-blue-500" />
                      Order Summary
                    </h2>
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <motion.div
                          key={`${item.id}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-4 border-b pb-4 last:border-0"
                        >
                          <img 
                            src={getSecureImageUrl(item.thumbnail)} 
                            alt={`${item.brand} ${item.model}`}
                            className="w-16 h-16 object-contain rounded-lg border bg-gray-50 p-1"
                            loading="lazy"
                            onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {item.brand} {item.model}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {item.memory?.storage_capacity} • Qty: {item.quantity}
                            </p>
                            <p className="text-sm text-gray-600">
                              GHS {item.memory?.price} each
                            </p>
                          </div>
                          <p className="font-semibold text-blue-600">
                            GHS {((item.memory?.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total Amount</span>
                        <span className="text-blue-600">GHS {order.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Status Timeline */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">Order Status</h2>
                  <div className="relative">
                    <div className="absolute left-5 top-0 h-full w-0.5 bg-blue-200 z-0"></div>
                    <div className="space-y-8">
                      {steps.map((step, index) => (
                        <motion.div 
                          key={step.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.15 }}
                          className="relative pl-12"
                        >
                          <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10
                            ${step.active ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400 border-2 border-blue-200'}`}>
                            {step.icon}
                          </div>
                          <div>
                            <h3 className={`font-medium ${step.active ? 'text-blue-600' : 'text-gray-600'}`}>
                              {step.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {step.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar - 1/3 width */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaUser className="text-blue-500" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FaUser className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{order.customer_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{order.customer_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaPhone className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{order.customer_phone_number}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-green-500" />
                      Delivery Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Estimated Delivery</p>
                        <p className="font-medium">{formattedDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Shipping Address</p>
                        <p className="font-medium text-sm">
                          {order.street_address}<br />
                          {order.town}, {order.region}<br />
                          {order.postal_code && `${order.postal_code}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaCreditCard className="text-purple-500" />
                      Payment Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-medium capitalize">
                          {formatPaymentMethod(order.payment_method)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium capitalize">
                          {order.is_paid ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="font-bold text-blue-600 text-lg">
                          GHS {order.total_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support & Actions */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="font-medium text-gray-800 mb-3">Need Help?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      We're here to assist you with your order.
                    </p>
                    <div className="space-y-3">
                      <a 
                        href={`https://wa.me/233502921324?text=Hi%20there,%20I%20need%20help%20with%20order%20${order.order_number}`}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaWhatsapp /> Chat on WhatsApp
                      </a>
                      <button
                        onClick={() => navigate('/shop')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Continue Shopping
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Print Receipt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

Order_Confirmation.propTypes = {
  location: PropTypes.shape({
    state: PropTypes.shape({
      order: PropTypes.shape({
        order_number: PropTypes.string,
        total_price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        message: PropTypes.string,
      }),
      cart: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        brand: PropTypes.string,
        model: PropTypes.string,
        thumbnail: PropTypes.string,
        memory: PropTypes.shape({
          storage_capacity: PropTypes.string,
          price: PropTypes.number,
        }),
        quantity: PropTypes.number,
      })),
      formData: PropTypes.shape({
        customer_name: PropTypes.string,
        customer_email: PropTypes.string,
        customer_phone_number: PropTypes.string,
        street_address: PropTypes.string,
        town: PropTypes.string,
        region: PropTypes.string,
        postal_code: PropTypes.string,
        payment_method: PropTypes.string,
        payment_status: PropTypes.string,
      }),
    }),
  }),
};

export default Order_Confirmation;