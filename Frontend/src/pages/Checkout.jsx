import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '@utils/api';

// Constants
const REGIONS = [
  { value: '', label: 'Select Region', disabled: true },
  { value: 'Greater Accra', label: 'Greater Accra' },
  { value: 'Ashanti', label: 'Ashanti' },
  { value: 'Western', label: 'Western' },
  { value: 'Eastern', label: 'Eastern' },
  { value: 'Central', label: 'Central' },
  { value: 'Volta', label: 'Volta' }
];

const PAYMENT_METHODS = [
  { 
    id: 'mobile_money', 
    label: 'Mobile Money/Credit Card/Bank Transfer', 
    available: true,
    description: 'Pay securely with Mobile Money or Credit Card or Bank Transfer'
  },
  { 
    id: 'Payment_on_delivery', 
    label: 'Payment on Delivery', 
    available: false,
    description: 'Pay when you receive your order'
  }
];

// Validation functions
const validatePhone = (phone) => /^0[2357]\d{8}$/.test(phone);
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePostalCode = (code) => !code || /^[A-Z]{2}-\d{3}-\d{3,4}$/.test(code);

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = Array.isArray(location.state?.cart) ? location.state.cart : [];
  const activeInputRef = useRef(null); // Track focused input

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone_number: '',
    street_address: '',
    town: '',
    region: '',
    postal_code: '',
    payment_method: 'mobile_money'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false);

  // Effects
  useEffect(() => {
    // Load Paystack SDK
    if (window.PaystackPop) {
      setIsPaystackLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      setIsPaystackLoaded(true);
    };
    script.onerror = () => {
      setError('Payment system failed to load. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-switch payment method if region changes
    if (formData.payment_method === 'cash_on_delivery' && formData.region !== 'Greater Accra') {
      setFormData(prev => ({ ...prev, payment_method: 'mobile_money' }));
    }
  }, [formData.region]);

  // Restore focus after state updates
  useEffect(() => {
    if (activeInputRef.current) {
      activeInputRef.current.focus();
    }
  }, [formData]);

  // Memoized calculations
  const totalPrice = useMemo(() => 
    cart.reduce((total, item) => 
      total + (Number(item.memory?.price) || 0) * (Number(item.quantity) || 1), 0
    ), [cart]
  );

  const availablePaymentMethods = useMemo(() => 
    PAYMENT_METHODS.map(method => ({
      ...method,
      available: method.id === 'cash_on_delivery' 
        ? formData.region === 'Greater Accra'
        : method.available
    })), [formData.region]
  );

  // Event handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  }, []);

  const handleInputFocus = useCallback((e) => {
    activeInputRef.current = e.target;
  }, []);

  const handleDirectInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  }, []);

  const handlePostalCodeChange = useCallback((value) => {
    let formattedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 9);
    
    let result = '';
    for (let i = 0; i < formattedValue.length; i++) {
      if (i === 2 || i === 5) result += '-';
      result += formattedValue[i];
    }

    handleInputChange('postal_code', result);
  }, [handleInputChange]);

  // Validation
  const validateForm = useCallback(() => {
    if (!cart.length) {
      return 'Your cart is empty. Please add items before checkout.';
    }

    if (!formData.customer_name.trim()) {
      return 'Please enter your full name.';
    }

    if (!validateEmail(formData.customer_email)) {
      return 'Please enter a valid email address.';
    }

    if (!validatePhone(formData.customer_phone_number)) {
      return 'Please enter a valid Ghanaian phone number (e.g., 0244123456).';
    }

    if (!formData.street_address.trim()) {
      return 'Please enter your street address.';
    }

    if (!formData.town.trim()) {
      return 'Please enter your town/city.';
    }

    if (!formData.region) {
      return 'Please select your region.';
    }

    if (!validatePostalCode(formData.postal_code)) {
      return 'Please enter a valid postal code (e.g., GA-123-0000) or leave it blank.';
    }

    const invalidItems = cart.filter(item => 
      !item?.id || !item?.memory?.id || !item.memory?.price || !item.quantity
    );
    
    if (invalidItems.length) {
      return 'Some items in your cart are invalid. Please refresh and try again.';
    }

    return null;
  }, [cart, formData]);

  // Order preparation
  const prepareOrderData = useCallback(() => ({
    customer_name: formData.customer_name.trim(),
    customer_email: formData.customer_email.trim(),
    customer_phone_number: formData.customer_phone_number.trim(),
    street_address: formData.street_address.trim(),
    town: formData.town.trim(),
    region: formData.region,
    postal_code: formData.postal_code.trim(),
    payment_method: formData.payment_method,
    status: 'pending',
    payment_status: 'pending',
    items: cart.map(item => ({
      phone_id: item.id,
      memory_variant_id: item.memory.id,
      quantity: Number(item.quantity),
      price_at_purchase: Number(item.memory.price).toFixed(2)
    }))
  }), [cart, formData]);

  // Payment handling
  const verifyPayment = useCallback(async (reference) => {
    try {
      const response = await api.post('/verify-payment/', { reference });
      return response.data.status === 'success';
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }, []);

  // Paystack payment function
  const processOnlinePayment = useCallback(async () => {
    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC;
    
    if (!paystackKey) {
      throw new Error('Payment configuration error. Please contact support.');
    }

    if (!isPaystackLoaded || !window.PaystackPop) {
      throw new Error('Payment system is loading. Please wait a moment.');
    }

    return new Promise((resolve, reject) => {
      const paymentReference = `iTrade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create proper callback functions
      const paymentCallback = function(response) {
        verifyPayment(response.reference)
          .then(success => {
            if (success) {
              resolve(response.reference);
            } else {
              reject(new Error('Payment verification failed'));
            }
          })
          .catch(err => {
            console.error('Payment verification error:', err);
            reject(new Error('Payment verification failed'));
          });
      };

      const paymentOnClose = function() {
        console.log('Paystack payment window closed');
        reject(new Error('Payment was cancelled'));
      };

      try {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: formData.customer_email,
          amount: Math.round(totalPrice * 100),
          currency: 'GHS',
          ref: paymentReference,
          metadata: {
            custom_fields: [
              {
                display_name: 'Customer Name',
                variable_name: 'customer_name',
                value: formData.customer_name
              },
              {
                display_name: 'Phone Number',
                variable_name: 'phone_number', 
                value: formData.customer_phone_number
              }
            ]
          },
          callback: paymentCallback,
          onClose: paymentOnClose
        });

        handler.openIframe();
      } catch (error) {
        console.error('Paystack setup error:', error);
        reject(new Error('Failed to initialize payment. Please try again.'));
      }
    });
  }, [formData, totalPrice, isPaystackLoaded, verifyPayment]);

  // Order submission
  const submitOrderToAPI = useCallback(async (orderData, paymentReference = null) => {
    const payload = {
      ...orderData,
      payment_status: paymentReference ? 'paid' : 'pending',
      ...(paymentReference && { payment_reference: paymentReference })
    };

    console.log('Submitting order payload:', payload);
    const response = await api.post('/order/', payload);
    return response.data;
  }, []);

  // Main submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const validationError = validateForm();
      if (validationError) throw new Error(validationError);

      const orderData = prepareOrderData();

      let paymentReference = null;

      // Process payment if not cash on delivery
      if (formData.payment_method === 'mobile_money') {
        paymentReference = await processOnlinePayment();
      }

      // Submit order
      console.log('Submitting order with payment reference:', paymentReference);
      const orderResponse = await submitOrderToAPI(orderData, paymentReference);
      
      if (orderResponse?.status === 'success' && orderResponse?.order_number) {
        navigate('/order-confirmation', {
          state: {
            order: {
              order_number: orderResponse.order_number,
              total_price: orderResponse.total_price,
              message: orderResponse.message,
              status: 'success'
            },
            cart: cart,
            formData: formData
          }
        });
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const OrderSummary = () => (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
      <div className="space-y-4">
        {cart.map((item, index) => (
          <div key={`${item.id}-${item.memory?.id}-${index}`} className="flex items-center space-x-3">
            <img
              src={item.thumbnail?.startsWith('http') ? item.thumbnail : `https://api.itrade4phones.com${item.thumbnail}`}
              alt={`${item.brand} ${item.model}`}
              className="w-12 h-12 object-contain bg-white rounded border"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/48x48?text=📱';
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.brand} {item.model}</p>
              <p className="text-sm text-gray-500">{item.memory?.storage_capacity}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">GHS {Number(item.memory?.price).toFixed(2)}</p>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total:</span>
          <span className="text-red-600">GHS {totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  if (!cart.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to your cart before checking out.</p>
            <button
              onClick={() => navigate('/shop')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-16  px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Checkout - iTrade4Phones</title>
        <meta name="description" content="Complete your purchase securely at iTrade4Phones" />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 pt-8">Checkout</h1>
          <p className="text-gray-600">Complete your purchase with secure payment options</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="lg:order-2">
            <OrderSummary />
          </div>

          {/* Checkout Form */}
          <div className="lg:order-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Information</h2>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    id="customer_name"
                    name="customer_name"
                    type="text"
                    value={formData.customer_name}
                    onChange={handleDirectInputChange}
                    onFocus={handleInputFocus}
                    placeholder="John Doe"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      id="customer_email"
                      name="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={handleDirectInputChange}
                      onFocus={handleInputFocus}
                      placeholder="john@example.com"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label htmlFor="customer_phone_number" className="block text-sm font-medium text-gray-700">
                      Phone Number *
                    </label>
                    <input
                      id="customer_phone_number"
                      name="customer_phone_number"
                      type="tel"
                      value={formData.customer_phone_number}
                      onChange={handleDirectInputChange}
                      onFocus={handleInputFocus}
                      placeholder="0244123456"
                      pattern="0[2357][0-9]{8}"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500">10-digit Ghanaian number</p>
                  </div>
                </div>

                {/* Street Address */}
                <div className="space-y-1">
                  <label htmlFor="street_address" className="block text-sm font-medium text-gray-700">
                    Street Address *
                  </label>
                  <input
                    id="street_address"
                    name="street_address"
                    type="text"
                    value={formData.street_address}
                    onChange={handleDirectInputChange}
                    onFocus={handleInputFocus}
                    placeholder="123 Main Street"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Town/City */}
                  <div className="space-y-1">
                    <label htmlFor="town" className="block text-sm font-medium text-gray-700">
                      Town/City *
                    </label>
                    <input
                      id="town"
                      name="town"
                      type="text"
                      value={formData.town}
                      onChange={handleDirectInputChange}
                      onFocus={handleInputFocus}
                      placeholder="Accra"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Region */}
                  <div className="space-y-1">
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                      Region *
                    </label>
                    <select
                      id="region"
                      name="region"
                      value={formData.region}
                      onChange={handleDirectInputChange}
                      onFocus={handleInputFocus}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      {REGIONS.map(option => (
                        <option 
                          key={option.value} 
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Postal Code */}
                <div className="space-y-1">
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                    Ghana Post Code
                  </label>
                  <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handlePostalCodeChange(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="GA-123-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500">Optional (e.g., GA-123-0000)</p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="space-y-3">
                  {availablePaymentMethods.map(method => (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.payment_method === method.id 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => method.available && handleInputChange('payment_method', method.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.payment_method === method.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {formData.payment_method === method.id && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{method.label}</span>
                            {!method.available && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {method.id === 'payment_on_delivery' ? 'Greater Accra Only' : 'Currently Unavailable'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (formData.payment_method === 'mobile_money' && !isPaystackLoaded)}
                className={`w-full mt-8 py-3 px-6 rounded-md font-semibold text-white transition-colors ${
                  isSubmitting || (formData.payment_method === 'mobile_money' && !isPaystackLoaded)
                    ? 'bg-orange-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {formData.payment_method === 'mobile_money' && !isPaystackLoaded ? (
                  'Loading Payment...'
                ) : isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Order...
                  </span>
                ) : (
                  `Place Order - GHS ${totalPrice.toFixed(2)}`
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Your personal information will be used to process your order and support your experience.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;