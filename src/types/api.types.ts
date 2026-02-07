/**
 * API-related TypeScript type definitions
 */

import { BaseEntity } from './common.types';

/**
 * User authentication response
 */
export interface AuthResponse {
  access: string;
  refresh: string;
}

/**
 * User information from API
 */
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_admin: boolean;
  role: string | null;
  permissions?: string[];
  member_type?: 'executive' | 'regular' | 'general_assembly' | 'honorary';
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Permission model
 */
export interface Permission {
  id: number;
  code: string;
  name: string;
  description: string;
}

/**
 * Page model
 */
export interface Page extends BaseEntity {
  page_type: string;
  title_en: string;
  title_am: string;
  content_en: string;
  content_am: string;
  hero_image?: Image;
  sections?: Section[];
  is_published: boolean;
}

/**
 * Section model
 */
export interface Section extends BaseEntity {
  title: string;
  content: string;
  image?: Image;
  order: number;
  is_active: boolean;
}

/**
 * Image model
 */
export interface Image extends BaseEntity {
  title: string;
  image: string;
  alt_text: string;
  caption: string;
  uploaded_by?: number;
  uploaded_at?: string;
}

/**
 * News model
 */
export interface News extends BaseEntity {
  title_en: string;
  title_am: string;
  slug: string;
  content_en: string;
  content_am: string;
  excerpt_en: string;
  excerpt_am: string;
  featured_image?: Image;
  is_published: boolean;
  published_at?: string;
  author?: number;
  author_name?: string;
}

/**
 * Event model
 */
export interface Event extends BaseEntity {
  title_en: string;
  title_am: string;
  description_en: string;
  description_am: string;
  start_date: string;
  end_date?: string;
  location: string;
  event_type: 'regular' | 'member';
  image?: Image;
  is_published: boolean;
  created_by?: number;
}

/**
 * Archive Document model
 */
export interface ArchiveDocument extends BaseEntity {
  title_en: string;
  title_am: string;
  description_en: string;
  description_am: string;
  file: string;
  file_url?: string;
  file_size?: number;
  file_type: string;
  category?: ArchiveCategory;
  tags?: ArchiveTag[];
  visibility: 'public' | 'member' | 'general_assembly' | 'executive';
  date?: string;
  author: string;
  download_count: number;
  uploaded_by?: number;
  is_active?: boolean;
}

/**
 * Archive Category model
 */
export interface ArchiveCategory extends BaseEntity {
  name_en: string;
  name_am: string;
  description: string;
  parent?: number;
  order?: number;
}

/**
 * Archive Tag model
 */
export interface ArchiveTag extends BaseEntity {
  name: string;
}

/**
 * Contact Message model
 */
export interface ContactMessage extends BaseEntity {
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  read_at?: string | null;
  read_by?: number | null;
  read_by_name?: string | null;
  replies?: MessageReply[];
}

/**
 * Message Reply model
 */
export interface MessageReply extends BaseEntity {
  message: number;
  replied_by?: number | null;
  replied_by_name?: string | null;
  replied_by_email?: string | null;
  reply_content: string;
  email_sent: boolean;
  email_sent_at?: string | null;
  email_error?: string | null;
}

/**
 * Contact Info model
 */
export interface ContactInfo extends BaseEntity {
  email: string;
  phone: string;
  address_en: string;
  address_am: string;
  description_en: string;
  description_am: string;
  updated_by?: number;
  updated_by_name?: string;
}

/**
 * Gallery Photo model
 */
export interface GalleryPhoto extends BaseEntity {
  title: string;
  photo: string;
  photo_url?: string;
  alt_text: string;
  caption: string;
  description: string;
  is_published: boolean;
  uploaded_by?: number;
  uploaded_by_name?: string;
}

/**
 * Gallery Video model
 */
export interface GalleryVideo extends BaseEntity {
  title: string;
  video_url?: string;
  video_file?: string;
  video_file_url?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  description: string;
  is_published: boolean;
  uploaded_by?: number;
  uploaded_by_name?: string;
}

/**
 * Audit Log model
 */
export interface AuditLog extends BaseEntity {
  user: number | null;
  username: string;
  action: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  action_description: string;
  endpoint: string;
  method: string;
  ip_address: string | null;
  user_agent: string;
  request_data: any;
  response_status: number;
  response_data: any;
  timestamp: string;
  duration_ms: number;
  error_message: string;
}

