/**
 * FormField Component
 * Reusable form field wrapper with label and error display
 */

import React from 'react';
import './FormField.css';

interface FormFieldProps {
  /** Field label */
  label: string;
  /** Field name (for error display) */
  name?: string;
  /** Error message */
  error?: string;
  /** Required indicator */
  required?: boolean;
  /** Field content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Help text */
  helpText?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * FormField component for consistent form field styling
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  required = false,
  children,
  className = '',
  helpText,
  style,
}) => {
  return (
    <div className={`form-group ${className}`.trim()} style={style}>
      <label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk"> *</span>}
      </label>
      {children}
      {helpText && !error && <p className="form-help-text">{helpText}</p>}
      {error && <p className="form-error-text">{error}</p>}
    </div>
  );
};

export default FormField;

