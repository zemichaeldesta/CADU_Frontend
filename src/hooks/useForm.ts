/**
 * useForm Hook
 * Manages form state and validation
 */

import { useState, useCallback } from 'react';
import { validateRequired, validateEmail, validatePassword, validatePasswordMatch } from '../utils/validation';

export interface FormErrors {
  [key: string]: string;
}

export interface FormFieldConfig {
  required?: boolean;
  validate?: (value: any) => { isValid: boolean; error?: string };
  email?: boolean;
  password?: boolean;
  passwordMatch?: string; // Field name to match password with
}

export interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  fieldConfig?: Partial<Record<keyof T, FormFieldConfig>>;
}

/**
 * Hook for managing form state and validation
 */
export const useForm = <T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
  fieldConfig = {},
}: UseFormOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (name: keyof T, value: any): string | undefined => {
      const config = fieldConfig[name];
      if (!config) return undefined;

      // Required validation
      if (config.required) {
        const requiredResult = validateRequired(value, String(name));
        if (!requiredResult.isValid) {
          return requiredResult.error;
        }
      }

      // Email validation
      if (config.email && value) {
        if (!validateEmail(value)) {
          return 'Please enter a valid email address';
        }
      }

      // Password validation
      if (config.password && value) {
        const passwordResult = validatePassword(value);
        if (!passwordResult.isValid) {
          return passwordResult.error;
        }
      }

      // Password match validation
      if (config.passwordMatch && value) {
        const matchValue = values[config.passwordMatch as keyof T];
        const matchResult = validatePasswordMatch(value, matchValue);
        if (!matchResult.isValid) {
          return matchResult.error;
        }
      }

      // Custom validation
      if (config.validate && value) {
        const customResult = config.validate(value);
        if (!customResult.isValid) {
          return customResult.error;
        }
      }

      return undefined;
    },
    [fieldConfig, values]
  );

  /**
   * Validate all fields
   */
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    Object.keys(values).forEach((key) => {
      const error = validateField(key as keyof T, values[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField]);

  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (name: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setValues((prev) => ({ ...prev, [name]: value }));

      // Clear error when user starts typing
      if (errors[name as string]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });
      }

      // Validate on change if enabled
      if (validateOnChange && touched[name as string]) {
        const error = validateField(name, value);
        if (error) {
          setErrors((prev) => ({ ...prev, [name as string]: error }));
        }
      }
    },
    [errors, touched, validateOnChange, validateField]
  );

  /**
   * Handle input blur
   */
  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [name as string]: true }));

      if (validateOnBlur) {
        const error = validateField(name, values[name]);
        if (error) {
          setErrors((prev) => ({ ...prev, [name as string]: error }));
        }
      }
    },
    [values, validateOnBlur, validateField]
  );

  /**
   * Handle form submit
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      Object.keys(values).forEach((key) => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      // Validate
      if (!validate()) {
        return;
      }

      // Submit
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Set field value programmatically
   */
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Set field error programmatically
   */
  const setError = useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name as string]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValue,
    setError,
    validate,
  };
};

