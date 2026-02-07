import apiClient from './client';

export interface MonthlyPayment {
  id: number;
  member: number;
  member_name?: string;
  payment_type?: 'monthly' | 'annual';
  payment_date: string;
  payment_month: string;
  payment_year?: string;
  amount: string;
  currency?: string; // Optional: may not be returned by backend yet
  payment_method?: string;
  receipt_image?: string;
  receipt_image_url?: string;
  submitted_at: string;
  is_verified: boolean;
  verified_by?: number;
  verified_by_name?: string;
  verified_at?: string;
  notes?: string;
  payment_status?: string;
}

export interface PaymentSubmission {
  payment_date: string;
  payment_month: string;
  amount: number;
  receipt_image: File;
  notes?: string;
}

export const paymentsAPI = {
  // Submit a new payment (member only)
  submitPayment: async (formData: FormData): Promise<MonthlyPayment> => {
    const response = await apiClient.post('/payments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get all payments for the logged-in member
  getMyPayments: async (): Promise<MonthlyPayment[]> => {
    const response = await apiClient.get('/payments/');
    // Handle both paginated and non-paginated responses
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    // If paginated response, return results array
    if (data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  },

  // Get a single payment by ID
  getPayment: async (id: number): Promise<MonthlyPayment> => {
    const response = await apiClient.get(`/payments/${id}/`);
    return response.data;
  },

  // Admin: Get all payments for a specific member
  getMemberPayments: async (memberId: number): Promise<MonthlyPayment[]> => {
    const response = await apiClient.get(`/payments/list_payments/?member_id=${memberId}`);
    // Handle both paginated and non-paginated responses
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    // If paginated response, return results array
    if (data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  },

  // Admin: Get all payments (no member filter)
  getAllPayments: async (): Promise<MonthlyPayment[]> => {
    const response = await apiClient.get('/payments/');
    // Handle both paginated and non-paginated responses
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    // If paginated response, return results array
    if (data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  },

  // Admin: Verify/unverify a payment
  verifyPayment: async (paymentId: number, verify: boolean = true): Promise<void> => {
    await apiClient.post(`/payments/${paymentId}/verify_payment/`, { verify });
  },

  // Admin: Download payment PDF
  downloadPaymentPDF: async (paymentId?: number, memberId?: number): Promise<Blob> => {
    let url = '/payments/download_payment_pdf/?';
    if (paymentId) {
      url += `payment_id=${paymentId}`;
    } else if (memberId) {
      url += `member_id=${memberId}`;
    } else {
      throw new Error('Either paymentId or memberId must be provided');
    }
    
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Admin: Delete a payment
  deletePayment: async (paymentId: number): Promise<void> => {
    await apiClient.delete(`/payments/${paymentId}/`);
  },

  // Admin: Create a payment for a member
  createPaymentForMember: async (memberId: number, formData: FormData): Promise<MonthlyPayment> => {
    formData.append('member', memberId.toString());
    const response = await apiClient.post('/payments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Admin: Update a payment
  updatePayment: async (paymentId: number, formData: FormData): Promise<MonthlyPayment> => {
    const response = await apiClient.patch(`/payments/${paymentId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

