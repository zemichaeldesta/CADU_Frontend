import React, { useEffect, useState } from 'react';
import { cmsAPI, Image } from '../../api/cms';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import apiClient from '../../api/client';
import imageCompression from 'browser-image-compression';
import '../../components/AdminLayout.css';

const ImageManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    alt_text: '',
    caption: '',
    file: null as File | null,
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const data = await cmsAPI.getImages();
      setImages(data.results);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    // Only compress if file is larger than 1MB
    if (file.size < 1024 * 1024) {
      return file;
    }

    const options = {
      maxSizeMB: 2, // Max file size in MB after compression
      maxWidthOrHeight: 1920, // Max dimension (maintains aspect ratio)
      useWebWorker: true, // Use web worker for better performance
      quality: 0.85, // Quality (0-1), 0.85 is a good balance
      fileType: file.type, // Preserve original file type
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
      const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
      
      // Image compression completed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${reduction}% reduction)
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed, using original:', error);
      return file; // Fallback to original if compression fails
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return;

    setUploading(true);
    try {
      // Compress image before upload
      const compressedFile = await compressImage(uploadData.file);
      
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('alt_text', uploadData.alt_text);
      formData.append('caption', uploadData.caption);
      formData.append('image', compressedFile);

      await cmsAPI.uploadImage(formData);
      setShowUpload(false);
      setUploadData({ title: '', alt_text: '', caption: '', file: null });
      loadImages();
      showSuccess('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      showError(error.response?.data?.detail || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await apiClient.delete(`/admin/images/${id}/`);
      showSuccess('Image deleted successfully');
      loadImages();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to delete image');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Image Manager" subtitle="Manage image library and uploads">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Image Manager"
      subtitle="Manage image library and uploads"
      actionButton={
        <button onClick={() => setShowUpload(!showUpload)} className="new-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {showUpload ? 'Cancel' : 'Upload Image'}
        </button>
      }
    >

      {showUpload && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Upload New Image</h3>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Alt Text</label>
              <input
                type="text"
                value={uploadData.alt_text}
                onChange={(e) => setUploadData({ ...uploadData, alt_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Caption</label>
              <textarea
                value={uploadData.caption}
                onChange={(e) => setUploadData({ ...uploadData, caption: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Image File</label>
              <input type="file" accept="image/*" onChange={handleFileChange} required />
            </div>
            <button type="submit" disabled={uploading} className="submit-btn">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

      <h2 className="section-title">Images</h2>
      {images.length === 0 ? (
        <div className="empty-state">No images found. Upload your first image above.</div>
      ) : (
        <div className="images-grid">
          {images.map((image) => (
            <div key={image.id} className="image-card">
              <img src={image.image} alt={image.alt_text || image.title} className="image-preview" />
              <div className="image-actions">
                <div className="image-name">{image.title || image.alt_text || 'Untitled'}</div>
                <div className="image-buttons">
                  <button className="action-btn small">Use</button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="action-btn small delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default ImageManager;

