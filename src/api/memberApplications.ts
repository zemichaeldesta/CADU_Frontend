import apiClient from './client';

export interface MemberApplication {
  id: number;
  fullname: string;
  birthdate: string | null;
  gender: string;
  citizenship: string;
  country: string;
  region: string;
  town: string;
  district: string;
  phone: string;
  email: string;
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
  photo_consent?: boolean;
  profile_picture: string | null;
  profile_picture_url: string | null;
  receipt_photo: string | null;
  receipt_photo_url: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  notes: string;
}

export interface MemberApplicationCreate {
  fullname: string;
  birthdate?: string;
  gender?: string;
  citizenship?: string;
  country?: string;
  region?: string;
  town?: string;
  district?: string;
  phone?: string;
  email?: string;
  spouse?: string;
  spousePhone?: string;
  study?: string;
  workFrom?: string;
  workTo?: string;
  registration_fee_amount?: number | string | null;
  monthly_fee_amount?: number | string | null;
  voluntaryBirr?: string;
  voluntaryUSD?: string;
  profilePicture?: File;
  receiptPhoto?: File;
}

export const memberApplicationsAPI = {
  // Public endpoint - submit registration form
  submitApplication: async (formData: FormData): Promise<MemberApplication> => {
    const response = await apiClient.post('/member-applications/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Admin endpoints
  getApplications: async (params?: any): Promise<MemberApplication[]> => {
    const response = await apiClient.get('/admin/member-applications/', { params });
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  getApplication: async (id: number): Promise<MemberApplication> => {
    const response = await apiClient.get(`/admin/member-applications/${id}/`);
    return response.data;
  },

  acceptApplication: async (id: number, memberType: 'executive' | 'regular' | 'general_assembly' | 'honorary'): Promise<any> => {
    const response = await apiClient.post(`/admin/member-applications/${id}/accept/`, {
      member_type: memberType,
    });
    return response.data;
  },

  rejectApplication: async (id: number, notes?: string): Promise<MemberApplication> => {
    const response = await apiClient.post(`/admin/member-applications/${id}/reject/`, {
      notes: notes || '',
    });
    return response.data;
  },
};

