/**
 * Application Modal Components
 * Modals for viewing, accepting, and rejecting member applications
 */

import React from 'react';
import { Modal, FormField } from '../common';
import { MemberApplication } from '../../types/admin.types';
import { CADUMember } from '../../api/caduMembers';
import { formatDate } from '../../utils/dateUtils';
import StatusBadge from '../common/StatusBadge';
import AuthenticatedImage from '../AuthenticatedImage';

/**
 * View Application Modal
 */
interface ViewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: MemberApplication | null;
  onAccept: () => void;
  onReject: () => void;
}

export const ViewApplicationModal: React.FC<ViewApplicationModalProps> = ({
  isOpen,
  onClose,
  application,
  onAccept,
  onReject,
}) => {
  if (!application) return null;

  // Helper to hide empty / nullish values instead of showing "N/A"
  // We also filter out fields that are not part of the new registration form (RegisterNew) if they are N/A.
  // This keeps the view clean and focused on relevant data for new applications.
  const rows: { label: string; value?: string | null }[] = [
    { label: 'Full Name', value: application.fullname },
    { label: 'Email', value: application.email },
    { label: 'Phone', value: application.phone },
    { label: 'Country', value: application.country },
    { label: 'Region', value: application.region },
    { label: 'Town', value: application.town },
    // Legacy fields - only show if they have values (not null/empty)
    {
      label: 'Birthdate',
      value: application.birthdate ? formatDate(application.birthdate) : null,
    },
    { label: 'Gender', value: application.gender },
    { label: 'Citizenship', value: application.citizenship },
    { label: 'District', value: application.district },
    { label: 'Spouse', value: application.spouse },
    { label: 'Spouse Phone', value: application.spousePhone },
    { label: 'Study', value: application.study },
    { label: 'Work From', value: application.workFrom },
    { label: 'Work To', value: application.workTo },
    // End legacy fields
    { label: 'Voluntary (Birr)', value: application.voluntaryBirr },
    { label: 'Voluntary (USD)', value: application.voluntaryUSD },
  ].filter((row) => row.value && String(row.value).trim().length > 0 && row.value !== 'N/A');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Details"
      variant="view"
      maxWidth="800px"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        {rows.map((row) => (
          <FormField key={row.label} label={row.label}>
            <p>{row.value}</p>
        </FormField>
        ))}
        <FormField label="One-time Registration Payment">
          {application.registration_fee_amount ? (
            <p>
              {typeof application.registration_fee_amount === 'number' 
                ? `${application.registration_fee_amount.toFixed(2)} ETB`
                : `${application.registration_fee_amount} ETB`}
            </p>
          ) : application.initial_payment_amount ? (
            <p>
              {typeof application.initial_payment_amount === 'number' 
                ? `${application.initial_payment_amount.toFixed(2)} ETB`
                : `${application.initial_payment_amount} ETB`}
            </p>
          ) : (
            <p>Not paid</p>
          )}
        </FormField>
        <FormField label="Membership Fee">
          {application.monthly_fee_amount ? (
            <p>
              {(() => {
                const amount = typeof application.monthly_fee_amount === 'number' 
                  ? application.monthly_fee_amount 
                  : parseFloat(String(application.monthly_fee_amount)) || 0;
                const isAnnual = amount >= 600 || (application.notes?.toLowerCase().includes('annual') ?? false);
                const feeType = isAnnual ? 'Annual' : 'Monthly';
                return `${amount.toFixed(2)} ETB (${feeType})`;
              })()}
            </p>
          ) : (
            <p>Not paid</p>
          )}
        </FormField>
        <FormField label="Photo Consent">
          <p>{application.photo_consent ? 'Yes' : 'No'}</p>
        </FormField>
        <FormField label="Status" style={{ gridColumn: '1 / -1' }}>
          <StatusBadge status={application.status as any} />
        </FormField>
        {application.notes && (
          <FormField label="Notes" style={{ gridColumn: '1 / -1' }}>
            <p>{application.notes}</p>
          </FormField>
        )}
        {application.reviewed_by_name && (
          <FormField label="Reviewed By">
            <p>{application.reviewed_by_name}</p>
          </FormField>
        )}
        {application.reviewed_at && (
          <FormField label="Reviewed At">
            <p>{formatDate(application.reviewed_at)}</p>
          </FormField>
        )}
        <FormField label="Submitted">
          <p>{formatDate(application.created_at)}</p>
        </FormField>
      </div>

      {(application.profile_picture_url || application.receipt_photo_url) && (
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {application.profile_picture_url && (
            <FormField label="Profile Picture">
              <AuthenticatedImage
                src={application.profile_picture_url}
                alt="Profile"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  marginTop: '0.5rem', 
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  objectFit: 'contain',
                  backgroundColor: '#f9fafb'
                }}
                onError={(error) => {
                  console.error('Failed to load profile picture:', application.profile_picture_url, error);
                }}
                onLoad={() => {
                  console.log('Profile picture loaded successfully:', application.profile_picture_url);
                }}
              />
            </FormField>
          )}
          {application.receipt_photo_url && (
            <FormField label="Receipt Photo">
              <AuthenticatedImage
                src={application.receipt_photo_url}
                alt="Receipt"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  marginTop: '0.5rem', 
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  objectFit: 'contain',
                  backgroundColor: '#f9fafb'
                }}
                onError={(error) => {
                  console.error('Failed to load receipt photo:', application.receipt_photo_url, error);
                }}
              />
            </FormField>
          )}
        </div>
      )}

      <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
        <button onClick={onClose} className="action-btn">
          Close
        </button>
        {application.status === 'pending' && (
          <>
            <button onClick={onAccept} className="action-btn accept">
              Accept
            </button>
            <button onClick={onReject} className="action-btn delete">
              Reject
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

/**
 * Accept Application Modal
 */
interface AcceptApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: MemberApplication | null;
  memberType: 'executive' | 'regular' | 'general_assembly' | 'honorary';
  onMemberTypeChange: (value: 'executive' | 'regular' | 'general_assembly' | 'honorary') => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const AcceptApplicationModal: React.FC<AcceptApplicationModalProps> = ({
  isOpen,
  onClose,
  application,
  memberType,
  onMemberTypeChange,
  onConfirm,
  loading = false,
}) => {
  if (!application) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Accept Application"
      variant="confirm"
      confirmLabel="Accept"
      onConfirm={onConfirm}
      loading={loading}
    >
      <p>
        Accept application for <strong>{application.fullname}</strong>?
      </p>
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Member Type</label>
        <select
          value={memberType}
          onChange={(e) => onMemberTypeChange(e.target.value as 'executive' | 'regular' | 'general_assembly' | 'honorary')}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ddd',
            marginTop: '0.5rem',
          }}
        >
          <option value="regular">Regular Member</option>
          <option value="executive">Executive Member</option>
          <option value="general_assembly">General Assembly Member</option>
          <option value="honorary">Honorary Member</option>
        </select>
      </div>
    </Modal>
  );
};

