/**
 * Members Section Component
 * Handles CADU members and applications display
 */

import React, { useState } from 'react';
import { DataTable, TableColumn, TableAction, StatusBadge } from '../common';
import { formatDate } from '../../utils/dateUtils';
import { CADUMember, MemberApplication } from '../../types/admin.types';

interface MembersSectionProps {
  applications: MemberApplication[];
  members: CADUMember[];
  onViewApplication: (app: MemberApplication) => void;
  onAcceptApplication: (app: MemberApplication) => void;
  onRejectApplication: (app: MemberApplication) => void;
  onEditMember: (member: CADUMember) => void;
  onDeleteMember: (id: number) => void;
  onDownloadPDF: (id: number) => void;
}

/**
 * Members Section component for CADU members and applications
 */
export const MembersSection: React.FC<MembersSectionProps> = ({
  applications,
  members,
  onViewApplication,
  onAcceptApplication,
  onRejectApplication,
  onEditMember,
  onDeleteMember,
  onDownloadPDF,
}) => {
  const [view, setView] = useState<'applications' | 'members'>('applications');
  const pendingApplications = applications.filter((app) => app.status === 'pending');

  // Applications table
  const applicationColumns: TableColumn<MemberApplication>[] = [
    { header: 'Name', accessor: 'fullname' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Country', accessor: 'country' },
    { header: 'Date', accessor: 'created_at', render: (value) => formatDate(value) },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => <StatusBadge status={value as any} />,
    },
  ];

  const applicationActions: TableAction<MemberApplication>[] = [
    {
      label: 'View',
      variant: 'edit',
      onClick: onViewApplication,
    },
    {
      label: 'Accept',
      variant: 'accept',
      onClick: onAcceptApplication,
      show: (app) => app.status === 'pending',
    },
    {
      label: 'Reject',
      variant: 'delete',
      onClick: onRejectApplication,
      show: (app) => app.status === 'pending',
    },
  ];

  // Members table
  const memberColumns: TableColumn<CADUMember>[] = [
    { header: 'Name', accessor: 'fullname' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Country', accessor: 'country' },
    {
      header: 'Type',
      accessor: 'member_type',
      render: (value) => {
        const memberType = value || 'regular';
        const typeLabels: Record<string, string> = {
          executive: 'Executive',
          regular: 'Regular',
          general_assembly: 'General Assembly',
          honorary: 'Honorary',
        };
        const statusMap: Record<string, 'published' | 'draft'> = {
          executive: 'published',
          general_assembly: 'published',
          honorary: 'draft',
          regular: 'draft',
        };
        return <StatusBadge status={statusMap[memberType] || 'draft'} label={typeLabels[memberType] || 'Regular'} />;
      },
    },
  ];

  const memberActions: TableAction<CADUMember>[] = [
    {
      label: 'Edit',
      variant: 'edit',
      onClick: onEditMember,
    },
    {
      label: 'Download PDF',
      variant: 'primary',
      onClick: (member) => onDownloadPDF(member.id),
    },
    {
      label: 'Delete',
      variant: 'delete',
      onClick: (member) => onDeleteMember(member.id),
    },
  ];

  return (
    <section>
      <h2 className="section-title">CADU Members</h2>
      <div className="cadu-tabs">
        <button
          className={`cadu-tab ${view === 'applications' ? 'active' : ''}`}
          onClick={() => setView('applications')}
        >
          Applications ({pendingApplications.length} pending)
        </button>
        <button
          className={`cadu-tab ${view === 'members' ? 'active' : ''}`}
          onClick={() => setView('members')}
        >
          Members ({members.length})
        </button>
      </div>

      {view === 'applications' && (
        <DataTable
          data={pendingApplications}
          columns={applicationColumns}
          actions={applicationActions}
          emptyMessage="No applications found"
        />
      )}

      {view === 'members' && (
        <DataTable
          data={members}
          columns={memberColumns}
          actions={memberActions}
          emptyMessage="No members found"
        />
      )}
    </section>
  );
};

