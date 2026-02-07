/**
 * Centralized error handling utilities
 * Extracts and formats error messages from API responses
 */

/**
 * Extracts a user-friendly error message from an API error response
 * @param error - The error object from axios or fetch
 * @param defaultMessage - Default message if error cannot be parsed
 * @returns A user-friendly error message string
 */
export const extractErrorMessage = (error: any, defaultMessage: string = 'An error occurred'): string => {
  // Handle axios errors
  if (error?.response) {
    const { data, status } = error.response;

    // Handle different error response formats
    if (typeof data === 'string') {
      return data;
    }

    if (data?.detail) {
      return data.detail;
    }

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    // Handle validation errors (field-specific errors)
    if (typeof data === 'object' && !Array.isArray(data)) {
      const errorFields = Object.keys(data);
      if (errorFields.length > 0) {
        const fieldErrors = errorFields.map(field => {
          const fieldError = data[field];
          if (Array.isArray(fieldError)) {
            return `${field}: ${fieldError.join(', ')}`;
          }
          return `${field}: ${fieldError}`;
        });
        return `Validation errors: ${fieldErrors.join('; ')}`;
      }
    }

    // Handle status-specific messages
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (status === 401) {
      return 'Please log in again. Your session may have expired.';
    }
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    if (status === 500) {
      return 'A server error occurred. Please try again later.';
    }
  }

  // Handle network errors
  if (error?.message) {
    return error.message;
  }

  // Handle blob errors (e.g., PDF download errors)
  if (error instanceof Blob) {
    return 'Failed to process the response.';
  }

  return defaultMessage;
};

/**
 * Extracts detailed error information for debugging
 * @param error - The error object
 * @returns Detailed error information object
 */
export const extractErrorDetails = (error: any) => {
  return {
    message: extractErrorMessage(error),
    status: error?.response?.status,
    data: error?.response?.data,
    originalError: error,
  };
};

