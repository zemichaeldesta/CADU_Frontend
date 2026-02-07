import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { cmsAPI, Page } from '../api/cms';
import { buildFallbackPage, cachePage, getCachedPage } from '../utils/pageCache';
import './Programs.css';

const Programs: React.FC = () => {
  const { language } = useLanguage();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const fallbackPage = buildFallbackPage({
    pageType: 'programs',
    title_en: 'Programs',
    title_am: 'ፕሮግራሞች',
    content_en:
      '<p>We are updating our programs content. Latest saved details will appear while we reconnect.</p>',
    content_am:
      '<p>የፕሮግራሞቻችንን መረጃ እያዘመን ነው። በግንኙነቱ ወቅት የተቀመጠውን ይወቁ።</p>',
  });

  useEffect(() => {
    const loadPage = async () => {
      try {
        const data = await cmsAPI.getPage('programs');
        setPage(data);
        cachePage('programs', data);
      } catch (error) {
        console.error('Failed to load programs page:', error);
        const cached = getCachedPage('programs');
        setPage(cached || fallbackPage);
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const title = language === 'am' && page?.title_am ? page.title_am : page?.title_en || 'Programs';
  const content = language === 'am' && page?.content_am ? page.content_am : page?.content_en || '';

  return (
    <div className="programs-page">
      <div className="container">
        <div className="content-section">
          <h1>{title}</h1>
          <div
            className="content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          {page?.sections && page.sections.length > 0 && (
            <div className="sections">
              {page.sections.map((section: any) => (
                <div key={section.id} className="section">
                  {section.image && (
                    <img src={section.image.image} alt={section.image.alt_text} />
                  )}
                  <h2>{section.title}</h2>
                  <div dangerouslySetInnerHTML={{ __html: section.content }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Programs;

