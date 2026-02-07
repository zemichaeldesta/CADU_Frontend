import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cmsAPI, Page } from '../../api/cms';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';

const PAGE_TYPES = [
  { value: 'home', label: 'Home' },
  { value: 'about', label: 'About Us' },
  { value: 'programs', label: 'Programs' },
  { value: 'initiatives', label: 'Initiatives' },
  { value: 'resources', label: 'Resources' },
  { value: 'news', label: 'News & Events' },
  { value: 'contact', label: 'Contact Us' },
];

const PageManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPageType, setSelectedPageType] = useState('');

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const data = await cmsAPI.getAdminPages();
      setPages(data.results);
    } catch (error) {
      console.error('Failed to load pages:', error);
      showError('Failed to load pages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedPageType) {
      showError('Please select a page type');
      return;
    }

    // Check if page already exists
    const existingPage = pages.find(p => p.page_type === selectedPageType);
    if (existingPage) {
      showError(`Page type "${selectedPageType}" already exists. Please edit the existing page instead.`);
      return;
    }

    try {
      const pageTypeInfo = PAGE_TYPES.find(pt => pt.value === selectedPageType);
      await cmsAPI.createPage({
        page_type: selectedPageType,
        title_en: pageTypeInfo?.label || selectedPageType,
        title_am: '',
        content_en: '',
        content_am: '',
        is_published: false,
      });
      showSuccess('Page created successfully! Redirecting to editor...');
      setTimeout(() => {
        window.location.href = `/admin/pages/${selectedPageType}`;
      }, 1000);
    } catch (error: any) {
      console.error('Failed to create page:', error);
      if (error.response?.status === 400 && error.response?.data?.page_type) {
        showError('This page type already exists. Please edit the existing page instead.');
      } else {
        showError(error.response?.data?.detail || 'Failed to create page. Please try again.');
      }
    }
  };

  const existingPageTypes = pages.map(p => p.page_type);
  const availablePageTypes = PAGE_TYPES.filter(pt => !existingPageTypes.includes(pt.value));

  if (loading) {
    return (
      <AdminLayout title="Page Manager" subtitle="Manage website pages and content">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Page Manager"
      subtitle="Manage website pages and content"
    >

      {showCreate && availablePageTypes.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Create New Page</h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Select a page type to create. Pages that already exist cannot be created again.</p>
          <div className="form-group">
            <label>Page Type *</label>
            <select
              value={selectedPageType}
              onChange={(e) => setSelectedPageType(e.target.value)}
            >
              <option value="">-- Select Page Type --</option>
              {availablePageTypes.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleCreate} className="submit-btn" disabled={!selectedPageType}>
            Create Page
          </button>
        </div>
      )}

      {availablePageTypes.length === 0 && !showCreate && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fde047' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>All available page types have been created. You can edit existing pages below.</p>
        </div>
      )}

      <h2 className="section-title">Existing Pages</h2>
      {pages.length === 0 ? (
        <div className="empty-state">
          <p>No pages created yet. Create your first page above.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td className="font-medium">{page.title_en || page.page_type}</td>
                  <td className="text-sm text-gray-600">{page.page_type}</td>
                  <td>
                    <span className={`status-badge ${page.is_published ? 'published' : 'draft'}`}>
                      {page.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">
                    {(() => {
                      const dateStr = page.updated_at || page.created_at;
                      return dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
                    })()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/pages/${page.page_type}`} className="action-btn edit">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default PageManager;

