/**
 * useNotifications Hook
 * Provides notification counts for Messages and Member Applications
 */

import { useState, useEffect, useCallback } from 'react';
import { messagesAPI, ContactMessage } from '../api/messages';
import { memberApplicationsAPI, MemberApplication } from '../api/memberApplications';

export const useNotifications = () => {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      // Load messages
      const messagesData = await messagesAPI.getMessages();
      const messages = messagesData.results || [];
      const unreadCount = messages.filter((m: ContactMessage) => !m.is_read).length;
      setUnreadMessagesCount(unreadCount);

      // Load applications
      const applications = await memberApplicationsAPI.getApplications();
      const applicationsArray = Array.isArray(applications) ? applications : [];
      const pendingCount = applicationsArray.filter((app: MemberApplication) => app.status === 'pending').length;
      setPendingApplicationsCount(pendingCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Set to 0 on error to avoid showing incorrect counts
      setUnreadMessagesCount(0);
      setPendingApplicationsCount(0);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Auto-refresh notifications every 30 seconds
    const intervalId = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadNotifications]);

  return {
    unreadMessagesCount,
    pendingApplicationsCount,
    refreshNotifications: loadNotifications,
  };
};

