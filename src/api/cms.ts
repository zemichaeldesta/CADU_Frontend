import apiClient from './client';

export interface Page {
  id: number;
  page_type: string;
  title_en: string;
  title_am: string;
  content_en: string;
  content_am: string;
  hero_image?: any;
  sections?: any[];
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface News {
  id: number;
  title_en: string;
  title_am: string;
  slug: string;
  content_en: string;
  content_am: string;
  excerpt_en: string;
  excerpt_am: string;
  featured_image?: any;
  is_published: boolean;
  published_at: string;
  author_name: string;
  created_at: string;
}

export interface Event {
  id: number;
  title_en: string;
  title_am: string;
  description_en: string;
  description_am: string;
  start_date: string;
  end_date?: string;
  location: string;
  event_type: 'regular' | 'member';
  image?: any;
  is_published: boolean;
}

export interface ContactInfo {
  id: number;
  email: string;
  phone: string;
  address_en: string;
  address_am: string;
  description_en: string;
  description_am: string;
  updated_by?: number;
  updated_by_name?: string;
  updated_at: string;
}

export interface Image {
  id: number;
  title: string;
  image: string;
  alt_text: string;
  caption: string;
}

export const cmsAPI = {
  getPage: async (pageType: string): Promise<Page> => {
    const response = await apiClient.get(`/pages/${pageType}/`);
    return response.data;
  },
  
  getNews: async (params?: any): Promise<{ results: News[]; count: number }> => {
    const response = await apiClient.get('/news/', { params });
    return response.data;
  },
  
  getEvent: async (id: number): Promise<Event> => {
    const response = await apiClient.get(`/events/${id}/`);
    return response.data;
  },
  
  getEvents: async (params?: any): Promise<{ results: Event[]; count: number }> => {
    const response = await apiClient.get('/events/', { params });
    return response.data;
  },
  
  // Admin endpoints
  getAdminPages: async (): Promise<{ results: Page[] }> => {
    const response = await apiClient.get('/admin/pages/');
    return response.data;
  },
  
  getAdminPage: async (pageType: string): Promise<Page> => {
    const response = await apiClient.get(`/admin/pages/${pageType}/`);
    return response.data;
  },
  
  createPage: async (data: Partial<Page>): Promise<Page> => {
    const response = await apiClient.post('/admin/pages/', data);
    return response.data;
  },
  
  updatePage: async (pageType: string, data: Partial<Page>): Promise<Page> => {
    // Use PATCH for partial updates instead of PUT
    const response = await apiClient.patch(`/admin/pages/${pageType}/`, data);
    return response.data;
  },
  
  uploadImage: async (formData: FormData): Promise<Image> => {
    const response = await apiClient.post('/admin/images/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  getImages: async (): Promise<{ results: Image[] }> => {
    const response = await apiClient.get('/admin/images/');
    return response.data;
  },
  
  createNews: async (data: Partial<News>): Promise<News> => {
    const response = await apiClient.post('/admin/news/', data);
    return response.data;
  },
  
  updateNews: async (id: number, data: Partial<News>): Promise<News> => {
    const response = await apiClient.put(`/admin/news/${id}/`, data);
    return response.data;
  },
  
  deleteNews: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/news/${id}/`);
  },
  
  // Admin Event endpoints
  getAdminEvents: async (): Promise<{ results: Event[] }> => {
    const response = await apiClient.get('/admin/events/');
    return response.data;
  },
  
  createEvent: async (data: Partial<Event>): Promise<Event> => {
    const response = await apiClient.post('/admin/events/', data);
    return response.data;
  },
  
  updateEvent: async (id: number, data: Partial<Event>): Promise<Event> => {
    const response = await apiClient.put(`/admin/events/${id}/`, data);
    return response.data;
  },
  
  deleteEvent: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/events/${id}/`);
  },
  
  // Contact Info endpoints
  getContactInfo: async (): Promise<ContactInfo> => {
    const response = await apiClient.get('/contact-info');
    return response.data;
  },
  
  getAdminContactInfo: async (): Promise<ContactInfo> => {
    const response = await apiClient.get('/admin/contact-info');
    return response.data;
  },
  
  updateContactInfo: async (data: Partial<ContactInfo>): Promise<ContactInfo> => {
    const response = await apiClient.patch('/admin/contact-info', data);
    return response.data;
  },
};

