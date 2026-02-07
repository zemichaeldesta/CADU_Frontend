import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { archiveAPI, ArchiveDocument, ArchiveCategory, ArchiveSearchParams } from '../api/archive';
import { authAPI, UserInfo } from '../api/auth';
import { buildCategoryTree, CategoryNode } from '../utils/categoryTree';
import './Resources.css';

type ViewMode = 'list' | 'grid';
type SortBy = 'name' | 'date';

interface ArchiveCategoryNode extends CategoryNode<ArchiveCategory> {
  children: ArchiveCategoryNode[];
}

interface IconProps {
  className?: string;
}

const IconFolder: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a3 3 0 0 1-3 3H5a2 2 0 0 1-2-2Z" />
  </svg>
);

const IconFolderOpen: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7" />
    <path d="M3 7h4a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H3l-2 6h15l2-6" />
  </svg>
);

const IconFile: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
  </svg>
);

const IconFileText: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
);

const IconImage: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
    <path d="m16 21-3-3-2 2-2-2" />
  </svg>
);

const IconVideo: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="5" width="15" height="14" rx="2" />
    <path d="m21 7-5 3 5 3Z" />
  </svg>
);

const IconMusic: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const IconDownload: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
);

const IconChevronRight: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const IconChevronDown: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconGrid: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconList: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
  </svg>
);

const IconMenu: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

const IconClose: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const formatFileSize = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const getDocumentTitle = (doc: ArchiveDocument, language: string) => {
  if (language === 'am' && doc.title_am) return doc.title_am;
  return doc.title_en || doc.title_am || 'Untitled';
};

const getFileIcon = (type?: string) => {
  switch (type) {
    case 'pdf':
      return <IconFileText className="icon icon-red" />;
    case 'doc':
    case 'docx':
      return <IconFileText className="icon icon-blue" />;
    case 'image':
      return <IconImage className="icon icon-purple" />;
    case 'video':
      return <IconVideo className="icon icon-orange" />;
    case 'audio':
      return <IconMusic className="icon icon-gold" />;
    default:
      return <IconFile className="icon icon-gray" />;
  }
};

