import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, UserInfo } from '../api/auth';
import { paymentsAPI, MonthlyPayment } from '../api/payments';
import { useToast } from '../context/ToastContext';
import Resources from './Resources';
import './MemberDashboard.css';

const MemberDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'payments' | 'resources' | 'member-resources'>('payments');
  
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_month: new Date().toISOString().slice(0, 7), // YYYY-MM
    amount: 50,
    receipt_image: null as File | null,
    notes: '',
  });
  
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user info
        const info = await authAPI.getUserInfo();
        setUserInfo(info);
        
        // Load payments
        const paymentData = await paymentsAPI.getMyPayments();
        setPayments(paymentData);
      } catch (error: any) {
        console.error('Failed to load dashboard data:', error);
        if (error.response?.status === 401) {
          authAPI.logout();
          navigate('/member-login');
        } else {
          showError('Member services are being updated. Please try again shortly.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, showError]);


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

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!paymentForm.receipt_image) {
      showError('Please upload a receipt image');
      return;
    }
    
    if (!paymentForm.payment_date) {
      showError('Please select a payment date');
      return;
    }
    
    if (!paymentForm.payment_month) {
      showError('Please select a payment month');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('payment_date', paymentForm.payment_date);
      formData.append('payment_month', paymentForm.payment_month);
      formData.append('amount', paymentForm.amount.toString());
      formData.append('receipt_image', paymentForm.receipt_image);
      if (paymentForm.notes) {
        formData.append('notes', paymentForm.notes);
      }

      await paymentsAPI.submitPayment(formData);
      showSuccess('Payment submitted successfully! It will be reviewed by an administrator.');
      
      // Reset form
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        payment_month: new Date().toISOString().slice(0, 7),
        amount: 50,
        receipt_image: null,
        notes: '',
      });
      setReceiptPreview(null);
      
      // Reload payments
      const paymentData = await paymentsAPI.getMyPayments();
      setPayments(paymentData);
    } catch (error: any) {
      console.error('Failed to submit payment:', error);
      let errorMessage = 'Failed to submit payment. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        // Handle different error formats
        if (errorData.payment_month) {
          // Unique constraint error - payment already exists for this month
          const monthError = Array.isArray(errorData.payment_month) 
            ? errorData.payment_month[0] 
            : errorData.payment_month;
          // Format month string if needed
          const monthDisplay = paymentForm.payment_month 
            ? new Date(paymentForm.payment_month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
            : paymentForm.payment_month;
          errorMessage = monthError || `A payment for ${monthDisplay} has already been submitted. Please select a different month.`;
        } else if (errorData.detail) {
          errorMessage = Array.isArray(errorData.detail) 
            ? errorData.detail[0] 
            : errorData.detail;
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ') 
            : errorData.non_field_errors;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          // Try to extract first error message
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
      }
      
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentMonthStatus = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentYear = currentMonth.substring(0, 4);
    // Ensure payments is an array before calling find
    const paymentsArray = Array.isArray(payments) ? payments : [];
    
    // Check for monthly payment for current month
    const monthlyPayment = paymentsArray.find(p => 
      p.payment_type === 'monthly' && p.payment_month === currentMonth
    );
    
    // Check for annual payment that covers current month
    const annualPayment = paymentsArray.find(p => 
      p.payment_type === 'annual' && 
      (p.payment_year === currentYear || p.payment_month?.substring(0, 4) === currentYear)
    );
    
    // Prioritize monthly payment if exists, otherwise check annual
    const payment = monthlyPayment || annualPayment;
    
    if (!payment) {
      return { status: 'unpaid', payment: null };
    }
    
    if (payment.is_verified) {
      return { status: 'paid', payment };
    } else {
      return { status: 'pending', payment };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="member-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const currentStatus = getCurrentMonthStatus();
  const displayName = userInfo?.first_name && userInfo?.last_name
    ? `${userInfo.first_name} ${userInfo.last_name}`
    : userInfo?.username || 'Member';

  return (
    <div className="member-dashboard">
      <div className="member-dashboard-container">
        <header className="member-dashboard-header">
          <div className="member-header-main">
            <h1>Welcome, {displayName}!</h1>
            <p>Member Dashboard</p>
          </div>
          <button
            type="button"
            className="member-back-link"
            onClick={() => navigate('/members')}
          >
            ← Back to Members
          </button>
        </header>

        {/* Navigation Bar */}
        <nav className="member-dashboard-nav">
          <button
            className={`nav-tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
          <button
            className={`nav-tab ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
          <button
            className={`nav-tab ${activeTab === 'member-resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('member-resources')}
          >
            {userInfo?.member_type === 'executive' ? 'Executive Resources' : 
             userInfo?.member_type === 'general_assembly' ? 'General Assembly Resources' : 
             'Member Resources'}
          </button>
        </nav>

        <div className="member-dashboard-content">
          {/* Payments Tab Content */}
          {activeTab === 'payments' && (
            <>
              {/* Payment Status Card */}
              <div className="dashboard-card status-card">
            <h2>Current Month Payment Status</h2>
            <div className={`status-badge ${currentStatus.status}`}>
              {currentStatus.status === 'paid' && '✓ Paid'}
              {currentStatus.status === 'pending' && '⏳ Pending Verification'}
              {currentStatus.status === 'unpaid' && '✗ Unpaid'}
            </div>
            {currentStatus.payment && (
              <div className="status-details">
                <p>Amount: {currentStatus.payment.amount} Birr</p>
                <p>Submitted: {formatDate(currentStatus.payment.submitted_at)}</p>
              </div>
            )}
          </div>

          {/* Payment Submission Form */}
          <div className="dashboard-card payment-form-card">
            <h2>Submit Monthly Payment</h2>
            <p className="form-description">
              Submit your monthly payment of 50 Birr by uploading a screenshot of your payment receipt.
              You can also pay in advance for future months.
            </p>
            
            <form onSubmit={handleSubmitPayment} className="payment-form">
              <div className="form-group">
                <label htmlFor="payment_month">Payment Month</label>
                <input
                  type="month"
                  id="payment_month"
                  value={paymentForm.payment_month}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_month: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 7)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="payment_date">Payment Date</label>
                <input
                  type="date"
                  id="payment_date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount (Birr)</label>
                <input
                  type="number"
                  id="amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 50 })}
                  min="50"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="receipt_image">Receipt Screenshot</label>
                <input
                  type="file"
                  id="receipt_image"
                  accept="image/*"
                  onChange={handleReceiptChange}
                  required
                />
                {receiptPreview && (
                  <div className="receipt-preview">
                    <img src={receiptPreview} alt="Receipt preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional notes about this payment..."
                />
              </div>

              <button type="submit" className="submit-button" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Payment'}
              </button>
            </form>
          </div>

          {/* Payment History */}
          <div className="dashboard-card payment-history-card">
            <h2>Payment History</h2>
            {payments.length === 0 ? (
              <p className="empty-state">No payments submitted yet.</p>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="payment-history-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{formatMonth(payment.payment_month)}</td>
                          <td>{formatDate(payment.payment_date)}</td>
                          <td>{payment.amount} Birr</td>
                          <td>
                            <span className={`status-badge-small ${payment.is_verified ? 'verified' : 'pending'}`}>
                              {payment.is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Card View */}
                <div className="payment-history-mobile">
                  {payments.map((payment) => (
                    <div key={payment.id} className="payment-item-mobile">
                      <div className="payment-item-mobile-header">
                        <span className="payment-item-mobile-month">
                          {formatMonth(payment.payment_month)}
                        </span>
                        <span className="payment-item-mobile-status">
                          <span className={`status-badge-small ${payment.is_verified ? 'verified' : 'pending'}`}>
                            {payment.is_verified ? 'Verified' : 'Pending'}
                          </span>
                        </span>
                      </div>
                      <div className="payment-item-mobile-details">
                        <div className="payment-item-mobile-detail">
                          <span className="payment-item-mobile-detail-label">Date:</span>
                          <span className="payment-item-mobile-detail-value">{formatDate(payment.payment_date)}</span>
                        </div>
                        <div className="payment-item-mobile-detail">
                          <span className="payment-item-mobile-detail-label">Amount:</span>
                          <span className="payment-item-mobile-detail-value">{payment.amount} Birr</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
            </>
          )}

          {/* Resources Tab Content - Public Website Resources Only */}
          {activeTab === 'resources' && (
            <div style={{ width: '100%', marginTop: '1rem' }}>
              <Resources memberMode={false} visibilityFilter="public" />
            </div>
          )}

          {/* Member Type Resources Tab Content - Member-specific Archives Only */}
          {activeTab === 'member-resources' && (
            <div style={{ width: '100%', marginTop: '1rem' }}>
              <Resources memberMode={true} usePersonalResources={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;

