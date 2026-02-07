/**
 * Dashboard Section Components
 * Individual section components for the admin dashboard
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DataTable, TableColumn, TableAction, StatusBadge, ActionButton, EmptyState } from '../common';
import { formatDate } from '../../utils/dateUtils';
import { buildCategoryTree, CategoryNode } from '../../utils/categoryTree';
import { Page, Image, Event, ArchiveDocument, ContactMessage } from '../../types/api.types';
import { MemberProfile } from '../../types/admin.types';
import { archiveAPI, ArchiveCategory } from '../../api/archive';

/**
 * Pages Section Component
 */
interface PagesSectionProps {
  pages: Page[];
  onEdit: (page: Page) => void;
}

export const PagesSection: React.FC<PagesSectionProps> = ({ pages, onEdit }) => {
  const columns: TableColumn<Page>[] = [
    { header: 'Title', accessor: 'title_en', render: (_, page) => page.title_en || page.page_type },
    { header: 'Type', accessor: 'page_type' },
    {
      header: 'Status',
      accessor: 'is_published',
      render: (value) => <StatusBadge status={value ? 'published' : 'draft'} />,
    },
    {
      header: 'Updated',
      accessor: 'updated_at',
      render: (value) => formatDate(value),
    },
  ];

  const actions: TableAction<Page>[] = [
    {
      label: 'Edit',
      variant: 'edit',
      onClick: onEdit,
    },
  ];

  return (
    <section>
      <h2 className="section-title">Pages</h2>
      <DataTable data={pages} columns={columns} actions={actions} emptyMessage="No pages found" />
    </section>
  );
};

/**
 * Images Section Component
 */
interface ImagesSectionProps {
  images: Image[];
  onDelete: (id: number) => void;
}

