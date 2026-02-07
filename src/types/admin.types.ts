/**
 * Admin-specific TypeScript type definitions
 */

import { BaseEntity, StatusType } from './common.types';
import { Permission } from './api.types';

/**
 * Member Profile model
 */
export interface MemberProfile extends BaseEntity {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: 'member' | 'admin' | 'manager';
  phone: string;
  address: string;
  bio: string;
  profile_image?: string;
  profile_image_url?: string;
  is_active: boolean;
  permissions?: Permission[];
  permission_codes?: string[];
  cadu_member_id?: number | null;
  member_type?: 'executive' | 'regular' | 'general_assembly' | 'honorary';
}

/**
 * Member creation data
 */
export interface MemberCreateData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'member' | 'admin' | 'manager';
  phone: string;
  address: string;
  bio: string;
  permissions?: string[];
  member_type?: 'executive' | 'regular' | 'general_assembly' | 'honorary';
}

/**
 * CADU Member model
 * Note: This should match the CADUMember interface from api/caduMembers.ts
 * Use CADUMember from api/caduMembers.ts for consistency with API responses
 */
export interface CADUMember {
  id: number;
  fullname: string;
  organization_name?: string;
  nationality?: string;
  resident_in?: 'ethiopia' | 'abroad' | string;
  birthdate: string | null;
  gender: string;
  citizenship: string;
  country: string;
  region: string;
  town: string;
  district: string;
  phone: string;
  email: string;
  emergency_contact?: string;
  spouse: string;
  spousePhone: string;
  study: string;
  workFrom: string;
  workTo: string;
  registration_fee_amount: number | string | null;
  monthly_fee_amount: number | string | null;
  voluntaryBirr: string;
  voluntaryUSD: string;
  initial_payment_amount?: string | number | null;
  profile_picture: string | null;
  profile_picture_url: string | null;
  receipt_photo: string | null;
  receipt_photo_url: string | null;
  member_type: 'executive' | 'regular' | 'general_assembly' | 'honorary';
  declaration_accepted?: boolean;
  photo_consent?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  created_by_name?: string | null;
}

/**
 * Member Application model
 */
export interface MemberApplication extends BaseEntity {
  fullname: string;
  birthdate?: string | null;
  gender: string;
  citizenship: string;
  country: string;
  region: string;
  town: string;
  district: string;
  phone: string;
  email: string;
  spouse: string;
  spousePhone: string;
  study: string;
  workFrom: string;
  workTo: string;
  registration_fee_amount: number | string | null;
  monthly_fee_amount: number | string | null;
  voluntaryBirr: string;
  voluntaryUSD: string;
  initial_payment_amount?: string | number | null;
  photo_consent?: boolean;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  receipt_photo?: string | null;
  receipt_photo_url?: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  notes?: string;
}

/**
 * Admin section type
 */
export type AdminSection = 'Pages' | 'Templates' | 'Archives' | 'Events' | 'Admins' | 'Messages' | 'Member Applications' | 'CADU Members' | 'Payments' | 'Members Directory' | 'Gallery' | 'Contact Info' | 'Logs';

/**
 * Storage information
 */
export interface StorageInfo {
  used: number;
  used_formatted: string;
  total: number;
  total_formatted: string;
  free: number;
  free_formatted: string;
  available: number;
  available_formatted: string;
  percentage: number;
  media_percentage: number;
}

