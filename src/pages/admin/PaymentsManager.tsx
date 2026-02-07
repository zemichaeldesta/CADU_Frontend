import React, { useState, useEffect, useMemo } from 'react';
import { caduMembersAPI, CADUMember } from '../../api/caduMembers';
import { paymentsAPI, MonthlyPayment } from '../../api/payments';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import apiClient from '../../api/client';
import '../../components/AdminLayout.css';

type ViewMode = 'all' | 'by-member';
type StatusFilter = 'all' | 'pending' | 'unpaid' | 'paid';

interface MemberPaymentSummary {
  member: CADUMember;
  payments: MonthlyPayment[];
  verifiedPayments: MonthlyPayment[];
  pendingPayments: MonthlyPayment[];
  unpaidMonths: string[];
  totalPaid: number;
  totalPending: number;
  status: 'paid' | 'unpaid' | 'pending' | 'partial';
}

const PaymentsManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [members, setMembers] = useState<CADUMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<CADUMember | null>(null);
  const [allPayments, setAllPayments] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingMember, setLoadingMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    loadMembers();
    loadAllPayments();
  }, []);

  useEffect(() => {
    if (selectedMemberId && viewMode === 'by-member') {
      loadPayments(selectedMemberId);
      loadSelectedMember(selectedMemberId);
    } else {
      setSelectedMember(null);
      // Reload all payments when switching back to 'all' view
      if (viewMode === 'all') {
        loadAllPayments();
      }
    }
  }, [selectedMemberId, viewMode]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await caduMembersAPI.getAdminCADUMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load members:', error);
      showError('Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPayments = async () => {
    try {
      setLoadingPayments(true);
      const data = await paymentsAPI.getAllPayments();
      setAllPayments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load all payments:', error);
      showError('Failed to load payments');
      setAllPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadPayments = async (memberId: number) => {
    try {
      setLoadingPayments(true);
      const data = await paymentsAPI.getMemberPayments(memberId);
      setAllPayments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load payments:', error);
      showError('Failed to load payments');
      setAllPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadSelectedMember = async (memberId: number) => {
    try {
      setLoadingMember(true);
      const member = await caduMembersAPI.getAdminCADUMember(memberId);
      setSelectedMember(member);
    } catch (error: any) {
      console.error('Failed to load member:', error);
      showError('Failed to load member details');
      setSelectedMember(null);
    } finally {
      setLoadingMember(false);
    }
  };

  const handleVerifyPayment = async (paymentId: number, verify: boolean) => {
    try {
      await paymentsAPI.verifyPayment(paymentId, verify);
      showSuccess(`Payment ${verify ? 'verified' : 'unverified'} successfully`);
      await loadAllPayments();
      if (selectedMemberId) {
        await loadPayments(selectedMemberId);
      }
    } catch (error: any) {
      showError(error.response?.data?.detail || `Failed to ${verify ? 'verify' : 'unverify'} payment`);
    }
  };

  // Calculate unpaid months for a member (starting from registration month)
  const getUnpaidMonths = (memberPayments: MonthlyPayment[], memberCreatedAt: string, memberType?: string): string[] => {
    // Honorary members don't require payments - return empty array
    if (memberType === 'honorary') {
      return [];
    }
    
    const verifiedMonths = new Set(
      memberPayments
        .filter(p => p.is_verified && p.payment_type === 'monthly')
        .map(p => p.payment_month)
    );

    // Get all verified annual payment years
    const verifiedAnnualYears = new Set(
      memberPayments
        .filter(p => p.is_verified && p.payment_type === 'annual')
        .map(p => p.payment_year || p.payment_month?.substring(0, 4))
        .filter((year): year is string => !!year)
    );

    const unpaidMonths: string[] = [];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Start from member registration month
    let registrationDate: Date;
    try {
      registrationDate = new Date(memberCreatedAt);
      // Set to first day of the registration month
      registrationDate = new Date(registrationDate.getFullYear(), registrationDate.getMonth(), 1);
    } catch (e) {
      // Fallback to 12 months ago if date parsing fails
      registrationDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }

    // Generate all months from registration to current month
    let currentDate = new Date(registrationDate);
    while (currentDate <= now) {
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const year = currentDate.getFullYear().toString();
      
      // Check if month is paid (either by monthly payment or annual payment)
      const isPaidByMonthly = verifiedMonths.has(month);
      const isPaidByAnnual = verifiedAnnualYears.has(year);
      
      // Only include months up to and including current month that are unpaid
      if (month <= currentMonth && !isPaidByMonthly && !isPaidByAnnual) {
        unpaidMonths.push(month);
      }
      
      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    return unpaidMonths;
  };

  // Create member payment summaries
  const memberSummaries = useMemo((): MemberPaymentSummary[] => {
    const summaries: MemberPaymentSummary[] = [];

    members.forEach(member => {
      const memberPayments = allPayments.filter(p => p.member === member.id);
      const verifiedPayments = memberPayments.filter(p => p.is_verified);
      const pendingPayments = memberPayments.filter(p => !p.is_verified);
      
      // Honorary members don't require payments
      const isHonorary = member.member_type === 'honorary';
      const unpaidMonths = isHonorary ? [] : getUnpaidMonths(memberPayments, member.created_at, member.member_type);
      
      const totalPaid = verifiedPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const totalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

      // Honorary members are always considered paid
      let status: 'paid' | 'unpaid' | 'pending' | 'partial' = isHonorary ? 'paid' : 'paid';
      if (!isHonorary) {
        if (unpaidMonths.length > 0 && verifiedPayments.length === 0) {
          status = 'unpaid';
        } else if (unpaidMonths.length > 0 && verifiedPayments.length > 0) {
          status = 'partial';
        } else if (pendingPayments.length > 0 && verifiedPayments.length === 0) {
          status = 'pending';
        }
      }

      summaries.push({
        member,
        payments: memberPayments,
        verifiedPayments,
        pendingPayments,
        unpaidMonths,
        totalPaid,
        totalPending,
        status,
      });
    });

    return summaries;
  }, [members, allPayments]);

  // Filter summaries based on status filter
  const filteredSummaries = useMemo(() => {
    let filtered = memberSummaries;

    if (statusFilter === 'pending') {
      filtered = filtered.filter(s => s.pendingPayments.length > 0);
    } else if (statusFilter === 'unpaid') {
      filtered = filtered.filter(s => s.unpaidMonths.length > 0);
    } else if (statusFilter === 'paid') {
      filtered = filtered.filter(s => s.status === 'paid');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.member.fullname.toLowerCase().includes(query) ||
        s.member.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [memberSummaries, statusFilter, searchQuery]);

  // Filter individual payments
  const filterPayments = (paymentsList: MonthlyPayment[]): MonthlyPayment[] => {
    let filtered = paymentsList;

    if (statusFilter === 'pending') {
      filtered = filtered.filter(p => !p.is_verified);
    } else if (statusFilter === 'unpaid') {
      // This doesn't apply to individual payments view
    } else if (statusFilter === 'paid') {
      filtered = filtered.filter(p => p.is_verified);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((payment) =>
        payment.payment_month.toLowerCase().includes(query) ||
        payment.amount.toString().includes(query) ||
        (payment.member_name && payment.member_name.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredPayments = filterPayments(
    viewMode === 'by-member' && selectedMemberId
      ? allPayments.filter(p => p.member === selectedMemberId)
      : allPayments
  );

  const formatMonth = (month: string): string => {
    try {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } catch {
      return month;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Payments" subtitle="Manage member payments">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Payments"
      subtitle="Manage member payments"
      searchPlaceholder="Search payments..."
      onSearch={setSearchQuery}
      searchValue={searchQuery}
    >
      <div className="content-card">
        {/* View Mode Toggle */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={async () => {
                setViewMode('all');
                setSelectedMemberId(null);
                // Reload all payments when switching back to 'all' view
                await loadAllPayments();
              }}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: viewMode === 'all' ? '#10b981' : '#ffffff',
                color: viewMode === 'all' ? 'white' : '#374151',
                cursor: 'pointer',
                fontWeight: viewMode === 'all' ? 600 : 400,
              }}
            >
              All Payments
            </button>
            <button
              onClick={() => setViewMode('by-member')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: viewMode === 'by-member' ? '#10b981' : '#ffffff',
                color: viewMode === 'by-member' ? 'white' : '#374151',
                cursor: 'pointer',
                fontWeight: viewMode === 'by-member' ? 600 : 400,
              }}
            >
              By Member
            </button>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 600, color: '#374151' }}>Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Verification</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Member Selector (only for by-member view) */}
          {viewMode === 'by-member' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label style={{ fontWeight: 600, color: '#374151' }}>Member:</label>
              <select
                value={selectedMemberId || ''}
                onChange={(e) => setSelectedMemberId(e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff',
                  minWidth: '250px',
                }}
              >
                <option value="">-- Select a member --</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullname} ({member.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* All Payments Summary View */}
        {viewMode === 'all' && (
          <div className="table-container">
            {loadingPayments ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading payments...</div>
            ) : filteredSummaries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                {searchQuery || statusFilter !== 'all' ? 'No members match your filters.' : 'No members found.'}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Verified Payments</th>
                    <th>Pending Verification</th>
                    <th>Unpaid Months</th>
                    <th>Total Paid</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummaries.map((summary) => (
                    <tr key={summary.member.id}>
                      <td>{summary.member.fullname}</td>
                      <td>{summary.member.email}</td>
                      <td>
                        <span className={`status-badge ${
                          summary.status === 'paid' ? 'published' :
                          summary.status === 'unpaid' ? 'draft' :
                          summary.status === 'pending' ? 'pending' : 'draft'
                        }`}>
                          {summary.status === 'paid' ? 'Paid' :
                           summary.status === 'unpaid' ? 'Unpaid' :
                           summary.status === 'pending' ? 'Pending' : 'Partial'}
                        </span>
                      </td>
                      <td>{summary.verifiedPayments.length}</td>
                      <td>
                        {summary.pendingPayments.length > 0 ? (
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                            {summary.pendingPayments.length}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>0</span>
                        )}
                      </td>
                      <td>
                        {summary.unpaidMonths.length > 0 ? (
                          <div style={{ maxWidth: '300px' }}>
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>
                              {summary.unpaidMonths.length} month{summary.unpaidMonths.length !== 1 ? 's' : ''}
                            </span>
                            <details style={{ marginTop: '0.25rem' }}>
                              <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '0.875rem' }}>
                                View months
                              </summary>
                              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f9fafb', borderRadius: '0.25rem' }}>
                                {summary.unpaidMonths.map(month => (
                                  <div key={month} style={{ fontSize: '0.875rem', color: '#374151' }}>
                                    {formatMonth(month)}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        ) : (
                          <span style={{ color: '#10b981' }}>All paid</span>
                        )}
                      </td>
                      <td>{summary.totalPaid.toFixed(2)} Birr</td>
                      <td>
                        <button
                          onClick={() => {
                            setViewMode('by-member');
                            setSelectedMemberId(summary.member.id);
                          }}
                          className="action-btn"
                          style={{ background: '#3498db', color: 'white' }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* By Member Detailed View */}
        {viewMode === 'by-member' && selectedMemberId && (
          <>
            {/* Registration Fee and Voluntary Donations Section */}
            {selectedMember && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  marginTop: 0,
                  marginBottom: '1rem',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Registration Fee & Voluntary Donations
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      Registration Fee
                    </label>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      {selectedMember.registration_fee_amount != null
                        ? `${typeof selectedMember.registration_fee_amount === 'number' 
                          ? selectedMember.registration_fee_amount.toFixed(2) 
                          : parseFloat(String(selectedMember.registration_fee_amount)).toFixed(2)} ETB`
                        : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      Voluntary Donation (Birr)
                    </label>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      {selectedMember.voluntaryBirr && selectedMember.voluntaryBirr.trim()
                        ? selectedMember.voluntaryBirr
                        : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      Voluntary Donation (USD)
                    </label>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      {selectedMember.voluntaryUSD && selectedMember.voluntaryUSD.trim()
                        ? selectedMember.voluntaryUSD
                        : 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="table-container">
              {loadingPayments ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading payments...</div>
              ) : filteredPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  {searchQuery || statusFilter !== 'all' ? 'No payments match your filters.' : 'No payments found for this member.'}
                </div>
              ) : (
                <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Receipt</th>
                    <th>Verified By</th>
                    <th>Verified At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const isAnnual = payment.payment_type === 'annual';
                    const periodDisplay = isAnnual 
                      ? `${payment.payment_year || payment.payment_month?.substring(0, 4) || payment.payment_month} (All 12 months)`
                      : formatMonth(payment.payment_month);
                    
                    return (
                      <tr key={payment.id}>
                        <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '4px', 
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              background: isAnnual ? '#e8f4f8' : '#f0f9ff',
                              color: isAnnual ? '#0369a1' : '#0c4a6e',
                              width: 'fit-content'
                            }}>
                              {isAnnual ? 'Annual' : 'Monthly'}
                            </span>
                            <span>{periodDisplay}</span>
                          </div>
                        </td>
                        <td>
                          {(() => {
                            const amount = typeof payment.amount === 'string' 
                              ? parseFloat(payment.amount) 
                              : typeof payment.amount === 'number' 
                                ? payment.amount 
                                : 0;
                            return isNaN(amount) ? '0.00' : amount.toFixed(2);
                          })()} Birr
                        </td>
                        <td>{payment.payment_method || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${payment.is_verified ? 'published' : 'pending'}`}>
                            {payment.is_verified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                      <td>
                        {payment.receipt_image_url ? (
                          <button
                            onClick={async () => {
                              try {
                                let urlPath = payment.receipt_image_url || '';
                                try {
                                  const url = new URL(payment.receipt_image_url || '');
                                  urlPath = url.pathname + url.search;
                                  // Remove /api prefix if present (apiClient will add it)
                                  if (urlPath.startsWith('/api/')) {
                                    urlPath = urlPath.substring(4); // Remove '/api' (4 chars)
                                  }
                                } catch (e) {
                                  // If not a valid URL, treat as relative path
                                  if (!urlPath.startsWith('/')) {
                                    urlPath = '/' + urlPath;
                                  }
                                  // Remove /api prefix if present
                                  if (urlPath.startsWith('/api/')) {
                                    urlPath = urlPath.substring(4);
                                  }
                                }
                                
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
                            }}
                          >
                            Download
                          </button>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>No receipt</span>
                        )}
                      </td>
                      <td>{payment.verified_by_name || '-'}</td>
                      <td>
                        {payment.verified_at
                          ? new Date(payment.verified_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {payment.is_verified ? (
                            <button
                              onClick={() => handleVerifyPayment(payment.id, false)}
                              className="action-btn"
                              style={{ background: '#f59e0b', color: 'white' }}
                            >
                              Unverify
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerifyPayment(payment.id, true)}
                              className="action-btn accept"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              )}
            </div>
          </>
        )}

        {viewMode === 'by-member' && !selectedMemberId && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <p>Please select a member to view their payments.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PaymentsManager;
