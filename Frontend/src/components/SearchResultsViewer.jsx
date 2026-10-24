import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import ProductCard from './ProductCard';

const SearchResultsViewer = ({ data = [], cartUpdate, searchTerm = '' }) => {
  const hasResults = data.length > 0;

  return (
    <div className="w-full">
      {/* === HEADER === */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          {hasResults ? 'Search Results' : 'No Products Found'}
        </h2>
        <p className="text-lg text-gray-600 mt-2">
          {hasResults ? (
            <>
              Found <span className="font-bold text-orange-600">{data.length}</span>{' '}
              {data.length === 1 ? 'product' : 'products'}
              {searchTerm && (
                <> for "<span className="text-orange-600 font-medium">{searchTerm}</span>"</>
              )}
            </>
          ) : (
            'Try adjusting your search or filters'
          )}
        </p>
      </motion.div>

      {/* === RESULTS GRID === */}
      {hasResults ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="
            grid
            w-full
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-5
            2xl:grid-cols-6
            gap-4
            sm:gap-5
            lg:gap-6
            2xl:gap-8
            px-2
            sm:px-4
            lg:px-6
          "
        >
          <AnimatePresence mode="popLayout">
            {data.map((phone, index) => (
              <motion.div
                key={phone.id}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -16 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.03,
                  type: "spring",
                  stiffness: 280,
                  damping: 24,
                }}
                className="min-w-0 w-full"
              >
                <ProductCard
                  product={phone}
                  updateCart={cartUpdate}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* === EMPTY STATE === */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-20"
        >
          <div className="max-w-md mx-auto">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <Search className="w-16 h-16 text-orange-500" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-dashed border-orange-300 rounded-full opacity-30"
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              No matching products
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We couldn't find any phones matching your search.
              <br />
              <span className="text-orange-600 font-medium">
                Try different keywords or clear filters
              </span>
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition transform hover:scale-105 shadow-lg"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => document.querySelector('input[type="text"]')?.focus()}
                className="px-6 py-3 border-2 border-orange-500 text-orange-600 font-medium rounded-xl hover:bg-orange-50 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SearchResultsViewer;