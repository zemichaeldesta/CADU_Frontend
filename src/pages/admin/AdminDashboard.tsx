/**
 * AdminDashboard Component (Refactored)
 * Main dashboard for admin content management
 * Uses reusable components and custom hooks for better maintainability
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { caduMembersAPI } from '../../api/caduMembers';
import { memberApplicationsAPI } from '../../api/memberApplications';
import apiClient from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { usePermissions, useDashboardData, useModal } from '../../hooks';
import {
  LoadingSpinner,
  SearchInput,
  SectionIcon,
} from '../../components/common';
import {
  PagesSection,
  ImagesSection,
  ArchiveSection,
  EventsSection,
  AdminsSection,
  MessagesSection,
} from '../../components/admin/DashboardSections';
import {
  ViewApplicationModal,
  AcceptApplicationModal,
  RejectApplicationModal,
  EditMemberModal,
} from '../../components/admin/ApplicationModals';
import { AdminSection } from '../../types/admin.types';
import { MemberApplication } from '../../types/admin.types';
import { CADUMember } from '../../api/caduMembers';
import type { ArchiveDocument as ArchiveDocumentType, ContactMessage as ContactMessageType } from '../../types/api.types';
import { extractErrorMessage } from '../../utils/errorHandler';
import './AdminDashboard.css';

/**
 * Format time ago for last refresh
 */
