import { useState, useEffect } from 'react';

const OptimizedImage = ({ src, alt, className, ...props }) => {
  const [imageSrc, setImageSrc] = useState('/placeholder-product.png');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setLoading(false);
    };
    img.onerror = () => {
      setImageSrc('/placeholder-product.png');
      setLoading(false);
    };
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${loading ? 'opacity-50' : 'opacity-100'} transition-opacity`}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};

export default OptimizedImage;