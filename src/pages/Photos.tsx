import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { galleryAPI, GalleryPhoto, GalleryTag } from '../api/gallery';
import './Resources.css';
import './Gallery.css';

type SortBy = 'name' | 'date';

const IconImage: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);


const IconMenu: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

const IconClose: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
  // Check if it's a valid URL format
  try {
    new URL(trimmed);
    return true;
  } catch {
    // If not a full URL, check if it's a relative path that looks valid
    return trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://');
  }
};

const Photos: React.FC = () => {
  const { language } = useLanguage();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [tags, setTags] = useState<GalleryTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let isActive = true;
    const loadTags = async () => {
      try {
        const data = await galleryAPI.getPhotoTags();
        if (!isActive) return;
        setTags(data.results);
        // Don't auto-select a tag - let user choose or show all photos
      } catch (error) {
        console.error('Failed to load tags:', error);
      } finally {
        if (isActive) setTagsLoading(false);
      }
    };
    loadTags();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    setPhotosLoading(true);
    const timeoutId = window.setTimeout(async () => {
    try {
        const params: any = {};
        if (selectedTagId !== null) {
          params.tags = selectedTagId;
        }
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }
        const data = await galleryAPI.getPhotos(params);
        if (!isActive) return;
      const loadedPhotos = Array.isArray(data) ? data : (data.results || []);
      // Filter out photos with invalid URLs immediately - don't store them in state
      const validPhotos = loadedPhotos.filter(photo => isValidImageUrl(photo.photo_url));
      setPhotos(validPhotos);
      // Clear failed image IDs when new photos are loaded
      setFailedImageIds(new Set());
    } catch (error) {
      console.error('Failed to load photos:', error);
      setPhotos([]);
    } finally {
        if (isActive) setPhotosLoading(false);
    }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [selectedTagId, searchTerm]);

  const sortedPhotos = useMemo(() => {
    // Filter out photos with invalid URLs or failed image loads
    let items = photos.filter(photo => 
      isValidImageUrl(photo.photo_url) && 
      !failedImageIds.has(photo.id)
    );
    
    return items.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.title.toLowerCase();
        const nameB = b.title.toLowerCase();
        return sortDesc ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
      }
      const dateA = new Date(a.uploaded_at || '').getTime();
      const dateB = new Date(b.uploaded_at || '').getTime();
      return sortDesc ? dateB - dateA : dateA - dateB;
    });
  }, [photos, sortBy, sortDesc, failedImageIds]);

  const handleTagClick = (id: number | null) => {
    setSelectedTagId(id);
    setSearchTerm('');
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  const handlePhotoClick = (photo: GalleryPhoto) => {
    // Only allow selecting photos with valid URLs that haven't failed to load
    if (isValidImageUrl(photo.photo_url) && !failedImageIds.has(photo.id)) {
      setSelectedPhoto(photo);
    }
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  const getTagName = (id: number | null) => {
    if (id === null) return '';
    const tag = tags.find((t) => t.id === id);
    return tag ? tag.name : '';
  };

  // Count photos per tag
  const getTagPhotoCount = (tagId: number) => {
    // This is approximate - we'd need to fetch all photos to get exact count
    // For now, return empty or fetch separately if needed
    return '';
  };

  const currentItemsCount = sortedPhotos.length;
  const showLoadingState = photosLoading && sortedPhotos.length === 0;

  return (
    <div className="resources-page archive-explorer-page">
      <div className="container">
        <div className="archive-explorer-card">
          {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}
          <div className={`archive-explorer-layout ${selectedPhoto ? 'has-video-player' : ''}`}>
            <aside className={`archive-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
              <div className="sidebar-header">
                <span>Categories</span>
                <button className="unstyled-button close" onClick={() => setMobileMenuOpen(false)}>
                  <IconClose />
                </button>
            </div>
              <div className="sidebar-body">
                <div className="sidebar-folders">
                  {tagsLoading && tags.length === 0 && (
                    <p className="sidebar-hint">Loading categories...</p>
                  )}
                  {!tagsLoading && tags.length === 0 && (
                    <p className="sidebar-hint">No categories found.</p>
                  )}
                  {!tagsLoading && (
                    <div
                      className={`category-item ${selectedTagId === null ? 'active' : ''}`}
                      onClick={() => handleTagClick(null)}
                    >
                      <span className="category-name">{language === 'am' ? 'ሁሉም ፎቶዎች' : 'All Photos'}</span>
                    </div>
                  )}
                  {tags.map((tag) => {
                    const isSelected = selectedTagId === tag.id;
                    return (
                      <div
                        key={tag.id}
                        className={`category-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleTagClick(tag.id)}
                      >
                        <span className="category-name">{tag.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="sidebar-footer">
                {currentItemsCount} {currentItemsCount === 1 ? 'photo' : 'photos'}
              </div>
            </aside>

            <section className={`archive-content ${selectedPhoto ? 'with-video-player' : ''}`}>
              <header className="explorer-toolbar">
                <div className="toolbar-left">
                  <button className="unstyled-button mobile-menu" onClick={() => setMobileMenuOpen(true)}>
                    <IconMenu />
                  </button>
                  <input
                    type="text"
                    className="search-input-minimal"
                    placeholder={language === 'am' ? 'ፈልግ...' : 'Search...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </header>

              {/* Photo Viewer - Below Search Bar */}
              {selectedPhoto && isValidImageUrl(selectedPhoto.photo_url) && !failedImageIds.has(selectedPhoto.id) && (
                <div className="video-player-container">
                  <div className="video-player-content">
                    <img 
                      src={selectedPhoto.photo_url} 
                      alt={selectedPhoto.alt_text || selectedPhoto.title}
                      onError={() => {
                        setFailedImageIds(prev => new Set(prev).add(selectedPhoto.id));
                        setSelectedPhoto(null);
                      }}
                    />
                  </div>
                  <div className="video-player-header">
                    <h3 className="video-player-title">{selectedPhoto.title}</h3>
                    <button className="video-player-close" onClick={closePhotoModal}>
                      <IconClose />
                    </button>
                  </div>
                  {selectedPhoto.caption && (
                    <div className="video-player-description">
                      <p>{selectedPhoto.caption}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="documents-area grid-mode">
                {showLoadingState ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <p>{language === 'am' ? 'በመጫን ላይ...' : 'Loading...'}</p>
                  </div>
                ) : sortedPhotos.length === 0 ? (
                  <div className="empty-state">
                    <IconImage className="empty-icon" />
                    <p className="title">{language === 'am' ? 'ፎቶዎች አልተገኙም' : 'No photos found'}</p>
                    <p>{language === 'am' ? 'ምንም ፎቶዎች አልተገኙም።' : 'No photos match your filters.'}</p>
                  </div>
                ) : (
                  sortedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="document-card photo-card"
                      onClick={() => handlePhotoClick(photo)}
                    >
                      <div className="card-image">
                        <img 
                          src={photo.photo_url} 
                          alt={photo.alt_text || photo.title}
                          loading="lazy"
                          onError={(e) => {
                            // Hide the image immediately
                            (e.target as HTMLImageElement).style.display = 'none';
                            // Hide the entire card immediately using data attribute
                            const card = (e.target as HTMLImageElement).closest('.photo-card');
                            if (card) {
                              (card as HTMLElement).setAttribute('data-image-error', 'true');
                              (card as HTMLElement).style.display = 'none';
                            }
                            // Mark as failed for state management
                            setFailedImageIds(prev => new Set(prev).add(photo.id));
                          }}
                        />
                      </div>
                      <p className="card-title">{photo.title}</p>
                      {photo.caption && <p className="card-meta">{photo.caption}</p>}
            </div>
                  ))
          )}
              </div>

              <footer className="status-bar">
                <span>{currentItemsCount} {language === 'am' ? 'ፎቶዎች' : 'photos'}</span>
                <span className="status-connection">{language === 'am' ? 'ተገናኝቷል' : 'Connected'}</span>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Photos;
