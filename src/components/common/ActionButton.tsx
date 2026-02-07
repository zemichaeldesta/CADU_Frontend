/**
 * ActionButton Component
 * Standardized action button with variants
 */

import React from 'react';
import './ActionButton.css';

interface ActionButtonProps {
  /** Button label */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'edit' | 'delete' | 'accept' | 'small';
  /** Disabled state */
  disabled?: boolean;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Additional CSS classes */
  className?: string;
  /** Optional icon */
  icon?: React.ReactNode;
}

/**
 * ActionButton component for standardized action buttons
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
  icon,
}) => {
  const buttonClass = `action-btn ${variant} ${className}`.trim();

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="action-btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default ActionButton;

