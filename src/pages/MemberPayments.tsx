import React, { useState, useEffect } from 'react';
import MemberProtectedRoute from '../components/MemberProtectedRoute';
import { paymentsAPI, MonthlyPayment } from '../api/payments';
import { useToast } from '../context/ToastContext';
import './MemberDashboard.css';

const MemberPayments: React.FC = () => {
  const { showSuccess, showError } = useToast();
  
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [paymentForm, setPaymentForm] = useState({
    payment_type: 'monthly' as 'monthly' | 'annual',
    payment_date: new Date().toISOString().split('T')[0],
    payment_month: new Date().toISOString().slice(0, 7), // YYYY-MM for monthly, YYYY for annual
    payment_year: new Date().getFullYear().toString(), // For annual payments
    amount: '',
    currency: 'ETB' as 'ETB' | 'USD',
    payment_method: 'bank_transfer' as 'bank_transfer' | 'cash' | 'mobile_money' | 'other',
    receipt_image: null as File | null,
    notes: '',
  });
  
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const paymentData = await paymentsAPI.getMyPayments();
        setPayments(paymentData);
      } catch (error: any) {
        console.error('Failed to load payments:', error);
        if (error.response?.status === 401) {
          window.location.href = '/member-login';
        } else {
          showError('Failed to load payments');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showError]);

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
    
    if (!paymentForm.receipt_image) {
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

    // Validate amount is provided
    const amountValue = parseFloat(paymentForm.amount);
    if (isNaN(amountValue) || paymentForm.amount.trim() === '') {
      showError('Please enter a payment amount');
      return;
    }

    // Validate minimum amount based on payment type
    const isAnnual = paymentForm.payment_type === 'annual';
    const minAmountETB = isAnnual ? 600 : 50;  // Annual: 12 months * 50 = 600 minimum
    const minAmountUSD = isAnnual ? 12 : 1;    // Annual: 12 months * 1 USD = 12 USD minimum
    
    if (paymentForm.currency === 'ETB' && amountValue < minAmountETB) {
      showError(isAnnual 
        ? `Annual payment amount must be at least ${minAmountETB} ETB (12 months × 50 ETB)`
        : 'Monthly payment amount must be at least 50 ETB');
      return;
    }
    
    // For USD, validate minimum
    if (paymentForm.currency === 'USD' && amountValue < minAmountUSD) {
      showError(isAnnual
        ? `Annual payment amount must be at least ${minAmountUSD} USD (12 months × 1 USD)`
        : 'Monthly payment amount must be at least 1 USD');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('payment_type', paymentForm.payment_type);
      formData.append('payment_date', paymentForm.payment_date);
      
      // For annual payments, use payment_year; for monthly, use payment_month
      if (paymentForm.payment_type === 'annual') {
        formData.append('payment_month', paymentForm.payment_year);
        formData.append('payment_year', paymentForm.payment_year);
      } else {
        formData.append('payment_month', paymentForm.payment_month);
      }
      
      formData.append('amount', amountValue.toString());
      formData.append('currency', paymentForm.currency);
      formData.append('payment_method', paymentForm.payment_method);
      
      if (paymentForm.receipt_image) {
        formData.append('receipt_image', paymentForm.receipt_image);
      }
      
      if (paymentForm.notes) {
        formData.append('notes', paymentForm.notes);
      }

      await paymentsAPI.submitPayment(formData);
      showSuccess('Payment submitted successfully! It will be reviewed by an administrator.');
      
      setPaymentForm({
        payment_type: 'monthly',
        payment_date: new Date().toISOString().split('T')[0],
        payment_month: new Date().toISOString().slice(0, 7),
        payment_year: new Date().getFullYear().toString(),
        amount: '',
        currency: 'ETB',
        payment_method: 'bank_transfer',
        receipt_image: null,
        notes: '',
      });
      setReceiptPreview(null);
      
      const paymentData = await paymentsAPI.getMyPayments();
      setPayments(paymentData);
    } catch (error: any) {
      console.error('Failed to submit payment:', error);
      let errorMessage = 'Failed to submit payment. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.payment_month) {
          const monthError = Array.isArray(errorData.payment_month) 
            ? errorData.payment_month[0] 
            : errorData.payment_month;
          const monthDisplay = paymentForm.payment_month 
            ? new Date(paymentForm.payment_month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
            : paymentForm.payment_month;
          const monthErrorStr = typeof monthError === 'string' 
            ? monthError 
            : '';
          errorMessage = monthErrorStr || `A payment for ${monthDisplay} has already been submitted. Please select a different month.`;
        } else if (errorData.detail) {
          const detail = Array.isArray(errorData.detail) 
            ? errorData.detail[0] 
            : errorData.detail;
          errorMessage = typeof detail === 'string' 
            ? detail 
            : typeof detail === 'object' 
              ? JSON.stringify(detail) 
              : String(detail);
        } else if (errorData.message) {
          errorMessage = typeof errorData.message === 'string' 
            ? errorData.message 
            : String(errorData.message);
        }
      } else if (error.message) {
        errorMessage = typeof error.message === 'string' 
          ? error.message 
          : String(error.message);
      }
      
      // Ensure errorMessage is always a string
      if (typeof errorMessage !== 'string') {
        errorMessage = 'Failed to submit payment. Please try again.';
      }
      
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentMonthStatus = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentYear = currentMonth.substring(0, 4);
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
        <p>Loading payments...</p>
      </div>
    );
  }

  const currentStatus = getCurrentMonthStatus();

  return (
    <MemberProtectedRoute>
      <div className="member-dashboard">
        <div className="member-dashboard-container">
          <header className="member-dashboard-header">
            <div className="member-header-main">
              <h1>Payments</h1>
              <p>Submit and track your monthly payments</p>
            </div>
          </header>

          <div className="member-dashboard-content">
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
                  <p>Amount: {String(currentStatus.payment.amount || 'N/A')} Birr</p>
                  <p>Submitted: {formatDate(currentStatus.payment.submitted_at)}</p>
                </div>
              )}
            </div>

            {/* Payment Submission Form */}
            <div className="dashboard-card payment-form-card">
              <h2>Submit Payment</h2>
              <p className="form-description">
                Submit your payment by uploading a receipt image. You can pay monthly (minimum 50 ETB or 1 USD) or annually (minimum 600 ETB or 12 USD).
              </p>
              
              <form onSubmit={handleSubmitPayment} className="payment-form">
                <div className="form-group">
                  <label htmlFor="payment_type">Payment Type</label>
                  <select
                    id="payment_type"
                    value={paymentForm.payment_type}
                    onChange={(e) => {
                      const type = e.target.value as 'monthly' | 'annual';
                      setPaymentForm({ 
                        ...paymentForm, 
                        payment_type: type,
                        // Reset payment_month/payment_year when switching type
                        payment_month: type === 'monthly' ? new Date().toISOString().slice(0, 7) : paymentForm.payment_month,
                        payment_year: type === 'annual' ? new Date().getFullYear().toString() : paymentForm.payment_year
                      });
                    }}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="payment_method">Payment Method</label>
                  <select
                    id="payment_method"
                    value={paymentForm.payment_method}
                    onChange={(e) => {
                      const method = e.target.value as 'bank_transfer' | 'cash' | 'mobile_money' | 'other';
                      setPaymentForm({ 
                        ...paymentForm, 
                        payment_method: method
                      });
                    }}
                    required
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {paymentForm.payment_type === 'monthly' ? (
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
                ) : (
                  <div className="form-group">
                    <label htmlFor="payment_year">Payment Year</label>
                    <input
                      type="number"
                      id="payment_year"
                      value={paymentForm.payment_year}
                      onChange={(e) => setPaymentForm({ 
                        ...paymentForm, 
                        payment_year: e.target.value,
                        payment_month: e.target.value // Also set payment_month for consistency
                      })}
                      required
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 5}
                    />
                  </div>
                )}

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
                  <label htmlFor="currency">Currency</label>
                  <select
                    id="currency"
                    value={paymentForm.currency}
                    onChange={(e) => {
                      const currency = e.target.value as 'ETB' | 'USD';
                      setPaymentForm({ ...paymentForm, currency });
                    }}
                    required
                    style={{ marginBottom: '1rem' }}
                  >
                    <option value="ETB">ETB (Ethiopian Birr)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder={paymentForm.currency === 'ETB' ? 'min 50 birr' : 'min 1 usd'}
                    step="0.01"
                    min="0"
                    required
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#f3f4f6',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
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
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td>{formatMonth(payment.payment_month)}</td>
                            <td>{formatDate(payment.payment_date)}</td>
                            <td>{String(payment.amount || 'N/A')} {payment.currency || 'ETB'}</td>
                            <td>
                              {payment.payment_method === 'bank_transfer' ? (
                                <span>🏦 Bank Transfer</span>
                              ) : payment.payment_method === 'cash' ? (
                                <span>💵 Cash</span>
                              ) : payment.payment_method === 'mobile_money' ? (
                                <span>📱 Mobile Money</span>
                              ) : (
                                <span>📄 Other</span>
                              )}
                            </td>
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
                            <span className="payment-item-mobile-detail-value">
                              {String(payment.amount || 'N/A')} {payment.currency || 'ETB'}
                            </span>
                          </div>
                          <div className="payment-item-mobile-detail">
                            <span className="payment-item-mobile-detail-label">Method:</span>
                            <span className="payment-item-mobile-detail-value">
                              {payment.payment_method === 'bank_transfer' ? (
                                '🏦 Bank Transfer'
                              ) : payment.payment_method === 'cash' ? (
                                '💵 Cash'
                              ) : payment.payment_method === 'mobile_money' ? (
                                '📱 Mobile Money'
                              ) : (
                                '📄 Other'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </MemberProtectedRoute>
  );
};

export default MemberPayments;

