import React, { useState, useEffect } from 'react';
import { caduMembersAPI, CADUMember } from '../../api/caduMembers';
import { memberApplicationsAPI, MemberApplication } from '../../api/memberApplications';
import { paymentsAPI, MonthlyPayment } from '../../api/payments';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import AuthenticatedImage from '../../components/AuthenticatedImage';
import apiClient from '../../api/client';
import '../../components/AdminLayout.css';

const CADUMemberManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [caduMembers, setCADUMembers] = useState<CADUMember[]>([]);
  const [applications, setApplications] = useState<MemberApplication[]>([]);
  const [caduMembersView, setCADUMembersView] = useState<'applications' | 'members'>('applications');
  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null);
  const [selectedMember, setSelectedMember] = useState<CADUMember | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [memberPayments, setMemberPayments] = useState<MonthlyPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [memberType, setMemberType] = useState<'executive' | 'regular' | 'general_assembly' | 'honorary'>('regular');
  const [rejectNotes, setRejectNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<number, string>>({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCADUMembers(), loadApplications()]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCADUMembers = async () => {
    try {
      const data = await caduMembersAPI.getAdminCADUMembers();
      setCADUMembers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load CADU members:', error);
      setCADUMembers([]);
    }
  };

  const loadApplications = async () => {
    try {
      const data = await memberApplicationsAPI.getApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load applications:', error);
      setApplications([]);
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
    if (caduMembers.length > 0 && caduMembersView === 'members') {
      loadPaymentStatuses();
    }
  }, [caduMembers, caduMembersView]);

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

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const filteredApplications = filterData(pendingApplications, ['fullname', 'email', 'phone', 'country', 'status']);
  const filteredCADUMembers = filterData(caduMembers, ['fullname', 'email', 'phone', 'country']);

  const handleAcceptApplication = async () => {
    if (!selectedApplication) return;
    try {
      await memberApplicationsAPI.acceptApplication(selectedApplication.id, memberType);
      showSuccess('Application accepted successfully');
      setShowAcceptModal(false);
      setSelectedApplication(null);
      setMemberType('regular');
      await Promise.all([loadApplications(), loadCADUMembers()]);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to accept application');
    }
  };

  const handleRejectApplication = async () => {
    if (!selectedApplication) return;
    try {
      await memberApplicationsAPI.rejectApplication(selectedApplication.id, rejectNotes);
      showSuccess('Application rejected');
      setShowRejectModal(false);
      setSelectedApplication(null);
      setRejectNotes('');
      loadApplications();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to reject application');
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    try {
      await caduMembersAPI.updateCADUMember(selectedMember.id, { 
        registration_fee_amount: selectedMember.registration_fee_amount,
        monthly_fee_amount: selectedMember.monthly_fee_amount,
        voluntaryBirr: selectedMember.voluntaryBirr,
        voluntaryUSD: selectedMember.voluntaryUSD,
        member_type: selectedMember.member_type,
        photo_consent: selectedMember.photo_consent
      });
      showSuccess('Member updated successfully');
      setShowEditModal(false);
      setSelectedMember(null);
      loadCADUMembers();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update member');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="CADU Members" subtitle="Manage CADU member applications and members">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="CADU Members"
      subtitle="Manage CADU member applications and members"
      searchPlaceholder="Search..."
      onSearch={setSearchQuery}
      searchValue={searchQuery}
    >
      <div className="content-card">
        <div className="cadu-tabs">
          <button
            className={`cadu-tab ${caduMembersView === 'applications' ? 'active' : ''}`}
            onClick={() => setCADUMembersView('applications')}
          >
            Applications ({pendingApplications.length} pending)
          </button>
          <button
            className={`cadu-tab ${caduMembersView === 'members' ? 'active' : ''}`}
            onClick={() => setCADUMembersView('members')}
          >
            Members ({caduMembers.length})
          </button>
        </div>

        {caduMembersView === 'applications' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">No applications found</td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td className="font-medium">{app.fullname}</td>
                      <td className="text-sm text-gray-600">{app.email}</td>
                      <td>{app.phone}</td>
                      <td>{app.country}</td>
                      <td className="text-sm text-gray-600">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`status-badge ${
                          app.status === 'accepted' ? 'published' :
                          app.status === 'rejected' ? 'draft' : 'pending'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => {
                              setSelectedApplication(app);
                              setShowViewModal(true);
                            }}
                            className="action-btn edit"
                          >
                            View
                          </button>
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setMemberType('regular');
                                  setShowAcceptModal(true);
                                }}
                                className="action-btn accept"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setRejectNotes('');
                                  setShowRejectModal(true);
                                }}
                                className="action-btn delete"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {caduMembersView === 'members' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
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
                    <td colSpan={8} className="empty-state">No members found</td>
                  </tr>
                ) : (
                  filteredCADUMembers.map((member, index) => (
                    <tr key={member.id}>
                      <td style={{ textAlign: 'center', fontWeight: '500', color: '#6b7280' }}>{index + 1}</td>
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
                            onClick={async () => {
                              setSelectedMember(member);
                              setLoadingPayments(true);
                              try {
                                const payments = await paymentsAPI.getMemberPayments(member.id);
                                setMemberPayments(payments);
                                setShowPaymentModal(true);
                              } catch (error: any) {
                                showError('Failed to load payments');
                                console.error('Failed to load payments:', error);
                              } finally {
                                setLoadingPayments(false);
                              }
                            }}
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
        )}
      </div>

      {/* Accept Application Modal */}
      {showAcceptModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowAcceptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Accept Application</h3>
            <p>Accept application for <strong>{selectedApplication.fullname}</strong>?</p>
            <div className="form-group">
              <label>Member Type</label>
              <select
                value={memberType}
                onChange={(e) => setMemberType(e.target.value as 'executive' | 'regular' | 'general_assembly' | 'honorary')}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  marginTop: '0.5rem',
                }}
              >
                <option value="regular">Regular Member</option>
                <option value="executive">Executive Member</option>
                <option value="general_assembly">General Assembly Member</option>
                <option value="honorary">Honorary Member</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAcceptModal(false)} className="action-btn">Cancel</button>
              <button onClick={handleAcceptApplication} className="action-btn accept">Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Application Modal */}
      {showRejectModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Application</h3>
            <p>Reject application for <strong>{selectedApplication.fullname}</strong>?</p>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowRejectModal(false)} className="action-btn">Cancel</button>
              <button onClick={handleRejectApplication} className="action-btn delete">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Member</h3>
            <p>Editing: <strong>{selectedMember.fullname}</strong></p>
            <div className="form-group">
              <label>Member Type</label>
              <select
                value={selectedMember.member_type}
                onChange={(e) => setSelectedMember({ ...selectedMember, member_type: e.target.value as 'executive' | 'regular' | 'general_assembly' | 'honorary' })}
              >
                <option value="regular">Regular Member</option>
                <option value="executive">Executive Member</option>
                <option value="general_assembly">General Assembly Member</option>
                <option value="honorary">Honorary Member</option>
              </select>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={selectedMember.photo_consent || false}
                  onChange={(e) => setSelectedMember({ ...selectedMember, photo_consent: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
                />
                Photo Consent (Allow displaying photos on website)
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="action-btn">Cancel</button>
              <button onClick={handleUpdateMember} className="action-btn accept">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* View Application Modal */}
      {showViewModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Application Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              {[
                { label: 'Full Name', value: selectedApplication.fullname },
                { label: 'Email', value: selectedApplication.email },
                { label: 'Phone', value: selectedApplication.phone },
                {
                  label: 'Birthdate',
                  value: selectedApplication.birthdate
                    ? new Date(selectedApplication.birthdate).toLocaleDateString()
                    : null,
                },
                { label: 'Gender', value: selectedApplication.gender },
                { label: 'Country', value: selectedApplication.country },
                { label: 'Region', value: selectedApplication.region },
                { label: 'Town', value: selectedApplication.town },
                { label: 'Voluntary (Birr)', value: selectedApplication.voluntaryBirr },
                { label: 'Voluntary (USD)', value: selectedApplication.voluntaryUSD },
              ]
                .filter((row) => row.value && String(row.value).trim().length > 0)
                .map((row) => (
                  <div key={row.label} className="form-group">
                    <label>
                      <strong>{row.label}:</strong>
                    </label>
                    <p>{row.value}</p>
                  </div>
                ))}
              <div className="form-group">
                <label><strong>One-time Registration Payment:</strong></label>
                {selectedApplication.registration_fee_amount ? (
                  <p>
                    {typeof selectedApplication.registration_fee_amount === 'number' 
                      ? `${selectedApplication.registration_fee_amount.toFixed(2)} ETB`
                      : `${selectedApplication.registration_fee_amount} ETB`}
                  </p>
                ) : selectedApplication.initial_payment_amount ? (
                  <p>
                    {typeof selectedApplication.initial_payment_amount === 'number' 
                      ? `${selectedApplication.initial_payment_amount.toFixed(2)} ETB`
                      : `${selectedApplication.initial_payment_amount} ETB`}
                  </p>
                ) : (
                  <p>Not paid</p>
                )}
              </div>
              <div className="form-group">
                <label><strong>Monthly Payment:</strong></label>
                {selectedApplication.monthly_fee_amount ? (
                  <p>
                    {typeof selectedApplication.monthly_fee_amount === 'number' 
                      ? `${selectedApplication.monthly_fee_amount.toFixed(2)} ETB`
                      : `${selectedApplication.monthly_fee_amount} ETB`}
                  </p>
                ) : (
                  <p>Not paid</p>
                )}
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label><strong>Status:</strong></label>
                <p>
                  <span className={`status-badge ${
                    selectedApplication.status === 'accepted' ? 'published' :
                    selectedApplication.status === 'rejected' ? 'draft' : 'pending'
                  }`}>
                    {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                  </span>
                </p>
              </div>
              {selectedApplication.notes && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label><strong>Notes:</strong></label>
                  <p>{selectedApplication.notes}</p>
                </div>
              )}
              {selectedApplication.reviewed_by_name && (
                <div className="form-group">
                  <label><strong>Reviewed By:</strong></label>
                  <p>{selectedApplication.reviewed_by_name}</p>
                </div>
              )}
              {selectedApplication.reviewed_at && (
                <div className="form-group">
                  <label><strong>Reviewed At:</strong></label>
                  <p>{new Date(selectedApplication.reviewed_at).toLocaleString()}</p>
                </div>
              )}
              <div className="form-group">
                <label><strong>Submitted:</strong></label>
                <p>{new Date(selectedApplication.created_at).toLocaleString()}</p>
              </div>
            </div>
            {(selectedApplication.profile_picture_url || selectedApplication.receipt_photo_url) && (
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {selectedApplication.profile_picture_url && (
                  <div className="form-group">
                    <label><strong>Profile Picture:</strong></label>
                    <AuthenticatedImage
                      src={selectedApplication.profile_picture_url}
                      alt="Profile"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        marginTop: '0.5rem', 
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        objectFit: 'contain',
                        backgroundColor: '#f9fafb'
                      }}
                      onError={(error) => {
                        console.error('Failed to load profile picture:', selectedApplication.profile_picture_url, error);
                      }}
                      onLoad={() => {
                        console.log('Profile picture loaded successfully:', selectedApplication.profile_picture_url);
                      }}
                    />
                  </div>
                )}
                {selectedApplication.receipt_photo_url && (
                  <div className="form-group">
                    <label><strong>Receipt Photo:</strong></label>
                    <AuthenticatedImage
                      src={selectedApplication.receipt_photo_url}
                      alt="Receipt"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        marginTop: '0.5rem', 
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        objectFit: 'contain',
                        backgroundColor: '#f9fafb'
                      }}
                      onError={(error) => {
                        console.error('Failed to load receipt photo:', selectedApplication.receipt_photo_url, error);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button onClick={() => setShowViewModal(false)} className="action-btn">Close</button>
              {selectedApplication.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setMemberType('regular');
                      setShowAcceptModal(true);
                    }}
                    className="action-btn accept"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setRejectNotes('');
                      setShowRejectModal(true);
                    }}
                    className="action-btn delete"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment View Modal */}
      {showPaymentModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Payment History - {selectedMember.fullname}</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="close-button"
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>
            
            {loadingPayments ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading payments...</div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={async () => {
                      try {
                        const blob = await paymentsAPI.downloadPaymentPDF(undefined, selectedMember.id);
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${selectedMember.fullname.replace(/\s+/g, '_')}_payments.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        showSuccess('PDF downloaded successfully');
                      } catch (error: any) {
                        showError('Failed to download PDF');
                        console.error('PDF download error:', error);
                      }
                    }}
                    className="action-btn"
                    style={{ background: '#27ae60', color: 'white' }}
                  >
                    Download All Payments PDF
                  </button>
                </div>
                
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
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Receipt</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberPayments.map((payment) => {
                          const isAnnual = payment.payment_type === 'annual';
                          const periodDisplay = isAnnual 
                            ? `${payment.payment_year || payment.payment_month?.substring(0, 4) || payment.payment_month} (All 12 months)`
                            : payment.payment_month;
                          
                          return (
                            <tr key={payment.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '0.75rem' }}>{new Date(payment.payment_date).toLocaleDateString()}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{ 
                                  padding: '0.25rem 0.5rem', 
                                  borderRadius: '4px', 
                                  fontSize: '0.875rem',
                                  fontWeight: '500',
                                  background: isAnnual ? '#e8f4f8' : '#f0f9ff',
                                  color: isAnnual ? '#0369a1' : '#0c4a6e'
                                }}>
                                  {isAnnual ? 'Annual' : 'Monthly'}
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
                              {payment.receipt_image_url ? (
                                <button
                                  onClick={async () => {
                                    if (!payment.receipt_image_url) {
                                      showError('Receipt image URL not available');
                                      return;
                                    }
                                    try {
                                      // Extract the path from the full URL
                                      // URL format: https://domain.com/api/media/cadu_members/payments/file.jpg
                                      // We need: /media/cadu_members/payments/file.jpg (without /api prefix)
                                      let urlPath = payment.receipt_image_url;
                                      try {
                                        const url = new URL(payment.receipt_image_url);
                                        urlPath = url.pathname + url.search;
                                        // Remove /api prefix if present (apiClient will add it)
                                        if (urlPath.startsWith('/api/')) {
                                          urlPath = urlPath.substring(4); // Remove '/api' (4 chars)
                                        }
                                      } catch (e) {
                                        // If it's already a relative path, use it as is
                                        if (!urlPath.startsWith('/')) {
                                          urlPath = '/' + urlPath;
                                        }
                                        // Remove /api prefix if present
                                        if (urlPath.startsWith('/api/')) {
                                          urlPath = urlPath.substring(4);
                                        }
                                      }
                                      
                                      // Fetch the image with authentication using apiClient
                                      const response = await apiClient.get(urlPath, {
                                        responseType: 'blob',
                                      });
                                      const blob = response.data;
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `receipt_${payment.id}_${new Date(payment.payment_date).toISOString().split('T')[0]}.jpg`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                      showSuccess('Receipt downloaded successfully');
                                    } catch (error: any) {
                                      showError('Failed to download receipt');
                                      console.error('Download receipt error:', error);
                                    }
                                  }}
                                  style={{ 
                                    color: '#3498db', 
                                    textDecoration: 'none',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontSize: 'inherit'
                                  }}
                                >
                                  Download
                                </button>
                              ) : (
                                <span style={{ color: '#9ca3af' }}>N/A</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={async () => {
                                    try {
                                      await paymentsAPI.verifyPayment(payment.id, !payment.is_verified);
                                      showSuccess(`Payment ${!payment.is_verified ? 'verified' : 'unverified'} successfully`);
                                      const payments = await paymentsAPI.getMemberPayments(selectedMember.id);
                                      setMemberPayments(payments);
                                      loadPaymentStatuses();
                                    } catch (error: any) {
                                      showError('Failed to update payment status');
                                      console.error('Verify payment error:', error);
                                    }
                                  }}
                                  className="action-btn small"
                                  style={{
                                    background: payment.is_verified ? '#e74c3c' : '#27ae60',
                                    color: 'white',
                                    padding: '0.25rem 0.75rem',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {payment.is_verified ? 'Unverify' : 'Verify'}
                                </button>
                                <button
                                  onClick={async () => {
                                    const paymentPeriod = isAnnual 
                                      ? `${payment.payment_year || payment.payment_month?.substring(0, 4) || payment.payment_month} (Annual)`
                                      : payment.payment_month;
                                    if (!window.confirm(`Are you sure you want to delete this payment for ${paymentPeriod}? This action cannot be undone.`)) {
                                      return;
                                    }
                                    try {
                                      await paymentsAPI.deletePayment(payment.id);
                                      showSuccess('Payment deleted successfully');
                                      const payments = await paymentsAPI.getMemberPayments(selectedMember.id);
                                      setMemberPayments(payments);
                                      loadPaymentStatuses();
                                    } catch (error: any) {
                                      showError('Failed to delete payment');
                                      console.error('Delete payment error:', error);
                                    }
                                  }}
                                  className="action-btn small"
                                  style={{
                                    background: '#e74c3c',
                                    color: 'white',
                                    padding: '0.25rem 0.75rem',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      const blob = await paymentsAPI.downloadPaymentPDF(payment.id);
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `payment_${payment.id}_receipt.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                      showSuccess('PDF downloaded successfully');
                                    } catch (error: any) {
                                      showError('Failed to download PDF');
                                      console.error('PDF download error:', error);
                                    }
                                  }}
                                  className="action-btn small"
                                  style={{
                                    background: '#3498db',
                                    color: 'white',
                                    padding: '0.25rem 0.75rem',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  Download PDF
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
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CADUMemberManager;

