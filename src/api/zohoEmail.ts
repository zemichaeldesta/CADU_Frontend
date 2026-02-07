import apiClient from './client';

export interface ZohoEmailConfig {
  host: string;
  port: number;
  user: string;
  use_tls: boolean;
  use_ssl: boolean;
  configured: boolean;
}

export interface ZohoEmailConfigUpdate {
  host: string;
  port: number;
  user: string;
  password: string;
  use_tls?: boolean;
  use_ssl?: boolean;
}

export interface TestEmailRequest {
  test_email?: string;
}

export interface TestEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  method?: string;
}

export const zohoEmailAPI = {
  getConfig: async (): Promise<ZohoEmailConfig> => {
    const response = await apiClient.get('/zoho-email/config/');
    return response.data;
  },

  updateConfig: async (config: ZohoEmailConfigUpdate): Promise<{ success?: boolean; message: string; instructions: string[]; note: string; error?: string }> => {
    const response = await apiClient.post('/zoho-email/config/update/', config);
    return response.data;
  },

  testEmail: async (testEmail?: string): Promise<TestEmailResponse> => {
    const response = await apiClient.post('/zoho-email/test/', { test_email: testEmail });
    return response.data;
  },

  sendComposedEmail: async (toEmail: string, subject: string, body: string): Promise<TestEmailResponse> => {
    const response = await apiClient.post('/zoho-email/send/', {
      to_email: toEmail,
      subject: subject,
      body: body,
    });
    return response.data;
  },
};

