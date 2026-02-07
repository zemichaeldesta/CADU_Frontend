import apiClient from './client';

export interface CADUMember {
  id: number;
  fullname: string;
  organization_name?: string;
  nationality?: string;
  resident_in?: 'ethiopia' | 'abroad' | string;
  birthdate: string | null;
  gender: string;
  citizenship: string;
  country: string;
  region: string;
  town: string;
  district: string;
  phone: string;
  email: string;
  emergency_contact?: string;
  spouse: string;
  spousePhone: string;
  study: string;
  workFrom: string;
  workTo: string;
  registration_fee_amount: number | string | null;
  monthly_fee_amount: number | string | null;
  voluntaryBirr: string;
  voluntaryUSD: string;
  initial_payment_amount?: string | number | null;
  profile_picture: string | null;
  profile_picture_url: string | null;
  receipt_photo: string | null;
  receipt_photo_url: string | null;
  member_type: 'executive' | 'regular' | 'general_assembly' | 'honorary';
  declaration_accepted?: boolean;
  photo_consent?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  created_by_name?: string | null;
}

export interface CADUMemberUpdate {
  fullname?: string;
  organization_name?: string;
  nationality?: string;
  resident_in?: 'ethiopia' | 'abroad' | string;
  birthdate?: string | null;
  gender?: string;
  citizenship?: string;
  country?: string;
  region?: string;
  town?: string;
  district?: string;
  phone?: string;
  email?: string;
  emergency_contact?: string;
  spouse?: string;
  spousePhone?: string;
  study?: string;
  workFrom?: string;
  workTo?: string;
  registration_fee_amount?: number | string | null;
  monthly_fee_amount?: number | string | null;
  voluntaryBirr?: string;
  voluntaryUSD?: string;
  initial_payment_amount?: number | string | null;
  member_type?: 'executive' | 'regular' | 'general_assembly' | 'honorary';
  declaration_accepted?: boolean;
  photo_consent?: boolean;
}

export const caduMembersAPI = {
  // Public endpoint - get all CADU members
  getCADUMembers: async (): Promise<CADUMember[]> => {
    const response = await apiClient.get('/cadu-members/');
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  // Public endpoint - get single CADU member
  getCADUMember: async (id: number): Promise<CADUMember> => {
    const response = await apiClient.get(`/cadu-members/${id}/`);
    return response.data;
  },

  // Admin endpoints
  getAdminCADUMembers: async (params?: any): Promise<CADUMember[]> => {
    const response = await apiClient.get('/admin/cadu-members/', { params });
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  getAdminCADUMember: async (id: number): Promise<CADUMember> => {
    const response = await apiClient.get(`/admin/cadu-members/${id}/`);
    return response.data;
  },

  updateCADUMember: async (id: number, data: CADUMemberUpdate): Promise<CADUMember> => {
    const response = await apiClient.patch(`/admin/cadu-members/${id}/`, data);
    return response.data;
  },

  updateCADUMemberWithFile: async (id: number, formData: FormData): Promise<CADUMember> => {
    const response = await apiClient.patch(`/admin/cadu-members/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteCADUMember: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/cadu-members/${id}/`);
  },

  downloadPDF: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/admin/cadu-members/${id}/download-pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

