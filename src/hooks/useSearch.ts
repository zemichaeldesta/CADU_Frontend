/**
 * useSearch Hook
 * Manages search/filter state and provides filtering logic
 */

import { useState, useMemo, useCallback } from 'react';

/**
 * Hook for managing search and filtering
 * @param data - Array of data to filter
 * @param searchKeys - Keys to search in
 * @returns Object with search state and filtered data
 */
export const useSearch = <T extends Record<string, any>>(
  data: T[],
  searchKeys: (keyof T)[]
) => {
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Filter data based on search query
   */
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchKeys]);

  /**
   * Update search query
   */
  const setSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  /**
   * Clear search query
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery: setSearch,
    clearSearch,
    filteredData,
  };
};

