import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../api/auth';
import apiClient from '../api/client';
import { usePermissions } from '../hooks/usePermissions';
import { useNotifications } from '../hooks/useNotifications';
import { AdminSection } from '../types/admin.types';
import SectionIcon from './common/SectionIcon';
import './AdminLayout.css';

type Section = AdminSection;

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  actionButton?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle = 'Manage your website content and settings',
  searchPlaceholder = 'Search...',
  onSearch,
  searchValue = '',
  actionButton,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getAllowedSections, hasPermission } = usePermissions();
  const { unreadMessagesCount, pendingApplicationsCount } = useNotifications();

  const getActiveSection = (): Section => {
    if (location.pathname.includes('/member-applications')) return 'Member Applications';
    if (location.pathname.includes('/payments')) return 'Payments';
    if (location.pathname.includes('/members-directory')) return 'Members Directory';
    if (location.pathname.includes('/cadu-members')) return 'CADU Members';
    if (location.pathname.includes('/admins')) return 'Admins';
    if (location.pathname.includes('/contact-info')) return 'Contact Info';
    if (location.pathname.includes('/pages')) return 'Pages';
    if (location.pathname.includes('/images')) return 'Templates';
    if (location.pathname.includes('/archive')) return 'Archives';
    if (location.pathname.includes('/events')) return 'Events';
    if (location.pathname.includes('/messages')) return 'Messages';
    if (location.pathname.includes('/gallery')) return 'Gallery';
    if (location.pathname.includes('/logs')) return 'Logs';
    return 'Pages';
  };

  const [activeSection, setActiveSection] = useState<Section>(getActiveSection());
  const [searchQuery, setSearchQuery] = useState(searchValue);
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    used_formatted: string;
    total: number;
    total_formatted: string;
    free: number;
    free_formatted: string;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  useEffect(() => {
    const currentSection = getActiveSection();
    setActiveSection(currentSection);
  }, [location.pathname]);

  // Check permissions when component mounts or permissions change
  useEffect(() => {
    const currentSection = getActiveSection();
    
    // Only check if we have a valid section and permissions are loaded
    if (currentSection) {
      const allowedSections = getAllowedSections();
      
      // If user doesn't have permission for current section, redirect
      if (!hasPermission(currentSection)) {
        if (allowedSections.length > 0) {
          // Navigate to first allowed section
          const firstAllowed = allowedSections[0];
          // Use switch navigation instead of calling handleSectionClick to avoid dependency issues
          switch (firstAllowed) {
            case 'Pages':
              navigate('/admin/pages');
              break;
            case 'Templates':
              navigate('/admin/images');
              break;
            case 'Archives':
              navigate('/admin/archive');
              break;
            case 'Events':
              navigate('/admin/events');
              break;
            case 'Admins':
              navigate('/admin/admins');
              break;
            case 'Messages':
              navigate('/admin/messages');
              break;
            case 'Member Applications':
              navigate('/admin/member-applications');
              break;
            case 'CADU Members':
              navigate('/admin/cadu-members');
              break;
            case 'Payments':
              navigate('/admin/payments');
              break;
            case 'Members Directory':
              navigate('/admin/members-directory');
              break;
            case 'Gallery':
              navigate('/admin/gallery');
              break;
            case 'Contact Info':
              navigate('/admin/contact-info');
              break;
            case 'Logs':
              navigate('/admin/logs');
              break;
          }
        } else {
          // No permissions at all, redirect to dashboard
          navigate('/admin/dashboard');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, getAllowedSections, hasPermission]);

  const loadStorageInfo = async () => {
    try {
      const response = await apiClient.get('/admin/storage');
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Failed to load storage info:', error);
      // Set default values if API fails
      setStorageInfo({
        used: 0,
        used_formatted: '0 B',
        total: 34359738368, // 32 GB default
        total_formatted: '32 GB',
        free: 34359738368,
        free_formatted: '32 GB',
        percentage: 0,
      });
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/admin/login');
  };

  const handleSectionClick = (section: Section) => {
    // Check if user has permission for this section
    if (!hasPermission(section)) {
      console.warn(`User does not have permission to access ${section}`);
      return;
    }
    
    setActiveSection(section);
    switch (section) {
      case 'Pages':
        navigate('/admin/pages');
        break;
      case 'Templates':
        navigate('/admin/images');
        break;
      case 'Archives':
        navigate('/admin/archive');
        break;
      case 'Events':
        navigate('/admin/events');
        break;
      case 'Admins':
        navigate('/admin/admins');
        break;
      case 'Messages':
        navigate('/admin/messages');
        break;
      case 'Member Applications':
        navigate('/admin/member-applications');
        break;
      case 'CADU Members':
        navigate('/admin/cadu-members');
        break;
      case 'Payments':
        navigate('/admin/payments');
        break;
      case 'Members Directory':
        navigate('/admin/members-directory');
        break;
      case 'Gallery':
        navigate('/admin/gallery');
        break;
      case 'Contact Info':
        navigate('/admin/contact-info');
        break;
      case 'Logs':
        navigate('/admin/logs');
        break;
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="unified-admin">
      <div className="admin-container">
        <header className="admin-header-bar">
          <div className="header-left">
            <div className="admin-logo-container">
              <img src={`${process.env.PUBLIC_URL || ''}/cadu.png`} alt="Cadu-Ardu Logo" className="admin-logo" />
            </div>
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
            {(onSearch || searchPlaceholder) && (
              <div className="search-container">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={searchPlaceholder}
                  className="search-input"
                />
              </div>
            )}
          <div className="header-right">
            {actionButton}
            <button onClick={handleLogout} className="logout-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </header>

        <div className="admin-layout">
          <nav className="admin-sidebar">
            <ul className="sidebar-menu">
              {getAllowedSections().map((section) => {
                const isSuperadmin = ['CADU Members', 'Admins', 'Logs'].includes(section);
                const isMessages = section === 'Messages';
                const isMemberApplications = section === 'Member Applications';
                const showMessagesBadge = isMessages && unreadMessagesCount > 0 && activeSection !== 'Messages';
                const showApplicationsBadge = isMemberApplications && pendingApplicationsCount > 0 && activeSection !== 'Member Applications';
                
                return (
                  <li key={section}>
                    <button
                      onClick={() => handleSectionClick(section)}
                      className={`sidebar-item ${activeSection === section ? 'active' : ''} ${isSuperadmin ? 'superadmin-section' : ''}`}
                    >
                      <SectionIcon section={section} className={isSuperadmin ? 'superadmin-icon' : ''} />
                      <span className={`sidebar-text ${isSuperadmin ? 'superadmin-text' : ''}`}>{section}</span>
                      {showMessagesBadge && (
                        <span className="notification-badge">{unreadMessagesCount}</span>
                      )}
                      {showApplicationsBadge && (
                        <span className="notification-badge">{pendingApplicationsCount}</span>
                      )}
                      {isSuperadmin && (
                        <span className="superadmin-badge">superadmin</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="sidebar-footer">
              <div className="storage-info">
                <div className="storage-header">
                  <span>Storage</span>
                  <span>{storageInfo?.total_formatted || '32 GB'}</span>
                </div>
                <div className="storage-bar">
                  <div 
                    className="storage-fill" 
                    style={{ 
                      width: `${storageInfo?.percentage || 0}%`,
                      backgroundColor: (storageInfo?.percentage || 0) > 80 ? '#ef4444' : (storageInfo?.percentage || 0) > 60 ? '#f59e0b' : '#10b981'
                    }}
                  ></div>
                </div>
                <div className="storage-details" style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {storageInfo?.used_formatted || '0 B'} of {storageInfo?.total_formatted || '32 GB'} used
                </div>
                <div className="storage-subtext">Up to 20 GB of data backed up</div>
              </div>
            </div>
          </nav>

          <main className="admin-main">
            <div className="content-panel">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;

