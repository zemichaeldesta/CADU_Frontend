/**
 * usePermissions Hook
 * Manages user permissions and permission checking logic
 */

import { useState, useEffect, useCallback } from 'react';
import { authAPI, UserInfo } from '../api/auth';
import { AdminSection } from '../types/admin.types';

/**
 * Map sections to required permissions
 */
const sectionPermissions: Record<AdminSection, string> = {
  'Pages': 'manage_pages',
  'Templates': 'manage_images',
  'Archives': 'manage_archive',
  'Events': 'manage_events',
  'Messages': 'manage_messages',
  'Gallery': 'manage_gallery',
  'Member Applications': 'manage_member_applications',
  'CADU Members': 'manage_cadu_members',
  'Payments': 'manage_payments',
  'Members Directory': 'view_member_directory',
  'Admins': 'manage_admins',
  'Contact Info': 'manage_contact_info',
  'Logs': 'view_logs',
};

/**
 * Hook for managing user permissions
 * @returns Object with permissions state and helper functions
 */
export const usePermissions = () => {
  const [userPermissions, setUserPermissions] = useState<string[]>(() => {
    // Load from localStorage immediately
    try {
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        const userInfo: UserInfo = JSON.parse(userInfoStr);
        return userInfo.permissions || [];
      }
    } catch (e) {
      console.error('Failed to parse user info from localStorage:', e);
    }
    return [];
  });

  const [loading, setLoading] = useState(true);

  /**
   * Load permissions from API
   */
  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const userInfo = await authAPI.getUserInfo();
      const permissions = userInfo.permissions || [];
      setUserPermissions(permissions);
      // Update localStorage
      localStorage.setItem('user_info', JSON.stringify(userInfo));
    } catch (error) {
      console.error('Failed to load user permissions:', error);
      // Try to get from localStorage as fallback
      try {
        const userInfoStr = localStorage.getItem('user_info');
        if (userInfoStr) {
          const userInfo: UserInfo = JSON.parse(userInfoStr);
          const permissions = userInfo.permissions || [];
          setUserPermissions(permissions);
        }
      } catch (e) {
        console.error('Failed to parse user info from localStorage:', e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if user has permission for a section
   */
  const hasPermission = useCallback(
    (section: AdminSection | string): boolean => {
      if (userPermissions.length === 0) {
        return false; // Deny by default until permissions are loaded
      }
      // If it's a permission code directly, check it
      if (section.startsWith('manage_') || section.startsWith('view_')) {
        return userPermissions.includes(section);
      }
      // Otherwise, look it up in sectionPermissions
      const requiredPermission = sectionPermissions[section as AdminSection];
      return requiredPermission ? userPermissions.includes(requiredPermission) : false;
    },
    [userPermissions]
  );

  /**
   * Get all allowed sections based on permissions
   */
  const getAllowedSections = useCallback((): AdminSection[] => {
    // Regular sections (non-superadmin)
    const regularSections: AdminSection[] = [
      'Pages',
      'Templates',
      'Archives',
      'Events',
      'Messages',
      'Gallery',
      'Member Applications',
      'Payments',
      'Members Directory',
      'Contact Info',
    ];
    
    // Superadmin sections (shown last with red text)
    const superadminSections: AdminSection[] = [
      'CADU Members',
      'Admins',
      'Logs',
    ];
    
    const allSections: AdminSection[] = [...regularSections, ...superadminSections];

    // Use permissions from state if available, otherwise fallback to localStorage
    let permissionsToUse = userPermissions;
    if (permissionsToUse.length === 0) {
      try {
        const userInfoStr = localStorage.getItem('user_info');
        if (userInfoStr) {
          const userInfo: UserInfo = JSON.parse(userInfoStr);
          permissionsToUse = userInfo.permissions || [];
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // If still no permissions, return empty array
    if (permissionsToUse.length === 0) {
      return [];
    }

    // Only return sections user has permission for
    return allSections.filter((section) => permissionsToUse.includes(sectionPermissions[section]));
  }, [userPermissions]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  return {
    userPermissions,
    loading,
    hasPermission,
    getAllowedSections,
    loadPermissions,
  };
};

