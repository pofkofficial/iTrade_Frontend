import { useEffect, useRef, useMemo, useCallback } from 'react';
import { IoMdRemoveCircleOutline } from 'react-icons/io';
import { FaArrowRight, FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

const Cart = ({ cart, onClose, onRemoveFromCart, updateCartQuantity }) => {
  const popupRef = useRef(null);
  const navigate = useNavigate();

  // Calculate total price
  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = item.memory?.price || 0;
      const quantity = item.quantity || 0;
      return total + price * quantity;
    }, 0);
  }, [cart]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle remove item
  const handleRemoveFromCart = useCallback(
    (itemId, memoryId) => {
      if (!memoryId) {
        toast.error('Invalid item data');
        return;
      }
      if (!window.confirm('Are you sure you want to remove this item?')) return;
      onRemoveFromCart(itemId, memoryId);
      toast.success('Item removed from cart');
    },
    [onRemoveFromCart]
  );

  // Handle quantity update
  const handleUpdateQuantity = useCallback(
    (itemId, memoryId, newQuantity) => {
      if (newQuantity < 1) {
        handleRemoveFromCart(itemId, memoryId);
        return;
      }
      updateCartQuantity(itemId, memoryId, newQuantity);
    },
    [updateCartQuantity, handleRemoveFromCart]
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={popupRef}
          initial={{
            opacity: 0,
            y: -8,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: -8,
            scale: 0.98,
          }}
          transition={{
            duration: 0.22,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            transformOrigin: 'top right',
          }}
          className="
          fixed top-[88px] left-3 right-3 sm:left-auto sm:right-5 sm:w-96
          max-h-[calc(100dvh-104px)]
          flex flex-col p-4 rounded-xl bg-white shadow-xl
          z-[60] border border-gray-100 overflow-hidden box-border
        "
        role="dialog"
        aria-modal="false"
        aria-labelledby="cart-title"
        >
          <div className="flex shrink-0 justify-between items-center pb-3 border-b">
            <div className="flex items-center space-x-2">
              <FaShoppingCart className="text-blue-600" aria-hidden="true" />
              <h3 id="cart-title" className="font-semibold text-lg">Your Cart</h3>
              {cart.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                  {cart.reduce((total, item) => total + (item.quantity || 0), 0)}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close cart"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain py-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <FaShoppingCart className="text-4xl mb-2 opacity-30" aria-hidden="true" />
                <p>Your cart is empty</p>
                <p className="text-sm">Start shopping to add items</p>
              </div>
            ) : (
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={`${item.id}-${item.memory?.id || 'no-memory'}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center py-3 border-b last:border-0"
                  >
                    <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={`${item.brand || 'Unknown'} ${item.model || 'Model'}`}
                          className="h-full w-full object-contain p-1"
                          loading="lazy"
                          onError={(e) => (e.target.src = '/placeholder-product.png')}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.brand || 'Unknown'} {item.model || 'Model'}
                      </p>
                      <p className="text-xs bg-gray-100 text-gray-700 font-semibold rounded px-1.5 py-0.5 inline-block mt-1">
                        {item.memory?.storage_capacity || 'N/A'}
                      </p>
                      <p className="text-blue-600 font-bold text-sm mt-1">
                        GHS {(item.memory?.price || 0)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 ml-2">
                      <div className="flex items-center border rounded-md">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.memory?.id, item.quantity - 1)}
                          className="px-2 py-1 text-gray-500 hover:text-gray-700"
                          aria-label={`Decrease quantity for ${item.brand || 'Unknown'} ${item.model || 'Model'}`}
                          disabled={!item.memory?.id}
                        >
                          -
                        </button>
                        <input
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value, 10);
                            if (!isNaN(newQuantity) && item.memory?.id) {
                              handleUpdateQuantity(item.id, item.memory.id, Math.max(1, newQuantity));
                            }
                          }}
                          className="w-10 text-center border-0 focus:ring-0 p-0 text-sm"
                          min="1"
                          type="number"
                          aria-label={`Quantity for ${item.brand || 'Unknown'} ${item.model || 'Model'}`}
                          disabled={!item.memory?.id}
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.memory?.id, item.quantity + 1)}
                          className="px-2 py-1 text-gray-500 hover:text-gray-700"
                          aria-label={`Increase quantity for ${item.brand || 'Unknown'} ${item.model || 'Model'}`}
                          disabled={!item.memory?.id}
                        >
                          +
                        </button>
                      </div>
                      <p className="font-bold text-blue-600 w-16 text-right text-sm">
                        GHS {(item.memory?.price * item.quantity || 0).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemoveFromCart(item.id, item.memory?.id)}
                        className="text-red-500 hover:text-red-700 ml-1"
                        aria-label={`Remove ${item.brand || 'Unknown'} ${item.model || 'Model'} from cart`}
                        disabled={!item.memory?.id}
                      >
                        <IoMdRemoveCircleOutline size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {cart.length > 0 && (
            <div className="shrink-0 border-t pt-3">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg text-red-600">
                  GHS {totalPrice.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => {
                  navigate('/checkout', { state: { cart } });
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-2.5 rounded-md font-medium flex items-center justify-center space-x-2 transition-all duration-300"
                aria-label="Proceed to checkout"
                disabled={cart.length === 0}
              >
                <span>Proceed to Checkout</span>
                <FaArrowRight className="text-sm" />
              </button>
              <button
                onClick={onClose}
                className="w-full mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium py-2 rounded-md hover:bg-blue-50 transition-colors"
                aria-label="Continue shopping"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>,
    document.body
  );
};

Cart.propTypes = {
  cart: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      brand: PropTypes.string,
      model: PropTypes.string,
      thumbnail: PropTypes.string,
      quantity: PropTypes.number,
      memory: PropTypes.shape({
        id: PropTypes.number,
        storage_capacity: PropTypes.string,
        price: PropTypes.number,
      }),
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onRemoveFromCart: PropTypes.func.isRequired,
  updateCartQuantity: PropTypes.func.isRequired,
};

export default Cart;