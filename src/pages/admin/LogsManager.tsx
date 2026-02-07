import React, { useState, useEffect } from 'react';
import { auditLogsAPI, AuditLog, AuditLogSearchParams, LogStatistics, DeletedUser } from '../../api/auditLogs';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import { DataTable, TableColumn, Modal } from '../../components/common';
import '../../components/AdminLayout.css';
import './LogsManager.css';

const LogsManager: React.FC = () => {
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState<'logs' | 'deleted-users'>('logs');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [statistics, setStatistics] = useState<LogStatistics | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [statisticsPeriod, setStatisticsPeriod] = useState(30);
  
  // Deleted users state
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [deletedUsersLoading, setDeletedUsersLoading] = useState(false);
  const [deletedUsersDays, setDeletedUsersDays] = useState(365);
  
  // Filters
  const [filters, setFilters] = useState<AuditLogSearchParams>({
    search: '',
    action: '',
    method: '',
    response_status: undefined,
    username: '',
    endpoint: '',
    date_from: '',
    date_to: '',
    ordering: '-timestamp',
  });

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    } else if (activeTab === 'deleted-users') {
      loadDeletedUsers();
    }
  }, [currentPage, filters, activeTab]);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadStatistics();
    }
  }, [statisticsPeriod, activeTab]);

  useEffect(() => {
    if (activeTab === 'deleted-users') {
      loadDeletedUsers();
    }
  }, [deletedUsersDays]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: AuditLogSearchParams = {
        ...filters,
        page: currentPage,
        ordering: filters.ordering || '-timestamp',
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key as keyof AuditLogSearchParams] === '' || params[key as keyof AuditLogSearchParams] === undefined) {
          delete params[key as keyof AuditLogSearchParams];
        }
      });

      const response = await auditLogsAPI.getLogs(params);
      setLogs(response.results);
      setTotalCount(response.count);
    } catch (error: any) {
      console.error('Failed to load logs:', error);
      showError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setStatisticsLoading(true);
      const stats = await auditLogsAPI.getStatistics(statisticsPeriod);
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
      showError(extractErrorMessage(error));
    } finally {
      setStatisticsLoading(false);
    }
  };

  const loadDeletedUsers = async () => {
    try {
      setDeletedUsersLoading(true);
      const response = await auditLogsAPI.getDeletedUsers(deletedUsersDays);
      setDeletedUsers(response.results);
    } catch (error: any) {
      console.error('Failed to load deleted users:', error);
      showError(extractErrorMessage(error));
    } finally {
      setDeletedUsersLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const allLogs = await auditLogsAPI.exportLogs(filters);
      
      // Convert to CSV
      const headers = ['Timestamp', 'User', 'Action', 'Action Description', 'Endpoint', 'Method', 'Status', 'Duration (ms)', 'IP Address', 'Error'];
      const rows = allLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.username || 'Anonymous',
        log.action,
        log.action_description || 'N/A',
        log.endpoint,
        log.method,
        log.response_status.toString(),
        log.duration_ms.toString(),
        log.ip_address || '',
        log.error_message || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Failed to export logs:', error);
      showError(extractErrorMessage(error));
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return '#10b981'; // green
    if (status >= 300 && status < 400) return '#3b82f6'; // blue
    if (status >= 400 && status < 500) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const columns: TableColumn<AuditLog>[] = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (value, log) => formatTimestamp(log.timestamp),
      sortable: true,
    },
    {
      header: 'User',
      accessor: 'username',
      render: (value, log) => log.username || 'Anonymous',
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (value, log) => (
        <span className={`action-badge action-${log.action.toLowerCase()}`}>
          {log.action}
        </span>
      ),
    },
    {
      header: 'Description',
      accessor: 'action_description',
      render: (value, log) => (
        <span style={{ fontWeight: 500, color: '#374151' }}>
          {log.action_description || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Endpoint',
      accessor: 'endpoint',
      render: (value, log) => (
        <span className="endpoint-text" title={log.endpoint}>
          {log.endpoint.length > 50 ? `${log.endpoint.substring(0, 50)}...` : log.endpoint}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'response_status',
      render: (value, log) => (
        <span style={{ color: getStatusColor(log.response_status), fontWeight: 'bold' }}>
          {log.response_status}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Duration',
      accessor: 'duration_ms',
      render: (value, log) => `${log.duration_ms}ms`,
      sortable: true,
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: handleViewDetails,
    },
  ];

  const deletedUsersColumns: TableColumn<DeletedUser>[] = [
    {
      header: 'Deleted At',
      accessor: 'timestamp',
      render: (value, user) => formatTimestamp(user.timestamp),
      sortable: true,
    },
    {
      header: 'Deleted User',
      accessor: 'deleted_username',
      render: (value, user) => (
        <div>
          <div style={{ fontWeight: 600, color: '#111827' }}>
            {user.deleted_name || user.deleted_username || 'Unknown'}
          </div>
          {user.deleted_email && (
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {user.deleted_email}
            </div>
          )}
          {user.user_id && (
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              ID: {user.user_id}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Deleted By',
      accessor: 'deleted_by',
      render: (value, user) => (
        <div>
          <div style={{ fontWeight: 500, color: '#374151' }}>
            {user.deleted_by}
          </div>
          {user.deleted_by_user_id && (
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              User ID: {user.deleted_by_user_id}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Endpoint',
      accessor: 'endpoint',
      render: (value, user) => (
        <span className="endpoint-text" title={user.endpoint}>
          {user.endpoint.length > 40 ? `${user.endpoint.substring(0, 40)}...` : user.endpoint}
        </span>
      ),
    },
    {
      header: 'IP Address',
      accessor: 'ip_address',
      render: (value, user) => user.ip_address || 'N/A',
    },
    {
      header: 'Description',
      accessor: 'action_description',
      render: (value, user) => (
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {user.action_description || 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title="Audit Logs" subtitle="View and export system audit logs">
      <div className="logs-manager">
        {/* Tabs */}
        <div className="logs-tabs" style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '2rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <button
            className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'logs' ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === 'logs' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'logs' ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            Audit Logs
          </button>
          <button
            className={`tab-button ${activeTab === 'deleted-users' ? 'active' : ''}`}
            onClick={() => setActiveTab('deleted-users')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'deleted-users' ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === 'deleted-users' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'deleted-users' ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            Deleted Users
          </button>
        </div>

        {activeTab === 'logs' && (
          <>
            {/* Statistics Section */}
        {statistics && (
          <div className="logs-statistics">
            <div className="statistics-header">
              <div>
                <h2>Web Statistics</h2>
                <p className="statistics-note">Unique visits (sessions) - one visit per IP+device per day, browsing multiple pages counts as one visit</p>
              </div>
              <select
                value={statisticsPeriod}
                onChange={(e) => setStatisticsPeriod(Number(e.target.value))}
                className="statistics-period-select"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
            </div>
            
            <div className="statistics-grid">
              <div className="stat-card">
                <div className="stat-value">{statistics.total_visits.toLocaleString()}</div>
                <div className="stat-label">Unique Visits</div>
                {statistics.total_bot_visits > 0 && (
                  <div className="stat-sublabel">
                    ({statistics.total_bot_visits.toLocaleString()} bot requests filtered)
                  </div>
                )}
              </div>
              <div className="stat-card">
                <div className="stat-value">{statistics.visits_today.toLocaleString()}</div>
                <div className="stat-label">Today</div>
                {statistics.bot_visits_today > 0 && (
                  <div className="stat-sublabel">
                    ({statistics.bot_visits_today} bots)
                  </div>
                )}
              </div>
              <div className="stat-card">
                <div className="stat-value">{statistics.visits_this_week.toLocaleString()}</div>
                <div className="stat-label">This Week</div>
                {statistics.bot_visits_this_week > 0 && (
                  <div className="stat-sublabel">
                    ({statistics.bot_visits_this_week} bots)
                  </div>
                )}
              </div>
              <div className="stat-card">
                <div className="stat-value">{statistics.visits_this_month.toLocaleString()}</div>
                <div className="stat-label">This Month</div>
                {statistics.bot_visits_this_month > 0 && (
                  <div className="stat-sublabel">
                    ({statistics.bot_visits_this_month} bots)
                  </div>
                )}
              </div>
            </div>

            <div className="statistics-details">
              <div className="stat-section">
                <h3>Most Visited Pages</h3>
                <div className="stat-list">
                  {statistics.most_visited_pages.length > 0 ? (
                    statistics.most_visited_pages.map((item, index) => (
                      <div key={index} className="stat-item">
                        <span className="stat-item-label">{item.page}</span>
                        <span className="stat-item-value">{item.visits.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="stat-empty">No data available</div>
                  )}
                </div>
              </div>

              <div className="stat-section">
                <h3>Top Users</h3>
                <div className="stat-list">
                  {statistics.top_users.length > 0 ? (
                    statistics.top_users.map((user, index) => (
                      <div key={index} className="stat-item">
                        <span className="stat-item-label">{user.username}</span>
                        <span className="stat-item-value">{user.visits.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="stat-empty">No data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="logs-header">
          <h1>Audit Logs</h1>
          <button className="btn btn-primary" onClick={handleExport} disabled={loading}>
            Export CSV
          </button>
        </div>

        <div className="logs-filters">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Search username or endpoint..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="filter-input"
            />
            <select
              value={filters.action || ''}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="filter-select"
            >
              <option value="">All Actions</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <select
              value={filters.response_status?.toString() || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                response_status: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="filter-select"
            >
              <option value="">All Status Codes</option>
              <option value="200">200 OK</option>
              <option value="201">201 Created</option>
              <option value="400">400 Bad Request</option>
              <option value="401">401 Unauthorized</option>
              <option value="403">403 Forbidden</option>
              <option value="404">404 Not Found</option>
              <option value="500">500 Server Error</option>
            </select>
            <input
              type="date"
              placeholder="Date From"
              value={filters.date_from || ''}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="filter-input"
            />
            <input
              type="date"
              placeholder="Date To"
              value={filters.date_to || ''}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="filter-input"
            />
            <button
              className="btn btn-secondary"
              onClick={() => {
                setFilters({
                  search: '',
                  action: '',
                  method: '',
                  response_status: undefined,
                  username: '',
                  endpoint: '',
                  date_from: '',
                  date_to: '',
                  ordering: '-timestamp',
                });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <DataTable
          data={logs}
          columns={columns}
          actions={actions}
          loading={loading}
        />
        
        {!loading && totalCount > 0 && (
          <div className="pagination-controls" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} logs
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span style={{ padding: '0.5rem 1rem', color: '#374151' }}>
                Page {currentPage} of {Math.ceil(totalCount / pageSize)}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {detailModalOpen && selectedLog && (
          <Modal
            isOpen={detailModalOpen}
            onClose={() => {
              setDetailModalOpen(false);
              setSelectedLog(null);
            }}
            title="Log Details"
          >
            <div className="log-details">
              <div className="detail-row">
                <strong>Timestamp:</strong>
                <span>{formatTimestamp(selectedLog.timestamp)}</span>
              </div>
              <div className="detail-row">
                <strong>User:</strong>
                <span>{selectedLog.username || 'Anonymous'}</span>
              </div>
              <div className="detail-row">
                <strong>Action:</strong>
                <span>{selectedLog.action}</span>
              </div>
              <div className="detail-row">
                <strong>Description:</strong>
                <span style={{ fontWeight: 500 }}>{selectedLog.action_description || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Endpoint:</strong>
                <span>{selectedLog.endpoint}</span>
              </div>
              <div className="detail-row">
                <strong>Method:</strong>
                <span>{selectedLog.method}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span style={{ color: getStatusColor(selectedLog.response_status) }}>
                  {selectedLog.response_status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Duration:</strong>
                <span>{selectedLog.duration_ms}ms</span>
              </div>
              <div className="detail-row">
                <strong>IP Address:</strong>
                <span>{selectedLog.ip_address || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>User Agent:</strong>
                <span>{selectedLog.user_agent || 'N/A'}</span>
              </div>
              {selectedLog.error_message && (
                <div className="detail-row">
                  <strong>Error:</strong>
                  <span className="error-text">{selectedLog.error_message}</span>
                </div>
              )}
              {selectedLog.request_data && (
                <div className="detail-section">
                  <strong>Request Data:</strong>
                  <pre className="json-preview">
                    {JSON.stringify(selectedLog.request_data, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.response_data && (
                <div className="detail-section">
                  <strong>Response Data:</strong>
                  <pre className="json-preview">
                    {JSON.stringify(selectedLog.response_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Modal>
        )}
        </>)}

        {activeTab === 'deleted-users' && (
          <>
            <div className="logs-header" style={{ marginBottom: '1.5rem' }}>
              <h1>Deleted Users</h1>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  Look back:
                  <select
                    value={deletedUsersDays}
                    onChange={(e) => setDeletedUsersDays(Number(e.target.value))}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                    <option value={180}>Last 180 days</option>
                    <option value={365}>Last year</option>
                    <option value={730}>Last 2 years</option>
                  </select>
                </label>
              </div>
            </div>

            {deletedUsersLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                Loading deleted users...
              </div>
            ) : deletedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                No deleted users found in the last {deletedUsersDays} days.
              </div>
            ) : (
              <>
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '0.75rem', 
                  background: '#f3f4f6', 
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Found {deletedUsers.length} deleted user(s) in the last {deletedUsersDays} days
                </div>
                <DataTable
                  data={deletedUsers}
                  columns={deletedUsersColumns}
                  loading={deletedUsersLoading}
                />
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

function extractErrorMessage(error: any): string {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export default LogsManager;

