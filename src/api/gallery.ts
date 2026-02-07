import apiClient from './client';

export interface GalleryTag {
  id: number;
  name: string;
}

export interface GalleryPhoto {
  id: number;
  title: string;
  photo: string;
  photo_url: string;
  alt_text: string;
  caption: string;
  description: string;
  is_published: boolean;
  tags: number[];
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_at: string;
  updated_at: string;
}

export interface GalleryVideo {
  id: number;
  title: string;
  video_url: string | null;
  video_file: string | null;
  video_file_url: string | null;
  thumbnail: string | null;
  thumbnail_url: string | null;
  description: string;
  is_published: boolean;
  tags: number[];
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_at: string;
  updated_at: string;
}

export interface GalleryPhotoCreate {
  title: string;
  photo: File;
  alt_text?: string;
  caption?: string;
  description?: string;
  is_published?: boolean;
  tags?: number[];
}

export interface GalleryVideoCreate {
  title: string;
  video_url?: string;
  video_file?: File;
  thumbnail?: File;
  description?: string;
  is_published?: boolean;
  tags?: number[];
}

export const galleryAPI = {
  // Public endpoints
  getPhotos: async (params?: any): Promise<{ results: GalleryPhoto[]; count: number }> => {
    const response = await apiClient.get('/gallery/photos/', { params });
    return response.data;
  },

  getPhoto: async (id: number): Promise<GalleryPhoto> => {
    const response = await apiClient.get(`/gallery/photos/${id}/`);
    return response.data;
  },

  getVideos: async (params?: any): Promise<{ results: GalleryVideo[]; count: number }> => {
    const response = await apiClient.get('/gallery/videos/', { params });
    return response.data;
  },

  getVideo: async (id: number): Promise<GalleryVideo> => {
    const response = await apiClient.get(`/gallery/videos/${id}/`);
    return response.data;
  },

  // Admin endpoints
  getAdminPhotos: async (params?: any): Promise<GalleryPhoto[] | { results: GalleryPhoto[]; count: number }> => {
    const response = await apiClient.get('/admin/gallery/photos/', { params });
    return response.data;
  },

  getAdminPhoto: async (id: number): Promise<GalleryPhoto> => {
    const response = await apiClient.get(`/admin/gallery/photos/${id}/`);
    return response.data;
  },

  createPhoto: async (
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<GalleryPhoto> => {
    const response = await apiClient.post('/admin/gallery/photos/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  },

  updatePhoto: async (
    id: number,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<GalleryPhoto> => {
    const response = await apiClient.patch(`/admin/gallery/photos/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  },

  deletePhoto: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/gallery/photos/${id}/`);
  },

  getAdminVideos: async (params?: any): Promise<GalleryVideo[] | { results: GalleryVideo[]; count: number }> => {
    const response = await apiClient.get('/admin/gallery/videos/', { params });
    return response.data;
  },

  getAdminVideo: async (id: number): Promise<GalleryVideo> => {
    const response = await apiClient.get(`/admin/gallery/videos/${id}/`);
    return response.data;
  },

  createVideo: async (
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<GalleryVideo> => {
    const response = await apiClient.post('/admin/gallery/videos/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  },

  updateVideo: async (
    id: number,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<GalleryVideo> => {
    const response = await apiClient.patch(`/admin/gallery/videos/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  },

  deleteVideo: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/gallery/videos/${id}/`);
  },

  // Photo Tags
  getPhotoTags: async (): Promise<{ results: GalleryTag[] }> => {
    const response = await apiClient.get('/gallery/photo-tags/');
    return response.data;
  },

  // Video Tags
  getVideoTags: async (): Promise<{ results: GalleryTag[] }> => {
    const response = await apiClient.get('/gallery/video-tags/');
    return response.data;
  },

  // Admin Photo Tags
  createPhotoTag: async (name: string): Promise<GalleryTag> => {
    const response = await apiClient.post('/admin/gallery/photo-tags/', { name });
    return response.data;
  },

  updatePhotoTag: async (id: number, name: string): Promise<GalleryTag> => {
    const response = await apiClient.put(`/admin/gallery/photo-tags/${id}/`, { name });
    return response.data;
  },

  deletePhotoTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/gallery/photo-tags/${id}/`);
  },

  // Admin Video Tags
  createVideoTag: async (name: string): Promise<GalleryTag> => {
    const response = await apiClient.post('/admin/gallery/video-tags/', { name });
    return response.data;
  },

  updateVideoTag: async (id: number, name: string): Promise<GalleryTag> => {
    const response = await apiClient.put(`/admin/gallery/video-tags/${id}/`, { name });
    return response.data;
  },

  deleteVideoTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/gallery/video-tags/${id}/`);
  },
};

