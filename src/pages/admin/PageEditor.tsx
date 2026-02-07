import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cmsAPI, Page } from '../../api/cms';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';

const PageEditor: React.FC = () => {
  const { pageType } = useParams<{ pageType: string }>();
  const { showSuccess, showError } = useToast();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleEn, setTitleEn] = useState('');
  const [titleAm, setTitleAm] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentAm, setContentAm] = useState('');

  // Configure ReactQuill modules and formats
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'blockquote', 'code-block'
  ];

  useEffect(() => {
    const loadPage = async () => {
      if (!pageType) {
        setLoading(false);
        setPage(null);
        setError('No page type specified');
        return;
      }
      try {
        setLoading(true);
        setPage(null); // Reset page state
        setError(null); // Reset error state
        const data = await cmsAPI.getAdminPage(pageType);
        setPage(data);
        setTitleEn(data.title_en || '');
        setTitleAm(data.title_am || '');
        setContentEn(data.content_en || '');
        setContentAm(data.content_am || '');
        setError(null);
      } catch (error: any) {
        console.error('Failed to load page:', error);
        console.error('Error response:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        setPage(null); // Ensure page is null on error
        const errorMessage = error.response?.status === 404
          ? `Page "${pageType}" not found. Please create it first.`
          : error.response?.data?.detail 
          || error.response?.data?.message
          || error.message
          || 'Failed to load page. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageType]); // Only depend on pageType to avoid re-renders

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      // Build update payload with only the fields we want to update
      // Exclude read-only fields: id, created_at, updated_at
      // Exclude nested objects: hero_image (use hero_image_id instead), sections (use section_ids instead)
      const updateData: any = {
        title_en: titleEn,
        title_am: titleAm,
        content_en: contentEn,
        content_am: contentAm,
      };
      
      // Include other fields if they exist
      if (page.is_published !== undefined) updateData.is_published = page.is_published;
      
      // Only include hero_image_id if hero_image exists and has an id
      if (page.hero_image && typeof page.hero_image === 'object' && page.hero_image.id) {
        updateData.hero_image_id = page.hero_image.id;
      } else if (!page.hero_image) {
        // Explicitly set to null if no hero image
        updateData.hero_image_id = null;
      }
      
      // Only include section_ids if sections exist
      if (page.sections && Array.isArray(page.sections) && page.sections.length > 0) {
        updateData.section_ids = page.sections
          .map((s: any) => (typeof s === 'object' && s.id ? s.id : s))
          .filter((id: any) => id != null);
      } else {
        // Explicitly set to empty array if no sections
        updateData.section_ids = [];
      }
      
      await cmsAPI.updatePage(page.page_type, updateData);
      showSuccess('Page saved successfully!');
      
      // Reload the page to get updated data
      const updatedPage = await cmsAPI.getAdminPage(page.page_type);
      setPage(updatedPage);
      setTitleEn(updatedPage.title_en || '');
      setTitleAm(updatedPage.title_am || '');
      setContentEn(updatedPage.content_en || '');
      setContentAm(updatedPage.content_am || '');
    } catch (error: any) {
      console.error('Failed to save page:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message
        || (error.response?.data && typeof error.response.data === 'object' 
            ? JSON.stringify(error.response.data)
            : error.message)
        || 'Failed to save page. Please try again.';
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Page Editor" subtitle="Loading page content...">
        <div className="admin-loading" style={{ textAlign: 'center', padding: '3rem' }}>
          Loading page...
        </div>
      </AdminLayout>
    );
  }

  if (error || !page || !pageType) {
    return (
      <AdminLayout 
        title={error ? "Error Loading Page" : "Page Not Found"} 
        subtitle={error || `The page "${pageType}" doesn't exist`}
      >
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
            {error ? 'Error Loading Page' : 'Page Not Found'}
          </h3>
          <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
            {error || `The page type "${pageType}" either doesn't exist or couldn't be loaded. Please create it first from the Page Manager.`}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/admin/pages" className="action-btn edit">
              Go to Page Manager
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="action-btn"
              style={{ background: '#f3f4f6', border: '1px solid #d1d5db' }}
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`Edit ${page?.title_en || page?.page_type || 'Page'}`}
      subtitle="Edit page content using the rich text editors below"
      actionButton={
        <button onClick={handleSave} disabled={saving} className="new-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {saving ? 'Saving...' : 'Save'}
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '600px' }}>
        {/* Title Section */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem', background: 'white' }}>
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Page Titles (Hero Section)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                English Title *
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Enter English title (shown in hero section)"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                Amharic Title
              </label>
              <input
                type="text"
                value={titleAm}
                onChange={(e) => setTitleAm(e.target.value)}
                placeholder="Enter Amharic title (shown when Amharic is selected)"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem', background: 'white' }}>
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>English Content</h2>
          <div style={{ minHeight: '400px', background: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
            <ReactQuill
              theme="snow"
              value={contentEn || ''}
              onChange={setContentEn}
              modules={quillModules}
              formats={quillFormats}
              style={{ 
                height: '400px',
                background: 'white'
              }}
              placeholder="Enter English content here..."
            />
          </div>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem', background: 'white' }}>
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>Amharic Content</h2>
          <div style={{ minHeight: '400px', background: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
            <ReactQuill
              theme="snow"
              value={contentAm || ''}
              onChange={setContentAm}
              modules={quillModules}
              formats={quillFormats}
              style={{ 
                height: '400px',
                background: 'white'
              }}
              placeholder="Enter Amharic content here..."
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PageEditor;

