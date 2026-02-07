import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { archiveAPI, ArchiveDocument, ArchiveCategory, ArchiveTag } from '../../api/archive';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import apiClient from '../../api/client';
import '../../components/AdminLayout.css';
import './ArchiveManager.css';

interface CategoryNode extends ArchiveCategory {
  children: CategoryNode[];
}

// Icon Components
const IconFolder: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a3 3 0 0 1-3 3H5a2 2 0 0 1-2-2Z" />
  </svg>
);

const IconFolderOpen: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7" />
    <path d="M3 7h4a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H3l-2 6h15l2-6" />
  </svg>
);

const IconFileText: React.FC<{ className?: string; type?: string }> = ({ className, type }) => {
  // Neutral gray color for all file types
  const color = '#6b7280';
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
};

const IconChevronRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const IconChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const IconSearch: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const IconFilter: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconUpload: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconDownload: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconEdit: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconEye: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconLock: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconPlus: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Status Badge Component
const StatusBadge: React.FC<{ visibility: 'public' | 'member' | 'general_assembly' | 'executive' }> = ({ visibility }) => {
  const getVisibilityLabel = () => {
    switch (visibility) {
      case 'public': return 'Public';
      case 'member': return 'Member';
      case 'general_assembly': return 'General Assembly';
      case 'executive': return 'Executive';
      default: return 'Unknown';
    }
  };
  const isPublic = visibility === 'public';
  return (
    <span className={`status-badge ${isPublic ? 'status-public' : 'status-member'}`}>
      {isPublic ? <IconEye className="status-icon" /> : <IconLock className="status-icon" />}
      {getVisibilityLabel()}
    </span>
  );
};

const ArchiveManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [categories, setCategories] = useState<ArchiveCategory[]>([]);
  const [tags, setTags] = useState<ArchiveTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryData, setCategoryData] = useState({
    name_en: '',
    name_am: '',
    description: '',
    parent: '',
    order: 0,
  });
  const [uploadData, setUploadData] = useState({
    title_en: '',
    title_am: '',
    description_en: '',
    description_am: '',
    file: null as File | null,
    category_id: '',
    tag_ids: [] as number[],
    visibility: 'public' as 'public' | 'member' | 'general_assembly' | 'executive',
    date: '',
    author: '',
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [uploadingForCategory, setUploadingForCategory] = useState<number | null>(null);
  const [editingDocument, setEditingDocument] = useState<ArchiveDocument | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'member' | 'general_assembly' | 'executive'>('public');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Initialize: expand only parent categories and one subcategory per parent
  useEffect(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      const expanded = new Set<number>();
      
      // Build category tree to find parent categories
      const categoryMap = new Map<number, ArchiveCategory>();
      categories.forEach(cat => categoryMap.set(cat.id, cat));
      
      // Find all parent categories (categories with no parent or parent is null)
      const parentCategories = categories.filter(cat => {
        const parentId = typeof cat.parent === 'number' ? cat.parent : null;
        return parentId === null || !categoryMap.has(parentId);
      });
      
      // Expand all parent categories
      parentCategories.forEach(cat => {
        expanded.add(cat.id);
        
        // For each parent, expand only the first subcategory (alphabetically)
        const subcategories = categories
          .filter(sub => {
            const subParentId = typeof sub.parent === 'number' ? sub.parent : null;
            return subParentId === cat.id;
          })
          .sort((a, b) => (a.name_en || '').localeCompare(b.name_en || ''));
        
        // Expand only the first subcategory if any exist
        if (subcategories.length > 0) {
          expanded.add(subcategories[0].id);
        }
      });
      
      setExpandedCategories(expanded);
    }
  }, [categories, expandedCategories.size]);

  const loadData = async () => {
    try {
      const [docsResponse, catsData, tagsData] = await Promise.all([
        apiClient.get('/admin/archive/'),
        archiveAPI.getCategories(),
        archiveAPI.getTags(),
      ]);
      const docsData = Array.isArray(docsResponse.data)
        ? docsResponse.data
        : (docsResponse.data.results || docsResponse.data || []);
      // Normalize documents: ensure category_id is set from category object
      const normalizedDocs = docsData.map((doc: ArchiveDocument) => ({
        ...doc,
        category_id: doc.category_id ?? doc.category?.id,
      }));
      setDocuments(normalizedDocs);
      setCategories(catsData.results);
      setTags(tagsData.results);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('title_en', uploadData.title_en);
      formData.append('title_am', uploadData.title_am);
      formData.append('description_en', uploadData.description_en);
      formData.append('description_am', uploadData.description_am);
      formData.append('file', uploadData.file);
      if (uploadData.category_id) formData.append('category_id', uploadData.category_id);
      uploadData.tag_ids.forEach(id => formData.append('tag_ids', id.toString()));
      formData.append('visibility', uploadData.visibility);
      if (uploadData.date) formData.append('date', uploadData.date);
      formData.append('author', uploadData.author);

      await archiveAPI.uploadDocument(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setShowUpload(false);
      setUploadingForCategory(null);
      setUploadData({
        title_en: '',
        title_am: '',
        description_en: '',
        description_am: '',
        file: null,
        category_id: '',
        tag_ids: [],
        visibility: 'public',
        date: '',
        author: '',
      });
      loadData();
      showSuccess('Document uploaded successfully!');
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      showError(error.response?.data?.detail || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleStartUploadForCategory = (categoryId: number) => {
    setUploadingForCategory(categoryId);
    setUploadData({
      ...uploadData,
      category_id: categoryId.toString(),
    });
    setShowUpload(false);
  };

  const handleDownload = async (doc: ArchiveDocument) => {
    try {
      // Always use admin download endpoint for admin interface
      // This ensures proper authentication and works for all files regardless of visibility
      console.log(`Attempting to download document ${doc.id} via admin endpoint`);
      const blob = await archiveAPI.downloadAdminDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = doc.file?.split('/').pop() || `${doc.title_en || 'document'}.${doc.file_type || 'pdf'}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccess('Document downloaded successfully!');
    } catch (error: any) {
      console.error('Failed to download document:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to download document. Please try again.';
      showError(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await archiveAPI.deleteDocument(id);
      loadData();
      showSuccess('Document deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete document:', error);
      showError(error.response?.data?.detail || 'Failed to delete document. Please try again.');
    }
  };

  const handleEditCategory = (doc: ArchiveDocument) => {
    setEditingDocument(doc);
    setEditCategoryId(doc.category_id?.toString() || doc.category?.id?.toString() || '');
    setEditVisibility(doc.visibility || 'public');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;

    try {
      const updateData: any = {};
      if (editCategoryId && editCategoryId !== '') {
        updateData.category_id = parseInt(editCategoryId);
      } else {
        // For null/empty, explicitly set to null
        updateData.category_id = null;
      }
      updateData.visibility = editVisibility;

      await archiveAPI.updateDocument(editingDocument.id, updateData);
      setEditingDocument(null);
      setEditCategoryId('');
      setEditVisibility('public');
      loadData();
      showSuccess('Document updated successfully!');
    } catch (error: any) {
      console.error('Failed to update document:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.category_id?.[0] ||
                          error.response?.data?.visibility?.[0] ||
                          error.response?.data?.message ||
                          'Failed to update document. Please try again.';
      showError(errorMessage);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        name_en: categoryData.name_en,
        name_am: categoryData.name_am,
        description: categoryData.description,
        order: categoryData.order,
      };
      if (categoryData.parent) {
        data.parent = parseInt(categoryData.parent);
      }
      
      await apiClient.post('/admin/archive/categories/', data);
      setShowCategoryForm(false);
      setCategoryData({
        name_en: '',
        name_am: '',
        description: '',
        parent: '',
        order: 0,
      });
      loadData();
      showSuccess('Category created successfully!');
    } catch (error: any) {
      console.error('Failed to create category:', error);
      showError(error.response?.data?.detail || 'Failed to create category. Please try again.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await apiClient.delete(`/admin/archive/categories/${id}/`);
      showSuccess('Category deleted successfully!');
      loadData();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      showError(error.response?.data?.detail || 'Failed to delete category. Please try again.');
    }
  };

  // Build hierarchical category tree
  const buildCategoryTree = (items: ArchiveCategory[]): CategoryNode[] => {
    const lookup = new Map<number, CategoryNode>();
    items.forEach((cat) => {
      lookup.set(cat.id, { ...cat, children: [] });
    });

    const roots: CategoryNode[] = [];

    lookup.forEach((node) => {
      const parentId = typeof node.parent === 'number' ? node.parent : null;
      if (parentId !== null && lookup.has(parentId)) {
        lookup.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by order, then by name
    const sortNodes = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => {
        // First sort by order if available
        const aOrder = (a as any).order ?? 0;
        const bOrder = (b as any).order ?? 0;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.name_en || '').localeCompare(b.name_en || '');
      });
      nodes.forEach((child) => sortNodes(child.children));
    };

    sortNodes(roots);
    return roots;
  };

  // Flatten tree for categories only (no documents) - respecting collapsed state
  const flattenCategoryTree = useCallback((
    nodes: CategoryNode[], 
    level: number = 0,
    parentExpanded: boolean = true
  ): Array<{ category: CategoryNode; level: number; type: 'category' }> => {
    const result: Array<{ category: CategoryNode; level: number; type: 'category' }> = [];
    nodes.forEach((node) => {
      const isExpanded = expandedCategories.has(node.id);
      result.push({ category: node, level, type: 'category' });
      
      // Only show children if this node is expanded and parent is expanded
      if (node.children.length > 0 && isExpanded && parentExpanded) {
        result.push(...flattenCategoryTree(node.children, level + 1, isExpanded));
      }
    });
    return result;
  }, [expandedCategories]);

  // Get all documents grouped by category, maintaining hierarchy
  const getAllDocuments = useCallback((): Array<{ document: ArchiveDocument; level: number; type: 'document'; categoryId: number | null }> => {
    const result: Array<{ document: ArchiveDocument; level: number; type: 'document'; categoryId: number | null }> = [];
    
    // Helper to get category level
    const getCategoryLevel = (categoryId: number | null, categoryTree: CategoryNode[], currentLevel: number = 0): number => {
      if (categoryId === null) return 0;
      for (const node of categoryTree) {
        if (node.id === categoryId) return currentLevel;
        if (node.children.length > 0) {
          const found = getCategoryLevel(categoryId, node.children, currentLevel + 1);
          if (found !== -1) return found;
        }
      }
      return -1;
    };

    const tree = buildCategoryTree(categories);
    
    documents.forEach((doc) => {
      const categoryId = doc.category_id ?? doc.category?.id ?? null;
      const level = categoryId !== null ? getCategoryLevel(categoryId, tree) + 1 : 0;
      result.push({ document: doc, level, type: 'document', categoryId });
    });
    
    // Sort by category level, then by category ID, then by document title
    result.sort((a, b) => {
      if (a.categoryId !== b.categoryId) {
        if (a.categoryId === null) return 1;
        if (b.categoryId === null) return -1;
        return (a.categoryId || 0) - (b.categoryId || 0);
      }
      return (a.document.title_en || '').localeCompare(b.document.title_en || '');
    });
    
    return result;
  }, [documents, categories]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Flatten categories and documents together, inserting documents right after their parent category
  const hierarchicalCategories = useMemo(() => {
    const tree = buildCategoryTree(categories);
    const result: Array<{ category?: CategoryNode; document?: ArchiveDocument; level: number; type: 'category' | 'document'; categoryId?: number | null }> = [];
    
    // Helper to get documents for a category
    const getDocumentsForCategory = (categoryId: number | null): ArchiveDocument[] => {
      return documents.filter(doc => {
        const docCategoryId = doc.category_id ?? doc.category?.id ?? null;
        return docCategoryId === categoryId;
      }).sort((a, b) => (a.title_en || '').localeCompare(b.title_en || ''));
    };
    
    // Helper to check if a category has documents (including in subcategories)
    const categoryHasDocuments = (node: CategoryNode): boolean => {
      const directDocs = getDocumentsForCategory(node.id);
      if (directDocs.length > 0) return true;
      return node.children.some(child => categoryHasDocuments(child));
    };
    
    // Recursive function to flatten tree with documents
    // Order: Category -> Subcategories (recursively) -> Documents in this category
    const flattenWithDocuments = (
      nodes: CategoryNode[],
      level: number = 0,
      parentExpanded: boolean = true
    ) => {
      // Sort categories alphabetically
      const sortedNodes = [...nodes].sort((a, b) => (a.name_en || '').localeCompare(b.name_en || ''));
      
      sortedNodes.forEach((node) => {
        const isExpanded = expandedCategories.has(node.id);
        
        // Add category
        result.push({ category: node, level, type: 'category' });
        
        // If expanded, process children first (subcategories), then documents
        if (isExpanded && parentExpanded) {
          // First: Recurse into children (subcategories) - they come before documents
          if (node.children.length > 0) {
            flattenWithDocuments(node.children, level + 1, isExpanded);
          }
          
          // Then: Add documents that belong directly to this category (after all subcategories)
          const categoryDocs = getDocumentsForCategory(node.id);
          categoryDocs.forEach(doc => {
            result.push({ document: doc, level: level + 1, type: 'document', categoryId: node.id });
          });
        }
      });
    };
    
    // Start flattening from root
    flattenWithDocuments(tree);
    
    // Add uncategorized documents at the end (level 0)
    const uncategorizedDocs = getDocumentsForCategory(null);
    uncategorizedDocs.sort((a, b) => (a.title_en || '').localeCompare(b.title_en || ''));
    uncategorizedDocs.forEach(doc => {
      result.push({ document: doc, level: 0, type: 'document', categoryId: null });
    });
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      return result.filter((item) => {
        if (item.type === 'category' && item.category) {
          const cat = item.category;
          return (cat.name_en?.toLowerCase().includes(lowerQuery) || 
                  cat.name_am?.toLowerCase().includes(lowerQuery));
        } else if (item.type === 'document' && item.document) {
          const doc = item.document;
          return (doc.title_en?.toLowerCase().includes(lowerQuery) || 
                  doc.title_am?.toLowerCase().includes(lowerQuery) ||
                  doc.description_en?.toLowerCase().includes(lowerQuery) ||
                  doc.description_am?.toLowerCase().includes(lowerQuery) ||
                  doc.author?.toLowerCase().includes(lowerQuery));
        }
        return false;
      });
    }
    
    return result;
  }, [categories, documents, expandedCategories, searchQuery]);

  if (loading) {
    return (
      <AdminLayout title="Archive Manager" subtitle="Manage archive documents and files">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  const documentCount = hierarchicalCategories.filter(item => item.type === 'document').length;
  const categoryCount = hierarchicalCategories.filter(item => item.type === 'category').length;

  return (
    <AdminLayout title="Archive Manager" subtitle="">
      <div className="archive-manager-modern">
        {/* Modern Header Section */}
        <header className="archive-header-modern">
          <div className="archive-header-content">
            <div>
              <h1 className="archive-title-modern">Archive Manager</h1>
              <p className="archive-subtitle-modern">Manage, categorize, and track your organization's documents.</p>
            </div>
            <div className="archive-header-actions">
              <button 
                onClick={() => {
                  setShowCategoryForm(!showCategoryForm);
                  setShowUpload(false);
                }} 
                className="btn-category-modern"
              >
                <IconFolder className="btn-icon" />
                {showCategoryForm ? 'Cancel' : 'New Category'}
              </button>
              <button 
                onClick={() => {
                  setShowUpload(!showUpload);
                  setShowCategoryForm(false);
                }} 
                className="btn-upload-modern"
              >
                <IconUpload className="btn-icon" />
                {showUpload ? 'Cancel' : 'Upload Document'}
              </button>
            </div>
          </div>
        </header>

        {/* Toolbar Section */}
        <div className="archive-toolbar-modern">
          <div className="archive-search-wrapper">
            <IconSearch className="search-icon" />
            <input
              type="text"
              className="archive-search-input"
              placeholder="Search by name, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="archive-stats">
            <IconFilter className="stats-icon" />
            <span>{documentCount} documents</span>
            <span className="stats-divider"></span>
            <span>{categoryCount} categories</span>
          </div>
        </div>

      {showCategoryForm && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Create New Category</h3>
          <form onSubmit={handleCreateCategory}>
            <div className="form-row">
              <div className="form-group">
                <label>Name (English) *</label>
                <input
                  type="text"
                  value={categoryData.name_en}
                  onChange={(e) => setCategoryData({ ...categoryData, name_en: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Name (Amharic)</label>
                <input
                  type="text"
                  value={categoryData.name_am}
                  onChange={(e) => setCategoryData({ ...categoryData, name_am: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={categoryData.description}
                onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Parent Category</label>
                <select
                  value={categoryData.parent}
                  onChange={(e) => setCategoryData({ ...categoryData, parent: e.target.value })}
                >
                  <option value="">None (Top Level)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_en}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Order</label>
                <input
                  type="number"
                  value={categoryData.order}
                  onChange={(e) => setCategoryData({ ...categoryData, order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
            <button type="submit" className="submit-btn">Create Category</button>
          </form>
        </div>
      )}

      {(showUpload || uploadingForCategory !== null) && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
              {uploadingForCategory !== null 
                ? `Upload Document to "${categories.find(c => c.id === uploadingForCategory)?.name_en || 'Category'}"`
                : 'Upload New Document'}
            </h3>
            <button
              onClick={() => {
                setShowUpload(false);
                setUploadingForCategory(null);
                setUploadData({
                  ...uploadData,
                  category_id: '',
                });
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: '#6b7280',
                padding: '0.25rem 0.5rem'
              }}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleUpload}>
            <div className="form-row">
              <div className="form-group">
                <label>Title (English)</label>
                <input
                  type="text"
                  value={uploadData.title_en}
                  onChange={(e) => setUploadData({ ...uploadData, title_en: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Title (Amharic)</label>
                <input
                  type="text"
                  value={uploadData.title_am}
                  onChange={(e) => setUploadData({ ...uploadData, title_am: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Description (English)</label>
                <textarea
                  value={uploadData.description_en}
                  onChange={(e) => setUploadData({ ...uploadData, description_en: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description (Amharic)</label>
                <textarea
                  value={uploadData.description_am}
                  onChange={(e) => setUploadData({ ...uploadData, description_am: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              {uploadingForCategory === null && (
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={uploadData.category_id}
                    onChange={(e) => setUploadData({ ...uploadData, category_id: e.target.value })}
                  >
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Visibility</label>
                <select
                  value={uploadData.visibility}
                  onChange={(e) => setUploadData({ ...uploadData, visibility: e.target.value as 'public' | 'member' | 'general_assembly' | 'executive' })}
                >
                  <option value="public">Public</option>
                  <option value="member">Member</option>
                  <option value="general_assembly">General Assembly type</option>
                  <option value="executive">Executive type</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={uploadData.date}
                  onChange={(e) => setUploadData({ ...uploadData, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input
                  type="text"
                  value={uploadData.author}
                  onChange={(e) => setUploadData({ ...uploadData, author: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Document File</label>
              <input type="file" onChange={handleFileChange} required />
            </div>

            {uploading && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Uploading...</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '0.5rem', background: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${uploadProgress}%`, 
                      height: '100%', 
                      background: '#27ae60', 
                      borderRadius: '9999px',
                      transition: 'width 0.2s ease-in-out' 
                    }} 
                  />
                </div>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

        {/* Main Content: Table/Tree View */}
        <div className="archive-table-container-modern">
          {categories.length === 0 && documents.length === 0 ? (
            <div className="archive-empty-state">
              <IconFolder className="empty-icon" />
              <p>No items found. Create a category or upload a document to get started.</p>
            </div>
          ) : (
            <div className="archive-table-wrapper">
              <table className="archive-table-modern">
                <thead>
                  <tr>
                    <th className="archive-th-name">Name</th>
                    <th className="archive-th-date">Date</th>
                    <th className="archive-th-author">Author / Size</th>
                    <th className="archive-th-visibility">Visibility</th>
                    <th className="archive-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                {hierarchicalCategories.map((item) => {
                  if (item.type === 'document' && item.document) {
                    const doc = item.document;
                    const docLevel = item.level;
                    const isEditing = editingDocument?.id === doc.id;
                    // Use level-based styling matching parent category
                    const getDocLevelStyles = (level: number) => {
                      // Neutral, professional styling for all levels
                      return { 
                        bg: '#ffffff', 
                        borderLeft: '2px solid #e5e7eb',
                        shadow: 'none',
                        textColor: '#111827'
                      };
                    };
                    const docLevelStyle = getDocLevelStyles(docLevel);
                    const docStyle = {
                      background: docLevelStyle.bg,
                      borderLeft: docLevelStyle.borderLeft,
                      transition: 'all 0.2s ease'
                    };
                    const docPaddingLeft = docLevel * 16 + 16;
                    return (
                      <React.Fragment key={`doc-${doc.id}`}>
                        <tr 
                          className="archive-row-modern archive-row-document"
                          style={docStyle}
                        >
                          <td className="archive-td-name">
                            <div className="archive-name-cell" style={{ paddingLeft: `${docPaddingLeft}px` }}>
                              <div className="archive-toggle-spacer"></div>
                              <div className="archive-icon-wrapper archive-icon-file">
                                <IconFileText className="archive-icon" type={doc.file_type} />
                              </div>
                              <div className="archive-name-content">
                                <span className="archive-name-primary">{doc.title_en || doc.title_am}</span>
                                {(doc.title_am || doc.title_en) && doc.title_en !== doc.title_am && (
                                  <span className="archive-name-secondary">{doc.title_am || doc.title_en}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="archive-td-date">
                            <span className="archive-meta-text">{doc.date || '-'}</span>
                          </td>
                          <td className="archive-td-author">
                            <div className="archive-author-info">
                              <span className="archive-author-name">{doc.author || '-'}</span>
                              {doc.file_size && (
                                <span className="archive-file-size">{doc.file_size}</span>
                              )}
                            </div>
                          </td>
                          <td className="archive-td-visibility">
                            <StatusBadge visibility={doc.visibility || 'public'} />
                          </td>
                          <td className="archive-td-actions">
                            <div className="archive-actions-modern">
                              <button
                                onClick={() => handleDownload(doc)}
                                className="archive-action-btn archive-action-download"
                                title="Download"
                              >
                                <IconDownload className="action-icon" />
                              </button>
                              <button
                                onClick={() => handleEditCategory(doc)}
                                className={`archive-action-btn archive-action-edit ${isEditing ? 'active' : ''}`}
                                title="Edit category"
                              >
                                <IconEdit className="action-icon" />
                              </button>
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="archive-action-btn archive-action-delete"
                                title="Delete"
                              >
                                <IconTrash className="action-icon" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isEditing && (
                          <tr className="archive-edit-row">
                            <td colSpan={5} className="archive-edit-cell" style={{ paddingLeft: `${docPaddingLeft + 24}px` }}>
                              <form onSubmit={handleUpdateCategory} className="archive-edit-form">
                                <label className="archive-edit-label">Category:</label>
                                <select
                                  value={editCategoryId}
                                  onChange={(e) => setEditCategoryId(e.target.value)}
                                  className="archive-edit-select"
                                >
                                  <option value="">None (Uncategorized)</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name_en}
                                    </option>
                                  ))}
                                </select>
                                <label className="archive-edit-label">Visibility:</label>
                                <select
                                  value={editVisibility}
                                  onChange={(e) => setEditVisibility(e.target.value as 'public' | 'member' | 'general_assembly' | 'executive')}
                                  className="archive-edit-select"
                                >
                                  <option value="public">Public</option>
                                  <option value="member">Member</option>
                                  <option value="general_assembly">General Assembly type</option>
                                  <option value="executive">Executive type</option>
                                </select>
                                <button 
                                  type="submit" 
                                  className="archive-edit-btn archive-edit-btn-primary"
                                >
                                  Update
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDocument(null);
                                    setEditCategoryId('');
                                    setEditVisibility('public');
                                  }}
                                  className="archive-edit-btn archive-edit-btn-cancel"
                                >
                                  Cancel
                                </button>
                              </form>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }

                  if (item.type !== 'category' || !item.category) return null;
                  const { category: cat, level } = item;
                  // Modern shading based on level - more distinct colors
                  const getLevelStyles = (level: number) => {
                    // Neutral, professional styling - subtle variation by level
                    const baseBg = level === 0 ? '#f9fafb' : '#ffffff';
                    const borderColor = level === 0 ? '#d1d5db' : '#e5e7eb';
                    return { 
                      bg: baseBg, 
                      borderLeft: `2px solid ${borderColor}`,
                      shadow: 'none',
                      textColor: '#111827'
                    };
                  };

                  const levelStyle = getLevelStyles(level);
                  
                  const paddingLeft = level * 24 + 24;
                  return (
                    <tr 
                      key={cat.id} 
                      className="archive-row-modern archive-row-category"
                      style={{ 
                        background: levelStyle.bg,
                        borderLeft: levelStyle.borderLeft,
                      }}
                    >
                      <td className="archive-td-name">
                        <div className="archive-name-cell" style={{ paddingLeft: `${paddingLeft}px` }}>
                          {(cat.children && cat.children.length > 0) || documents.some(doc => (doc.category_id ?? doc.category?.id) === cat.id) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategory(cat.id);
                              }}
                              className="archive-toggle-btn"
                            >
                              {expandedCategories.has(cat.id) ? 
                                <IconChevronDown className="toggle-icon" /> : 
                                <IconChevronRight className="toggle-icon" />
                              }
                            </button>
                          ) : (
                            <div className="archive-toggle-spacer"></div>
                          )}
                          <div className={`archive-icon-wrapper archive-icon-folder`}>
                            {expandedCategories.has(cat.id) ? 
                              <IconFolderOpen className="archive-icon" /> : 
                              <IconFolder className="archive-icon" />
                            }
                          </div>
                          <div className="archive-name-content">
                            <span className="archive-name-primary">{cat.name_en}</span>
                            {cat.name_am && (
                              <span className="archive-name-secondary">{cat.name_am}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="archive-td-date">
                        <span className="archive-meta-text">-</span>
                      </td>
                      <td className="archive-td-author">
                        <span className="archive-meta-text archive-folder-label">Folder</span>
                      </td>
                      <td className="archive-td-visibility"></td>
                      <td className="archive-td-actions">
                        <div className="archive-actions-modern">
                          <button
                            onClick={() => handleStartUploadForCategory(cat.id)}
                            className="archive-action-btn archive-action-upload"
                            title="Upload document to this category"
                          >
                            <IconUpload className="action-icon" />
                          </button>
                          <button
                            className="archive-action-btn archive-action-delete"
                            onClick={() => handleDeleteCategory(cat.id)}
                            title="Delete category"
                          >
                            <IconTrash className="action-icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ArchiveManager;

