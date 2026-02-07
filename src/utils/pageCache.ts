import { ContactInfo, Page } from '../api/cms';

const PAGE_CACHE_KEY = 'cms_page_cache_v1';
const CONTACT_CACHE_KEY = 'cms_contact_cache_v1';

const hasLocalStorage =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readCache = <T>(key: string): T | null => {
  if (!hasLocalStorage) {
    return null;
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.warn('Unable to read cached data', error);
    return null;
  }
};

const writeCache = (key: string, value: unknown) => {
  if (!hasLocalStorage) {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to cache data', error);
  }
};

export const getCachedPage = (pageType: string): Page | null => {
  const cache = readCache<Record<string, Page>>(PAGE_CACHE_KEY);
  if (cache && cache[pageType]) {
    return cache[pageType];
  }
  return null;
};

export const cachePage = (pageType: string, page: Page) => {
  const cache = readCache<Record<string, Page>>(PAGE_CACHE_KEY) || {};
  cache[pageType] = page;
  writeCache(PAGE_CACHE_KEY, cache);
};

export const getCachedContactInfo = (): ContactInfo | null => {
  return readCache<ContactInfo>(CONTACT_CACHE_KEY);
};

export const cacheContactInfo = (contactInfo: ContactInfo) => {
  writeCache(CONTACT_CACHE_KEY, contactInfo);
};

export const buildFallbackPage = (options: {
  pageType: string;
  title_en: string;
  title_am?: string;
  content_en: string;
  content_am?: string;
}): Page => ({
  id: -1,
  page_type: options.pageType,
  title_en: options.title_en,
  title_am: options.title_am || options.title_en,
  content_en: options.content_en,
  content_am: options.content_am || options.content_en,
  hero_image: undefined,
  sections: [],
  is_published: true,
  created_at: '',
  updated_at: '',
});

export const buildFallbackContactInfo = (): ContactInfo => ({
  id: -1,
  email: 'caduarduet@gmail.com',
  phone: '',
  address_en: 'Addis Ababa, Ethiopia',
  address_am: 'አዲስ አበባ፣ ኢትዮጵያ',
  description_en:
    'Our team is updating the contact service. Please email us and we will get back to you shortly.',
  description_am:
    'የግንኙነት አገልግሎታችንን እያዘመን ነው። በኢሜይል ያግኙን በፍጥነት እንመልስልዎታለን።',
  updated_at: new Date().toISOString(),
});
