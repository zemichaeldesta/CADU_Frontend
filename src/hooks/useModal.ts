/**
 * useModal Hook
 * Manages modal state (open/close) and provides helper functions
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing modal state
 * @param initialOpen - Initial open state (default: false)
 * @returns Object with modal state and control functions
 */
export const useModal = (initialOpen: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

