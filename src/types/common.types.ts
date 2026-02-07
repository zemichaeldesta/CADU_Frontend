/**
 * Common TypeScript type definitions used across the application
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  results?: T[];
  count?: number;
  data?: T;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

/**
 * Search and filter parameters
 */
export interface SearchParams {
  search?: string;
  ordering?: string;
}

/**
 * Status types for various entities
 */
export type StatusType = 'active' | 'inactive' | 'published' | 'draft' | 'pending' | 'accepted' | 'rejected';

/**
 * Generic entity with ID
 */
export interface BaseEntity {
  id: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Form field error
 */
export interface FormError {
  field: string;
  message: string;
}

/**
 * Modal variant types
 */
export type ModalVariant = 'confirm' | 'form' | 'view' | 'delete';