const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * AdminDashboard component - Main admin dashboard
 */
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  // Hooks
  const { userPermissions, hasPermission, getAllowedSections, loading: permissionsLoading } = usePermissions();
  const {
    loading: dataLoading,
    refreshing,
    lastRefresh,
    pages,
    images,
    archive: archiveData,
    events,
    members,
    messages: messagesData,
    caduMembers,
    applications,
    storageInfo,
    loadImages,
    loadArchive,
    loadEvents,
    loadMembers,
    loadCADUMembers,
    loadApplications,
    loadAllData,
  } = useDashboardData();

  // Type cast to match our types (API types may have slight differences)
  const archive = archiveData as any as ArchiveDocumentType[];
  const messages = messagesData as any as ContactMessageType[];

  // State
  const [activeSection, setActiveSection] = useState<AdminSection>('Pages');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data based on search query
  const filterData = <T extends Record<string, any>>(list: T[], keys: (keyof T)[]): T[] => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((item) =>
      keys.some((key) => String(item[key] || '').toLowerCase().includes(query))
    );
  };

  const filteredPages = filterData(pages, ['title_en', 'title_am', 'page_type']);
  const filteredImages = filterData(images, ['title', 'alt_text', 'caption']);
  const filteredArchive = filterData(archive, ['title_en', 'title_am']);
  const filteredEvents = filterData(events, ['title_en', 'title_am', 'location']);
  const filteredMembers = filterData(members, ['username', 'email', 'first_name', 'last_name', 'role']);
  const filteredMessages = filterData(messages, ['name', 'email', 'subject', 'message']);

  // Modal states
  const viewModal = useModal(false);
  const acceptModal = useModal(false);
  const rejectModal = useModal(false);
  const editModal = useModal(false);

  // Application/Member states
  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null);
  const [selectedMember, setSelectedMember] = useState<CADUMember | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [memberType, setMemberType] = useState<'executive' | 'regular' | 'general_assembly' | 'honorary'>('regular');
  const [rejectNotes, setRejectNotes] = useState('');

  // Initialize active section from URL or permissions
  useEffect(() => {
    if (permissionsLoading || userPermissions.length === 0) return;

    const sectionParam = searchParams.get('section') as AdminSection | null;
    const validSections: AdminSection[] = ['Pages', 'Templates', 'Archives', 'Events', 'Admins', 'Messages', 'Member Applications', 'CADU Members', 'Payments', 'Members Directory', 'Gallery', 'Contact Info'];

    if (sectionParam && validSections.includes(sectionParam)) {
      if (hasPermission(sectionParam)) {
        if (sectionParam === 'Gallery') {
          navigate('/admin/gallery');
          return;
        }
        setActiveSection(sectionParam);
      } else {
        const allowedSections = getAllowedSections();
        const defaultSection = allowedSections[0] || 'Pages';
        setActiveSection(defaultSection);
        setSearchParams({ section: defaultSection });
        showError(`You don't have permission to access ${sectionParam}`);
      }
    } else {
      const allowedSections = getAllowedSections();
      const defaultSection = allowedSections[0] || 'Pages';
      setActiveSection(defaultSection);
      setSearchParams({ section: defaultSection });
    }
  }, [searchParams, userPermissions, permissionsLoading, hasPermission, getAllowedSections, navigate, setSearchParams, showError]);

  // Handlers
  const handleLogout = () => {
    authAPI.logout();
    navigate('/admin/login');
  };

  const handleSectionClick = (section: AdminSection) => {
    if (!hasPermission(section)) {
      showError(`You don't have permission to access ${section}`);
      return;
    }

    // Navigate to dedicated pages for some sections - check this FIRST
    const navigationMap: Record<AdminSection, string> = {
      'Pages': '/admin/pages',
      'Templates': '/admin/images',
      'Archives': '/admin/archive',
      'Events': '/admin/events',
      'Admins': '/admin/admins',
      'Messages': '/admin/messages',
      'Member Applications': '/admin/member-applications',
      'CADU Members': '/admin/cadu-members',
      'Payments': '/admin/payments',
      'Members Directory': '/admin/members-directory',
      'Gallery': '/admin/gallery',
      'Contact Info': '/admin/contact-info',
      'Logs': '/admin/logs',
    };

    // If this section has a dedicated page, navigate immediately
    if (navigationMap[section]) {
      navigate(navigationMap[section]);
      return;
    }

    // Otherwise, set as active section for dashboard view
    setActiveSection(section);
    setSearchParams({ section });
  };

  const handleNewClick = () => {
    if (!hasPermission(activeSection)) {
      showError(`You don't have permission to access ${activeSection}`);
      return;
    }

    const navigationMap: Record<AdminSection, string> = {
      'Pages': '/admin/pages',
      'Templates': '/admin/images',
      'Archives': '/admin/archive',
      'Events': '/admin/events',
      'Admins': '/admin/admins',
      'Messages': '/admin/messages',
      'Member Applications': '/admin/member-applications',
      'CADU Members': '/admin/cadu-members',
      'Payments': '/admin/payments',
      'Members Directory': '/admin/members-directory',
      'Gallery': '/admin/gallery',
      'Contact Info': '/admin/contact-info',
      'Logs': '/admin/logs',
    };

    if (navigationMap[activeSection]) {
      navigate(navigationMap[activeSection]);
    }
  };

  const getSectionLabel = (section: AdminSection): string => {
    return section === 'Pages' ? 'Page' : section.slice(0, -1);
  };

  // Delete handlers
  const handleDeleteImage = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await apiClient.delete(`/admin/images/${id}/`);
      showSuccess('Image deleted successfully');
      // Refresh all data immediately
      await loadAllData(false);
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to delete image'));
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await apiClient.delete(`/admin/events/${id}/`);
      showSuccess('Event deleted successfully');
      // Refresh all data immediately
      await loadAllData(false);
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to delete event'));
    }
  };

  const handleDeleteArchive = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this archive item?')) return;
    try {
      await apiClient.delete(`/admin/archive/${id}/`);
      showSuccess('Archive item deleted successfully');
      // Refresh all data immediately
      await loadAllData(false);
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to delete archive item'));
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await apiClient.delete(`/admin/members/${id}/`);
      showSuccess('Member deleted successfully');
      // Refresh all data immediately
      await loadAllData(false);
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to delete member'));
    }
  };

  const handleToggleMemberActive = async (id: number, isActive: boolean) => {
    try {
      await apiClient.patch(`/admin/members/${id}/`, { is_active: !isActive });
      showSuccess(`Member ${isActive ? 'disabled' : 'enabled'} successfully`);
      // Refresh all data immediately
      await loadAllData(false);
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to update member status'));
    }
  };

  // Application handlers
  const handleViewApplication = (app: MemberApplication) => {
    setSelectedApplication(app);
    viewModal.open();
  };

  const handleAcceptApplication = async () => {
    if (!selectedApplication) return;
    try {
      await memberApplicationsAPI.acceptApplication(selectedApplication.id, memberType);
      showSuccess('Application accepted successfully');
      acceptModal.close();
      setSelectedApplication(null);
      setMemberType('regular');
      // Refresh all data immediately
      await loadAllData(false);
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to accept application'));
    }
  };

  const handleRejectApplication = async () => {
    if (!selectedApplication) return;
    try {
      await memberApplicationsAPI.rejectApplication(selectedApplication.id, rejectNotes);
      showSuccess('Application rejected');
      rejectModal.close();
      setSelectedApplication(null);
      setRejectNotes('');
      // Refresh all data immediately
      await loadAllData(false);
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to reject application'));
    }
  };

  // Member handlers
  const handleEditMember = (member: CADUMember) => {
    setSelectedMember(member);
    setProfilePictureFile(null); // Reset file when opening modal
    editModal.open();
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    try {
      // Check if we have a profile picture file to upload
      if (profilePictureFile) {
        // Use FormData for file upload
        const formData = new FormData();
        
        // Add all text fields
        formData.append('fullname', selectedMember.fullname);
        if (selectedMember.organization_name) {
          formData.append('organization_name', selectedMember.organization_name);
        }
        if (selectedMember.nationality) {
          formData.append('nationality', selectedMember.nationality);
        }
        if (selectedMember.resident_in) {
          formData.append('resident_in', selectedMember.resident_in);
        }
        if (selectedMember.birthdate) {
          formData.append('birthdate', selectedMember.birthdate);
        }
        if (selectedMember.gender) {
          formData.append('gender', selectedMember.gender);
        }
        if (selectedMember.country) {
          formData.append('country', selectedMember.country);
        }
        if (selectedMember.region) {
          formData.append('region', selectedMember.region);
        }
        if (selectedMember.town) {
          formData.append('town', selectedMember.town);
        }
        if (selectedMember.phone) {
          formData.append('phone', selectedMember.phone);
        }
        if (selectedMember.email) {
          formData.append('email', selectedMember.email);
        }
        if (selectedMember.emergency_contact) {
          formData.append('emergency_contact', selectedMember.emergency_contact);
        }
        if (selectedMember.registration_fee_amount != null) {
          formData.append('registration_fee_amount', String(selectedMember.registration_fee_amount));
        }
        if (selectedMember.monthly_fee_amount != null) {
          formData.append('monthly_fee_amount', String(selectedMember.monthly_fee_amount));
        }
        if (selectedMember.voluntaryBirr) {
          formData.append('voluntaryBirr', selectedMember.voluntaryBirr);
        }
        if (selectedMember.voluntaryUSD) {
          formData.append('voluntaryUSD', selectedMember.voluntaryUSD);
        }
        if (selectedMember.initial_payment_amount != null) {
          formData.append('initial_payment_amount', String(selectedMember.initial_payment_amount));
        }
        formData.append('member_type', selectedMember.member_type);
        formData.append('declaration_accepted', String(selectedMember.declaration_accepted || false));
        formData.append('photo_consent', String(selectedMember.photo_consent || false));
        
        // Add profile picture file
        formData.append('profile_picture', profilePictureFile);
        
        await caduMembersAPI.updateCADUMemberWithFile(selectedMember.id, formData);
      } else {
        // Use regular JSON update (no file)
        const updateData: any = {
          fullname: selectedMember.fullname,
          organization_name: selectedMember.organization_name,
          nationality: selectedMember.nationality,
          resident_in: selectedMember.resident_in,
          birthdate: selectedMember.birthdate,
          gender: selectedMember.gender,
          country: selectedMember.country,
          region: selectedMember.region,
          town: selectedMember.town,
          phone: selectedMember.phone,
          email: selectedMember.email,
          emergency_contact: selectedMember.emergency_contact,
          registration_fee_amount: selectedMember.registration_fee_amount,
          monthly_fee_amount: selectedMember.monthly_fee_amount,
          voluntaryBirr: selectedMember.voluntaryBirr,
          voluntaryUSD: selectedMember.voluntaryUSD,
          initial_payment_amount: selectedMember.initial_payment_amount,
          member_type: selectedMember.member_type,
          declaration_accepted: selectedMember.declaration_accepted,
          photo_consent: selectedMember.photo_consent,
        };
        
        await caduMembersAPI.updateCADUMember(selectedMember.id, updateData);
      }
      
      showSuccess('Member updated successfully');
      editModal.close();
      setSelectedMember(null);
      setProfilePictureFile(null);
      // Refresh all data immediately
      await loadAllData(false);
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to update member'));
    }
  };

  const handleDeleteCADUMember = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await caduMembersAPI.deleteCADUMember(id);
      showSuccess('Member deleted successfully');
      // Refresh all data immediately
      await loadAllData(false);
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to delete member'));
    }
  };

  const handleDownloadPDF = async (id: number) => {
    try {
      const blob = await caduMembersAPI.downloadPDF(id);
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const errorData = JSON.parse(text);
        showError(errorData.error || errorData.detail || 'Failed to download PDF');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedMember?.fullname.replace(/\s+/g, '_') || 'member'}_member_certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('PDF downloaded successfully');
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to download PDF'));
    }
  };

  const handleEditPage = (page: any) => {
    navigate(`/admin/pages/${page.page_type}`);
  };

  const handleEditMemberProfile = (member: any) => {
    navigate('/admin/admins');
  };

  const pendingApplications = applications.filter((app) => app.status === 'pending');
  const allowedSections = getAllowedSections();
  const loading = permissionsLoading || dataLoading;

  if (loading) {
    return (
      <div className="unified-admin">
        <LoadingSpinner fullScreen message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="unified-admin">
      <div className="admin-container">
        <header className="admin-header-bar">
          <div className="header-left">
            <h1>Page Manager</h1>
            <p>Manage pages, images, archives, events, members and messages</p>
          </div>
          
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${activeSection}...`}
            />

          <div className="header-right">
            {/* Auto-refresh indicator */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginRight: '1rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              {refreshing && (
                <>
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      animation: 'spin 1s linear infinite',
                      color: '#27ae60'
                    }}
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  <span style={{ fontSize: '0.75rem', color: '#27ae60' }}>
                    Updating...
                  </span>
                </>
              )}
              {lastRefresh && !refreshing && (
                <span style={{ fontSize: '0.75rem' }}>
                  Updated {formatTimeAgo(lastRefresh)} • Auto-refresh every 10s
                </span>
              )}
            </div>
            
            {/* Manual refresh button */}
            <button 
              onClick={() => loadAllData(false)} 
              className="refresh-button"
              disabled={refreshing || dataLoading}
              title="Refresh data"
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: refreshing || dataLoading ? 'not-allowed' : 'pointer',
                opacity: refreshing || dataLoading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ 
                  width: '18px', 
                  height: '18px',
                  transform: refreshing ? 'rotate(360deg)' : 'none',
                  transition: refreshing ? 'transform 1s linear' : 'none'
                }}
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
            
            {activeSection !== 'Messages' && activeSection !== 'Member Applications' && activeSection !== 'CADU Members' && activeSection !== 'Payments' && (
              <button onClick={handleNewClick} className="new-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                New {getSectionLabel(activeSection)}
              </button>
            )}
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
              {allowedSections.map((section) => (
                <li key={section}>
                  <button
                    onClick={() => handleSectionClick(section)}
                    className={`sidebar-item ${activeSection === section ? 'active' : ''}`}
                  >
                    <SectionIcon section={section} />
                    <span className="sidebar-text">{section}</span>
                    {section === 'Member Applications' && pendingApplications.length > 0 && (
                      <span className="notification-badge">{pendingApplications.length}</span>
                    )}
                  </button>
                </li>
              ))}
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
                      backgroundColor:
                        (storageInfo?.percentage || 0) > 80
                          ? '#ef4444'
                          : (storageInfo?.percentage || 0) > 60
                          ? '#f59e0b'
                          : '#10b981',
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
              {activeSection === 'Pages' && (
                <PagesSection pages={filteredPages} onEdit={handleEditPage} />
              )}

              {activeSection === 'Templates' && (
                <ImagesSection images={filteredImages} onDelete={handleDeleteImage} />
              )}

              {activeSection === 'Archives' && (
                <ArchiveSection archive={filteredArchive} onDelete={handleDeleteArchive} />
              )}

              {activeSection === 'Events' && (
                <EventsSection events={filteredEvents} onDelete={handleDeleteEvent} />
              )}

              {activeSection === 'Admins' && (
                <AdminsSection
                  members={filteredMembers}
                  onEdit={handleEditMemberProfile}
                  onDelete={handleDeleteMember}
                  onToggleActive={handleToggleMemberActive}
                />
              )}

              {activeSection === 'Messages' && <MessagesSection messages={filteredMessages} />}


              {/* These sections redirect immediately via handleSectionClick, but show loading while redirecting */}
              {(activeSection === 'Member Applications' || 
                activeSection === 'CADU Members' || 
                activeSection === 'Payments') && (
                <section>
                  <div className="content-card">
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                      Redirecting to {activeSection}...
                    </p>
                  </div>
                </section>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <ViewApplicationModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        application={selectedApplication}
        onAccept={() => {
          viewModal.close();
          setSelectedApplication(selectedApplication);
          setMemberType('regular');
          acceptModal.open();
        }}
        onReject={() => {
          viewModal.close();
          setSelectedApplication(selectedApplication);
          setRejectNotes('');
          rejectModal.open();
        }}
      />

      <AcceptApplicationModal
        isOpen={acceptModal.isOpen}
        onClose={acceptModal.close}
        application={selectedApplication}
        memberType={memberType}
        onMemberTypeChange={setMemberType}
        onConfirm={handleAcceptApplication}
      />

      <RejectApplicationModal
        isOpen={rejectModal.isOpen}
        onClose={rejectModal.close}
        application={selectedApplication}
        notes={rejectNotes}
        onNotesChange={setRejectNotes}
        onConfirm={handleRejectApplication}
      />

      <EditMemberModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        member={selectedMember}
        onMemberChange={(updatedMember) => {
          if (updatedMember) {
            setSelectedMember(updatedMember);
          }
        }}
        onProfilePictureChange={(file) => {
          setProfilePictureFile(file);
        }}
        onConfirm={handleUpdateMember}
      />
    </div>
  );
};

export default AdminDashboard;

