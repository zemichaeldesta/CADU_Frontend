/**
 * PermissionManager Component
 * Modal for managing member permissions
 */

import React from 'react';
import { Modal } from '../common';
import { Permission } from '../../types/api.types';

interface PermissionManagerProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Available permissions */
  permissions: Permission[];
  /** Selected permission codes */
  selectedPermissions: string[];
  /** Permission toggle handler */
  onTogglePermission: (code: string) => void;
  /** Save handler */
  onSave: () => void;
  /** Loading state */
  loading?: boolean;
}

/**
 * PermissionManager component for editing member permissions
 */
const PermissionManager: React.FC<PermissionManagerProps> = ({
  isOpen,
  onClose,
  permissions,
  selectedPermissions,
  onTogglePermission,
  onSave,
  loading = false,
}) => {
  // Remove duplicates based on permission code (safety measure) and sort with superadmin permissions last
  // Also filter out deprecated 'manage_members' permission (replaced by manage_member_applications, manage_cadu_members, manage_payments)
  const uniquePermissions = React.useMemo(() => {
    const seen = new Set<string>();
    const filtered = permissions.filter((permission) => {
      // Exclude deprecated manage_members permission
      if (permission.code === 'manage_members') {
        return false;
      }
      if (seen.has(permission.code)) {
        return false;
      }
      seen.add(permission.code);
      return true;
    });
    
    // Superadmin permission codes
    const superadminCodes = ['manage_cadu_members', 'manage_admins', 'view_logs'];
    
    // Separate regular and superadmin permissions
    const regular = filtered.filter(p => !superadminCodes.includes(p.code));
    const superadmin = filtered.filter(p => superadminCodes.includes(p.code));
    
    // Sort superadmin permissions in the order: CADU Members, Admins, Logs
    const superadminOrder = ['manage_cadu_members', 'manage_admins', 'view_logs'];
    const sortedSuperadmin = superadminOrder
      .map(code => superadmin.find(p => p.code === code))
      .filter(Boolean) as Permission[];
    
    // Return regular permissions first, then superadmin permissions
    return [...regular, ...sortedSuperadmin];
  }, [permissions]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Permissions"
      variant="form"
      confirmLabel="Save Permissions"
      onConfirm={onSave}
      loading={loading}
      maxWidth="600px"
    >
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1rem',
          maxHeight: '400px',
          overflowY: 'auto',
          background: '#fff',
        }}
      >
        <table className="data-table" style={{ width: '100%', margin: 0 }}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>Select</th>
              <th>Permission</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {uniquePermissions.map((permission, index) => {
              const isSuperadmin = ['manage_cadu_members', 'manage_admins', 'view_logs'].includes(permission.code);
              const isFirstSuperadmin = isSuperadmin && index > 0 && !['manage_cadu_members', 'manage_admins', 'view_logs'].includes(uniquePermissions[index - 1].code);
              
              return (
                <React.Fragment key={`${permission.id}-${permission.code}`}>
                  {isFirstSuperadmin && (
                    <tr>
                      <td colSpan={3} style={{ 
                        padding: '0.75rem 0.5rem', 
                        borderTop: '2px solid #e5e7eb',
                        background: '#fef2f2'
                      }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          color: '#dc2626',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Superadmin Permissions</span>
                      </td>
                    </tr>
                  )}
                  <tr className={isSuperadmin ? 'superadmin-permission-row' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.code)}
                        onChange={() => onTogglePermission(permission.code)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ color: isSuperadmin ? '#ef4444' : 'inherit' }}>
                        {permission.name}
                      </span>
                      {isSuperadmin && (
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.65rem',
                          padding: '0.125rem 0.375rem',
                          background: '#fee2e2',
                          color: '#dc2626',
                          borderRadius: '0.25rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>superadmin</span>
                      )}
                    </td>
                    <td style={{ color: isSuperadmin ? '#dc2626' : '#666', fontSize: '0.9rem' }}>
                      {permission.description}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default PermissionManager;

