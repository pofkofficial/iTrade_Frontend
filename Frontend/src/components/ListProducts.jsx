import { memo, useMemo } from 'react';
import ProductCard from '@components/ProductCard';
import ErrorBoundary from '@components/ErrorBoundary';
import PropTypes from 'prop-types';

const ListProducts = ({ phone, updateCart, cartFromShop }) => {
  const phones = useMemo(
    () => (Array.isArray(phone) ? phone : []),
    [phone]
  );

  const cart = useMemo(
    () => (Array.isArray(cartFromShop) ? cartFromShop : []),
    [cartFromShop]
  );

  if (!phones.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-500 text-lg">
          No devices available at the moment.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <div
          className="
            flex
            gap-4
            overflow-x-auto
            pb-4
            snap-x
            snap-mandatory
            hide-scrollbar
          "
        >
          {phones.map((phone) => (
            <div
              key={phone.id}
              className="
                snap-start
                shrink-0
                w-[78%]
              "
            >
              <ErrorBoundary>
                <ProductCard
                  product={phone}
                  updateCart={updateCart}
                  cartFromlist={cart}
                  featuredphones={phones}
                />
              </ErrorBoundary>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div
        className="
          hidden
          md:grid
          grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
          2xl:grid-cols-5
          gap-6
        "
      >
        {phones.map((phone) => (
          <ErrorBoundary key={phone.id}>
            <ProductCard
              product={phone}
              updateCart={updateCart}
              cartFromlist={cart}
              featuredphones={phones}
            />
          </ErrorBoundary>
        ))}
      </div>
    </>
  );
};

ListProducts.propTypes = {
  phone: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
      ]).isRequired,
    })
  ),
  updateCart: PropTypes.func,
  cartFromShop: PropTypes.array,
};

ListProducts.defaultProps = {
  phone: [],
  updateCart: null,
  cartFromShop: [],
};

export default memo(ListProducts);