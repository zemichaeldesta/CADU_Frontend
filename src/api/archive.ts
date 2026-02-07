import apiClient from './client';

export interface ArchiveCategory {
  id: number;
  name_en: string;
  name_am: string;
  description: string;
  parent?: number;
  order?: number;
}

export interface ArchiveTag {
  id: number;
  name: string;
}

export interface ArchiveDocument {
  id: number;
  title_en: string;
  title_am: string;
  description_en: string;
  description_am: string;
  file: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category?: ArchiveCategory;
  category_id?: number;
  tags: ArchiveTag[];
  tag_ids?: number[];
  visibility: 'public' | 'member' | 'general_assembly' | 'executive';
  date?: string;
  author: string;
  download_count: number;
  created_at: string;
}

export interface ArchiveSearchParams {
  search?: string;
  category?: number;
  tags?: number[];
  file_type?: string;
  // Optional visibility filter - used to distinguish public vs member-only docs
  visibility?: 'public' | 'member' | 'general_assembly' | 'executive';
  date_from?: string;
  date_to?: string;
  ordering?: string;
  page?: number;
}

export const archiveAPI = {
  getDocuments: async (params?: ArchiveSearchParams): Promise<{ results: ArchiveDocument[]; count: number }> => {
    const response = await apiClient.get('/archive/', { params });
    return response.data;
  },
  
  getDocument: async (id: number): Promise<ArchiveDocument> => {
    const response = await apiClient.get(`/archive/${id}/`);
    return response.data;
  },
  
  downloadDocument: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/archive/${id}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  getCategories: async (): Promise<{ results: ArchiveCategory[] }> => {
    const response = await apiClient.get('/archive/categories/');
    return response.data;
  },
  
  getTags: async (): Promise<{ results: ArchiveTag[] }> => {
    const response = await apiClient.get('/archive/tags/');
    return response.data;
  },

  // Admin tag endpoints
  createTag: async (name: string): Promise<ArchiveTag> => {
    const response = await apiClient.post('/admin/archive/tags/', { name });
    return response.data;
  },

  updateTag: async (id: number, name: string): Promise<ArchiveTag> => {
    const response = await apiClient.put(`/admin/archive/tags/${id}/`, { name });
    return response.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/archive/tags/${id}/`);
  },
  
  // Admin category endpoints
  getAdminCategories: async (): Promise<ArchiveCategory[]> => {
    const response = await apiClient.get('/admin/archive/categories/');
    // Handle both array and paginated responses
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },
  
  // Member endpoints
  getMemberDocuments: async (params?: ArchiveSearchParams): Promise<{ results: ArchiveDocument[]; count: number }> => {
    const response = await apiClient.get('/members/archive/', { params });
    return response.data;
  },
  
  getPersonalResources: async (params?: Omit<ArchiveSearchParams, 'visibility'>): Promise<{ results: ArchiveDocument[]; count: number }> => {
    const response = await apiClient.get('/members/archive/personal/', { params });
    return response.data;
  },
  
  downloadMemberDocument: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/members/archive/${id}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  // Admin endpoints
  uploadDocument: async (formData: FormData, onUploadProgress?: (progressEvent: any) => void): Promise<ArchiveDocument> => {
    const response = await apiClient.post('/admin/archive/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onUploadProgress,
    });
    return response.data;
  },
  
  updateDocument: async (id: number, data: Partial<ArchiveDocument>): Promise<ArchiveDocument> => {
    const response = await apiClient.patch(`/admin/archive/${id}/`, data);
    return response.data;
  },
  
  deleteDocument: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/archive/${id}/`);
  },
  
  downloadAdminDocument: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/admin/archive/${id}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

