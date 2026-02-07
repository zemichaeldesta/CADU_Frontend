import React, { useEffect, useState } from 'react';
import { zohoEmailAPI, ZohoEmailConfig as ZohoEmailConfigType, ZohoEmailConfigUpdate } from '../../api/zohoEmail';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';

const ZohoEmailConfig: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [config, setConfig] = useState<ZohoEmailConfigType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [formData, setFormData] = useState<ZohoEmailConfigUpdate>({
    host: 'smtp.zoho.com',
    port: 587,
    user: 'kirosdesta@cadu-ardu.com',
    password: '',
    use_tls: true,
    use_ssl: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await zohoEmailAPI.getConfig();
      setConfig(data);
      setFormData({
        host: data.host,
        port: data.port,
        user: data.user,
        password: '', // Don't load password
        use_tls: data.use_tls,
        use_ssl: data.use_ssl,
      });
    } catch (error: any) {
      console.error('Failed to load Zoho config:', error);
      showError('Failed to load Zoho email configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (name === 'port' ? parseInt(value) || 587 : value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);
    try {
      const result = await zohoEmailAPI.updateConfig(formData);
      // If we get here, validation was successful (errors throw exceptions)
      if (result.message) {
        showSuccess('Configuration validated and SMTP connection test successful! Please update your .env file with the provided values and restart the server.');
        setTestResult({
          success: true,
          message: result.message + '\n\n' + result.instructions.join('\n') + '\n\n' + result.note,
        });
      } else {
        throw new Error('Validation failed');
      }
    } catch (error: any) {
      console.error('Failed to update Zoho config:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to validate configuration';
      showError(errorMessage);
      setTestResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const emailToTest = testEmail.trim() || undefined;
      const result = await zohoEmailAPI.testEmail(emailToTest);
      if (result.success) {
        showSuccess(result.message || 'Test email sent successfully!');
        setTestResult({
          success: true,
          message: result.message || 'Test email sent successfully!',
        });
      } else {
        showError(result.error || 'Failed to send test email');
        setTestResult({
          success: false,
          error: result.error || 'Failed to send test email',
        });
      }
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      showError(error.response?.data?.error || 'Failed to send test email');
      setTestResult({
        success: false,
        error: error.response?.data?.error || 'Failed to send test email',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Zoho Email Configuration" subtitle="Configure and test Zoho email SMTP settings">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Zoho Email Configuration" subtitle="Configure and test Zoho email SMTP settings">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Instructions Section */}
        <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid #bae6fd' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#0369a1' }}>Setup Instructions</h3>
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '0.375rem', border: '1px solid #fcd34d' }}>
            <strong style={{ color: '#92400e' }}>Important for Free Accounts:</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#78350f', fontSize: '0.875rem' }}>
              IMAP and POP are not available on free Zoho accounts, but you don't need them! 
              SMTP (for sending emails) is available and that's all you need for this website.
            </p>
          </div>
          <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e' }}>
            <li style={{ marginBottom: '0.5rem' }}>Log in to your Zoho Mail account</li>
            <li style={{ marginBottom: '0.5rem' }}>Go to Settings → Security → App Passwords</li>
            <li style={{ marginBottom: '0.5rem' }}>Generate an App Password for SMTP access</li>
            <li style={{ marginBottom: '0.5rem' }}>Use the SMTP settings below to configure your email</li>
            <li style={{ marginBottom: '0.5rem' }}>Enter your Zoho email address (e.g., kirosdesta@cadu-ardu.com)</li>
            <li>After updating your .env file, restart the Django server</li>
          </ol>
        </div>

        {/* Configuration Status */}
        {config && (
          <div style={{ 
            background: config.configured ? '#f0fdf4' : '#fef2f2', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            marginBottom: '2rem',
            border: `1px solid ${config.configured ? '#86efac' : '#fca5a5'}` 
          }}>
            <strong style={{ color: config.configured ? '#166534' : '#991b1b' }}>
              Status: {config.configured ? '✓ Configured' : '✗ Not Configured'}
            </strong>
            {config.configured && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#166534', fontSize: '0.875rem' }}>
                Zoho email is configured and ready to use. You can send a test email below.
              </p>
            )}
            {!config.configured && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#991b1b', fontSize: '0.875rem' }}>
                Please configure Zoho email settings below and update your .env file.
              </p>
            )}
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>SMTP Configuration</h3>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="host" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              SMTP Host *
            </label>
            <input
              type="text"
              id="host"
              name="host"
              value={formData.host}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
            />
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>Default: smtp.zoho.com</small>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="port" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Port *
            </label>
            <select
              id="port"
              name="port"
              value={formData.port}
              onChange={(e) => {
                const newPort = parseInt(e.target.value);
                setFormData({
                  ...formData,
                  port: newPort,
                  use_tls: newPort === 587,
                  use_ssl: newPort === 465,
                });
              }}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
            >
              <option value={587}>587 (TLS - Recommended)</option>
              <option value={465}>465 (SSL)</option>
              <option value={25}>25 (Standard SMTP)</option>
            </select>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {formData.port === 587 && 'Use TLS encryption'}
              {formData.port === 465 && 'Use SSL encryption'}
              {formData.port === 25 && 'Standard SMTP (may require authentication)'}
            </small>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="user" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Email Address *
            </label>
            <input
              type="email"
              id="user"
              name="user"
              value={formData.user}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
            />
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>Your Zoho email address (e.g., kirosdesta@cadu-ardu.com) - use the exact address from your Zoho account</small>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Password / App Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your Zoho password or app password"
                style={{ width: '100%', padding: '0.75rem', paddingRight: '3rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Your Zoho account password or app-specific password (recommended)
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="use_tls"
                checked={formData.use_tls}
                onChange={handleChange}
                disabled={formData.port === 465}
              />
              <span>Use TLS encryption</span>
            </label>
            {formData.port === 465 && (
              <small style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                TLS is automatically disabled when using port 465 (SSL)
              </small>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="use_ssl"
                checked={formData.use_ssl}
                onChange={handleChange}
                disabled={formData.port === 587}
              />
              <span>Use SSL encryption</span>
            </label>
            {formData.port === 587 && (
              <small style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                SSL is automatically enabled when using port 465
              </small>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.75rem 2rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Validating...' : 'Validate Configuration'}
            </button>
          </div>
        </form>

        {/* Test Email Section */}
        {config && config.configured && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Test Email</h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Send a test email to verify your Zoho email configuration is working correctly.
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="test-email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Email Address (optional)
              </label>
              <input
                type="email"
                id="test-email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Leave empty to send to your admin email"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
              />
              <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                If left empty, the test email will be sent to your admin account email address.
              </small>
            </div>
            <button
              onClick={handleTestEmail}
              disabled={testing}
              style={{
                padding: '0.75rem 2rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: testing ? 'not-allowed' : 'pointer',
                opacity: testing ? 0.6 : 1,
              }}
            >
              {testing ? 'Sending...' : 'Send Test Email'}
            </button>

            {testResult && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: testResult.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${testResult.success ? '#86efac' : '#fca5a5'}`,
                borderRadius: '0.375rem',
                whiteSpace: 'pre-wrap',
              }}>
                {testResult.success ? (
                  <div style={{ color: '#166534' }}>
                    <strong>✓ Success:</strong> {testResult.message}
                  </div>
                ) : (
                  <div style={{ color: '#991b1b' }}>
                    <strong>✗ Error:</strong> {testResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Configuration Validation Result */}
        {testResult && testResult.success && testResult.message && testResult.message.includes('ZOHO_EMAIL') && (
          <div style={{ marginTop: '2rem', background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#0369a1' }}>Next Steps</h3>
            <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #bae6fd' }}>
              <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#0369a1' }}>Step 1: Update .env File</h4>
              <p style={{ color: '#0c4a6e', marginBottom: '1rem' }}>
                Copy the environment variables shown above and add them to your <code style={{ background: '#e0f2fe', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>.env</code> file located at:
              </p>
              <code style={{ 
                display: 'block', 
                background: '#1e293b', 
                color: '#f1f5f9', 
                padding: '1rem', 
                borderRadius: '0.375rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                overflowX: 'auto'
              }}>
                /home/zemichael/Desktop/Touch_Authentication_Data_Server/caduardu-website/backend/.env
              </code>
            </div>
            
            <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #86efac' }}>
              <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#166534' }}>Step 2: Restart Django Server</h4>
              <p style={{ color: '#166534', marginBottom: '1rem' }}>
                After updating the .env file, restart your Django server:
              </p>
              <code style={{ 
                display: 'block', 
                background: '#1e293b', 
                color: '#f1f5f9', 
                padding: '1rem', 
                borderRadius: '0.375rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                sudo systemctl restart caduardu
              </code>
            </div>

            <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #fcd34d' }}>
              <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#92400e' }}>Step 3: Test Email Sending</h4>
              <p style={{ color: '#78350f', margin: 0 }}>
                After restarting, come back to this page and click "Send Test Email" to verify everything is working correctly.
              </p>
            </div>
          </div>
        )}

        {/* Current Configuration Display */}
        {config && (
          <div style={{ marginTop: '2rem', background: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem' }}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Current Configuration</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <strong>Host:</strong> {config.host}
              </div>
              <div>
                <strong>Port:</strong> {config.port}
              </div>
              <div>
                <strong>User:</strong> {config.user}
              </div>
              <div>
                <strong>TLS:</strong> {config.use_tls ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>SSL:</strong> {config.use_ssl ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Status:</strong> {config.configured ? 'Configured' : 'Not Configured'}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ZohoEmailConfig;

