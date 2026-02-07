/**
 * MemberForm Component
 * Form for creating and editing member accounts
 */

import React from 'react';
import { FormField } from '../common';
import { MemberProfile, MemberCreateData } from '../../types/admin.types';
import { Permission } from '../../types/api.types';

interface MemberFormProps {
  /** Form data */
  formData: MemberCreateData;
  /** Form change handler */
  onChange: (field: keyof MemberCreateData, value: any) => void;
  /** Password confirmation data */
  passwordData: { password: string; confirmPassword: string };
  /** Password data change handler */
  onPasswordChange: (field: 'password' | 'confirmPassword', value: string) => void;
  /** Available permissions */
  permissions: Permission[];
  /** Selected permission codes */
  selectedPermissions: string[];
  /** Permission toggle handler */
  onTogglePermission: (code: string) => void;
  /** Whether editing existing member */
  editingMember?: MemberProfile | null;
  /** Form errors */
  errors?: Record<string, string>;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * MemberForm component for member creation and editing
 */
const MemberForm: React.FC<MemberFormProps> = ({
  formData,
  onChange,
  passwordData,
  onPasswordChange,
  permissions,
  selectedPermissions,
  onTogglePermission,
  editingMember,
  errors = {},
  className = '',
  style,
}) => {
  return (
    <div
      className={className}
      style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb', ...style }}
    >
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>
        {editingMember ? 'Edit' : 'Create'} - Personal Information & Profile
      </h3>
      <div className="form-row">
        <FormField label="Username" required error={errors.username}>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => onChange('username', e.target.value)}
            required
            disabled={!!editingMember}
          />
        </FormField>
        <FormField label="Email" required error={errors.email}>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            required
          />
        </FormField>
      </div>
      <div className="form-row">
        <FormField label="First Name" error={errors.first_name}>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => onChange('first_name', e.target.value)}
          />
        </FormField>
        <FormField label="Last Name" error={errors.last_name}>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => onChange('last_name', e.target.value)}
          />
        </FormField>
      </div>
      <div className="form-row">
        <FormField label="Phone" error={errors.phone}>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </FormField>
        {/* Role field removed - always set to 'admin' (administrator) when creating */}
      </div>
      <FormField label="Address" error={errors.address}>
        <textarea
          value={formData.address}
          onChange={(e) => onChange('address', e.target.value)}
        />
      </FormField>
      {/* Bio field removed */}
      {!editingMember && (
        <div className="form-row">
          <FormField label="Password" required error={errors.password}>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => onChange('password', e.target.value)}
              required
              minLength={8}
              placeholder="Enter password (min. 8 characters)"
            />
          </FormField>
          <FormField label="Confirm Password" required error={errors.confirmPassword}>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
              required
              minLength={8}
              placeholder="Confirm password"
            />
          </FormField>
        </div>
      )}

      {/* Permissions table removed - permissions will be managed after account creation */}

      {/* Member Type - Only show if member has a CADU member account */}
      {editingMember && editingMember.cadu_member_id && (
        <FormField label="Member Type" style={{ marginTop: '1.5rem' }}>
          <select
            value={formData.member_type || 'regular'}
            onChange={(e) => onChange('member_type', e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="regular">Regular Member</option>
            <option value="executive">Executive Member</option>
            <option value="general_assembly">General Assembly Member</option>
            <option value="honorary">Honorary Member</option>
          </select>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
            Member type determines access to different archive documents.
          </p>
        </FormField>
      )}
    </div>
  );
};

export default MemberForm;