export const ImagesSection: React.FC<ImagesSectionProps> = ({ images, onDelete }) => {
  if (images.length === 0) {
    return (
      <section>
        <h2 className="section-title">Images</h2>
        <EmptyState message="No images found" />
      </section>
    );
  }

  return (
    <section>
      <h2 className="section-title">Images</h2>
      <div className="images-grid">
        {images.map((img) => (
          <div key={img.id} className="image-card">
            <img src={img.image} alt={img.alt_text || img.title} className="image-preview" />
            <div className="image-actions">
              <div className="image-name">{img.title || img.alt_text || 'Untitled'}</div>
              <div className="image-buttons">
                <ActionButton variant="primary" className="small">Use</ActionButton>
                <ActionButton variant="delete" className="small" onClick={() => onDelete(img.id)}>
                  Delete
                </ActionButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * Archive Section Component
 */
interface ArchiveCategoryNode extends CategoryNode<ArchiveCategory> {
  children: ArchiveCategoryNode[];
}

interface ArchiveSectionProps {
  archive: ArchiveDocument[];
  onDelete: (id: number) => void;
}

export const ArchiveSection: React.FC<ArchiveSectionProps> = ({ archive, onDelete }) => {
  const [categories, setCategories] = useState<ArchiveCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      const allCategoryIds = new Set(categories.map(cat => cat.id));
      setExpandedCategories(allCategoryIds);
    }
  }, [categories]);

  const loadCategories = async () => {
    try {
      // Use admin endpoint which requires authentication
      const categoriesData = await archiveAPI.getAdminCategories();
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      // Don't show error toast as it might be a temporary auth issue
      // The component will handle empty categories gracefully
    } finally {
      setLoading(false);
    }
  };

  // Use shared buildCategoryTree utility with order-based sorting

  const flattenCategoryTree = (
    nodes: ArchiveCategoryNode[],
    level: number = 0,
    parentExpanded: boolean = true
  ): Array<{ category?: ArchiveCategoryNode; document?: ArchiveDocument; level: number; type: 'category' | 'document' }> => {
    const result: Array<{ category?: ArchiveCategoryNode; document?: ArchiveDocument; level: number; type: 'category' | 'document' }> = [];
    nodes.forEach((node) => {
      const isExpanded = expandedCategories.has(node.id);
      result.push({ category: node, level, type: 'category' });

      if (isExpanded && parentExpanded) {
        const categoryDocuments = archive.filter(doc => {
          // Check multiple ways the category might be stored
          let docCategoryId: number | undefined;
          
          // Method 1: Check if category object exists with id
          if (doc.category && typeof doc.category === 'object' && 'id' in doc.category) {
            docCategoryId = (doc.category as any).id;
          }
          
          // Method 2: Check category_id directly (if it exists on the document)
          if (!docCategoryId && (doc as any).category_id) {
            docCategoryId = (doc as any).category_id;
          }
          
          // Method 3: Check if category is just a number
          if (!docCategoryId && typeof doc.category === 'number') {
            docCategoryId = doc.category;
          }
          
          const matches = docCategoryId === node.id;
          return matches;
        });
        
        categoryDocuments.forEach((doc) => {
          result.push({ document: doc, level: level + 1, type: 'document' });
        });
      }

      if (node.children.length > 0 && isExpanded && parentExpanded) {
        result.push(...flattenCategoryTree(node.children, level + 1, isExpanded));
      }
    });
    return result;
  };

  const hierarchicalItems = useMemo(() => {
    // Build hierarchical archive structure
    const documentsWithCategory = archive.filter(doc => {
      const docCategoryId = doc.category?.id || (doc as any).category_id || 
                           (typeof doc.category === 'number' ? doc.category : null);
      return !!docCategoryId;
    });
    const documentsWithoutCategory = archive.filter(doc => {
      const docCategoryId = doc.category?.id || (doc as any).category_id || 
                           (typeof doc.category === 'number' ? doc.category : null);
      return !docCategoryId;
    });
    
    const tree = buildCategoryTree(categories);
    const items = flattenCategoryTree(tree);
    
    // Track which documents have been added to categories
    const addedDocumentIds = new Set<number>();
    items.forEach(item => {
      if (item.type === 'document' && item.document) {
        addedDocumentIds.add(item.document.id);
      }
    });
    
    // Add documents without categories at the end
    const uncategorizedDocs = archive.filter(doc => {
      const docCategoryId = doc.category?.id || (doc as any).category_id || 
                           (typeof doc.category === 'number' ? doc.category : null);
      return !docCategoryId && !addedDocumentIds.has(doc.id);
    });
    
    uncategorizedDocs.forEach((doc) => {
      items.push({ document: doc, level: 0, type: 'document' });
    });
    
    // If we have documents but none matched categories, show a warning
    if (archive.length > 0 && addedDocumentIds.size === 0 && documentsWithCategory.length > 0) {
      console.warn('⚠️ WARNING: Documents have categories but none matched! This might indicate a data structure mismatch.');
      console.warn('Sample document category:', documentsWithCategory[0]);
      console.warn('Available category IDs:', categories.map(c => c.id));
      
      // Fallback: Show all documents that have categories but didn't match
      documentsWithCategory.forEach((doc) => {
        if (!addedDocumentIds.has(doc.id)) {
          items.push({ document: doc, level: 0, type: 'document' });
        }
      });
    }
    
    return items;
  }, [categories, expandedCategories, archive]);

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

  const handleDownload = async (doc: ArchiveDocument) => {
    try {
      if (doc.file_url) {
        const a = document.createElement('a');
        a.href = doc.file_url;
        const filename = doc.file?.split('/').pop() || `${doc.title_en || 'document'}.${doc.file_type || 'pdf'}`;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const blob = await archiveAPI.downloadDocument(doc.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = doc.file?.split('/').pop() || `${doc.title_en || 'document'}.${doc.file_type || 'pdf'}`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const getLevelStyles = (level: number) => {
    const styles: Record<number, { bg: string; borderLeft: string; shadow: string }> = {
      0: {
        bg: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderLeft: '4px solid #27ae60',
        shadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      },
      1: {
        bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderLeft: '4px solid #60a5fa',
        shadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
      },
      2: {
        bg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        borderLeft: '4px solid #a78bfa',
        shadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
      },
      3: {
        bg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
        borderLeft: '4px solid #f472b6',
        shadow: '0 1px 1px rgba(0, 0, 0, 0.02)'
      }
    };
    return styles[level] || styles[3];
  };

  if (loading) {
    return (
      <section>
        <h2 className="section-title">Archive</h2>
        <EmptyState message="Loading categories..." />
      </section>
    );
  }

  if (categories.length === 0 && archive.length === 0) {
    return (
      <section>
        <h2 className="section-title">Archive</h2>
        <EmptyState message="No archive items found" />
      </section>
    );
  }

  return (
    <section>
      <h2 className="section-title">Archive</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th style={{ width: '200px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hierarchicalItems.map((item) => {
              if (item.type === 'document' && item.document) {
                const doc = item.document;
                const docLevel = item.level;
                return (
                  <tr
                    key={`doc-${doc.id}`}
                    style={{
                      background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                      borderLeft: '2px solid #d1d5db',
                    }}
                  >
                    <td>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: `${docLevel * 24 + 40}px`,
                        color: '#4b5563',
                        fontSize: '0.9375rem'
                      }}>
                        <span style={{ marginRight: '8px', color: '#9ca3af' }}>📄</span>
                        {doc.title_en || doc.title_am}
                        <span style={{ marginLeft: '8px', color: '#9ca3af', fontSize: '0.875rem' }}>
                          ({doc.file_type})
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <ActionButton
                          variant="primary"
                          className="small"
                          onClick={() => handleDownload(doc)}
                        >
                          Download
                        </ActionButton>
                        <Link
                          to={`/admin/archive`}
                          className="action-btn edit small"
                          style={{ textDecoration: 'none' }}
                        >
                          Edit
                        </Link>
                        <ActionButton
                          variant="delete"
                          className="small"
                          onClick={() => onDelete(doc.id)}
                        >
                Delete
              </ActionButton>
            </div>
                    </td>
                  </tr>
                );
              }

              if (!item.category) return null;
              const { category: cat, level } = item;
              const levelStyle = getLevelStyles(level);

              return (
                <tr
                  key={cat.id}
                  style={{
                    background: levelStyle.bg,
                    borderLeft: levelStyle.borderLeft,
                    boxShadow: levelStyle.shadow,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(2px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = levelStyle.shadow;
                  }}
                >
                  <td>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: `${level * 24}px`,
                      fontWeight: level === 0 ? 600 : level === 1 ? 500 : 400,
                      color: level === 0 ? '#111827' : level === 1 ? '#1f2937' : '#374151',
                      fontSize: level === 0 ? '1rem' : '0.9375rem'
                    }}>
                      {cat.children && cat.children.length > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(cat.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            marginRight: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: level === 0 ? '#27ae60' : level === 1 ? '#60a5fa' : level === 2 ? '#a78bfa' : '#f472b6',
                            transition: 'transform 0.2s ease',
                            transform: expandedCategories.has(cat.id) ? 'rotate(90deg)' : 'rotate(0deg)'
                          }}
                          title={expandedCategories.has(cat.id) ? 'Collapse' : 'Expand'}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      ) : (
                        <span style={{ width: '32px', display: 'inline-block' }}></span>
                      )}
                      {level > 0 && (
                        <span style={{
                          marginRight: '8px',
                          color: level === 1 ? '#60a5fa' : level === 2 ? '#a78bfa' : '#f472b6',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}>
                          └─
                        </span>
                      )}
                      {cat.name_en}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <Link
                        to="/admin/archive"
                        className="action-btn edit small"
                        style={{ textDecoration: 'none' }}
                      >
                        Manage
                      </Link>
          </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/**
 * Events Section Component
 */
interface EventsSectionProps {
  events: Event[];
  onDelete: (id: number) => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({ events, onDelete }) => {
  if (events.length === 0) {
    return (
      <section>
        <h2 className="section-title">Events</h2>
        <EmptyState message="No events found" />
      </section>
    );
  }

  return (
    <section>
      <h2 className="section-title">Events</h2>
      <div className="events-list">
        {events.map((event) => (
          <div key={event.id} className="event-item">
            <div className="event-info">
              <div className="event-title">{event.title_en || event.title_am}</div>
              <div className="event-meta">
                {formatDate(event.start_date)} • {event.location}
              </div>
            </div>
            <div className="action-buttons">
              <Link to="/admin/events" className="action-btn edit">
                Edit
              </Link>
              <ActionButton variant="delete" className="small" onClick={() => onDelete(event.id)}>
                Cancel
              </ActionButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * Admins Section Component
 */
interface AdminsSectionProps {
  members: MemberProfile[];
  onEdit: (member: MemberProfile) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
}

export const AdminsSection: React.FC<AdminsSectionProps> = ({
  members,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const columns: TableColumn<MemberProfile>[] = [
    {
      header: 'Name',
      accessor: (member) =>
        member.first_name && member.last_name
          ? `${member.first_name} ${member.last_name}`
          : member.username,
    },
    { header: 'Role', accessor: 'role', render: (value) => String(value).charAt(0).toUpperCase() + String(value).slice(1) },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (value) => <StatusBadge status={value ? 'active' : 'inactive'} />,
    },
  ];

  const actions: TableAction<MemberProfile>[] = [
    {
      label: 'Edit',
      variant: 'edit',
      onClick: onEdit,
    },
    {
      label: (member) => (member.is_active ? 'Disable' : 'Enable'),
      variant: 'secondary',
      onClick: (member) => onToggleActive(member.id, !member.is_active),
    },
    {
      label: 'Delete',
      variant: 'delete',
      onClick: (member) => onDelete(member.id),
    },
  ];

  return (
    <section>
      <h2 className="section-title">Admins</h2>
      <DataTable data={members} columns={columns} actions={actions} emptyMessage="No members found" />
    </section>
  );
};

/**
 * Messages Section Component
 */
interface MessagesSectionProps {
  messages: ContactMessage[];
}

export const MessagesSection: React.FC<MessagesSectionProps> = ({ messages }) => {
  const columns: TableColumn<ContactMessage>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Subject', accessor: 'subject' },
    { header: 'Date', accessor: 'created_at', render: (value) => formatDate(value) },
    {
      header: 'Status',
      accessor: 'is_read',
      render: (value) => <StatusBadge status={value ? 'published' : 'draft'} label={value ? 'Read' : 'Unread'} />,
    },
  ];

  return (
    <section>
      <h2 className="section-title">Messages</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>{column.header}</th>
              ))}
              <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="empty-state">No messages found</td>
              </tr>
            ) : (
              messages.map((message) => {
                const renderCell = (column: TableColumn<ContactMessage>) => {
                  let value: any;
                  
                  if (typeof column.accessor === 'function') {
                    value = column.accessor(message);
                  } else {
                    value = message[column.accessor];
                  }
                  
                  if (column.render) {
                    return column.render(value, message);
                  }
                  
                  // Convert non-ReactNode values to strings
                  if (value === null || value === undefined) {
                    return 'N/A';
                  }
                  
                  if (Array.isArray(value)) {
                    return String(value.length);
                  }
                  
                  if (typeof value === 'object') {
                    return JSON.stringify(value);
                  }
                  
                  return String(value);
                };
                
                return (
                  <tr key={message.id}>
                    {columns.map((column, colIndex) => (
                      <td key={colIndex}>{renderCell(column)}</td>
                    ))}
                    <td>
                      <div className="action-buttons">
                        <Link to="/admin/messages" className="action-btn edit">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

