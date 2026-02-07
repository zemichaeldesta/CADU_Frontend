import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { galleryAPI, GalleryVideo, GalleryTag } from '../api/gallery';
import './Resources.css';
import './Gallery.css';

type SortBy = 'name' | 'date';

const IconVideo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="5" width="15" height="14" rx="2" />
    <path d="m21 7-5 3 5 3Z" />
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

  const getEmbedUrl = (url: string | null): string | null => {
    if (!url) return null;
    // YouTube
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = url.includes('youtu.be/')
        ? url.split('youtu.be/')[1].split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    // Vimeo
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1].split('?')[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    // Direct video URL
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return url;
    }
    return null;
  };

const Videos: React.FC = () => {
  const { language } = useLanguage();
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [tags, setTags] = useState<GalleryTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videosLoading, setVideosLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<GalleryVideo | null>(null);
  const [failedThumbnailIds, setFailedThumbnailIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let isActive = true;
    const loadTags = async () => {
      try {
        const data = await galleryAPI.getVideoTags();
        if (!isActive) return;
        setTags(data.results);
        // Don't auto-select a tag - let user choose or show all videos
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
    setVideosLoading(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const params: any = {};
        // Only filter by tag if one is selected
        if (selectedTagId !== null) {
          params.tags = selectedTagId;
        }
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }
        const data = await galleryAPI.getVideos(params);
        if (!isActive) return;
        const loadedVideos = Array.isArray(data) ? data : (data.results || []);
        // Filter out videos immediately - we'll still show them even without thumbnails
        // but we won't store videos that are completely invalid
        const validVideos = loadedVideos.filter(video => 
          video && video.title && video.title.trim() !== ''
        );
        setVideos(validVideos);
        // Clear failed thumbnail IDs when new videos are loaded
        setFailedThumbnailIds(new Set());
      } catch (error) {
        console.error('Failed to load videos:', error);
        setVideos([]);
      } finally {
        if (isActive) setVideosLoading(false);
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [selectedTagId, searchTerm]);

  const sortedVideos = useMemo(() => {
    let items = [...videos];
    
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
  }, [videos, sortBy, sortDesc]);

  const handleTagClick = (id: number | null) => {
    setSelectedTagId(id);
    setSearchTerm('');
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  const handleVideoClick = (video: GalleryVideo) => {
    setSelectedVideo(video);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  const currentItemsCount = sortedVideos.length;
  const showLoadingState = videosLoading && sortedVideos.length === 0;

    return (
    <>
      <div className="resources-page archive-explorer-page">
        <div className="container">
          <div className="archive-explorer-card">
            {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}
            <div className={`archive-explorer-layout ${selectedVideo ? 'has-video-player' : ''}`}>
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
                        <span className="category-name">{language === 'am' ? 'ሁሉም ቪዲዮዎች' : 'All Videos'}</span>
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
                  {currentItemsCount} {currentItemsCount === 1 ? 'video' : 'videos'}
                </div>
              </aside>

              <section className={`archive-content ${selectedVideo ? 'with-video-player' : ''}`}>
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

              {/* Video Player - Below Search Bar */}
              {selectedVideo && (
                <div className="video-player-container">
                  <div className="video-player-content">
                    {selectedVideo.video_file_url ? (
                      <video
                        controls
                        autoPlay
                        style={{ width: '100%', height: '100%' }}
                      >
                        <source src={selectedVideo.video_file_url} type="video/mp4" />
                        <source src={selectedVideo.video_file_url} type="video/webm" />
                        Your browser does not support the video tag.
                      </video>
                    ) : selectedVideo.video_url ? (
                      (() => {
                        const embedUrl = getEmbedUrl(selectedVideo.video_url);
                        if (embedUrl) {
                          if (embedUrl.includes('youtube.com/embed') || embedUrl.includes('vimeo.com/video')) {
                            return (
                              <iframe
                                src={embedUrl}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ width: '100%', height: '100%' }}
                              />
                            );
                          } else {
                            return (
                              <video
                                controls
                                autoPlay
                                style={{ width: '100%', height: '100%' }}
                              >
                                <source src={embedUrl} type="video/mp4" />
                                <source src={embedUrl} type="video/webm" />
                                Your browser does not support the video tag.
                              </video>
                            );
                          }
                        }
                        return <p>Invalid video URL</p>;
                      })()
                    ) : (
                      <p>No video available</p>
                    )}
                  </div>
                  <div className="video-player-header">
                    <h3 className="video-player-title">{selectedVideo.title}</h3>
                    <button className="video-player-close" onClick={closeVideoModal}>
                      <IconClose />
                    </button>
                  </div>
                  {selectedVideo.description && (
                    <div className="video-player-description">
                      <p>{selectedVideo.description}</p>
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
                  ) : sortedVideos.length === 0 ? (
                    <div className="empty-state">
                      <IconVideo className="empty-icon" />
                      <p className="title">{language === 'am' ? 'ቪዲዮዎች አልተገኙም' : 'No videos found'}</p>
                      <p>{language === 'am' ? 'ምንም ቪዲዮዎች አልተገኙም።' : 'No videos match your filters.'}</p>
                    </div>
                  ) : (
                    sortedVideos.map((video) => (
                      <div
                        key={video.id}
                        className="document-card video-card"
                        onClick={() => handleVideoClick(video)}
                      >
                        <div className="card-image">
                          {video.thumbnail_url && video.thumbnail_url.trim() !== '' && !failedThumbnailIds.has(video.id) ? (
                            <img 
                              src={video.thumbnail_url} 
                              alt={video.title} 
                              loading="lazy"
                              onError={() => {
                                setFailedThumbnailIds(prev => new Set(prev).add(video.id));
                              }}
                            />
                          ) : (
                            <div className="card-icon">
                              <IconVideo className="icon icon-orange" />
                            </div>
                          )}
                        </div>
                        <p className="card-title">{video.title}</p>
                        {video.description && <p className="card-meta">{video.description}</p>}
                      </div>
                    ))
                  )}
                </div>

                <footer className="status-bar">
                  <span>{currentItemsCount} {language === 'am' ? 'ቪዲዮዎች' : 'videos'}</span>
                  <span className="status-connection">{language === 'am' ? 'ተገናኝቷል' : 'Connected'}</span>
                </footer>
              </section>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default Videos;
