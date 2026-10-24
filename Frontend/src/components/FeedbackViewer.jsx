/*import React, { useState, useEffect } from 'react';
import { FaQuoteLeft, FaQuoteRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const feeds = [
    { id: 1, customer_name: "Majid", feedback: "The best phone I've ever owned! Highly recommend Tech Haven." },
    { id: 2, customer_name: "Kukua", feedback: "iTrade never disappoints. Love my new phone!" },
    { id: 3, customer_name: "Felix", feedback: "The best phone I've ever owned! Highly recommend iTrade." },
    { id: 4, customer_name: "Dr Oppong", feedback: "Excellent service and product quality. Will buy again!" },
    { id: 5, customer_name: "Godfred", feedback: "Fast delivery and the phone works perfectly. Very satisfied!" },
    { id: 6, customer_name: "Joseph Addison", feedback: "Great prices for refurbished phones that look brand new!" },
];

const FeedbackViewer = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Auto-rotate testimonials
    useEffect(() => {
        if (!isAutoPlaying) return;
        
        const interval = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev + 1) % feeds.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, feeds.length]);

    const goToNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % feeds.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const goToPrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + feeds.length) % feeds.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    // For mobile horizontal scroll (optional)
    const scrollContainerRef = React.useRef(null);

    return (
        <div className="relative w-full overflow-hidden">
            {/* Desktop Carousel *}
            <div className="hidden md:block">
                <div className="flex justify-center items-center min-h-[250px]">
                    <button 
                        onClick={goToPrev}
                        className="absolute left-2 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all"
                        aria-label="Previous testimonial"
                    >
                        &larr;
                    </button>
                    
                    <div className="w-full max-w-4xl mx-auto overflow-hidden">
                        <AnimatePresence custom={direction}>
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
                                transition={{ duration: 0.5 }}
                                className="p-6"
                            >
                                <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
                                    <FaQuoteLeft className="text-gray-300 text-2xl mb-2" />
                                    <p className="text-gray-700 italic text-lg text-center px-4">
                                        {feeds[currentIndex].feedback}
                                    </p>
                                    <FaQuoteRight className="text-gray-300 text-2xl mt-2 ml-auto" />
                                    <p className="text-orange-500 font-bold text-center mt-4">
                                        — {feeds[currentIndex].customer_name}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <button 
                        onClick={goToNext}
                        className="absolute right-2 z-10 bg-white bg-opacity-80 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all"
                        aria-label="Next testimonial"
                    >
                        &rarr;
                    </button>
                </div>

                {/* Indicators *}
                <div className="flex justify-center mt-4 space-x-2">
                    {feeds.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setDirection(index > currentIndex ? 1 : -1);
                                setCurrentIndex(index);
                                setIsAutoPlaying(false);
                                setTimeout(() => setIsAutoPlaying(true), 10000);
                            }}
                            className={`w-3 h-3 rounded-full ${index === currentIndex ? 'bg-orange-500' : 'bg-gray-300'}`}
                            aria-label={`Go to testimonial ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Mobile Horizontal Scroll *}
            <div className="md:hidden px-4 py-6">
                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto scroll-snap-x-mandatory scrollbar-hide space-x-4 py-2"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {feeds.map((feedback) => (
                        <div 
                            key={feedback.id}
                            className="flex-shrink-0 w-64 scroll-snap-align-start bg-white rounded-lg shadow-md p-4"
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            <FaQuoteLeft className="text-gray-300 text-xl mb-1" />
                            <p className="text-gray-700 text-sm italic">
                                {feedback.feedback}
                            </p>
                            <FaQuoteRight className="text-gray-300 text-xl mt-1 ml-auto" />
                            <p className="text-orange-500 font-bold text-sm text-center mt-3">
                                — {feedback.customer_name}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeedbackViewer;
*/

const testimonials = [
  {
    name: "Majid",
    feedback: "The phone arrived exactly as described. Fast delivery and excellent condition."
  },
  {
    name: "Kukua",
    feedback: "Smooth experience from ordering to delivery. I'll definitely buy again."
  },
  {
    name: "Felix",
    feedback: "Original device, great battery life, and excellent customer service."
  }
];

const FeedbackViewer = () => {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {testimonials.map((item) => (
        <div
          key={item.name}
          className="rounded-3xl border border-zinc-200 bg-white p-8"
        >
          <p className="text-lg leading-relaxed text-zinc-700">
            "{item.feedback}"
          </p>

          <div className="mt-6">
            <p className="font-semibold text-zinc-900">
              {item.name}
            </p>
            <p className="text-sm text-zinc-500">
              Verified Customer
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeedbackViewer;