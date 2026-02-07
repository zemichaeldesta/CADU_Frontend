import React, { useState, useEffect } from 'react';
import { caduMembersAPI, CADUMember } from '../../api/caduMembers';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';

const MembersDirectory: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [caduMembers, setCADUMembers] = useState<CADUMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<CADUMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCADUMembers();
  }, []);

  const loadCADUMembers = async () => {
    try {
      setLoading(true);
      const data = await caduMembersAPI.getAdminCADUMembers();
      setCADUMembers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load CADU members:', error);
      showError('Failed to load members');
      setCADUMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterData = <T extends Record<string, any>>(
    list: T[],
    keys: (keyof T)[]
  ): T[] => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((item) =>
      keys.some((key) => String(item[key] || '').toLowerCase().includes(query))
    );
  };

  const filteredCADUMembers = filterData(caduMembers, ['fullname', 'email', 'phone', 'country']);

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    try {
      await caduMembersAPI.updateCADUMember(selectedMember.id, { 
        member_type: selectedMember.member_type
      });
      showSuccess('Member updated successfully');
      setShowEditModal(false);
      setSelectedMember(null);
      loadCADUMembers();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update member');
    }
  };

  const handleDownloadCertificate = async (memberId: number, memberName: string) => {
    try {
      const blob = await caduMembersAPI.downloadPDF(memberId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${memberName.replace(/\s+/g, '_')}_member_certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Certificate downloaded successfully');
    } catch (error: any) {
      console.error('Download certificate error:', error);
      try {
        const errorData = await error.response?.data?.text();
        if (errorData) {
          const parsed = JSON.parse(errorData);
          showError(parsed.error || parsed.detail || 'Failed to download certificate');
        } else {
          showError('Failed to download certificate');
        }
      } catch (parseError) {
        if (error.response?.data?.error) {
          showError(error.response.data.error || error.response.data.detail || 'Failed to download certificate');
        } else if (error.response?.data?.detail) {
          showError(error.response.data.detail);
        } else {
          showError(error.message || 'Failed to download certificate');
        }
      }
    }
  };

  const handleEditMember = (member: CADUMember) => {
    setSelectedMember({
      ...member,
      member_type: member.member_type || 'regular',
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <AdminLayout title="Members Directory" subtitle="View and manage member information">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <>
      <AdminLayout
        title="Members Directory"
        subtitle="View and manage member information"
        searchPlaceholder="Search members..."
        onSearch={setSearchQuery}
        searchValue={searchQuery}
      >
        <div className="content-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCADUMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">No members found</td>
                  </tr>
                ) : (
                  filteredCADUMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="font-medium">{member.fullname}</td>
                      <td className="text-sm text-gray-600">{member.email}</td>
                      <td>{member.phone}</td>
                      <td>{member.country}</td>
                      <td>
                        <span className={`status-badge ${member.member_type === 'executive' ? 'published' : member.member_type === 'honorary' ? 'draft' : 'default'}`}>
                          {member.member_type === 'executive' && 'Executive'}
                          {member.member_type === 'regular' && 'Regular'}
                          {member.member_type === 'general_assembly' && 'General Assembly'}
                          {member.member_type === 'honorary' && 'Honorary'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleDownloadCertificate(member.id, member.fullname)}
                            className="action-btn accept"
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{ width: '16px', height: '16px', marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }}
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download Certificate
                          </button>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="action-btn edit"
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{ width: '16px', height: '16px', marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }}
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminLayout>

      {/* Simple Edit Member Modal - Only member type */}
      {showEditModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Member</h3>
            <p>Editing: <strong>{selectedMember.fullname}</strong></p>
            <div className="form-group">
              <label>Member Type</label>
              <select
                value={selectedMember.member_type}
                onChange={(e) => setSelectedMember({ ...selectedMember, member_type: e.target.value as 'executive' | 'regular' | 'general_assembly' | 'honorary' })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                }}
              >
                <option value="regular">Regular Member</option>
                <option value="executive">Executive Member</option>
                <option value="general_assembly">General Assembly Member</option>
                <option value="honorary">Honorary Member</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="action-btn">
                Cancel
              </button>
              <button onClick={handleUpdateMember} className="action-btn edit">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MembersDirectory;

