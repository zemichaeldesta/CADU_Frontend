import React, { useEffect, useState, useRef } from 'react';
import { galleryAPI, GalleryPhoto, GalleryVideo, GalleryTag } from '../../api/gallery';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import imageCompression from 'browser-image-compression';
import '../../components/AdminLayout.css';
import './GalleryManager.css';

type ViewType = 'photos' | 'videos' | 'tags';

const GalleryManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [viewType, setViewType] = useState<ViewType>('photos');
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryPhoto | GalleryVideo | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [availablePhotoTags, setAvailablePhotoTags] = useState<GalleryTag[]>([]);
  const [availableVideoTags, setAvailableVideoTags] = useState<GalleryTag[]>([]);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [createTagType, setCreateTagType] = useState<'photo' | 'video'>('photo');
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set());
  
  // Refs for file inputs to reset them after upload
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const videoThumbnailInputRef = useRef<HTMLInputElement>(null);
  
  const [photoData, setPhotoData] = useState({
    title: '',
    alt_text: '',
    caption: '',
    description: '',
    is_published: true,
    file: null as File | null,
    selectedTags: [] as number[],
  });

  const [videoData, setVideoData] = useState({
    title: '',
    video_url: '',
    video_file: null as File | null,
    description: '',
    is_published: true,
    thumbnail: null as File | null,
    selectedTags: [] as number[],
  });

  useEffect(() => {
    loadAllData();
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const [photoTagsData, videoTagsData] = await Promise.all([
        galleryAPI.getPhotoTags(),
        galleryAPI.getVideoTags(),
      ]);
      setAvailablePhotoTags(photoTagsData.results);
      setAvailableVideoTags(videoTagsData.results);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      showError('Tag name is required');
      return;
    }

    setCreatingTag(true);
    try {
      let newTag: GalleryTag;
      // Determine tag type based on viewType or createTagType
      const tagType = viewType === 'photos' ? 'photo' : (viewType === 'videos' ? 'video' : createTagType);
      
      if (tagType === 'photo') {
        newTag = await galleryAPI.createPhotoTag(newTagName.trim());
        setAvailablePhotoTags([...availablePhotoTags, newTag]);
      } else {
        newTag = await galleryAPI.createVideoTag(newTagName.trim());
        setAvailableVideoTags([...availableVideoTags, newTag]);
      }
      setNewTagName('');
      setShowCreateTag(false);
      showSuccess(`${tagType === 'photo' ? 'Photo' : 'Video'} tag created successfully!`);
    } catch (error: any) {
      console.error('Failed to create tag:', error);
      showError(error.response?.data?.name?.[0] || error.response?.data?.detail || 'Failed to create tag. Please try again.');
    } finally {
      setCreatingTag(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPhotos(), loadVideos()]);
    } catch (error) {
      console.error('Failed to load gallery data:', error);
    } finally {
      setLoading(false);
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

  const loadPhotos = async () => {
    try {
      const response = await galleryAPI.getAdminPhotos();
      console.log('Admin photos API response:', response);
      // Handle both array and paginated responses
      let loadedPhotos: GalleryPhoto[] = [];
      if (Array.isArray(response)) {
        loadedPhotos = response;
      } else if (response && typeof response === 'object') {
        // Handle paginated response {results: [], count: number}
        loadedPhotos = response.results || [];
      }
      console.log('Loaded photos after processing:', loadedPhotos);
      // Filter out any null/undefined items and ensure we have valid photos
      const validPhotos = loadedPhotos.filter(photo => photo && photo.id);
      console.log('Valid photos after filtering:', validPhotos);
      // Sort by ID descending (newest first)
      validPhotos.sort((a, b) => (b.id || 0) - (a.id || 0));
      setPhotos(validPhotos);
      // Clear failed image IDs for newly loaded photos
      setFailedImageIds(new Set());
    } catch (error: any) {
      console.error('Failed to load photos:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Don't clear photos on error, keep existing ones
      showError('Failed to load photos. Please refresh the page.');
    }
  };

  const loadVideos = async () => {
    try {
      const response = await galleryAPI.getAdminVideos();
      console.log('Admin videos API response:', response);
      // Handle both array and paginated responses
      let loadedVideos: GalleryVideo[] = [];
      if (Array.isArray(response)) {
        loadedVideos = response;
      } else if (response && typeof response === 'object') {
        // Handle paginated response {results: [], count: number}
        loadedVideos = response.results || [];
      }
      console.log('Loaded videos after processing:', loadedVideos);
      // Filter out any null/undefined items and ensure we have valid videos
      const validVideos = loadedVideos.filter(video => video && video.id);
      console.log('Valid videos after filtering:', validVideos);
      // Sort by ID descending (newest first)
      validVideos.sort((a, b) => (b.id || 0) - (a.id || 0));
      setVideos(validVideos);
      // Clear failed image IDs for newly loaded videos
      setFailedImageIds(new Set());
    } catch (error: any) {
      console.error('Failed to load videos:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Don't clear videos on error, keep existing ones
      showError('Failed to load videos. Please refresh the page.');
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoData({ ...photoData, file: e.target.files[0] });
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoData({ ...videoData, video_file: e.target.files[0] });
    }
  };

  const handleVideoThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoData({ ...videoData, thumbnail: e.target.files[0] });
    }
  };

  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoData.file) {
      showError('Please select a photo file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      // Compress image before upload
      const compressedFile = await compressImage(photoData.file);
      
      const formData = new FormData();
      formData.append('title', photoData.title);
      formData.append('alt_text', photoData.alt_text);
      formData.append('caption', photoData.caption);
      formData.append('description', photoData.description);
      formData.append('is_published', photoData.is_published.toString());
      formData.append('photo', compressedFile);
      photoData.selectedTags.forEach((tagId) => {
        formData.append('tags', tagId.toString());
      });

      const newPhoto = await galleryAPI.createPhoto(formData, (progressEvent) => {
        if (!progressEvent.total) return;
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setShowUpload(false);
      setPhotoData({
        title: '',
        alt_text: '',
        caption: '',
        description: '',
        is_published: true,
        file: null,
        selectedTags: [],
      });
      // Reset file input
      if (photoFileInputRef.current) {
        photoFileInputRef.current.value = '';
      }
      // Reload photos from server to get fresh data with proper URLs
      await loadPhotos();
      showSuccess('Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.photo?.[0] ||
                          error.response?.data?.title?.[0] ||
                          error.message ||
                          'Failed to upload photo. Please try again.';
      showError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoData.video_url && !videoData.video_file) {
      showError('Please either enter a video URL or upload a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('title', videoData.title);
      if (videoData.video_url) {
        formData.append('video_url', videoData.video_url);
      }
      if (videoData.video_file) {
        formData.append('video_file', videoData.video_file);
      }
      formData.append('description', videoData.description);
      formData.append('is_published', videoData.is_published.toString());
      if (videoData.thumbnail) {
        // Compress thumbnail before upload
        const compressedThumbnail = await compressImage(videoData.thumbnail);
        formData.append('thumbnail', compressedThumbnail);
      }
      videoData.selectedTags.forEach((tagId) => {
        formData.append('tags', tagId.toString());
      });

      await galleryAPI.createVideo(formData, (progressEvent) => {
        if (!progressEvent.total) return;
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setShowUpload(false);
      setVideoData({
        title: '',
        video_url: '',
        video_file: null,
        description: '',
        is_published: true,
        thumbnail: null,
        selectedTags: [],
      });
      // Reset file inputs
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
      if (videoThumbnailInputRef.current) {
        videoThumbnailInputRef.current.value = '';
      }
      await loadVideos();
      showSuccess('Video added successfully!');
    } catch (error: any) {
      console.error('Failed to upload video:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.video_file?.[0] ||
                          error.response?.data?.video_url?.[0] ||
                          error.response?.data?.title?.[0] ||
                          error.message ||
                          'Failed to add video. Please try again.';
      showError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePhoto = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    
    // Close edit form and clear selected item immediately if this item is selected
    if (selectedItem && (selectedItem as GalleryPhoto).id === id) {
      setShowEdit(false);
      setSelectedItem(null);
    }
    
    // Store the photo to restore if deletion fails
    const photoToDelete = photos.find(p => p.id === id);
    
    // Remove from UI immediately for better UX
    setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== id));
    
    try {
      await galleryAPI.deletePhoto(id);
      showSuccess('Photo deleted successfully');
      
      // Remove from failed image IDs if present
      setFailedImageIds(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
      
      // Ensure edit form is closed and selected item is cleared
      setShowEdit(false);
      setSelectedItem(null);
      
      // Reload photos from server to ensure UI is in sync
      // Use a small delay to ensure backend has finished processing
      setTimeout(async () => {
        try {
          await loadPhotos();
        } catch (reloadError) {
          console.error('Failed to reload photos after deletion:', reloadError);
          // Silent fail - deletion already succeeded
        }
      }, 500);
    } catch (error: any) {
      // Restore the photo if deletion failed
      if (photoToDelete) {
        setPhotos(prevPhotos => {
          // Check if photo is already in the list
          if (prevPhotos.find(p => p.id === id)) {
            return prevPhotos;
          }
          const restored = [...prevPhotos, photoToDelete];
          restored.sort((a, b) => (b.id || 0) - (a.id || 0));
          return restored;
        });
      }
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to delete photo. Please try again.';
      showError(errorMessage);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    
    // Close edit form and clear selected item immediately if this item is selected
    if (selectedItem && (selectedItem as GalleryVideo).id === id) {
      setShowEdit(false);
      setSelectedItem(null);
    }
    
    // Store the video to restore if deletion fails
    const videoToDelete = videos.find(v => v.id === id);
    
    // Remove from UI immediately for better UX
    setVideos(prevVideos => prevVideos.filter(v => v.id !== id));
    
    try {
      await galleryAPI.deleteVideo(id);
      showSuccess('Video deleted successfully');
      
      // Remove from failed image IDs if present
      setFailedImageIds(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
      
      // Ensure edit form is closed and selected item is cleared
      setShowEdit(false);
      setSelectedItem(null);
      
      // Reload videos from server to ensure UI is in sync
      // Use a small delay to ensure backend has finished processing
      setTimeout(async () => {
        try {
          await loadVideos();
        } catch (reloadError) {
          console.error('Failed to reload videos after deletion:', reloadError);
          // Silent fail - deletion already succeeded
        }
      }, 500);
    } catch (error: any) {
      // Restore the video if deletion failed
      if (videoToDelete) {
        setVideos(prevVideos => {
          // Check if video is already in the list
          if (prevVideos.find(v => v.id === id)) {
            return prevVideos;
          }
          const restored = [...prevVideos, videoToDelete];
          restored.sort((a, b) => (b.id || 0) - (a.id || 0));
          return restored;
        });
      }
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to delete video. Please try again.';
      showError(errorMessage);
    }
  };

  const handleDeleteTag = async (id: number, tagType: 'photo' | 'video') => {
    const tags = tagType === 'photo' ? availablePhotoTags : availableVideoTags;
    const tag = tags.find(t => t.id === id);
    if (!tag) return;
    
    // Count usage
    const photoCount = tagType === 'photo' ? photos.filter(p => p.tags?.includes(id)).length : 0;
    const videoCount = tagType === 'video' ? videos.filter(v => v.tags?.includes(id)).length : 0;
    const totalUsage = photoCount + videoCount;
    
    if (totalUsage > 0) {
      const message = `This tag is used by ${totalUsage} item(s) (${photoCount} photo(s), ${videoCount} video(s)).\n\nRemoving the tag will unlink it from all items. Do you want to continue?`;
      if (!window.confirm(message)) return;
    } else {
      if (!window.confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) return;
    }
    
    try {
      if (tagType === 'photo') {
        await galleryAPI.deletePhotoTag(id);
        setAvailablePhotoTags(availablePhotoTags.filter(t => t.id !== id));
      } else {
        await galleryAPI.deleteVideoTag(id);
        setAvailableVideoTags(availableVideoTags.filter(t => t.id !== id));
      }
      showSuccess('Tag deleted successfully');
      // Reload photos and videos to update tag references
      loadAllData();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to delete tag');
    }
  };

  const getTagUsage = (tagId: number, tagType: 'photo' | 'video') => {
    const photoCount = tagType === 'photo' ? photos.filter(p => p.tags?.includes(tagId)).length : 0;
    const videoCount = tagType === 'video' ? videos.filter(v => v.tags?.includes(tagId)).length : 0;
    return { photoCount, videoCount, total: photoCount + videoCount };
  };

  const handleEditPhoto = (photo: GalleryPhoto) => {
    setSelectedItem(photo);
    setPhotoData({
      title: photo.title,
      alt_text: photo.alt_text,
      caption: photo.caption,
      description: photo.description,
      is_published: photo.is_published,
      file: null,
      selectedTags: photo.tags || [],
    });
    setShowEdit(true);
  };

  const handleEditVideo = (video: GalleryVideo) => {
    setSelectedItem(video);
    setVideoData({
      title: video.title,
      video_url: video.video_url || '',
      video_file: null,
      description: video.description,
      is_published: video.is_published,
      thumbnail: null,
      selectedTags: video.tags || [],
    });
    setShowEdit(true);
  };

  const handleUpdatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('title', photoData.title);
      formData.append('alt_text', photoData.alt_text);
      formData.append('caption', photoData.caption);
      formData.append('description', photoData.description);
      formData.append('is_published', photoData.is_published.toString());
      if (photoData.file) {
        // Compress image before upload if new file is provided
        const compressedFile = await compressImage(photoData.file);
        formData.append('photo', compressedFile);
      }
      photoData.selectedTags.forEach((tagId) => {
        formData.append('tags', tagId.toString());
      });

      await galleryAPI.updatePhoto(selectedItem.id, formData, (progressEvent) => {
        if (!progressEvent.total) return;
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setShowEdit(false);
      setSelectedItem(null);
      loadPhotos();
      showSuccess('Photo updated successfully!');
    } catch (error: any) {
      console.error('Failed to update photo:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.photo?.[0] ||
                          error.response?.data?.title?.[0] ||
                          error.message ||
                          'Failed to update photo. Please try again.';
      showError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('title', videoData.title);
      if (videoData.video_url) {
        formData.append('video_url', videoData.video_url);
      }
      if (videoData.video_file) {
        formData.append('video_file', videoData.video_file);
      }
      formData.append('description', videoData.description);
      formData.append('is_published', videoData.is_published.toString());
      if (videoData.thumbnail) {
        // Compress thumbnail before upload
        const compressedThumbnail = await compressImage(videoData.thumbnail);
        formData.append('thumbnail', compressedThumbnail);
      }
      videoData.selectedTags.forEach((tagId) => {
        formData.append('tags', tagId.toString());
      });

      await galleryAPI.updateVideo(selectedItem.id, formData, (progressEvent) => {
        if (!progressEvent.total) return;
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setShowEdit(false);
      setSelectedItem(null);
      loadVideos();
      showSuccess('Video updated successfully!');
    } catch (error: any) {
      console.error('Failed to update video:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.video_file?.[0] ||
                          error.response?.data?.video_url?.[0] ||
                          error.response?.data?.title?.[0] ||
                          error.message ||
                          'Failed to update video. Please try again.';
      showError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Gallery Manager" subtitle="Manage photos and videos">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Gallery Manager"
      subtitle="Manage photos and videos"
      actionButton={
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => { setShowCreateTag(!showCreateTag); setShowUpload(false); setShowEdit(false); }} 
            className="new-button"
            style={{ background: '#f59e0b', color: 'white' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            {showCreateTag ? 'Cancel' : 'Create Tag'}
          </button>
          <button onClick={() => { setShowUpload(!showUpload); setShowEdit(false); setShowCreateTag(false); }} className="new-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {showUpload ? 'Cancel' : `Add ${viewType === 'photos' ? 'Photo' : 'Video'}`}
        </button>
        </div>
      }
    >
      <div className="gallery-manager">
        {showCreateTag && (
          <div className="upload-form" style={{ marginBottom: '1.5rem' }}>
            <h3>Create New Tag</h3>
            <form onSubmit={handleCreateTag}>
              <div className="form-group">
                <label>Tag Name *</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name"
                  required
                  disabled={creatingTag}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => { setShowCreateTag(false); setNewTagName(''); }}
                  className="action-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTag || !newTagName.trim()}
                  className="action-btn accept"
                >
                  {creatingTag ? 'Creating...' : 'Create Tag'}
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="gallery-tabs">
          <button
            className={`gallery-tab ${viewType === 'photos' ? 'active' : ''}`}
            onClick={() => { setViewType('photos'); setShowUpload(false); setShowEdit(false); setShowCreateTag(false); }}
          >
            Photos ({photos.length})
          </button>
          <button
            className={`gallery-tab ${viewType === 'videos' ? 'active' : ''}`}
            onClick={() => { setViewType('videos'); setShowUpload(false); setShowEdit(false); setShowCreateTag(false); }}
          >
            Videos ({videos.length})
          </button>
          <button
            className={`gallery-tab ${viewType === 'tags' ? 'active' : ''}`}
            onClick={() => { setViewType('tags'); setShowUpload(false); setShowEdit(false); setShowCreateTag(false); }}
          >
            Tags ({availablePhotoTags.length + availableVideoTags.length})
          </button>
        </div>

        {(showUpload || showEdit) && (
          <div className="upload-form">
            <h3>{showEdit ? 'Edit' : 'Add'} {viewType === 'photos' ? 'Photo' : 'Video'}</h3>
            {viewType === 'photos' ? (
              <form onSubmit={showEdit ? handleUpdatePhoto : handleUploadPhoto}>
                {uploading && (
                  <div className="upload-progress">
                    <div className="upload-progress-header">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="upload-progress-bar">
                      <div
                        className="upload-progress-bar-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={photoData.title}
                    onChange={(e) => setPhotoData({ ...photoData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Photo {showEdit ? '(leave empty to keep current)' : '*'}</label>
                  <input
                    ref={photoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    required={!showEdit}
                  />
                </div>
                <div className="form-group">
                  <label>Alt Text</label>
                  <input
                    type="text"
                    value={photoData.alt_text}
                    onChange={(e) => setPhotoData({ ...photoData, alt_text: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Caption</label>
                  <input
                    type="text"
                    value={photoData.caption}
                    onChange={(e) => setPhotoData({ ...photoData, caption: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={photoData.description}
                    onChange={(e) => setPhotoData({ ...photoData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Tags</label>
                  <div className="tag-selection">
                    {availablePhotoTags.map((tag) => (
                      <label key={tag.id} className="tag-checkbox">
                        <input
                          type="checkbox"
                          checked={photoData.selectedTags.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPhotoData({
                                ...photoData,
                                selectedTags: [...photoData.selectedTags, tag.id],
                              });
                            } else {
                              setPhotoData({
                                ...photoData,
                                selectedTags: photoData.selectedTags.filter((id) => id !== tag.id),
                              });
                            }
                          }}
                        />
                        <span>{tag.name}</span>
                      </label>
                    ))}
                    {availablePhotoTags.length === 0 && (
                      <p className="tag-hint">No tags available. Click "Create Tag" button to add one.</p>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={photoData.is_published}
                      onChange={(e) => {
                        e.stopPropagation();
                        setPhotoData({ ...photoData, is_published: e.target.checked });
                      }}
                    />
                    {' '}Published
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => { setShowUpload(false); setShowEdit(false); setSelectedItem(null); }} className="action-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading} className="action-btn accept">
                    {uploading ? 'Saving...' : (showEdit ? 'Update' : 'Upload')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={showEdit ? handleUpdateVideo : handleUploadVideo}>
                {uploading && (
                  <div className="upload-progress">
                    <div className="upload-progress-header">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="upload-progress-bar">
                      <div
                        className="upload-progress-bar-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={videoData.title}
                    onChange={(e) => setVideoData({ ...videoData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Video File (Upload MP4, WebM, etc.)</label>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                  />
                  {videoData.video_file && (
                    <p className="file-info">Selected: {videoData.video_file.name}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>OR Video URL (YouTube, Vimeo, or direct video URL)</label>
                  <input
                    type="url"
                    value={videoData.video_url}
                    onChange={(e) => setVideoData({ ...videoData, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <small>Either upload a file or provide a URL (at least one is required)</small>
                </div>
                <div className="form-group">
                  <label>Thumbnail {showEdit ? '(leave empty to keep current)' : '(optional)'}</label>
                  <input
                    ref={videoThumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleVideoThumbnailChange}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={videoData.description}
                    onChange={(e) => setVideoData({ ...videoData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Tags</label>
                  <div className="tag-selection">
                    {availableVideoTags.map((tag) => (
                      <label key={tag.id} className="tag-checkbox">
                        <input
                          type="checkbox"
                          checked={videoData.selectedTags.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVideoData({
                                ...videoData,
                                selectedTags: [...videoData.selectedTags, tag.id],
                              });
                            } else {
                              setVideoData({
                                ...videoData,
                                selectedTags: videoData.selectedTags.filter((id) => id !== tag.id),
                              });
                            }
                          }}
                        />
                        <span>{tag.name}</span>
                      </label>
                    ))}
                    {availableVideoTags.length === 0 && (
                      <p className="tag-hint">No tags available. Click "Create Tag" button to add one.</p>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={videoData.is_published}
                      onChange={(e) => {
                        e.stopPropagation();
                        setVideoData({ ...videoData, is_published: e.target.checked });
                      }}
                    />
                    {' '}Published
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => { setShowUpload(false); setShowEdit(false); setSelectedItem(null); }} className="action-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading} className="action-btn accept">
                    {uploading ? 'Saving...' : (showEdit ? 'Update' : 'Add')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {viewType === 'photos' && (
          <div className="gallery-grid">
            {photos.filter(photo => 
              photo && 
              photo.id && 
              !failedImageIds.has(photo.id)
            ).length === 0 ? (
              <div className="empty-state">No photos found. Upload your first photo!</div>
            ) : (
              photos
                .filter(photo => 
                  photo && 
                  photo.id && 
                  !failedImageIds.has(photo.id)
                )
                .map((photo) => (
                <div key={photo.id} className="gallery-item">
                  {photo.photo_url ? (
                    <img 
                      src={photo.photo_url} 
                      alt={photo.alt_text || photo.title}
                      onError={() => {
                        setFailedImageIds(prev => new Set(prev).add(photo.id));
                      }}
                    />
                  ) : (
                    <div className="gallery-item-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                      <p>No image</p>
                    </div>
                  )}
                  <div className="gallery-item-info">
                    <h4>{photo.title}</h4>
                    {photo.caption && <p>{photo.caption}</p>}
                    <div className="gallery-item-actions">
                      <button onClick={() => handleEditPhoto(photo)} className="action-btn edit">
                        Edit
                      </button>
                      <button onClick={() => handleDeletePhoto(photo.id)} className="action-btn delete">
                        Delete
                      </button>
                    </div>
                    <div className="gallery-item-status">
                      <span className={`status-badge ${photo.is_published ? 'published' : 'draft'}`}>
                        {photo.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {viewType === 'videos' && (
          <div className="gallery-grid">
            {videos.filter(video => !failedImageIds.has(video.id)).length === 0 ? (
              <div className="empty-state">No videos found. Add your first video!</div>
            ) : (
              videos
                .filter(video => !failedImageIds.has(video.id))
                .map((video) => (
                <div key={video.id} className="gallery-item">
                  {video.thumbnail_url && video.thumbnail_url.trim() !== '' ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      onError={() => {
                        setFailedImageIds(prev => new Set(prev).add(video.id));
                      }}
                    />
                  ) : (
                    <div className="video-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  )}
                  <div className="gallery-item-info">
                    <h4>{video.title}</h4>
                    {video.description && <p>{video.description}</p>}
                    <div className="gallery-item-actions">
                      <button onClick={() => handleEditVideo(video)} className="action-btn edit">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteVideo(video.id)} className="action-btn delete">
                        Delete
                      </button>
                    </div>
                    <div className="gallery-item-status">
                      <span className={`status-badge ${video.is_published ? 'published' : 'draft'}`}>
                        {video.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {viewType === 'tags' && (
          <div className="tags-table-container">
            <div className="tags-table-header">
              <h3>Gallery Tags</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => { setCreateTagType('photo'); setShowCreateTag(true); }}
                  className="action-btn accept"
                >
                  + Create Photo Tag
                </button>
                <button
                  onClick={() => { setCreateTagType('video'); setShowCreateTag(true); }}
                  className="action-btn accept"
                  style={{ background: '#2563eb' }}
                >
                  + Create Video Tag
                </button>
              </div>
            </div>
            
            {showCreateTag && (
              <div className="create-tag-form">
                <h4>Create New {createTagType === 'photo' ? 'Photo' : 'Video'} Tag</h4>
                <form onSubmit={handleCreateTag}>
                  <div className="form-group">
                    <label>Tag Name *</label>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Enter tag name"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => { setShowCreateTag(false); setNewTagName(''); }}
                      className="action-btn"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={creatingTag} className="action-btn accept">
                      {creatingTag ? 'Creating...' : `Create ${createTagType === 'photo' ? 'Photo' : 'Video'} Tag`}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {availablePhotoTags.length === 0 && availableVideoTags.length === 0 ? (
              <div className="empty-state">No tags found. Create your first tag!</div>
            ) : (
              <>
                {availablePhotoTags.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#111827' }}>Photo Tags</h4>
                    <table className="tags-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Used by Photos</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availablePhotoTags.map((tag) => {
                          const usage = getTagUsage(tag.id, 'photo');
                          return (
                            <tr key={`photo-${tag.id}`}>
                              <td>{tag.id}</td>
                              <td><strong>{tag.name}</strong></td>
                              <td>{usage.photoCount}</td>
                              <td>
                                <button
                                  onClick={() => handleDeleteTag(tag.id, 'photo')}
                                  className="action-btn delete"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {availableVideoTags.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '1rem', color: '#111827' }}>Video Tags</h4>
                    <table className="tags-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Used by Videos</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableVideoTags.map((tag) => {
                          const usage = getTagUsage(tag.id, 'video');
                          return (
                            <tr key={`video-${tag.id}`}>
                              <td>{tag.id}</td>
                              <td><strong>{tag.name}</strong></td>
                              <td>{usage.videoCount}</td>
                              <td>
                                <button
                                  onClick={() => handleDeleteTag(tag.id, 'video')}
                                  className="action-btn delete"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GalleryManager;