const fileTypeOptions = [
  { value: '', label: 'All File Types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'doc', label: 'Word Documents' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
];

interface ResourcesProps {
  memberMode?: boolean;
  visibilityFilter?: 'public' | 'member' | 'general_assembly' | 'executive';
  usePersonalResources?: boolean;
}

const Resources: React.FC<ResourcesProps> = ({ 
  memberMode: propMemberMode = false,
  visibilityFilter,
  usePersonalResources = false
}) => {
  const { language, t } = useLanguage();
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [categories, setCategories] = useState<ArchiveCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [fileType, setFileType] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  
  // Load user info to check executive status
  useEffect(() => {
    const loadUserInfo = () => {
      if (authAPI.isAuthenticated()) {
        try {
          const userInfoStr = localStorage.getItem('user_info');
          if (userInfoStr) {
            const info: UserInfo = JSON.parse(userInfoStr);
            setUserInfo(info);
          } else {
            // Fetch if not cached
            authAPI.getUserInfo().then(info => {
              setUserInfo(info);
              localStorage.setItem('user_info', JSON.stringify(info));
            }).catch(() => {
              // Ignore errors
            });
          }
        } catch (e) {
          // Ignore errors
        }
      } else {
        setUserInfo(null);
      }
    };

    loadUserInfo();
    
    // Listen for auth changes
    const handleAuthChange = () => {
      loadUserInfo();
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'user_info' || e.key === 'access_token') {
        loadUserInfo();
      }
    });

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  // Determine if we should use member mode
  // Only use member mode if explicitly set via prop (for member dashboard)
  // Main Resources page should always use public mode
  const memberMode = useMemo(() => {
    return propMemberMode || false;
  }, [propMemberMode]);

  // Subfolders of the currently selected category (for main list view)
  const currentSubfolders = useMemo(() => {
    // When "All Files" is selected, show all parent categories (root categories)
    if (selectedCategoryId === null) {
      return categoryTree.filter(cat => !cat.parent || cat.parent === null);
    }

    const findNode = (nodes: CategoryNode[]): CategoryNode | null => {
      for (const node of nodes) {
        if (node.id === selectedCategoryId) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
      return null;
    };

    const node = findNode(categoryTree);
    return node ? node.children : [];
  }, [categoryTree, selectedCategoryId]);

  useEffect(() => {
    let isActive = true;
    const loadCategories = async () => {
      try {
        const data = await archiveAPI.getCategories();
        if (!isActive) return;
        setCategories(data.results);
        
        // Find first 3 subcategories (categories with a parent) and expand them
        const subcategories = data.results.filter(cat => cat.parent !== undefined && cat.parent !== null);
        const firstThreeSubcategories = subcategories.slice(0, 3);
        const initialExpanded = new Set<number>();
        
        // Add the first 3 subcategories and their parent categories to expanded set
        firstThreeSubcategories.forEach(cat => {
          if (cat.parent !== undefined && cat.parent !== null) {
            initialExpanded.add(cat.parent); // Expand parent
            initialExpanded.add(cat.id); // Expand subcategory
          }
        });
        
        setExpandedCategories(initialExpanded);
        
        // Always start with "All Files" (null) selected
        setSelectedCategoryId((prev) => {
          if (prev !== null) return prev; // Don't override if already set
          return null; // Always start with All Files
        });
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        if (isActive) setCategoriesLoading(false);
      }
    };
    loadCategories();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    setDocumentsLoading(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const params: ArchiveSearchParams = {};
        
        // Don't filter by category here - we'll show all documents in the tree
        if (searchTerm.trim()) params.search = searchTerm.trim();
        if (fileType) params.file_type = fileType;
        
        let data;
        if (usePersonalResources) {
          // Use personal resources endpoint
          console.log('Loading personal resources');
          data = await archiveAPI.getPersonalResources(params);
        } else if (memberMode) {
          // Use member endpoint with visibility filter
          // Auto-determine visibility filter from userInfo if not provided
          let effectiveVisibilityFilter = visibilityFilter;
          if (!effectiveVisibilityFilter && userInfo?.member_type) {
            effectiveVisibilityFilter = userInfo.member_type === 'executive' ? 'executive' :
                                      userInfo.member_type === 'general_assembly' ? 'general_assembly' :
                                      'member';
          }
          console.log('Loading member documents with visibility filter:', effectiveVisibilityFilter);
          if (effectiveVisibilityFilter) {
            params.visibility = effectiveVisibilityFilter;
          }
          data = await archiveAPI.getMemberDocuments(params);
        } else {
          // Public documents
          console.log('Loading public documents');
          params.visibility = 'public';
          data = await archiveAPI.getDocuments(params);
        }
        if (!isActive) return;
        console.log('Documents loaded:', data.results?.length || 0, 'memberMode:', memberMode);
        setDocuments(data.results || []);
        setDocumentsCount(data.count ?? data.results?.length ?? 0);
      } catch (error) {
        console.error('Failed to load documents:', error);
        if (!isActive) return;
        setDocuments([]);
        setDocumentsCount(0);
      } finally {
        if (isActive) setDocumentsLoading(false);
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [searchTerm, fileType, memberMode, visibilityFilter, usePersonalResources, userInfo]);

  const sortedDocuments = useMemo(() => {
    let items = [...documents];
    
    // Filter by selected category
    if (selectedCategoryId !== null) {
      // Show files in the selected category
      items = items.filter((doc) => {
        const docCategoryId = doc.category_id ?? doc.category?.id ?? null;
        return docCategoryId === selectedCategoryId;
      });
    } else {
      // When "All Files" is selected, show files that belong to parent categories (level 0) OR have no category
      const parentCategoryIds = new Set(
        categoryTree
          .filter(cat => !cat.parent || cat.parent === null)
          .map(cat => cat.id)
      );
      
      items = items.filter((doc) => {
        const docCategoryId = doc.category_id ?? doc.category?.id ?? null;
        // Show files that belong to a parent category OR have no category (null)
        return docCategoryId === null || parentCategoryIds.has(docCategoryId);
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter((doc) => {
        const title = getDocumentTitle(doc, language).toLowerCase();
        return title.includes(searchLower);
      });
    }
    
    // Apply file type filter
    if (fileType) {
      items = items.filter((doc) => doc.file_type === fileType);
    }
    
    return items.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = getDocumentTitle(a, language).toLowerCase();
        const nameB = getDocumentTitle(b, language).toLowerCase();
        return sortDesc ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
      }
      const dateA = new Date(a.created_at || '').getTime();
      const dateB = new Date(b.created_at || '').getTime();
      return sortDesc ? dateB - dateA : dateA - dateB;
    });
  }, [documents, selectedCategoryId, searchTerm, fileType, language, sortBy, sortDesc]);

  const handleDownload = async (doc: ArchiveDocument) => {
    try {
      const blob = memberMode
        ? await archiveAPI.downloadMemberDocument(doc.id)
        : await archiveAPI.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = doc.file?.split('/').pop() || getDocumentTitle(doc, language);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleCategoryClick = (id: number | null) => {
    setSelectedCategoryId(id);
    setSearchTerm('');
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  const toggleCategoryExpand = (event: React.MouseEvent, id: number) => {
    event.stopPropagation();
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getCategoryName = (id: number | null) => {
    if (id === null) return '';
    const category = categories.find((cat) => cat.id === id);
    if (!category) return '';
    if (language === 'am' && category.name_am) return category.name_am;
    return category.name_en;
  };

  // Group documents by category
  const documentsByCategory = useMemo(() => {
    const grouped = new Map<number | null, ArchiveDocument[]>();
    grouped.set(null, []); // For uncategorized documents
    
    documents.forEach((doc) => {
      // Handle both category_id (number) and category (object with id)
      const catId = doc.category_id ?? doc.category?.id ?? null;
      if (!grouped.has(catId)) {
        grouped.set(catId, []);
      }
      grouped.get(catId)!.push(doc);
    });
    
    return grouped;
  }, [documents]);

  const currentItemsCount = sortedDocuments.length;
  const showLoadingState = documentsLoading && sortedDocuments.length === 0;

  const renderCategoryNodes = (nodes: CategoryNode[], depth = 0): React.ReactNode[] => {
    return nodes.map((cat) => {
      const isSelected = selectedCategoryId === cat.id;
      const isExpanded = expandedCategories.has(cat.id);
      const hasChildren = cat.children.length > 0;
      const label = language === 'am' && cat.name_am ? cat.name_am : cat.name_en;
      const categoryFiles = documentsByCategory.get(cat.id) || [];
      const hasFiles = categoryFiles.length > 0;

  return (
        <div key={cat.id} className="folder-node">
          <div
            className={`folder-item ${isSelected ? 'active' : ''} ${hasChildren || hasFiles ? 'has-children' : 'leaf'}`}
            style={{ marginLeft: depth ? `${depth * 0.85}rem` : 0 }}
            onClick={() => handleCategoryClick(cat.id)}
          >
            <div className="tree-branch">
              {(hasChildren || hasFiles) ? (
                <button
                  className="unstyled-button caret"
                  onClick={(event) => toggleCategoryExpand(event, cat.id)}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                </button>
              ) : (
                <span className="caret placeholder" aria-hidden="true" />
              )}
              <span className="folder-icon">
                {(hasChildren || hasFiles) && isExpanded ? <IconFolderOpen /> : <IconFolder />}
              </span>
            </div>
            <span className="folder-name">{label}</span>
            {hasFiles && <span className="file-count">({categoryFiles.length})</span>}
          </div>
          {isExpanded && (
            <div className="folder-children">
              {/* Mix subfolders and files together */}
              {(() => {
                const filteredFiles = categoryFiles.filter((doc) => {
                  const title = getDocumentTitle(doc, language).toLowerCase();
                  const matchesSearch = !searchTerm.trim() || title.includes(searchTerm.toLowerCase());
                  const matchesFileType = !fileType || doc.file_type === fileType;
                  return matchesSearch && matchesFileType;
                });

                // Create a combined list: subfolders as folder items, then files
                const items: React.ReactNode[] = [];
                
                // Add subfolders as folder items
                if (hasChildren) {
                  cat.children.forEach((childCat) => {
                    const childLabel = language === 'am' && childCat.name_am ? childCat.name_am : childCat.name_en;
                    const childFiles = documentsByCategory.get(childCat.id) || [];
                    const childHasFiles = childFiles.length > 0;
                    const childIsExpanded = expandedCategories.has(childCat.id);
                    const childHasChildren = childCat.children.length > 0;
                    
                    items.push(
                      <div key={`subfolder-${childCat.id}`} className="folder-node">
                        <div
                          className={`folder-item ${selectedCategoryId === childCat.id ? 'active' : ''} ${childHasChildren || childHasFiles ? 'has-children' : 'leaf'}`}
                          style={{ marginLeft: 0 }}
                          onClick={() => handleCategoryClick(childCat.id)}
                        >
                          <div className="tree-branch">
                            {(childHasChildren || childHasFiles) ? (
            <button 
                                className="unstyled-button caret"
                                onClick={(event) => toggleCategoryExpand(event, childCat.id)}
                                title={childIsExpanded ? 'Collapse' : 'Expand'}
                              >
                                {childIsExpanded ? <IconChevronDown /> : <IconChevronRight />}
            </button>
                            ) : (
                              <span className="caret placeholder" aria-hidden="true" />
                            )}
                            <span className="folder-icon">
                              {(childHasChildren || childHasFiles) && childIsExpanded ? <IconFolderOpen /> : <IconFolder />}
                            </span>
                          </div>
                          <span className="folder-name">{childLabel}</span>
                          {childHasFiles && <span className="file-count">({childFiles.length})</span>}
                        </div>
                        {childIsExpanded && (
                          <div className="folder-children">
                            {(() => {
                              const childFilteredFiles = childFiles.filter((doc) => {
                                const title = getDocumentTitle(doc, language).toLowerCase();
                                const matchesSearch = !searchTerm.trim() || title.includes(searchTerm.toLowerCase());
                                const matchesFileType = !fileType || doc.file_type === fileType;
                                return matchesSearch && matchesFileType;
                              });

                              const childItems: React.ReactNode[] = [];
                              
                              // Add subfolders of this child
                              if (childHasChildren) {
                                const childNodes = renderCategoryNodes(childCat.children, depth + 1);
                                childItems.push(...childNodes);
                              }
                              
                              // Add files of this child
                              childFilteredFiles.forEach((doc) => {
                                const title = getDocumentTitle(doc, language);
                                childItems.push(
                                  <div
                                    key={`file-${doc.id}`}
                                    className="file-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(doc);
                                    }}
                                    title={title}
                                  >
                                    <span className="file-icon-small">{getFileIcon(doc.file_type)}</span>
                                    <span className="file-name-small">{title}</span>
                                  </div>
                                );
                              });
                              
                              return childItems;
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  });
                }
                
                // Add files as file items
                filteredFiles.forEach((doc) => {
                  const title = getDocumentTitle(doc, language);
                  items.push(
                    <div
                      key={`file-${doc.id}`}
                      className="file-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                      title={title}
                    >
                      <span className="file-icon-small">{getFileIcon(doc.file_type)}</span>
                      <span className="file-name-small">{title}</span>
                    </div>
                  );
                });
                
                return items;
              })()}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="resources-page archive-explorer-page">
      <div className="container">
        <div className="archive-explorer-card">
          {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}
          <div className="archive-explorer-layout">
            <aside className={`archive-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
              <div className="sidebar-header">
                <span>Folders</span>
                <button className="unstyled-button close" onClick={() => setMobileMenuOpen(false)}>
                  <IconClose />
                </button>
              </div>
              <div className="sidebar-body">
                <div className="sidebar-folders">
                  {/* All Files option */}
                  <div
                    className={`folder-root-item ${selectedCategoryId === null ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(null)}
                  >
                    <IconFolder className="folder-root-icon" />
                    <span className="folder-root-name">{language === 'am' ? 'ሁሉም ፋይሎች' : 'All Files'}</span>
                  </div>
                  
                  {categoriesLoading && categories.length === 0 && (
                    <p className="sidebar-hint">Loading folders...</p>
                  )}
                  {!categoriesLoading && categories.length === 0 && (
                    <p className="sidebar-hint">No folders found.</p>
                  )}
                  {categoryTree.length > 0 && renderCategoryNodes(categoryTree)}
                </div>
              </div>
              <div className="sidebar-footer">
                {documentsCount} total items
              </div>
            </aside>

            <section className="archive-content">
              <header className="explorer-toolbar">
                <div className="toolbar-left">
                  <button className="unstyled-button mobile-menu" onClick={() => setMobileMenuOpen(true)}>
                    <IconMenu />
                    <span className="mobile-menu-text">{language === 'am' ? 'ምድቦች' : 'Categories'}</span>
                  </button>
              <input
                type="text"
                    className="search-input-minimal"
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
                <div className="toolbar-right">
                  <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="file-type-select">
                    {fileTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                  </option>
                ))}
              </select>
                  <div className="view-toggle">
                    <button
                      className={viewMode === 'list' ? 'active' : ''}
                      onClick={() => setViewMode('list')}
                      title="List view"
                    >
                      <IconList />
                    </button>
                    <button
                      className={viewMode === 'grid' ? 'active' : ''}
                      onClick={() => setViewMode('grid')}
                      title="Grid view"
                    >
                      <IconGrid />
                    </button>
                  </div>
                </div>
              </header>

              {viewMode === 'list' && (
                <div className="list-header">
                  <button
                    className={`list-col ${sortBy === 'name' ? 'active' : ''}`}
                    onClick={() => {
                      if (sortBy === 'name') {
                        setSortDesc(!sortDesc);
                      } else {
                        setSortBy('name');
                        setSortDesc(false);
                      }
                    }}
                  >
                    {t('name')}
                  </button>
                  <button
                    className={`list-col narrow ${sortBy === 'date' ? 'active' : ''}`}
                    onClick={() => {
                      if (sortBy === 'date') {
                        setSortDesc(!sortDesc);
                      } else {
                        setSortBy('date');
                        setSortDesc(true);
                      }
                    }}
                  >
                    {t('date_modified')}
                  </button>
                  <span className="list-col narrow muted">{t('type')}</span>
                  <span className="list-col narrow muted">{t('size')}</span>
                  <span className="list-col actions" />
                </div>
              )}

              <div className={`documents-area ${viewMode === 'grid' ? 'grid-mode' : ''}`}>
                {showLoadingState ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <p>{t('loading')}</p>
                  </div>
                ) : sortedDocuments.length === 0 && currentSubfolders.length === 0 ? (
                  <div className="empty-state">
                    <IconFolderOpen className="empty-icon" />
                    <p className="title">{t('empty_folder')}</p>
                    <p>No items match your filters.</p>
                  </div>
                ) : viewMode === 'list' ? (
                  <>
                    {/* Folder rows for subcategories of the selected category */}
                    {currentSubfolders.map((folder) => {
                      const folderLabel =
                        language === 'am' && folder.name_am ? folder.name_am : folder.name_en;
                      return (
                        <div
                          key={`folder-row-${folder.id}`}
                          className="document-row folder-row"
                          onClick={() => handleCategoryClick(folder.id)}
                        >
                          <div className="document-cell name">
                            <span className="file-icon">
                              <IconFolder className="icon icon-folder" />
                            </span>
                            <div className="file-meta">
                              <span className="file-title">{folderLabel}</span>
                              {folder.description && (
                                <span className="file-subtle">{folder.description}</span>
                              )}
            </div>
          </div>
                          <div className="document-cell narrow">—</div>
                          <div className="document-cell narrow muted">FOLDER</div>
                          <div className="document-cell narrow">—</div>
                          <div className="document-cell actions" />
        </div>
                      );
                    })}

                    {/* File rows for the selected category */}
                    {sortedDocuments.map((doc) => {
                      const title = getDocumentTitle(doc, language);
                      const size = doc.file_size ? formatFileSize(doc.file_size) : '—';
                      const date = formatDate(doc.created_at);
                      return (
                        <div
                          key={doc.id}
                          className="document-row"
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            handleDownload(doc);
                          }}
                        >
                          <div className="document-cell name">
                            <span className="file-icon">{getFileIcon(doc.file_type)}</span>
                            <div className="file-meta">
                              <span className="file-title">{title}</span>
                              {doc.description_en && (
                                <span className="file-subtle">{doc.description_en}</span>
                              )}
                            </div>
                          </div>
                          <div className="document-cell narrow">{date}</div>
                          <div className="document-cell narrow muted">
                            {(doc.file_type || 'file').toUpperCase()}
                          </div>
                          <div className="document-cell narrow">{size}</div>
                          <div className="document-cell actions">
                            <button
                              className="download-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(doc);
                              }}
                            >
                              <IconDownload />
                              <span>{t('download')}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  sortedDocuments.map((doc) => {
                    const title = getDocumentTitle(doc, language);
                    const size = doc.file_size ? formatFileSize(doc.file_size) : '—';
                return (
                      <div
                        key={doc.id}
                        className="document-card"
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          handleDownload(doc);
                        }}
                      >
                        <div className="card-icon">{getFileIcon(doc.file_type)}</div>
                        <p className="card-title">{title}</p>
                        <p className="card-meta">{size}</p>
                        <button className="card-download" onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}>
                          <IconDownload />
                      </button>
                      </div>
                );
                  })
                )}
        </div>

              <footer className="status-bar">
                <span>{currentItemsCount} {t('files')}</span>
                <span className="status-connection">Connected to archive</span>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;

