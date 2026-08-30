import React, { useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  thumbnail?: string;
  aspectRatio?: string;
  className?: string;
  priority?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  thumbnail,
  aspectRatio,
  className = '',
  priority = false,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoaded(false);
    setRetryKey(prev => prev + 1);
  };

  return (
    <div 
      className={`relative overflow-hidden bg-[#121212] ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Background low-res or shimmer placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover filter blur-lg scale-105 opacity-60"
            />
          ) : (
            <div className="w-8 h-8 rounded-full border border-neutral-700/60 border-t-neutral-400 animate-spin" />
          )}
        </div>
      )}

      {/* Main image */}
      {!hasError ? (
        <img
          key={retryKey}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center border border-neutral-800">
          <Camera className="w-8 h-8 text-neutral-600 mb-2 stroke-[1.2]" />
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium">Photograph Unavailable</span>
          <span className="text-[11px] text-neutral-500 mt-1 max-w-[200px] truncate">{alt}</span>
          <button
            onClick={handleRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-[11px] uppercase tracking-wider text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
