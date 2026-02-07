/**
 * MemberManager Component (Refactored)
 * Manages member accounts and profiles
 * Uses reusable components and custom hooks for better maintainability
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import { DataTable, TableColumn, TableAction, StatusBadge, Modal, FormField } from '../../components/common';
import MemberForm from '../../components/forms/MemberForm';
import PermissionManager from '../../components/admin/PermissionManager';
import { useModal } from '../../hooks';
import { MemberProfile, MemberCreateData } from '../../types/admin.types';
import { Permission } from '../../types/api.types';
import { extractErrorMessage } from '../../utils/errorHandler';
import { extractResponseData } from '../../utils/apiHelpers';
import '../../components/AdminLayout.css';

/**
 * MemberManager component for managing member accounts
 */
const MemberManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);
  
  // Modals
  const passwordModal = useModal(false);
  const permissionsModal = useModal(false);
  
  // Form state
  const [formData, setFormData] = useState<MemberCreateData>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'admin', // Default to administrator
    phone: '',
    address: '',
    bio: '',
    permissions: [], // Empty permissions by default
    member_type: 'regular' as 'executive' | 'regular' | 'general_assembly' | 'honorary',
  });
  
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMembers();
    loadPermissions();
  }, []);

  /**
   * Load available permissions
   */
  const loadPermissions = async () => {
    try {
      const response = await apiClient.get('/admin/permissions/');
      const permissionsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      // Remove duplicates based on permission code
      const uniquePermissions = permissionsData.reduce((acc: Permission[], permission: Permission) => {
        if (!acc.find((p) => p.code === permission.code)) {
          acc.push(permission);
        }
        return acc;
      }, [] as Permission[]);
      
      setPermissions(uniquePermissions);
    } catch (error: any) {
      console.error('Failed to load permissions:', error);
      // Use default permissions if API fails
      setPermissions([
        { id: 1, code: 'manage_pages', name: 'Manage Pages', description: 'Create, edit, and delete website pages' },
        { id: 2, code: 'manage_images', name: 'Manage Images', description: 'Upload and manage image library' },
        { id: 3, code: 'manage_archive', name: 'Manage Archive', description: 'Upload and manage archive documents' },
        { id: 5, code: 'manage_events', name: 'Manage Events', description: 'Create and manage events and meetings' },
        { id: 6, code: 'manage_news', name: 'Manage News', description: 'Create and publish news articles' },
        { id: 7, code: 'view_member_directory', name: 'View Member Directory', description: 'Access to member directory' },
        { id: 8, code: 'view_archive', name: 'View Archive', description: 'Access to archive documents' },
        { id: 9, code: 'manage_member_applications', name: 'Manage Member Applications', description: 'Manage member application submissions' },
        { id: 10, code: 'manage_cadu_members', name: 'Manage CADU Members', description: 'Manage CADU member accounts' },
        { id: 11, code: 'manage_payments', name: 'Manage Payments', description: 'Manage member payments' },
      ]);
    }
  };

  /**
   * Load members list
   */
  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/members/');
      const membersData = extractResponseData<MemberProfile>(response.data);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Failed to load members:', error);
      showError(extractErrorMessage(error, 'Failed to load members. Please try again.'));
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form field change
   */
  const handleFormChange = (field: keyof MemberCreateData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle password change
   */
  const handlePasswordChange = (field: 'password' | 'confirmPassword', value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Toggle permission selection
   */
  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  /**
   * Toggle form permission
   */
  const toggleFormPermission = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions?.includes(code)
        ? prev.permissions.filter((p) => p !== code)
        : [...(prev.permissions || []), code],
    }));
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!editingMember) {
      if (!formData.password || formData.password.trim() === '') {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      } else if (formData.password !== passwordData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (editingMember) {
        // Update existing member
        const updateData: any = { ...formData };
        delete updateData.password; // Don't send password for updates
        if (formData.permissions) {
          updateData.permission_codes = formData.permissions;
        }
        // Include member_type if member has a CADU member account
        if (editingMember.cadu_member_id !== null && editingMember.cadu_member_id !== undefined && formData.member_type !== undefined) {
          updateData.member_type_write = formData.member_type;
        }
        await apiClient.put(`/admin/members/${editingMember.id}/`, updateData);
        showSuccess('Member updated successfully!');
      } else {
        // Create new member (admin account)
        const createData: any = { ...formData };
        // Set role to admin (administrator) and permissions to empty
        createData.role = 'admin';
        createData.permissions = []; // Empty permissions - will be managed after creation
        // Remove bio field from create data
        delete createData.bio;
        await apiClient.post('/admin/members/', createData);
        showSuccess('Admin account created successfully! You can manage permissions after creation.');
      }
      resetForm();
      loadMembers();
    } catch (error: any) {
      console.error('Failed to save member:', error);
      showError(extractErrorMessage(error, 'Failed to save member. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle edit member
   */
  const handleEdit = (member: MemberProfile) => {
    setEditingMember(member);
    setFormData({
      username: member.username,
      email: member.email,
      password: '',
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      role: member.role,
      phone: member.phone || '',
      address: member.address || '',
      bio: member.bio || '',
      permissions: member.permissions?.map((p) => p.code) || [],
      member_type: member.member_type || 'regular',
    });
    setShowCreate(true);
  };


  /**
   * Handle manage permissions
   */
  const handleManagePermissions = (member: MemberProfile) => {
    setSelectedMemberId(member.id);
    // Initialize selectedPermissions with member's current permissions
    const currentPermissions = member.permissions?.map((p) => p.code) || [];
    setSelectedPermissions(currentPermissions);
    permissionsModal.open();
  };

  /**
   * Save permissions
   */
  const handleSavePermissions = async () => {
    if (selectedMemberId === null) return;
    setLoading(true);
    try {
      const response = await apiClient.put(`/admin/members/${selectedMemberId}/permissions/`, {
        permissions: selectedPermissions,
      });
      showSuccess('Permissions updated successfully!');
      permissionsModal.close();
      setSelectedPermissions([]);
      setSelectedMemberId(null);
      // Reload members to get updated permissions
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to update permissions:', error);
      showError(extractErrorMessage(error, 'Failed to update permissions. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle change password
   */
  const handleChangePassword = (memberId: number) => {
    setSelectedMemberId(memberId);
    passwordModal.open();
  };

  /**
   * Handle password submit
   */
  const handlePasswordSubmit = async () => {
    if (passwordData.password !== passwordData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (passwordData.password.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }

    if (selectedMemberId === null) return;

    setLoading(true);
    try {
      await apiClient.patch(`/admin/members/${selectedMemberId}/`, {
        password: passwordData.password,
      });
      showSuccess('Password changed successfully');
      passwordModal.close();
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to change password'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete member
   */
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await apiClient.delete(`/admin/members/${id}/`);
      showSuccess('Member deleted successfully!');
      loadMembers();
    } catch (error: any) {
      showError(extractErrorMessage(error, 'Failed to delete member. Please try again.'));
    }
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'admin', // Default to administrator
      phone: '',
      address: '',
      bio: '',
      permissions: [], // Empty permissions by default
      member_type: 'regular' as 'executive' | 'regular' | 'general_assembly' | 'honorary',
    });
    setEditingMember(null);
    setShowCreate(false);
    setPasswordData({ password: '', confirmPassword: '' });
    setFormErrors({});
  };

  // Table columns
  const columns: TableColumn<MemberProfile>[] = [
    {
      header: 'Name',
      accessor: (member) =>
        member.first_name && member.last_name
          ? `${member.first_name} ${member.last_name}`
          : member.username,
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (value) => String(value).charAt(0).toUpperCase() + String(value).slice(1),
    },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (value) => <StatusBadge status={value ? 'active' : 'inactive'} />,
    },
    {
      header: 'Member Type',
      accessor: 'member_type',
      render: (value, member) => {
        if (!member.cadu_member_id) return <span style={{ color: '#94a3b8' }}>—</span>;
        const memberType = value || 'regular';
        const typeLabels: Record<string, string> = {
          executive: 'Executive',
          regular: 'Regular',
          general_assembly: 'General Assembly',
          honorary: 'Honorary',
        };
        const typeColors: Record<string, string> = {
          executive: '#4338ca',
          regular: '#6b7280',
          general_assembly: '#7c3aed',
          honorary: '#059669',
        };
        return (
          <span className="status-badge" style={{ background: typeColors[memberType] || '#6b7280', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {typeLabels[memberType] || 'Regular'}
          </span>
        );
      },
    },
  ];

  // Table actions
  const actions: TableAction<MemberProfile>[] = [
    {
      label: 'Edit',
      variant: 'edit',
      onClick: handleEdit,
    },
    {
      label: 'Manage Permissions',
      variant: 'secondary',
      onClick: handleManagePermissions,
    },
    {
      label: 'Change Password',
      variant: 'secondary',
      onClick: (member) => handleChangePassword(member.id),
    },
    {
      label: 'Delete',
      variant: 'delete',
      onClick: (member) => handleDelete(member.id),
    },
  ];

  if (loading && members.length === 0) {
    return (
      <AdminLayout title="Member Management" subtitle="Manage member accounts and profiles">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Member Management"
      subtitle="Manage member accounts and profiles"
      actionButton={
        <button
          onClick={() => {
            resetForm();
            setShowCreate(!showCreate);
          }}
          className="new-button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {showCreate ? 'Cancel' : 'Create Member'}
        </button>
      }
    >
      {showCreate && (
        <form onSubmit={handleSubmit}>
          <MemberForm
            formData={formData}
            onChange={handleFormChange}
            passwordData={passwordData}
            onPasswordChange={handlePasswordChange}
            permissions={permissions}
            selectedPermissions={formData.permissions || []}
            onTogglePermission={toggleFormPermission}
            editingMember={editingMember}
            errors={formErrors}
          />
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? (editingMember ? 'Updating...' : 'Creating...') : (editingMember ? 'Update Member' : 'Create Member')}
          </button>
        </form>
      )}

      <h2 className="section-title">Existing Members</h2>
      <DataTable
        data={members}
        columns={columns}
        actions={actions}
        emptyMessage="No members found. Create your first member above."
      />

      {/* Permission Manager Modal */}
      <PermissionManager
        isOpen={permissionsModal.isOpen}
        onClose={() => {
          permissionsModal.close();
          setSelectedPermissions([]);
          setSelectedMemberId(null);
        }}
        permissions={permissions}
        selectedPermissions={selectedPermissions}
        onTogglePermission={togglePermission}
        onSave={handleSavePermissions}
        loading={loading}
      />

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordModal.isOpen}
        onClose={() => {
          passwordModal.close();
          setPasswordData({ password: '', confirmPassword: '' });
        }}
        title="Change Password"
        variant="form"
        confirmLabel="Change Password"
        onConfirm={handlePasswordSubmit}
        loading={loading}
      >
        <FormField label="New Password" required error={formErrors.password}>
          <input
            type="password"
            value={passwordData.password}
            onChange={(e) => handlePasswordChange('password', e.target.value)}
            required
            minLength={8}
            placeholder="Enter new password (min. 8 characters)"
          />
        </FormField>
        <FormField label="Confirm Password" required error={formErrors.confirmPassword}>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            required
            minLength={8}
            placeholder="Confirm new password"
          />
        </FormField>
      </Modal>
    </AdminLayout>
  );
};

export default MemberManager;

