/**
 * LoadingSpinner Component
 * Displays a loading indicator with optional message
 */

import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  /** Optional message to display below the spinner */
  message?: string;
  /** Size of the spinner (small, medium, large) */
  size?: 'small' | 'medium' | 'large';
  /** Full screen overlay mode */
  fullScreen?: boolean;
}

/**
 * LoadingSpinner component for displaying loading states
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'medium',
  fullScreen = false,
}) => {
  const containerClass = fullScreen ? 'loading-spinner-fullscreen' : 'loading-spinner-container';
  
  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${size}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;

