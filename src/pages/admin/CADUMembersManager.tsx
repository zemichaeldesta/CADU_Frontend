import React, { useState, useEffect } from 'react';
import { caduMembersAPI, CADUMember } from '../../api/caduMembers';
import { paymentsAPI, MonthlyPayment } from '../../api/payments';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import { EditMemberModal } from '../../components/admin/ApplicationModals';
import '../../components/AdminLayout.css';

const CADUMembersManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [caduMembers, setCADUMembers] = useState<CADUMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<CADUMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [memberPayments, setMemberPayments] = useState<MonthlyPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<number, string>>({});
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<MonthlyPayment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_type: 'monthly' as 'monthly' | 'annual',
    payment_date: new Date().toISOString().split('T')[0],
    payment_month: new Date().toISOString().slice(0, 7),
    payment_year: new Date().getFullYear().toString(),
    amount: 50,
    payment_method: 'bank_transfer',
    receipt_image: null as File | null,
    notes: '',
  });
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    loadCADUMembers();
  }, []);

  const loadCADUMembers = async () => {
    try {
      setLoading(true);
      const data = await caduMembersAPI.getAdminCADUMembers();
      setCADUMembers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load CADU members:', error);
      showError('Failed to load members');
      setCADUMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStatuses = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentYear = currentMonth.substring(0, 4);
    const statuses: Record<number, string> = {};
    
    for (const member of caduMembers) {
      // Honorary members don't require payments - always show as paid
      if (member.member_type === 'honorary') {
        statuses[member.id] = 'paid';
        continue;
      }
      
      try {
        const payments = await paymentsAPI.getMemberPayments(member.id);
        
        // Check for monthly payment for current month
        const monthlyPayment = payments.find(p => 
          p.payment_type === 'monthly' && p.payment_month === currentMonth
        );
        
        // Check for annual payment that covers current month
        const annualPayment = payments.find(p => 
          p.payment_type === 'annual' && 
          (p.payment_year === currentYear || p.payment_month?.substring(0, 4) === currentYear)
        );
        
        // Prioritize monthly payment if exists, otherwise check annual
        const payment = monthlyPayment || annualPayment;
        
        if (payment) {
          statuses[member.id] = payment.is_verified ? 'paid' : 'pending';
        } else {
          statuses[member.id] = 'unpaid';
        }
      } catch (error) {
        statuses[member.id] = 'unpaid';
      }
    }
    setPaymentStatuses(statuses);
  };

  useEffect(() => {
    if (caduMembers.length > 0) {
      loadPaymentStatuses();
    }
  }, [caduMembers]);

  const filterData = <T extends Record<string, any>>(
    list: T[],
    keys: (keyof T)[]
  ): T[] => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((item) =>
      keys.some((key) => String(item[key] || '').toLowerCase().includes(query))
    );
  };

  const filteredCADUMembers = filterData(caduMembers, ['fullname', 'email', 'phone', 'country']);

  const loadMemberPayments = async (memberId: number) => {
    try {
      setLoadingPayments(true);
      const payments = await paymentsAPI.getMemberPayments(memberId);
      setMemberPayments(payments);
    } catch (error: any) {
      showError('Failed to load payments');
      console.error('Failed to load payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleOpenPaymentModal = async (member: CADUMember) => {
    setSelectedMember(member);
    setShowAddPaymentForm(false);
    setEditingPayment(null);
    setReceiptPreview(null);
    setPaymentForm({
      payment_type: 'monthly',
      payment_date: new Date().toISOString().split('T')[0],
      payment_month: new Date().toISOString().slice(0, 7),
      payment_year: new Date().getFullYear().toString(),
      amount: 50,
      payment_method: 'bank_transfer',
      receipt_image: null,
      notes: '',
    });
    await loadMemberPayments(member.id);
    setShowPaymentModal(true);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentForm({ ...paymentForm, receipt_image: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedMember) return;

    if (!paymentForm.receipt_image && !editingPayment) {
      showError('Please upload a receipt image');
      return;
    }

    if (!paymentForm.payment_date) {
      showError('Please select a payment date');
      return;
    }

    if (paymentForm.payment_type === 'monthly' && !paymentForm.payment_month) {
      showError('Please select a payment month');
      return;
    }

    if (paymentForm.payment_type === 'annual' && !paymentForm.payment_year) {
      showError('Please select a payment year');
      return;
    }

    setSubmittingPayment(true);
    try {
      const formData = new FormData();
      formData.append('payment_type', paymentForm.payment_type);
      formData.append('payment_date', paymentForm.payment_date);
      
      if (paymentForm.payment_type === 'monthly') {
        // For monthly payments, ensure payment_month is in YYYY-MM format
        formData.append('payment_month', paymentForm.payment_month);
        // Clear payment_year if switching from annual to monthly
        if (editingPayment && editingPayment.payment_type === 'annual') {
          formData.append('payment_year', '');
        }
      } else {
        // For annual payments, set both payment_year and payment_month to year (YYYY format)
        formData.append('payment_year', paymentForm.payment_year);
        // Ensure payment_month is just the year, not YYYY-MM format
        formData.append('payment_month', paymentForm.payment_year);
      }
      
      formData.append('amount', paymentForm.amount.toString());
      formData.append('payment_method', paymentForm.payment_method);
      
      // Only append receipt_image if a new file is selected
      if (paymentForm.receipt_image) {
        formData.append('receipt_image', paymentForm.receipt_image);
      }
      
      if (paymentForm.notes !== undefined) {
        formData.append('notes', paymentForm.notes || '');
      }

      if (editingPayment) {
        // Update existing payment
        await paymentsAPI.updatePayment(editingPayment.id, formData);
        showSuccess('Payment updated successfully');
      } else {
        // Create new payment
        await paymentsAPI.createPaymentForMember(selectedMember.id, formData);
        showSuccess('Payment added successfully');
      }

      // Reset form
      setShowAddPaymentForm(false);
      setEditingPayment(null);
      setReceiptPreview(null);
      setPaymentForm({
        payment_type: 'monthly',
        payment_date: new Date().toISOString().split('T')[0],
        payment_month: new Date().toISOString().slice(0, 7),
        payment_year: new Date().getFullYear().toString(),
        amount: 50,
        payment_method: 'bank_transfer',
        receipt_image: null,
        notes: '',
      });

      // Reload payments
      if (selectedMember) {
        await loadMemberPayments(selectedMember.id);
        loadPaymentStatuses(); // Refresh payment statuses
      }
    } catch (error: any) {
      console.error('Failed to save payment:', error);
      let errorMessage = 'Failed to save payment. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.payment_month) {
          const monthError = Array.isArray(errorData.payment_month) 
            ? errorData.payment_month[0] 
            : errorData.payment_month;
          errorMessage = monthError || 'A payment for this period already exists.';
        } else if (errorData.payment_year) {
          const yearError = Array.isArray(errorData.payment_year) 
            ? errorData.payment_year[0] 
            : errorData.payment_year;
          errorMessage = yearError || 'An annual payment for this year already exists.';
        } else if (errorData.detail) {
          errorMessage = Array.isArray(errorData.detail) 
            ? errorData.detail[0] 
            : errorData.detail;
        }
      }
      
      showError(errorMessage);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleEditPayment = (payment: MonthlyPayment) => {
    setEditingPayment(payment);
    setShowAddPaymentForm(true);
    setPaymentForm({
      payment_type: payment.payment_type || 'monthly',
      payment_date: payment.payment_date.split('T')[0],
      payment_month: payment.payment_month || new Date().toISOString().slice(0, 7),
      payment_year: payment.payment_year || new Date().getFullYear().toString(),
      amount: parseFloat(payment.amount) || 50,
      payment_method: payment.payment_method || 'bank_transfer',
      receipt_image: null,
      notes: payment.notes || '',
    });
    setReceiptPreview(payment.receipt_image_url || null);
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }

    try {
      await paymentsAPI.deletePayment(paymentId);
      showSuccess('Payment deleted successfully');
      
      // Reload payments
      if (selectedMember) {
        await loadMemberPayments(selectedMember.id);
        loadPaymentStatuses(); // Refresh payment statuses
      }
    } catch (error: any) {
      console.error('Failed to delete payment:', error);
      showError(error.response?.data?.detail || 'Failed to delete payment');
    }
  };

  const handleCancelPaymentForm = () => {
    setShowAddPaymentForm(false);
    setEditingPayment(null);
    setReceiptPreview(null);
    setPaymentForm({
      payment_type: 'monthly',
      payment_date: new Date().toISOString().split('T')[0],
      payment_month: new Date().toISOString().slice(0, 7),
      payment_year: new Date().getFullYear().toString(),
      amount: 50,
      payment_method: 'bank_transfer',
      receipt_image: null,
      notes: '',
    });
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    try {
      // Check if we have a profile picture file to upload
      if (profilePictureFile) {
        // Use FormData for file upload
        const formData = new FormData();
        
        // Add all text fields
        formData.append('fullname', selectedMember.fullname);
        if (selectedMember.organization_name) {
          formData.append('organization_name', selectedMember.organization_name);
        }
        if (selectedMember.nationality) {
          formData.append('nationality', selectedMember.nationality);
        }
        if (selectedMember.resident_in) {
          formData.append('resident_in', selectedMember.resident_in);
        }
        if (selectedMember.birthdate) {
          formData.append('birthdate', selectedMember.birthdate);
        }
        if (selectedMember.gender) {
          formData.append('gender', selectedMember.gender);
        }
        if (selectedMember.country) {
          formData.append('country', selectedMember.country);
        }
        if (selectedMember.region) {
          formData.append('region', selectedMember.region);
        }
        if (selectedMember.town) {
          formData.append('town', selectedMember.town);
        }
        if (selectedMember.phone) {
          formData.append('phone', selectedMember.phone);
        }
        if (selectedMember.email) {
          formData.append('email', selectedMember.email);
        }
        if (selectedMember.emergency_contact) {
          formData.append('emergency_contact', selectedMember.emergency_contact);
        }
        if (selectedMember.registration_fee_amount != null) {
          formData.append('registration_fee_amount', String(selectedMember.registration_fee_amount));
        }
        if (selectedMember.monthly_fee_amount != null) {
          formData.append('monthly_fee_amount', String(selectedMember.monthly_fee_amount));
        }
        if (selectedMember.voluntaryBirr) {
          formData.append('voluntaryBirr', selectedMember.voluntaryBirr);
        }
        if (selectedMember.voluntaryUSD) {
          formData.append('voluntaryUSD', selectedMember.voluntaryUSD);
        }
        if (selectedMember.initial_payment_amount != null) {
          formData.append('initial_payment_amount', String(selectedMember.initial_payment_amount));
        }
        formData.append('member_type', selectedMember.member_type);
        formData.append('declaration_accepted', String(selectedMember.declaration_accepted || false));
        formData.append('photo_consent', String(selectedMember.photo_consent || false));
        
        // Add profile picture file
        formData.append('profile_picture', profilePictureFile);
        
        await caduMembersAPI.updateCADUMemberWithFile(selectedMember.id, formData);
      } else {
        // Use regular JSON update (no file)
        const updateData: any = {
          fullname: selectedMember.fullname,
          organization_name: selectedMember.organization_name,
          nationality: selectedMember.nationality,
          resident_in: selectedMember.resident_in,
          birthdate: selectedMember.birthdate,
          gender: selectedMember.gender,
          country: selectedMember.country,
          region: selectedMember.region,
          town: selectedMember.town,
          phone: selectedMember.phone,
          email: selectedMember.email,
          emergency_contact: selectedMember.emergency_contact,
          registration_fee_amount: selectedMember.registration_fee_amount,
          monthly_fee_amount: selectedMember.monthly_fee_amount,
          voluntaryBirr: selectedMember.voluntaryBirr,
          voluntaryUSD: selectedMember.voluntaryUSD,
          initial_payment_amount: selectedMember.initial_payment_amount,
          member_type: selectedMember.member_type,
          declaration_accepted: selectedMember.declaration_accepted,
          photo_consent: selectedMember.photo_consent,
        };
        
        await caduMembersAPI.updateCADUMember(selectedMember.id, updateData);
      }
      
      showSuccess('Member updated successfully');
      setShowEditModal(false);
      setSelectedMember(null);
      setProfilePictureFile(null);
      loadCADUMembers();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update member');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="CADU Members" subtitle="Manage CADU members">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="CADU Members"
      subtitle="Manage CADU members"
      searchPlaceholder="Search members..."
      onSearch={setSearchQuery}
      searchValue={searchQuery}
    >
      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Type</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCADUMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">No members found</td>
                </tr>
              ) : (
                filteredCADUMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="font-medium">{member.fullname}</td>
                    <td className="text-sm text-gray-600">{member.email}</td>
                    <td>{member.phone}</td>
                    <td>{member.country}</td>
                    <td>
                      <span className={`status-badge ${member.member_type === 'executive' ? 'published' : member.member_type === 'honorary' ? 'draft' : 'default'}`}>
                        {member.member_type === 'executive' && 'Executive'}
                        {member.member_type === 'regular' && 'Regular'}
                        {member.member_type === 'general_assembly' && 'General Assembly'}
                        {member.member_type === 'honorary' && 'Honorary'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge payment-status ${paymentStatuses[member.id] || 'unpaid'}`}>
                        {paymentStatuses[member.id] === 'paid' && '✓ Paid'}
                        {paymentStatuses[member.id] === 'pending' && '⏳ Pending'}
                        {(!paymentStatuses[member.id] || paymentStatuses[member.id] === 'unpaid') && '✗ Unpaid'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleOpenPaymentModal(member)}
                          className="action-btn"
                          style={{ background: '#3498db', color: 'white' }}
                        >
                          Payments
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowEditModal(true);
                          }}
                          className="action-btn edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const blob = await caduMembersAPI.downloadPDF(member.id);
                              if (blob.type === 'application/json') {
                                const text = await blob.text();
                                const errorData = JSON.parse(text);
                                showError(errorData.error || errorData.detail || 'Failed to download PDF');
                                return;
                              }
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${member.fullname.replace(/\s+/g, '_')}_member_certificate.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                              showSuccess('PDF downloaded successfully');
                            } catch (error: any) {
                              console.error('PDF download error:', error);
                              if (error.response) {
                                if (error.response.data instanceof Blob) {
                                  error.response.data.text().then((text: string) => {
                                    try {
                                      const errorData = JSON.parse(text);
                                      showError(errorData.error || errorData.detail || 'Failed to download PDF');
                                    } catch {
                                      showError('Failed to download PDF');
                                    }
                                  });
                                } else {
                                  showError(error.response.data?.error || error.response.data?.detail || 'Failed to download PDF');
                                }
                              } else {
                                showError(error.message || 'Failed to download PDF');
                              }
                            }
                          }}
                          className="action-btn"
                        >
                          Download PDF
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Are you sure you want to delete ${member.fullname}? This action cannot be undone.`)) {
                              return;
                            }
                            try {
                              await caduMembersAPI.deleteCADUMember(member.id);
                              showSuccess('Member deleted successfully');
                              loadCADUMembers();
                            } catch (error: any) {
                              console.error('Failed to delete member:', error);
                              showError(error.response?.data?.detail || 'Failed to delete member');
                            }
                          }}
                          className="action-btn delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <EditMemberModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMember(null);
            setProfilePictureFile(null);
          }}
          member={selectedMember}
          onMemberChange={(updatedMember) => {
            if (updatedMember) {
              setSelectedMember(updatedMember);
            }
          }}
          onProfilePictureChange={(file) => {
            setProfilePictureFile(file);
          }}
          onConfirm={handleUpdateMember}
          loading={false}
        />
      )}

      {/* Payment View Modal */}
      {showPaymentModal && selectedMember && (
        <div className="modal-overlay" onClick={() => {
          if (!showAddPaymentForm) {
            setShowPaymentModal(false);
            setSelectedMember(null);
            handleCancelPaymentForm();
          }
        }}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Payment Management - {selectedMember.fullname}</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedMember(null);
                  handleCancelPaymentForm();
                }}
                className="close-button"
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>

            {!showAddPaymentForm ? (
              <>
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowAddPaymentForm(true)}
                    className="action-btn"
                    style={{ background: '#10b981', color: 'white' }}
                  >
                    + Add Payment
              </button>
            </div>
            
            {loadingPayments ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading payments...</div>
            ) : (
              <>
                {memberPayments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No payments found for this member.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Date</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Type</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Period</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Amount</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberPayments.map((payment) => {
                          // Determine if payment is annual - check payment_type first, then infer from payment_month format
                          const explicitAnnual = payment.payment_type === 'annual';
                          const inferredAnnual = !payment.payment_month?.includes('-') && payment.payment_month?.length === 4 && payment.payment_year;
                          const isAnnual = explicitAnnual || inferredAnnual;
                          
                          // Format period display
                          let periodDisplay = '';
                          if (isAnnual) {
                            // For annual payments, try payment_year first, then extract from payment_month
                            let year = payment.payment_year;
                            if (!year && payment.payment_month) {
                              // Extract year from payment_month (could be "YYYY" or "YYYY-MM")
                              if (payment.payment_month.length === 4) {
                                year = payment.payment_month;
                              } else if (payment.payment_month.includes('-')) {
                                year = payment.payment_month.substring(0, 4);
                              } else {
                                year = payment.payment_month;
                              }
                            }
                            periodDisplay = year ? `${year} (All 12 months)` : payment.payment_month || 'N/A';
                          } else {
                            // For monthly payments, display the month in readable format
                            if (payment.payment_month) {
                              try {
                                // Check if it's in YYYY-MM format
                                if (payment.payment_month.includes('-')) {
                                  const [year, month] = payment.payment_month.split('-');
                                  const date = new Date(parseInt(year), parseInt(month) - 1);
                                  periodDisplay = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                                } else {
                                  // If it's just a year, treat as annual
                                  periodDisplay = `${payment.payment_month} (All 12 months)`;
                                }
                              } catch {
                                periodDisplay = payment.payment_month;
                              }
                            } else {
                              periodDisplay = 'N/A';
                            }
                          }
                          
                          // Determine badge color based on actual type
                          const badgeIsAnnual = explicitAnnual || (payment.payment_month?.length === 4 && !payment.payment_month.includes('-'));
                          
                          return (
                            <tr key={payment.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '0.75rem' }}>{new Date(payment.payment_date).toLocaleDateString()}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{ 
                                  padding: '0.25rem 0.5rem', 
                                  borderRadius: '4px', 
                                  fontSize: '0.875rem',
                                  fontWeight: '500',
                                  background: badgeIsAnnual ? '#e8f4f8' : '#f0f9ff',
                                  color: badgeIsAnnual ? '#0369a1' : '#0c4a6e'
                                }}>
                                  {badgeIsAnnual ? 'Annual' : 'Monthly'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem' }}>{periodDisplay}</td>
                              <td style={{ padding: '0.75rem' }}>{payment.amount} Birr</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span className={`status-badge ${payment.is_verified ? 'published' : 'pending'}`}>
                                  {payment.is_verified ? 'Verified' : 'Pending'}
                                </span>
                              </td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button
                                        onClick={() => handleEditPayment(payment)}
                                        className="action-btn edit"
                                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeletePayment(payment.id)}
                                        className="action-btn delete"
                                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
              </>
            ) : (
              <div style={{ padding: '1rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>
                  {editingPayment ? 'Edit Payment' : 'Add New Payment'}
                </h4>
                
                <form onSubmit={(e) => { e.preventDefault(); handleAddPayment(); }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Payment Type *
                    </label>
                    <select
                      value={paymentForm.payment_type}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value as 'monthly' | 'annual' })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      required
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>

                  {paymentForm.payment_type === 'monthly' ? (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Payment Month *
                      </label>
                      <input
                        type="month"
                        value={paymentForm.payment_month}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_month: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        required
                      />
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Payment Year *
                      </label>
                      <input
                        type="number"
                        value={paymentForm.payment_year}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_year: e.target.value })}
                        min="2020"
                        max="2100"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        required
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Amount (Birr) *
                    </label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 50 })}
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Payment Method *
                    </label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      required
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Receipt Image {!editingPayment && '*'}
                      {editingPayment && <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'normal' }}> (Optional - leave empty to keep current)</span>}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptChange}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      required={!editingPayment}
                    />
                    {receiptPreview && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>New receipt preview:</p>
                        <img src={receiptPreview} alt="Receipt preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                      </div>
                    )}
                    {editingPayment && !receiptPreview && editingPayment.receipt_image_url && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Current receipt:</p>
                        <img src={editingPayment.receipt_image_url} alt="Current receipt" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Notes (Optional)
                    </label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      rows={3}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="Any additional notes about this payment..."
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <button
                      type="submit"
                      className="action-btn"
                      style={{ background: '#10b981', color: 'white' }}
                      disabled={submittingPayment}
                    >
                      {submittingPayment ? 'Saving...' : editingPayment ? 'Update Payment' : 'Add Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPaymentForm}
                      className="action-btn"
                      style={{ background: '#6b7280', color: 'white' }}
                      disabled={submittingPayment}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
            </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CADUMembersManager;