/**
 * Reject Application Modal
 */
interface RejectApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: MemberApplication | null;
  notes: string;
  onNotesChange: (value: string) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const RejectApplicationModal: React.FC<RejectApplicationModalProps> = ({
  isOpen,
  onClose,
  application,
  notes,
  onNotesChange,
  onConfirm,
  loading = false,
}) => {
  if (!application) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Application"
      variant="delete"
      confirmLabel="Reject"
      onConfirm={onConfirm}
      loading={loading}
    >
      <p>
        Reject application for <strong>{application.fullname}</strong>?
      </p>
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
        />
      </div>
    </Modal>
  );
};

/**
 * Edit Member Modal - Comprehensive edit form for superadmin
 */
interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: CADUMember | null;
  onMemberChange: (member: CADUMember) => void;
  onProfilePictureChange?: (file: File | null) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onMemberChange,
  onProfilePictureChange,
  onConfirm,
  loading = false,
}) => {
  const [profilePictureFile, setProfilePictureFile] = React.useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = React.useState<string | null>(null);

  if (!member) return null;

  const handleFieldChange = (field: keyof CADUMember, value: any) => {
    onMemberChange({ ...member, [field]: value });
  };

  const handleProfilePictureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProfilePictureFile(file);
    
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProfilePicturePreview(null);
    }
    
    // Notify parent component
    if (onProfilePictureChange) {
      onProfilePictureChange(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    if (onProfilePictureChange) {
      onProfilePictureChange(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Member - Superadmin"
      variant="form"
      confirmLabel="Save Changes"
      onConfirm={onConfirm}
      loading={loading}
      maxWidth="900px"
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0.5rem' }}>
        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
          Editing: <strong>{member.fullname}</strong>
        </p>

        {/* Basic Information */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Basic Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={member.fullname || ''}
                onChange={(e) => handleFieldChange('fullname', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={member.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={member.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Organization Name</label>
              <input
                type="text"
                value={member.organization_name || ''}
                onChange={(e) => handleFieldChange('organization_name', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Personal Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Birthdate</label>
              <input
                type="date"
                value={member.birthdate ? member.birthdate.split('T')[0] : ''}
                onChange={(e) => handleFieldChange('birthdate', e.target.value || null)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <input
                type="text"
                value={member.gender || ''}
                onChange={(e) => handleFieldChange('gender', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <input
                type="text"
                value={member.nationality || ''}
                onChange={(e) => handleFieldChange('nationality', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Resident In</label>
              <select
                value={member.resident_in || ''}
                onChange={(e) => handleFieldChange('resident_in', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">Select...</option>
                <option value="ethiopia">Ethiopia</option>
                <option value="abroad">Abroad</option>
              </select>
            </div>
            <div className="form-group">
              <label>Member Type *</label>
              <select
                value={member.member_type}
                onChange={(e) => handleFieldChange('member_type', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="regular">Regular Member</option>
                <option value="executive">Executive Member</option>
                <option value="general_assembly">General Assembly Member</option>
                <option value="honorary">Honorary Member</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Address Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                value={member.country || ''}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Region</label>
              <input
                type="text"
                value={member.region || ''}
                onChange={(e) => handleFieldChange('region', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Town</label>
              <input
                type="text"
                value={member.town || ''}
                onChange={(e) => handleFieldChange('town', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Contact Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Emergency Contact</label>
              <input
                type="text"
                value={member.emergency_contact || ''}
                onChange={(e) => handleFieldChange('emergency_contact', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Payment Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Registration Fee Amount (ETB)</label>
              <input
                type="number"
                step="0.01"
                value={member.registration_fee_amount != null ? member.registration_fee_amount : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFieldChange('registration_fee_amount', value !== '' ? parseFloat(value) : null);
                }}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Monthly Fee Amount (ETB)</label>
              <input
                type="number"
                step="0.01"
                value={member.monthly_fee_amount || ''}
                onChange={(e) => handleFieldChange('monthly_fee_amount', e.target.value ? parseFloat(e.target.value) : null)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Initial Payment Amount (ETB)</label>
              <input
                type="number"
                step="0.01"
                value={member.initial_payment_amount || ''}
                onChange={(e) => handleFieldChange('initial_payment_amount', e.target.value ? parseFloat(e.target.value) : null)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Voluntary (Birr)</label>
              <input
                type="text"
                value={member.voluntaryBirr || ''}
                onChange={(e) => handleFieldChange('voluntaryBirr', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div className="form-group">
              <label>Voluntary (USD)</label>
              <input
                type="text"
                value={member.voluntaryUSD || ''}
                onChange={(e) => handleFieldChange('voluntaryUSD', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>
        </div>

        {/* Profile Picture */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Profile Picture
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Current Profile Picture</label>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {profilePicturePreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={profilePicturePreview}
                      alt="Profile preview"
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Remove new picture"
                    >
                      ×
                    </button>
                  </div>
                ) : member.profile_picture_url ? (
                  <AuthenticatedImage
                    src={member.profile_picture_url}
                    alt="Current profile"
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '8px',
                      border: '2px dashed #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                    }}
                  >
                    No picture
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureFileChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '0.875rem',
                    }}
                  />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    {profilePictureFile
                      ? `Selected: ${profilePictureFile.name}`
                      : 'Select a new profile picture to replace the current one'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consent Form */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Consent Form
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Member Visibility</label>
              <button
                type="button"
                onClick={() => handleFieldChange('photo_consent', !member.photo_consent)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: '#ffffff',
                  backgroundColor: member.photo_consent ? '#10b981' : '#ef4444',
                  transition: 'background-color 0.2s ease',
                  marginTop: '0.5rem',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {member.photo_consent ? 'Public' : 'Private'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

