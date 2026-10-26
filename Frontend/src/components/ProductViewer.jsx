import { useState, useEffect, useRef, useCallback } from 'react';
import { IoMdClose } from 'react-icons/io';
import { BsCartPlusFill, BsCartCheckFill } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '@utils/api';

const ProductViewer = ({
  phoneData,
  onClose,
  isClicked,
  onButtonClick,
  storageSetter,
  storage,
  isOutOfStock,
}) => {
  const popupRef        = useRef(null);
  const navigate        = useNavigate();
  const [specs, setSpecs]                   = useState(null);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);

  // ── storage options already loaded by the card ───────────────────────────
  const variants = phoneData?.storage_options || [];

  // ── fetch only the spec fields the card doesn't carry ────────────────────
  const fetchSpecs = useCallback(async () => {
    if (!phoneData?.id) return;
    setIsLoadingSpecs(true);
    try {
      const { data } = await api.get(`/phones/${phoneData.id}/`);
      setSpecs(data);
    } catch {
      // viewer still works with card data; specs show —
    } finally {
      setIsLoadingSpecs(false);
    }
  }, [phoneData?.id]);

  useEffect(() => { fetchSpecs(); }, [fetchSpecs]);

  // ── pill selection ────────────────────────────────────────────────────────
  const handleVariantSelect = useCallback((v) => {
    storageSetter([
      v.storage_capacity || 'N/A',
      parseFloat(v.price) || 0,
      v.old_price ? parseFloat(v.old_price) : null,
      v.id || null,
      v.availability !== undefined ? Boolean(v.availability) : true,
    ]);
  }, [storageSetter]);

  // ── buy now ───────────────────────────────────────────────────────────────
  const handleBuyNow = useCallback((e) => {
    e.stopPropagation();
    if (!storage || storage[0] === 'N/A' || isOutOfStock) return;
    navigate('/checkout', {
      state: {
        cart: [{
          id:        phoneData.id,
          brand:     phoneData.brand,
          model:     phoneData.model,
          thumbnail: phoneData.thumbnail,
          quantity:  1,
          memory: {
            id:               storage[3] || `temp-${phoneData.id}-${storage[0]}`,
            storage_capacity: storage[0],
            price:            storage[1],
          },
        }],
        fromProductViewer: true,
      },
    });
  }, [navigate, phoneData, storage, isOutOfStock]);

  // ── close on outside click / Escape ──────────────────────────────────────
  useEffect(() => {
    const onOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown',   onEsc);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown',   onEsc);
    };
  }, [onClose]);

  // ── destructure ───────────────────────────────────────────────────────────
  const { brand, model, thumbnail } = phoneData;
  const {
    display_size, battery_capacity,
    camera_details, number_of_sims, link, esim, physical_sim
  } = specs || {};

  const selectedCapacity = storage?.[0];
  const selectedPrice    = storage?.[1];
  const selectedOldPrice = storage?.[2];

  const specRows = [
    { label: 'Display',      value: display_size      ? `${display_size}"`          : null },
    { label: 'Battery',      value: battery_capacity  ? `${battery_capacity}`       : null },
    { label: 'Camera',       value: camera_details    || null                               },
    { label: 'Number of SIMs', value: number_of_sims != null
        ? `${number_of_sims} SIM`
        : null },
    { label: 'eSIM',         value: esim ? 'Yes' : 'No' },
    { label: 'Physical SIM',   value: physical_sim ? 'Yes' : 'No' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[28px] w-full max-w-3xl overflow-hidden shadow-2xl"
        >
          <div className="grid sm:grid-cols-2">

            {/* ── Image panel ─────────────────────────────────────────────── */}
            <div className={`
              bg-[#FAFAFA] flex items-center justify-center p-10
              min-h-[240px] sm:min-h-0
              ${isOutOfStock ? 'grayscale opacity-60' : ''}
            `}>
              <img
                src={thumbnail || '/placeholder-product.png'}
                alt={`${brand} ${model}`}
                className="max-h-[280px] sm:max-h-[380px] w-auto object-contain"
              />
            </div>

            {/* ── Detail panel ─────────────────────────────────────────────── */}
            <div className="p-7 flex flex-col gap-4">

              {/* header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                    {brand}
                  </p>
                  <h2 className="text-2xl font-semibold text-neutral-900 leading-tight mt-0.5">
                    {model}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="text-neutral-400 hover:text-neutral-900 transition mt-0.5 shrink-0"
                >
                  <IoMdClose size={22} />
                </button>
              </div>

              {/* storage pills */}
              {variants.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-neutral-400 mb-2">
                    Storage
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const cap         = v.storage_capacity || 'N/A';
                      const isSelected  = selectedCapacity === cap;
                      const unavailable = v.availability === false;
                      return (
                        <button
                          key={v.id || cap}
                          disabled={unavailable}
                          onClick={() => !unavailable && handleVariantSelect(v)}
                          className={`
                            px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                            ${unavailable
                              ? 'border-neutral-100 text-neutral-300 cursor-not-allowed line-through'
                              : isSelected
                                ? 'border-[#2962FF] bg-[#2962FF]/8 text-[#2962FF]'
                                : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                            }
                          `}
                        >
                          {cap}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* price */}
              <div>
                <p className={`text-2xl font-bold leading-none ${isOutOfStock ? 'text-neutral-400' : 'text-neutral-900'}`}>
                  GHS {selectedPrice?.toLocaleString() ?? '—'}
                </p>
                {selectedOldPrice && (
                  <p className="text-sm text-neutral-400 line-through mt-1">
                    GHS {selectedOldPrice.toLocaleString()}
                  </p>
                )}
              </div>

              {/* specs 2×2 */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {specRows.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] text-neutral-400">{label}</p>
                    <p className="text-sm font-medium text-neutral-800 mt-0.5 leading-snug">
                      {isLoadingSpecs
                        ? <span className="inline-block w-14 h-2.5 bg-neutral-100 rounded-full animate-pulse" />
                        : (value || '—')
                      }
                    </p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-1">
                {isOutOfStock ? (
                  <button
                    disabled
                    className="
                      flex-1 h-12 rounded-full
                      bg-neutral-100 text-neutral-400
                      text-sm font-medium cursor-not-allowed
                      flex items-center justify-center gap-2
                    "
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    Out of Stock
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleBuyNow}
                      className="
                        flex-1 h-12 rounded-full
                        bg-[#0A0A0A] text-white
                        text-sm font-medium
                        hover:bg-neutral-800 transition
                      "
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={onButtonClick}
                      className={`
                        flex-1 h-12 rounded-full border
                        text-sm font-medium transition
                        flex items-center justify-center gap-2
                        ${isClicked
                          ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                          : 'border-neutral-300 text-neutral-800 hover:border-[#0A0A0A]'
                        }
                      `}
                    >
                      {isClicked
                        ? <><BsCartCheckFill /> Added</>
                        : <><BsCartPlusFill /> Add to Cart</>
                      }
                    </button>
                  </>
                )}
              </div>

              {/* full specs link */}
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-400 hover:text-neutral-900 transition"
                >
                  View full specifications →
                </a>
              )}

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

ProductViewer.propTypes = {
  phoneData:    PropTypes.object.isRequired,
  onClose:      PropTypes.func.isRequired,
  isClicked:    PropTypes.bool.isRequired,
  onButtonClick: PropTypes.func.isRequired,
  storageSetter: PropTypes.func.isRequired,
  storage:       PropTypes.array,
  isOutOfStock:  PropTypes.bool,
};

ProductViewer.defaultProps = {
  storage:      null,
  isOutOfStock: false,
};

export default ProductViewer;