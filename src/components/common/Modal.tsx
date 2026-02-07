/**
 * Modal Component
 * Reusable modal component with variants (confirm, form, view, delete)
 */

import React, { useEffect } from 'react';
import './Modal.css';
import { ModalVariant } from '../../types';
import ActionButton from './ActionButton';

interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Modal variant */
  variant?: ModalVariant;
  /** Confirm button label (for confirm/delete variants) */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Confirm button handler */
  onConfirm?: () => void;
  /** Show cancel button */
  showCancel?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Maximum width */
  maxWidth?: string;
}

/**
 * Modal component for displaying dialogs and forms
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  variant = 'form',
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  showCancel = true,
  loading = false,
  className = '',
  maxWidth = '500px',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getConfirmVariant = (): 'primary' | 'delete' | 'accept' => {
    if (variant === 'delete') return 'delete';
    if (variant === 'confirm') return 'accept';
    return 'primary';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${variant} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {(variant === 'confirm' || variant === 'delete' || onConfirm) && (
          <div className="modal-footer">
            {showCancel && (
              <ActionButton variant="secondary" onClick={onClose} disabled={loading}>
                {cancelLabel}
              </ActionButton>
            )}
            {onConfirm && (
              <ActionButton
                variant={getConfirmVariant()}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? 'Loading...' : confirmLabel || 'Confirm'}
              </ActionButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

