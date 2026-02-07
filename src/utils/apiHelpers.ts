/**
 * Common API response parsing utilities
 * Handles different response formats from the backend
 */

/**
 * Extracts data from API response, handling both paginated and direct array responses
 * @param response - The API response data
 * @returns Array of items from the response
 */
export const extractResponseData = <T>(response: any): T[] => {
  if (Array.isArray(response)) {
    return response;
  }
  
  if (response?.results && Array.isArray(response.results)) {
    return response.results;
  }
  
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  return [];
};

/**
 * Extracts a single item from API response
 * @param response - The API response data
 * @returns The item or null if not found
 */
export const extractResponseItem = <T>(response: any): T | null => {
  if (response?.data) {
    return response.data;
  }
  
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    return response as T;
  }
  
  return null;
};

/**
 * Handles paginated API response
 * @param response - The API response data
 * @returns Object with results array and count
 */
export const extractPaginatedResponse = <T>(response: any): { results: T[]; count: number } => {
  if (Array.isArray(response)) {
    return {
      results: response,
      count: response.length,
    };
  }
  
  return {
    results: response?.results || response?.data || [],
    count: response?.count || 0,
  };
};

/**
 * Checks if a response is a paginated response
 * @param response - The API response data
 * @returns True if response has pagination structure
 */
export const isPaginatedResponse = (response: any): boolean => {
  return (
    response &&
    typeof response === 'object' &&
    !Array.isArray(response) &&
    ('results' in response || 'count' in response)
  );
};

