import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { cmsAPI, Page } from '../api/cms';
import { buildFallbackPage, cachePage, getCachedPage } from '../utils/pageCache';
import './About.css';

const About: React.FC = () => {
  const { language } = useLanguage();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const fallbackPage = buildFallbackPage({
    pageType: 'about',
    title_en: 'About Us',
    title_am: 'ስለ እኛ',
    content_en:
      '<p>We are updating this section. Showing the latest saved overview while we finalize updates.</p>',
    content_am:
      '<p>ይህን ክፍል እያዘመን ነው። እስካለበት የተቀመጠውን መረጃ እያሳየን ነው።</p>',
  });

  useEffect(() => {
    const loadPage = async () => {
      try {
        const data = await cmsAPI.getPage('about');
        setPage(data);
        cachePage('about', data);
      } catch (error) {
        console.error('Failed to load about page:', error);
        const cached = getCachedPage('about');
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

  const title = language === 'am' && page?.title_am ? page.title_am : page?.title_en || 'About Us';
  const content = language === 'am' && page?.content_am ? page.content_am : page?.content_en || '';

  return (
    <div className="about-page">
      <div className="container">
        <div className="content-section">
          <h1>{title}</h1>
          {page?.hero_image && (
            <div className="hero-image">
              <img src={page.hero_image.image} alt={page.hero_image.alt_text || title} />
            </div>
          )}
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

export default About;

