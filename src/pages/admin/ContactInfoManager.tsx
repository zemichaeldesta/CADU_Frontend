import React, { useEffect, useState } from 'react';
import { cmsAPI, ContactInfo } from '../../api/cms';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';

const ContactInfoManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address_en: '',
    address_am: '',
    description_en: '',
    description_am: '',
  });

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      const data = await cmsAPI.getAdminContactInfo();
      setContactInfo(data);
      setFormData({
        email: data.email || '',
        phone: data.phone || '',
        address_en: data.address_en || '',
        address_am: data.address_am || '',
        description_en: data.description_en || '',
        description_am: data.description_am || '',
      });
    } catch (error: any) {
      console.error('Failed to load contact info:', error);
      showError('Failed to load contact information');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await cmsAPI.updateContactInfo(formData);
      setContactInfo(updated);
      showSuccess('Contact information updated successfully!');
    } catch (error: any) {
      console.error('Failed to update contact info:', error);
      showError(error.response?.data?.detail || 'Failed to update contact information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Contact Information" subtitle="Manage contact information displayed on the contact page">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Contact Information" subtitle="Manage contact information displayed on the contact page">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Phone
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="address_en" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Address (English) *
            </label>
            <input
              type="text"
              id="address_en"
              name="address_en"
              value={formData.address_en}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="address_am" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Address (Amharic)
            </label>
            <input
              type="text"
              id="address_am"
              name="address_am"
              value={formData.address_am}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="description_en" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Description (English)
            </label>
            <textarea
              id="description_en"
              name="description_en"
              value={formData.description_en}
              onChange={handleChange}
              rows={4}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem', fontFamily: 'inherit' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="description_am" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Description (Amharic)
            </label>
            <textarea
              id="description_am"
              name="description_am"
              value={formData.description_am}
              onChange={handleChange}
              rows={4}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '1rem', fontFamily: 'inherit' }}
            />
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {contactInfo && contactInfo.updated_at && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f3f4f6', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Last updated: {new Date(contactInfo.updated_at).toLocaleString()}
              {contactInfo.updated_by_name && ` by ${contactInfo.updated_by_name}`}
            </div>
          )}
        </form>
      </div>
    </AdminLayout>
  );
};

export default ContactInfoManager;

