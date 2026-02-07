import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'am';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<string, Record<Language, string>> = {
  'home': { en: 'Home', am: 'መነሻ' },
  'about': { en: 'About Us', am: 'ስለእኛ' },
  'programs': { en: 'Programs & Initiatives', am: 'ፕሮግራሞች እና ተነሳሽነቶች' },
  'programs_only': { en: 'Programs', am: 'ፕሮግራሞች' },
  'initiatives': { en: 'Initiatives', am: 'ተነሳሽነቶች' },
  'resources': { en: 'Resources', am: 'መረጃዎች' },
  'news': { en: 'News & Events', am: 'ዜናዎች እና ዝግጅቶች' },
  'news_only': { en: 'News', am: 'ዜናዎች' },
  'events': { en: 'Events', am: 'ዝግጅቶች' },
  'member_events': { en: 'Member Events', am: 'የአባላት ዝግጅቶች' },
  'contact': { en: 'Contact Us', am: 'ያግኙን' },
  'gallery': { en: 'Gallery', am: 'ፎቶ ማውጫ' },
  'photos': { en: 'Photos', am: 'ፎቶዎች' },
  'videos': { en: 'Videos', am: 'ቪዲዮዎች' },
  'members': { en: 'Members', am: 'አባላት' },
  'members_login': { en: 'Members Login', am: 'የአባላት መግቢያ' },
  'register': { en: 'Register', am: 'ተመዝግብ' },
  'archive': { en: 'Archive', am: 'ማህደር' },
  'search': { en: 'Search', am: 'ፈልግ' },
  'download': { en: 'Download', am: 'አውርድ' },
  'all_files': { en: 'All Files', am: 'ሁሉም ፋይሎች' },
  'name': { en: 'Name', am: 'ስም' },
  'date_modified': { en: 'Date Modified', am: 'የተሻሻለበት ቀን' },
  'type': { en: 'Type', am: 'ዓይነት' },
  'size': { en: 'Size', am: 'መጠን' },
  'files': { en: 'files', am: 'ፋይሎች' },
  'empty_folder': { en: 'This folder is empty', am: 'ይህ ማህደር ባዶ ነው' },
  'loading': { en: 'Loading...', am: 'በመጫን ላይ...' },
  'read_more': { en: 'Read More', am: 'ተጨማሪ አንብብ' },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

