import React from 'react';

interface BrandLogoProps {
  variant?: 'white' | 'dark' | 'black' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'hero' | 'footer';
  className?: string;
  priority?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'white',
  size = 'md',
  className = '',
  priority = false
}) => {
  // Height classes by size
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-7 sm:h-8';
      case 'md':
        return 'h-9 sm:h-11';
      case 'lg':
        return 'h-14 sm:h-16';
      case 'hero':
        return 'h-16 sm:h-24 md:h-32';
      case 'footer':
        return 'h-14 sm:h-20 md:h-24';
      default:
        return 'h-10';
    }
  };

  // Image source and styling based on theme/contrast
  const isWhite = variant === 'white' || variant === 'dark';
  // Use the transparent white logo on dark backgrounds, or transparent black / IMG_2162.jpeg on light backgrounds
  const imgSrc = isWhite ? '/logo-transparent-white.png' : '/logo-transparent-black.png';

  return (
    <div
      id="brand-logo"
      className={`inline-flex items-center justify-center select-none ${className}`}
    >
      <img
        src={imgSrc}
        alt="NINETIES SHOTS"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        className={`${getSizeClass()} w-auto object-contain transition-opacity duration-300`}
        onError={(e) => {
          // Direct fallback to IMG_2162.jpeg without any color inversion
          const target = e.currentTarget;
          if (target.src !== window.location.origin + '/IMG_2162.jpeg') {
            target.src = '/IMG_2162.jpeg';
          }
        }}
      />
    </div>
  );
};
