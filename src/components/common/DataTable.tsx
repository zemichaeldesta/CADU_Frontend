/**
 * DataTable Component
 * Generic table component with sorting, filtering, and actions
 */

import React from 'react';
import './DataTable.css';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';
import ActionButton from './ActionButton';

export interface TableColumn<T = any> {
  /** Column header label */
  header: string;
  /** Data accessor (key or function) */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** Custom render function */
  render?: (value: any, row: T) => React.ReactNode;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Column width */
  width?: string;
  /** Whether column is sortable */
  sortable?: boolean;
}

export interface TableAction<T = any> {
  /** Action label or function that returns label */
  label: string | ((row: T) => string);
  /** Action handler */
  onClick: (row: T) => void;
  /** Action variant */
  variant?: 'primary' | 'secondary' | 'edit' | 'delete' | 'accept';
  /** Icon component */
  icon?: React.ReactNode;
  /** Show condition */
  show?: (row: T) => boolean;
}

interface DataTableProps<T = any> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Action buttons */
  actions?: TableAction<T>[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Row key extractor */
  getRowKey?: (row: T) => string | number;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode */
  compact?: boolean;
}

/**
 * DataTable component for displaying tabular data
 */
function DataTable<T extends { id?: number | string }>({
  data,
  columns,
  actions,
  loading = false,
  emptyMessage = 'No items found',
  getRowKey = (row) => (row.id ? String(row.id) : Math.random().toString()),
  className = '',
  compact = false,
}: DataTableProps<T>) {
  const renderCell = (column: TableColumn<T>, row: T) => {
    let value: any;

    if (typeof column.accessor === 'function') {
      value = column.accessor(row);
    } else {
      value = row[column.accessor];
    }

    if (column.render) {
      return column.render(value, row);
    }

    // Auto-detect status badges
    if (typeof value === 'boolean') {
      return <StatusBadge status={value ? 'active' : 'inactive'} />;
    }

    if (typeof value === 'string' && ['active', 'inactive', 'published', 'draft', 'pending', 'accepted', 'rejected'].includes(value.toLowerCase())) {
      return <StatusBadge status={value} />;
    }

    return <span>{value ?? 'N/A'}</span>;
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-loading">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`.trim()}>
      <table className={`data-table ${compact ? 'compact' : ''}`.trim()}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                style={{
                  textAlign: column.align || 'left',
                  width: column.width,
                }}
              >
                {column.header}
              </th>
            ))}
            {actions && actions.length > 0 && <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const rowKey = getRowKey(row);
            const visibleActions = actions?.filter((action) => !action.show || action.show(row)) || [];

            return (
              <tr key={rowKey}>
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      textAlign: column.align || 'left',
                    }}
                  >
                    {renderCell(column, row)}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td>
                    <div className="action-buttons">
                      {visibleActions.map((action, actionIndex) => {
                        const label = typeof action.label === 'function' ? action.label(row) : action.label;
                        return (
                          <ActionButton
                            key={actionIndex}
                            variant={action.variant || 'primary'}
                            onClick={() => action.onClick(row)}
                            className="small"
                          >
                            {action.icon}
                            {label}
                          </ActionButton>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

