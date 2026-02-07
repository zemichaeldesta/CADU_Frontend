import React, { useState, useEffect } from 'react';
import { authAPI, UserInfo } from '../api/auth';
import { paymentsAPI, MonthlyPayment } from '../api/payments';
import { useToast } from '../context/ToastContext';
import './AccountManagement.css';

const AccountManagement: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const info = await authAPI.getUserInfo();
        setUserInfo(info);
        localStorage.setItem('user_info', JSON.stringify(info));
        
        const paymentData = await paymentsAPI.getMyPayments();
        setPayments(paymentData);
      } catch (error: any) {
        console.error('Failed to load account data:', error);
        if (error.response?.status === 401) {
          authAPI.logout();
          window.location.href = '/member-login';
        } else {
          showError('Failed to load account data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showError]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showError('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      showSuccess('Password changed successfully');
      setPasswordForm({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
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

  const getPaymentSummary = () => {
    const totalPayments = payments.length;
    const verifiedPayments = payments.filter(p => p.is_verified).length;
    const lastPayment = payments.length > 0 
      ? payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]
      : null;
    
    return {
      total: totalPayments,
      verified: verifiedPayments,
      pending: totalPayments - verifiedPayments,
      lastPaymentDate: lastPayment ? formatDate(lastPayment.payment_date) : 'N/A',
    };
  };

  if (loading) {
    return (
      <div className="account-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading account information...</p>
      </div>
    );
  }

  const paymentSummary = getPaymentSummary();
  const displayName = userInfo?.first_name && userInfo?.last_name
    ? `${userInfo.first_name} ${userInfo.last_name}`
    : userInfo?.username || 'Member';

  return (
    <div className="account-management">
      <div className="account-management-container">
        <h1>My Account</h1>
        
        {/* Account Information Section */}
        <div className="account-section">
          <h2>Account Information</h2>
          <div className="account-info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <p>{displayName}</p>
            </div>
            <div className="info-item">
              <label>Username</label>
              <p>{userInfo?.username || 'N/A'}</p>
            </div>
            <div className="info-item">
              <label>Email</label>
              <p>{userInfo?.email || 'N/A'}</p>
            </div>
            <div className="info-item">
              <label>Role</label>
              <p>{userInfo?.role || 'Member'}</p>
            </div>
            {userInfo?.member_type && userInfo.member_type !== 'regular' && (
              <div className="info-item">
                <label>Status</label>
                <p className="executive-badge">
                  {userInfo.member_type === 'executive' && 'Executive Member'}
                  {userInfo.member_type === 'general_assembly' && 'General Assembly Member'}
                  {userInfo.member_type === 'honorary' && 'Honorary Member'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Section */}
        <div className="account-section">
          <h2>Change Password</h2>
          <form onSubmit={handlePasswordChange} className="password-change-form">
            <div className="form-group">
              <label htmlFor="old_password">Current Password</label>
              <input
                type="password"
                id="old_password"
                value={passwordForm.old_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                required
                placeholder="Enter your current password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="new_password">New Password</label>
              <input
                type="password"
                id="new_password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                required
                minLength={8}
                placeholder="Enter your new password (min 8 characters)"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm_password">Confirm New Password</label>
              <input
                type="password"
                id="confirm_password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                required
                minLength={8}
                placeholder="Confirm your new password"
              />
            </div>
            <button type="submit" className="submit-button" disabled={changingPassword}>
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Payment Summary Section */}
        <div className="account-section">
          <h2>Payment Summary</h2>
          <div className="payment-summary-grid">
            <div className="summary-card">
              <h3>Total Payments</h3>
              <p className="summary-value">{paymentSummary.total}</p>
            </div>
            <div className="summary-card verified">
              <h3>Verified</h3>
              <p className="summary-value">{paymentSummary.verified}</p>
            </div>
            <div className="summary-card pending">
              <h3>Pending</h3>
              <p className="summary-value">{paymentSummary.pending}</p>
            </div>
            <div className="summary-card">
              <h3>Last Payment</h3>
              <p className="summary-value">{paymentSummary.lastPaymentDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;

