import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

/**
 * Component that loads images with authentication headers
 * Converts the image to a blob URL so it can be displayed in an img tag
 */
const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  src,
  alt,
  style,
  className,
  onError,
  onLoad,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Clean up previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (!src) {
      setLoading(false);
      setError('No image URL provided');
      return;
    }

    setLoading(true);
    setError(null);

    // Extract the path from absolute URL if needed
    let imagePath = src;
    
    if (src.startsWith('http')) {
      // For absolute URLs, extract path and remove /api prefix if present
      // since apiClient will add it back
      try {
        const url = new URL(src);
        imagePath = url.pathname + url.search;
        // Remove /api prefix if present (apiClient will add it)
        if (imagePath.startsWith('/api/')) {
          imagePath = imagePath.substring(4); // Remove '/api' (4 chars)
        }
      } catch (e) {
        console.error('Invalid URL:', src);
        setError('Invalid image URL');
        setLoading(false);
        return;
      }
    }

    // Fetch image with authentication using apiClient
    apiClient
      .get(imagePath, {
        responseType: 'blob',
      })
      .then((response) => {
        const blob = response.data;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load authenticated image:', src, err);
        setError(err.response?.status === 401 ? 'Authentication required' : 'Failed to load image');
        setLoading(false);
        if (onError) {
          onError(err);
        }
      });

    // Cleanup function
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [src, onError]);

  if (loading) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</span>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: '1rem' }}>
        <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error || 'Failed to load image'}</span>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      style={style}
      className={className}
      onLoad={onLoad}
      onError={() => {
        setError('Failed to display image');
        if (onError) {
          onError(new Error('Image display error'));
        }
      }}
    />
  );
};

export default AuthenticatedImage;

