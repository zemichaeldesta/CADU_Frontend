import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ username, password });
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      
      // Fetch user info to cache admin status
      try {
        const userInfo = await authAPI.getUserInfo();
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        
        if (!userInfo.is_admin) {
          setError('You do not have admin permissions. Please contact an administrator.');
          authAPI.logout();
          return;
        }
      } catch (userInfoError: any) {
        console.error('Failed to fetch user info:', userInfoError);
        // Continue anyway - backend will handle permission checks
      }
      
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Left Column - Login Form */}
      <div className="admin-login-left">
        <div className="admin-login-container">
          {/* Logo */}
          <div className="admin-login-logo">
            <img src={`${process.env.PUBLIC_URL || ''}/cadu.png`} alt="CADU Logo" />
            <span>CADU</span>
          </div>

          {/* Back to Home Link */}
          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <Link 
              to="/" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#27ae60'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Welcome Section */}
          <div className="admin-login-header">
            <h1>Welcome Back!</h1>
            <p>Sign in to access your admin dashboard and manage the website.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="admin-login-form">
            {error && (
              <div className="admin-login-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="admin-login-field">
              <label htmlFor="username">Username</label>
              <div className="admin-login-input-wrapper">
                <svg className="admin-login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="admin-login-field">
              <label htmlFor="password">Password</label>
              <div className="admin-login-input-wrapper">
                <svg className="admin-login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="admin-login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button type="submit" className="admin-login-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="admin-login-spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Back to Home Button */}
            <button 
              type="button"
              className="admin-login-back-home"
              onClick={() => navigate('/')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Back to Home
            </button>
          </form>
        </div>
      </div>

      {/* Right Column - Promotional Content */}
      <div className="admin-login-right">
        <div className="admin-login-promo">
          <h2>Admin Login</h2>
          
          <div className="admin-login-stats">
            <h3>EXPLORE OUR SITE</h3>
            <div className="admin-login-partners">
              <Link to="/" className="admin-login-partner-logo">Home</Link>
              <Link to="/gallery" className="admin-login-partner-logo">Gallery</Link>
              <Link to="/contact" className="admin-login-partner-logo">Contact Us</Link>
              <Link to="/resources" className="admin-login-partner-logo">Resources</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
