import apiClient from './client';

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  read_by: number | null;
  read_by_name: string | null;
  replies: MessageReply[];
  created_at: string;
  updated_at: string;
}

export interface MessageReply {
  id: number;
  message: number;
  replied_by: number | null;
  replied_by_name: string | null;
  replied_by_email: string | null;
  reply_content: string;
  email_sent: boolean;
  email_sent_at: string | null;
  email_error: string | null;
  created_at: string;
}

export interface ContactMessageCreate {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface MessageReplyCreate {
  message: number;
  reply_content: string;
}

export const messagesAPI = {
  // Public endpoint - submit contact form
  submitContact: async (data: ContactMessageCreate): Promise<ContactMessage> => {
    const response = await apiClient.post('/contact/', data);
    return response.data;
  },

  // Admin endpoints
  getMessages: async (params?: any): Promise<{ results: ContactMessage[]; count: number }> => {
    const response = await apiClient.get('/admin/messages/', { params });
    return response.data;
  },

  getMessage: async (id: number): Promise<ContactMessage> => {
    const response = await apiClient.get(`/admin/messages/${id}/`);
    return response.data;
  },

  markAsRead: async (id: number): Promise<ContactMessage> => {
    const response = await apiClient.patch(`/admin/messages/${id}/mark_read/`);
    return response.data;
  },

  markAsUnread: async (id: number): Promise<ContactMessage> => {
    const response = await apiClient.patch(`/admin/messages/${id}/mark_unread/`);
    return response.data;
  },

  deleteMessage: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/messages/${id}/`);
  },

  createReply: async (messageId: number, replyContent: string): Promise<MessageReply> => {
    const response = await apiClient.post('/admin/message-replies/', {
      message: messageId,
      reply_content: replyContent,
    });
    return response.data;
  },

  getReplies: async (messageId: number): Promise<MessageReply[]> => {
    const response = await apiClient.get('/admin/message-replies/', {
      params: { message_id: messageId },
    });
    return response.data.results || response.data || [];
  },

  // Gmail API endpoints
  gmailAuthenticate: async (): Promise<{ authorization_url: string; message: string }> => {
    const response = await apiClient.get('/gmail/authenticate');
    return response.data;
  },

  gmailStatus: async (): Promise<{ authenticated: boolean; message: string }> => {
    const response = await apiClient.get('/gmail/status');
    return response.data;
  },

  syncGmail: async (): Promise<{ message: string; synced_count: number }> => {
    const response = await apiClient.post('/gmail/sync');
    return response.data;
  },
};

