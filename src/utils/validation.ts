/**
 * Form validation utilities
 * Common validation functions for form inputs
 */

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates email format (returns validation result object)
 * @param email - Email address to validate
 * @returns Object with isValid flag and error message
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!isValidEmail(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

/**
 * Validates password strength
 * @param password - Password to validate
 * @param minLength - Minimum password length (default: 8)
 * @returns Object with isValid flag and error message
 */
export const validatePassword = (
  password: string,
  minLength: number = 8
): { isValid: boolean; error?: string } => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters long`,
    };
  }
  
  return { isValid: true };
};

/**
 * Validates password confirmation matches password
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Object with isValid flag and error message
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true };
};

/**
 * Validates phone number format (basic validation)
 * @param phone - Phone number to validate
 * @returns True if phone number format is acceptable
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone || phone.trim() === '') {
    return true; // Phone is optional
  }
  
  // Basic phone validation: allows +, digits, spaces, hyphens, parentheses
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validates required field
 * @param value - Value to validate
 * @param fieldName - Name of the field (for error message)
 * @returns Object with isValid flag and error message
 */
export const validateRequired = (
  value: any,
  fieldName: string = 'Field'
): { isValid: boolean; error?: string } => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true };
};

/**
 * Validates URL format
 * @param url - URL to validate
 * @returns True if URL format is valid
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === '') {
    return true; // URL is optional in most cases
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates date string
 * @param dateString - Date string to validate
 * @returns True if date is valid
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) {
    return true; // Date is optional in most cases
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

