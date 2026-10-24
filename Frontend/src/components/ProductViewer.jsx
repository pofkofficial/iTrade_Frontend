import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaBroadcastTower,
  FaMicrochip,
  FaCamera,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { IoMdPhonePortrait, IoMdClose } from 'react-icons/io';
import { MdSensorOccupied, MdBattery4Bar, MdOutlineSimCard } from 'react-icons/md';
import { BsCartPlusFill, BsCartCheckFill } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '@utils/api';
import { toast } from 'react-toastify';

const ProductViewer = ({ phoneData, onClose, isClicked, onButtonClick, storageSetter, storage }) => {
  const popupRef = useRef(null);
  const navigate = useNavigate();
  const [selectedValue, setSelectedValue] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneDetails, setPhoneDetails] = useState(phoneData);

  const getPhoneDetails = useCallback(async () => {
    if (!phoneData?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.get(`/phones/${phoneData.id}/`);
      setPhoneDetails(prev => ({ ...prev, ...data }));
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.message || 'Failed to load phone details';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [phoneData?.id]);

  useEffect(() => {
    getPhoneDetails();
  }, [getPhoneDetails]);

  const {
    id,
    brand = 'Unknown',
    model = 'Unknown',
    thumbnail = '/placeholder-product.png',
    support_5G = false,
    number_of_sims = 1,
    esim = false,
    physical_sim = true,
    display_size = 'N/A',
    storage_options = [],
    storage_variants = storage_options,
    camera_details = 'N/A',
    FaceScanner = false,
    Fingerprint = false,
    Iris_scanner = false,
    battery_capacity = 'N/A',
    link = '#',
    min_price = 0,
    max_price = 0,
  } = phoneDetails;

  const variants = storage_variants.length ? storage_variants : storage_options;

  useEffect(() => {
    if (variants.length === 0) {
      const fallback = ['N/A', parseFloat(min_price) || 0, parseFloat(max_price) || null, null];
      setSelectedValue(fallback);
      storageSetter(fallback);
      return;
    }

    const first = variants[0];
    const capacity = first.storage_capacity || first.storage || 'N/A';
    const price = parseFloat(first.price || min_price) || 0;
    const oldPrice = first.old_price ? parseFloat(first.old_price) : null;
    const variantId = first.id || null;

    const defaultStorage = [capacity, price, oldPrice, variantId];
    setSelectedValue(defaultStorage);
    storageSetter(defaultStorage);
  }, [variants, min_price, max_price, storageSetter]);

  const handleStorageChange = (e) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const [capacity, price, oldPrice, variantId] = e.target.value.split(',');
    const newStorage = [
      capacity,
      parseFloat(price),
      oldPrice ? parseFloat(oldPrice) : null,
      variantId && !variantId.startsWith('temp-') ? parseInt(variantId, 10) : variantId,
    ];

    setSelectedValue(newStorage);
    storageSetter(newStorage);

    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (!storage || storage[0] === 'N/A') return;

    const cartItem = {
      id,
      brand,
      model,
      thumbnail,
      memory: {
        id: storage[3] || `temp-${id}-${storage[0]}`,
        storage_capacity: storage[0],
        price: storage[1],
      },
      quantity: 1,
    };

    navigate('/checkout', { state: { cart: [cartItem], fromProductViewer: true } });
  };

  const sensors = [];
  if (FaceScanner) sensors.push('Face Scanner');
  if (Fingerprint) sensors.push('Fingerprint Scanner');
  if (Iris_scanner) sensors.push('Iris Scanner');

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const storageOptions = variants.map((variant) => {
    const capacity = variant.storage_capacity || variant.storage || 'N/A';
    const price = parseFloat(variant.price || min_price) || 0;
    const oldPrice = variant.old_price ? parseFloat(variant.old_price) : null;
    const variantId = variant.id || `temp-${id}-${capacity}`;
    const ram = variant.ram?.ram || variant.ram || '';

    return (
      <option
        key={variantId}
        value={[capacity, price, oldPrice, variantId].join(',')}
      >
        {capacity}{ram ? `, ${ram} RAM` : ''}
      </option>
    );
  });

  if (error) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl p-8 text-center max-w-md"
          >
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white border border-zinc-200 rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        >
          <div className="grid lg:grid-cols-2">

            <div className="bg-zinc-50 p-10 lg:p-16 flex items-center justify-center">
              <img
                src={thumbnail}
                alt={`${brand} ${model}`}
                className="max-h-[500px] object-contain"
              />
            </div>

            <div className="p-8 lg:p-12">

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                    {brand}
                  </p>

                  <h2 className="mt-3 text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-950">
                    {model}
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  className="text-zinc-400 hover:text-zinc-900 transition"
                >
                  <IoMdClose size={26} />
                </button>
              </div>

              <div className="mt-10">

                <p className="text-sm text-zinc-500 mb-3">
                  Storage
                </p>

                <select
                  onChange={handleStorageChange}
                  value={selectedValue.join(',')}
                  className="w-full h-12 rounded-xl border border-zinc-300 px-4"
                >
                  {storageOptions}
                </select>

              </div>

              <div className="mt-10">

                <p className="text-sm text-zinc-500">
                  Starting at
                </p>

                <h3 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
                  GHS {selectedValue?.[1]?.toLocaleString()}
                </h3>

                {selectedValue?.[2] && (
                  <p className="mt-2 text-zinc-400 line-through">
                    GHS {selectedValue[2].toLocaleString()}
                  </p>
                )}

              </div>

              <div className="grid grid-cols-2 gap-8 mt-12">

                <div>
                  <p className="text-sm text-zinc-500">Display</p>
                  <p className="mt-2 font-medium">{display_size}"</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Battery</p>
                  <p className="mt-2 font-medium">{battery_capacity}mAh</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Camera</p>
                  <p className="mt-2 font-medium">{camera_details}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Connectivity</p>
                  <p className="mt-2 font-medium">
                    {support_5G ? '5G + Dual SIM' : 'Dual SIM'}
                  </p>
                </div>

              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-3">

                <button
                  onClick={handleBuyNow}
                  className="flex-1 h-14 rounded-full bg-zinc-950 text-white font-medium hover:bg-zinc-800 transition"
                >
                  Buy Now
                </button>

                <button
                  onClick={onButtonClick}
                  className={`
                    flex-1 h-14 rounded-full border transition
                    ${
                      isClicked
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-300 hover:border-zinc-950'
                    }
                  `}
                >
                  {isClicked ? 'Added to Cart' : 'Add to Cart'}
                </button>

              </div>

              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-8 text-sm text-zinc-500 hover:text-zinc-950 transition"
              >
                View Full Specifications →
              </a>

            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

ProductViewer.propTypes = {
  phoneData: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  isClicked: PropTypes.bool.isRequired,
  onButtonClick: PropTypes.func.isRequired,
  storageSetter: PropTypes.func.isRequired,
  storage: PropTypes.array,
};

export default ProductViewer;