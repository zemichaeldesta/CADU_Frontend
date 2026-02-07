import React, { useState, useEffect } from 'react';
import { memberApplicationsAPI, MemberApplication } from '../../api/memberApplications';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import AuthenticatedImage from '../../components/AuthenticatedImage';
import {
  ViewApplicationModal,
  AcceptApplicationModal,
  RejectApplicationModal,
} from '../../components/admin/ApplicationModals';
import '../../components/AdminLayout.css';

const MemberApplicationsManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [applications, setApplications] = useState<MemberApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [memberType, setMemberType] = useState<'executive' | 'regular' | 'general_assembly' | 'honorary'>('regular');
  const [rejectNotes, setRejectNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await memberApplicationsAPI.getApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load applications:', error);
      showError('Failed to load applications');
      setApplications([]);
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

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const filteredApplications = filterData(pendingApplications, ['fullname', 'email', 'phone', 'country', 'status']);

  const handleAcceptApplication = async () => {
    if (!selectedApplication) return;
    try {
      await memberApplicationsAPI.acceptApplication(selectedApplication.id, memberType);
      showSuccess('Application accepted successfully');
      setShowAcceptModal(false);
      setSelectedApplication(null);
      setMemberType('regular');
      await loadApplications();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to accept application');
    }
  };

  const handleRejectApplication = async () => {
    if (!selectedApplication) return;
    try {
      await memberApplicationsAPI.rejectApplication(selectedApplication.id, rejectNotes);
      showSuccess('Application rejected');
      setShowRejectModal(false);
      setSelectedApplication(null);
      setRejectNotes('');
      loadApplications();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to reject application');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Member Applications" subtitle="Manage member registration applications">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Member Applications"
      subtitle="Manage member registration applications"
      searchPlaceholder="Search applications..."
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
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">No applications found</td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id}>
                    <td className="font-medium">{app.fullname}</td>
                    <td className="text-sm text-gray-600">{app.email}</td>
                    <td>{app.phone}</td>
                    <td>{app.country}</td>
                    <td className="text-sm text-gray-600">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`status-badge ${
                        app.status === 'accepted' ? 'published' :
                        app.status === 'rejected' ? 'draft' : 'pending'
                      }`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowViewModal(true);
                          }}
                          className="action-btn edit"
                        >
                          View
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setMemberType('regular');
                                setShowAcceptModal(true);
                              }}
                              className="action-btn accept"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setRejectNotes('');
                                setShowRejectModal(true);
                              }}
                              className="action-btn delete"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Application Modal */}
      {showViewModal && selectedApplication && (
        <ViewApplicationModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedApplication(null);
          }}
          application={selectedApplication}
          onAccept={() => {
            setShowViewModal(false);
            setMemberType('regular');
            setShowAcceptModal(true);
          }}
          onReject={() => {
            setShowViewModal(false);
            setRejectNotes('');
            setShowRejectModal(true);
          }}
        />
      )}

      {/* Accept Application Modal */}
      {showAcceptModal && selectedApplication && (
        <AcceptApplicationModal
          isOpen={showAcceptModal}
          onClose={() => {
            setShowAcceptModal(false);
            setSelectedApplication(null);
            setMemberType('regular');
          }}
          application={selectedApplication}
          memberType={memberType}
          onMemberTypeChange={setMemberType}
          onConfirm={handleAcceptApplication}
          loading={false}
        />
      )}

      {/* Reject Application Modal */}
      {showRejectModal && selectedApplication && (
        <RejectApplicationModal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedApplication(null);
            setRejectNotes('');
          }}
          application={selectedApplication}
          notes={rejectNotes}
          onNotesChange={setRejectNotes}
          onConfirm={handleRejectApplication}
          loading={false}
        />
      )}
    </AdminLayout>
  );
};

export default MemberApplicationsManager;

