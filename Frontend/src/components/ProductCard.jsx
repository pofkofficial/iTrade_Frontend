import { BsCartPlusFill, BsCartCheckFill } from 'react-icons/bs';
import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductViewer from '@components/ProductViewer';
import PropTypes from 'prop-types';

const ProductCard = ({ product, updateCart, cartFromlist, featuredphones }) => {
  const [isClicked, setIsClicked] = useState(false);
  const [storage, setStorage] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const navigate = useNavigate();

  const cart = Array.isArray(cartFromlist) ? cartFromlist : [];

  useEffect(() => {
    if (!product?.storage_options?.length) {
      setStorage([
        'N/A',
        product?.min_price || 0,
        null,
        null,
      ]);
      return;
    }

    const first = product.storage_options[0];

    setStorage([
      first.storage_capacity || 'N/A',
      parseFloat(first.price) || product?.min_price || 0,
      first.old_price ? parseFloat(first.old_price) : null,
      first.id || null,
    ]);
  }, [product]);

  useEffect(() => {
    if (!storage?.[3]) {
      setIsClicked(false);
      return;
    }

    const exists = cart.some(
      (item) =>
        item.id === product.id &&
        item.memory?.id === storage[3]
    );

    setIsClicked(exists);
  }, [cart, product.id, storage]);

  const handleAddToCart = useCallback(
    (e) => {
      e?.stopPropagation();

      if (!storage || storage[0] === 'N/A') return;

      const cartItem = {
        id: product.id,
        brand: product.brand,
        model: product.model,
        thumbnail: product.thumbnail,
        quantity: 1,
        memory: {
          id: storage[3] || `temp-${product.id}-${storage[0]}`,
          storage_capacity: storage[0],
          price: storage[1],
        },
      };

      const nextState = !isClicked;
      setIsClicked(nextState);

      if (!updateCart) {
        navigate('/shop', {
          state: {
            cart: [cartItem],
            featured: featuredphones,
          },
        });
      } else {
        updateCart(cartItem, nextState);
      }
    },
    [
      featuredphones,
      isClicked,
      navigate,
      product,
      storage,
      updateCart,
    ]
  );

  const openPopup = () => setIsPopupVisible(true);
  const closePopup = () => setIsPopupVisible(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPopup();
    }
  };

  const handleImageError = (e) => {
    e.target.src = '/placeholder-product.png';
  };

  return (
    <>
      <div
        onClick={openPopup}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`${product?.brand} ${product?.model}`}
        className="group cursor-pointer"
      >
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ duration: 0.25 }}
          className="
            bg-white
            border
            border-neutral-200
            rounded-[28px]
            overflow-hidden
            h-full
            transition-all
            duration-300
            hover:border-neutral-300
            hover:shadow-xl
          "
        >
          {/* Image */}
          <div
            className="
              aspect-square
              flex
              items-center
              justify-center
              p-6
              bg-white
            "
          >
            <img
              src={product?.thumbnail || '/placeholder-product.png'}
              alt={`${product?.brand} ${product?.model}`}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
              className="
                max-h-full
                object-contain
                transition-transform
                duration-500
                group-hover:scale-105
              "
            />
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <p
              className="
                text-[11px]
                uppercase
                tracking-[0.2em]
                text-neutral-500
                mb-1
              "
            >
              {product?.brand}
            </p>

            <h3
              className="
                text-base
                sm:text-xl
                md:text-lg
                font-medium
                text-neutral-900
                leading-tight
              "
            >
              {product?.model}
            </h3>

            {storage && (
              <div className="mt-2">
                <span
                  className="
                    inline-flex
                    items-center
                    rounded-full
                    bg-neutral-100
                    px-3
                    py-1.5
                    text-sm
                    font-medium
                    text-neutral-700
                  "
                >
                  {storage[0]}
                </span>
              </div>
            )}

            <div className="mt-2">
              <p
                className="
                  text-lg
                  2xl:text-2xl
                  font-semibold
                  text-neutral-900
                "
              >
                GHS {storage?.[1]?.toLocaleString()}
              </p>

              {storage?.[2]?  (
                <p
                  className="
                    mt-1
                    text-sm
                    text-neutral-400
                    line-through
                  "
                >
                  GHS {storage[2].toLocaleString()}
                </p>
              ):(
                <p
                  className="
                    mt-2
                    text-sm
                    text-neutral-400
                    line-through
                    py-2
                  "
                >
                    
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!storage || storage[0] === 'N/A'}
                className={`
                  flex-1
                  h-11
                  rounded-full
                  font-medium
                  text-sm
                  transition
                  flex
                  items-center
                  justify-center
                  gap-2
                  ${
                    isClicked
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-[#2962FF] text-white hover:opacity-90'
                  }
                `}
              >
                {isClicked ? (
                  <>
                    <BsCartCheckFill />
                    Added
                  </>
                ) : (
                  <>
                    <BsCartPlusFill />
                    Add to Cart
                  </>
                )}
              </button>
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
        />
      )}
    </>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  updateCart: PropTypes.func,
  cartFromlist: PropTypes.array,
  featuredphones: PropTypes.array,
};

ProductCard.defaultProps = {
  updateCart: null,
  cartFromlist: [],
  featuredphones: [],
};

export default memo(ProductCard);