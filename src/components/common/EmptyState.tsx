/**
 * EmptyState Component
 * Displays a message when there's no data to show
 */

import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  /** Message to display */
  message?: string;
  /** Optional description text */
  description?: string;
  /** Optional icon or image */
  icon?: React.ReactNode;
  /** Optional action button */
  action?: React.ReactNode;
}

/**
 * EmptyState component for displaying empty data states
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No items found',
  description,
  icon,
  action,
}) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-message">{message}</p>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;

