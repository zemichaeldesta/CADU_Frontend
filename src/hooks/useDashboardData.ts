/**
 * useDashboardData Hook
 * Manages dashboard data loading for all sections
 */

import { useState, useEffect, useCallback } from 'react';
import { cmsAPI, Page, Image, Event } from '../api/cms';
import { ArchiveDocument } from '../api/archive';
import { messagesAPI, ContactMessage } from '../api/messages';
import { caduMembersAPI, CADUMember } from '../api/caduMembers';
import { memberApplicationsAPI, MemberApplication } from '../api/memberApplications';
import apiClient from '../api/client';
import { extractResponseData } from '../utils/apiHelpers';
import { MemberProfile, StorageInfo } from '../types/admin.types';

/**
 * Hook for managing dashboard data loading
 * @returns Object with data state and loading functions
 */
export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [archive, setArchive] = useState<ArchiveDocument[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [caduMembers, setCADUMembers] = useState<CADUMember[]>([]);
  const [applications, setApplications] = useState<MemberApplication[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  /**
   * Load pages
   */
  const loadPages = useCallback(async () => {
    try {
      const data = await cmsAPI.getAdminPages();
      setPages(data.results || []);
    } catch (error: any) {
      console.error('Failed to load pages:', error);
    }
  }, []);

  /**
   * Load images
   */
  const loadImages = useCallback(async () => {
    try {
      const data = await cmsAPI.getImages();
      setImages(data.results || []);
    } catch (error: any) {
      console.error('Failed to load images:', error);
    }
  }, []);

  /**
   * Load archive documents
   */
  const loadArchive = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/archive/');
      const archiveData = extractResponseData<ArchiveDocument>(response.data);
      setArchive(archiveData);
    } catch (error: any) {
      console.error('Failed to load archive:', error);
    }
  }, []);

  /**
   * Load events
   */
  const loadEvents = useCallback(async () => {
    try {
      const data = await cmsAPI.getAdminEvents();
      setEvents(data.results || []);
    } catch (error: any) {
      console.error('Failed to load events:', error);
    }
  }, []);

  /**
   * Load members
   */
  const loadMembers = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/members/');
      const membersData = extractResponseData<MemberProfile>(response.data);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Failed to load members:', error);
      setMembers([]);
    }
  }, []);

  /**
   * Load messages
   */
  const loadMessages = useCallback(async () => {
    try {
      const data = await messagesAPI.getMessages();
      setMessages(data.results || []);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  /**
   * Load CADU members
   */
  const loadCADUMembers = useCallback(async () => {
    try {
      const data = await caduMembersAPI.getAdminCADUMembers();
      setCADUMembers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load CADU members:', error);
      setCADUMembers([]);
    }
  }, []);

  /**
   * Load applications
   */
  const loadApplications = useCallback(async () => {
    try {
      const data = await memberApplicationsAPI.getApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load applications:', error);
      setApplications([]);
    }
  }, []);

  /**
   * Load storage info
   */
  const loadStorageInfo = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/storage');
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Failed to load storage info:', error);
      // Set default values if API fails
      setStorageInfo({
        used: 0,
        used_formatted: '0 B',
        total: 34359738368, // 32 GB default
        total_formatted: '32 GB',
        free: 34359738368,
        free_formatted: '32 GB',
        available: 34359738368,
        available_formatted: '32 GB',
        percentage: 0,
        media_percentage: 0,
      });
    }
  }, []);

  /**
   * Load all data
   */
  const loadAllData = useCallback(async (isAutoRefresh = false) => {
    // Only show loading spinner on initial load, not on auto-refresh
    if (!isAutoRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      await Promise.all([
        loadPages(),
        loadImages(),
        loadArchive(),
        loadEvents(),
        loadMembers(),
        loadMessages(),
        loadCADUMembers(),
        loadApplications(),
        loadStorageInfo(),
      ]);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    loadPages,
    loadImages,
    loadArchive,
    loadEvents,
    loadMembers,
    loadMessages,
    loadCADUMembers,
    loadApplications,
    loadStorageInfo,
  ]);

  useEffect(() => {
    loadAllData(false); // Initial load
  }, [loadAllData]);

  /**
   * Auto-refresh data at intervals
   * Pauses when tab is not visible to save resources
   * Uses shorter interval for more real-time updates
   */
  useEffect(() => {
    const REFRESH_INTERVAL = 10000; // 10 seconds for more real-time updates
    let intervalId: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause auto-refresh when tab is hidden
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        // Resume auto-refresh when tab becomes visible
        if (!intervalId) {
          // Refresh immediately when tab becomes visible
          loadAllData(true);
          // Then set up interval
          intervalId = setInterval(() => {
            loadAllData(true);
          }, REFRESH_INTERVAL);
        }
      }
    };

    // Set up auto-refresh
    intervalId = setInterval(() => {
      loadAllData(true);
    }, REFRESH_INTERVAL);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also refresh when window regains focus
    const handleFocus = () => {
      if (!document.hidden && !intervalId) {
        loadAllData(true);
        intervalId = setInterval(() => {
          loadAllData(true);
        }, REFRESH_INTERVAL);
      }
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadAllData]);

  return {
    loading,
    refreshing,
    lastRefresh,
    pages,
    images,
    archive,
    events,
    members,
    messages,
    caduMembers,
    applications,
    storageInfo,
    loadPages,
    loadImages,
    loadArchive,
    loadEvents,
    loadMembers,
    loadMessages,
    loadCADUMembers,
    loadApplications,
    loadStorageInfo,
    loadAllData,
  };
};

