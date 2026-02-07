/**
 * StatusBadge Component
 * Displays a status indicator badge with different variants
 */

import React from 'react';
import './StatusBadge.css';
import { StatusType } from '../../types';

interface StatusBadgeProps {
  /** Status type to display */
  status: StatusType | string;
  /** Custom label (overrides default status label) */
  label?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
}

/**
 * StatusBadge component for displaying status indicators
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'medium',
}) => {
  // Map status to CSS class
  const getStatusClass = (status: string): string => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'active' || statusLower === 'published' || statusLower === 'accepted') {
      return 'published';
    }
    if (statusLower === 'inactive' || statusLower === 'draft' || statusLower === 'rejected') {
      return 'draft';
    }
    if (statusLower === 'pending') {
      return 'pending';
    }
    
    return 'default';
  };

  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  const statusClass = getStatusClass(status);

  return (
    <span className={`status-badge ${statusClass} ${size}`}>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;

