import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const SideTag = ({ 
  text = "Featured", 
  textColor = "#ffffff", 
  bgColor = "#ef4444", // red-500
  accentColor = "#dc2626", // red-600
  icon = null,
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 8 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
      className={`relative inline-flex items-center group cursor-default ${className}`}
      role="presentation"
    >
      {/* Main Tag Body */}
      <div
        className="relative px-5 py-2.5 md:py-3 flex items-center gap-2 font-bold text-base md:text-lg tracking-wide shadow-lg"
        style={{ 
          color: textColor,
          background: `linear-gradient(135deg, ${bgColor} 0%, ${accentColor} 100%)`,
          clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)'
        }}
      >
        {icon && <span className="text-xl">{icon}</span>}
        <span className="relative z-10 drop-shadow-sm">{text}</span>
        
        {/* Right Arrow (decorative) */}
        <ChevronRight className="w-5 h-5 ml-1 opacity-80 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Optional Glow Effect */}
      <div
        className="absolute inset-0 blur-xl opacity-30 group-hover:opacity-50 transition-opacity"
        style={{
          background: `radial-gradient(ellipse at right, ${bgColor} 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
};

export default SideTag;