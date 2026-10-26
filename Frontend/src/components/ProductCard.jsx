import { BsCartPlusFill, BsCartCheckFill } from 'react-icons/bs';
import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductViewer from '@components/ProductViewer';
import PropTypes from 'prop-types';

const ProductCard = ({ product, updateCart, cartFromlist, featuredphones }) => {
  const [isClicked, setIsClicked]       = useState(false);
  const [storage, setStorage]           = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const navigate = useNavigate();

  const cart = Array.isArray(cartFromlist) ? cartFromlist : [];

  // ── Storage init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!product?.storage_options?.length) {
      setStorage(['N/A', product?.min_price || 0, null, null, true]);
      return;
    }

    const first = product.storage_options[0];
    setStorage([
      first.storage_capacity || 'N/A',
      parseFloat(first.price) || product?.min_price || 0,
      first.old_price ? parseFloat(first.old_price) : null,
      first.id || null,
      // index 4 — availability: default true if field absent (backwards-compat)
      first.availability !== undefined ? Boolean(first.availability) : true,
    ]);
  }, [product]);

  // ── Cart sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!storage?.[3]) { setIsClicked(false); return; }
    const exists = cart.some(
      (item) => item.id === product.id && item.memory?.id === storage[3]
    );
    setIsClicked(exists);
  }, [cart, product.id, storage]);

  // ── Derived state ─────────────────────────────────────────────────────────
  // availability lives at storage[4]; treat undefined as available
  const isOutOfStock  = storage ? storage[4] === false : false;
  const isDisabled    = !storage || storage[0] === 'N/A' || isOutOfStock;
  const discountPct   = storage?.[2]
    ? Math.round((1 - storage[1] / storage[2]) * 100)
    : null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback((e) => {
    e?.stopPropagation();
    if (isDisabled) return;

    const cartItem = {
      id:        product.id,
      brand:     product.brand,
      model:     product.model,
      thumbnail: product.thumbnail,
      quantity:  1,
      memory: {
        id:                storage[3] || `temp-${product.id}-${storage[0]}`,
        storage_capacity:  storage[0],
        price:             storage[1],
      },
    };

    const nextState = !isClicked;
    setIsClicked(nextState);

    if (!updateCart) {
      navigate('/shop', { state: { cart: [cartItem], featured: featuredphones } });
    } else {
      updateCart(cartItem, nextState);
    }
  }, [isClicked, isDisabled, navigate, product, storage, updateCart, featuredphones]);

  const openPopup      = useCallback(() => setIsPopupVisible(true),  []);
  const closePopup     = useCallback(() => setIsPopupVisible(false), []);
  const handleKeyDown  = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPopup(); }
  }, [openPopup]);
  const handleImageError = useCallback((e) => {
    e.target.src = '/placeholder-product.png';
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        onClick={openPopup}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`${product?.brand} ${product?.model}${isOutOfStock ? ' — out of stock' : ''}`}
        className="group cursor-pointer"
      >
        <motion.div
          whileHover={{ y: isOutOfStock ? 0 : -6 }}
          transition={{ duration: 0.25 }}
          className={`
            relative bg-white border rounded-[28px] overflow-hidden h-full
            transition-all duration-300
            ${isOutOfStock
              ? 'border-neutral-200 opacity-75'
              : 'border-neutral-200 hover:border-neutral-300 hover:shadow-xl'}
          `}
        >
          {/* ── Out-of-stock overlay badge ── */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none rounded-[28px]">
              {/* subtle dark scrim */}
              <div className="absolute inset-0 bg-white/60 rounded-[28px]" />
              {/* badge */}
              <span className="
                relative z-10
                inline-flex items-center gap-1.5
                bg-neutral-900 text-white
                text-[11px] font-semibold uppercase tracking-widest
                px-4 py-2 rounded-full shadow-lg
              ">
                {/* small dot */}
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                Out of Stock
              </span>
            </div>
          )}

          {/* ── Image ── */}
          <div className={`
            aspect-square flex items-center justify-center p-6 bg-white
            ${isOutOfStock ? 'grayscale' : ''}
          `}>
            {discountPct && !isOutOfStock && (
              <span className="
                absolute top-4 left-4 z-10
                bg-red-500 text-white text-[10px] font-bold
                px-2 py-0.5 rounded-full
              ">
                -{discountPct}%
              </span>
            )}
            <img
              src={product?.thumbnail || '/placeholder-product.png'}
              alt={`${product?.brand} ${product?.model}`}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
              className="
                max-h-full object-contain
                transition-transform duration-500
                group-hover:scale-105
              "
            />
          </div>

          {/* ── Content ── */}
          <div className="px-6 pb-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-1">
              {product?.brand}
            </p>
            <h3 className="text-base sm:text-xl md:text-lg font-medium text-neutral-900 leading-tight">
              {product?.model}
            </h3>

            {storage && storage[0] !== 'N/A' && (
              <div className="mt-2">
                <span className="
                  inline-flex items-center rounded-full
                  bg-neutral-100 px-3 py-1.5
                  text-sm font-medium text-neutral-700
                ">
                  {storage[0]}
                </span>
              </div>
            )}

            <div className="mt-2">
              <p className={`
                text-lg 2xl:text-2xl font-semibold
                ${isOutOfStock ? 'text-neutral-400' : 'text-neutral-900'}
              `}>
                GHS {storage?.[1]?.toLocaleString()}
              </p>
              {storage?.[2] ? (
                <p className="mt-1 text-sm text-neutral-400 line-through">
                  GHS {storage[2].toLocaleString()}
                </p>
              ) : (
                <p className="mt-1 text-sm py-2">&nbsp;</p>
              )}
            </div>

            {/* ── CTA ── */}
            <div className="mt-6">
              {isOutOfStock ? (
                /* Disabled out-of-stock button */
                <button
                  disabled
                  className="
                    w-full h-11 rounded-full
                    border border-neutral-200
                    bg-neutral-50 text-neutral-400
                    text-sm font-medium
                    flex items-center justify-center gap-2
                    cursor-not-allowed
                  "
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                  Unavailable
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isDisabled}
                  className={`
                    w-full h-11 rounded-full font-medium text-sm
                    flex items-center justify-center gap-2
                    transition-all duration-200
                    ${isClicked
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-[#2962FF] text-white hover:opacity-90'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isClicked ? (
                    <><BsCartCheckFill /> Added</>
                  ) : (
                    <><BsCartPlusFill /> Add to Cart</>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {isPopupVisible && (
        <ProductViewer
          isClicked={isClicked}
          onButtonClick={handleAddToCart}
          phoneData={product}
          onClose={closePopup}
          storageSetter={setStorage}
          storage={storage}
          isOutOfStock={isOutOfStock}
        />
      )}
    </>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id:              PropTypes.number.isRequired,
    brand:           PropTypes.string,
    model:           PropTypes.string,
    storage_options: PropTypes.arrayOf(PropTypes.object),
    min_price:       PropTypes.number,
    max_price:       PropTypes.number,
    thumbnail:       PropTypes.string,
  }).isRequired,
  updateCart:    PropTypes.func,
  cartFromlist:  PropTypes.array,
  featuredphones: PropTypes.array,
};

ProductCard.defaultProps = {
  updateCart:    null,
  cartFromlist:  [],
  featuredphones: [],
};

export default memo(ProductCard);