import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { cmsAPI, Page } from '../api/cms';
import { buildFallbackPage, cachePage, getCachedPage } from '../utils/pageCache';
import './Home.css';

const Home: React.FC = () => {
  const { language } = useLanguage();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const fallbackPage = buildFallbackPage({
    pageType: 'home',
    title_en: 'Home',
    title_am: 'መነሻ',
    content_en:
      '<p>We are refreshing our site. Showing the most recent saved version while we reconnect.</p>',
    content_am:
      '<p>ድህረ ገጻችንን እያዘመን ነው። እንደገና ስንገናኝ አዳዲስ መረጃዎችን እናሳያለን።</p>',
  });

  useEffect(() => {
    const loadPage = async () => {
      try {
        const data = await cmsAPI.getPage('home');
        setPage(data);
        cachePage('home', data);
      } catch (error: any) {
        console.error('Failed to load home page:', error);
        // If page doesn't exist (404), show default content
        if (error.response?.status === 404) {
          setPage(null);
        } else {
          const cached = getCachedPage('home');
          setPage(cached || fallbackPage);
        }
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const title = language === 'am' && page?.title_am ? page.title_am : page?.title_en || 'Home';
  const content = language === 'am' && page?.content_am ? page.content_am : page?.content_en || '';

  return (
    <div className="home-page">
      {/* Modern Hero Section */}
      <div className="hero-section">
        {page?.hero_image ? (
          <div className="hero-image-wrapper">
            <img src={page.hero_image.image} alt={page.hero_image.alt_text || title} />
            <div className="hero-overlay"></div>
          </div>
        ) : (
          <div className="hero-gradient"></div>
        )}
        <div className="hero-content">
          <div className="hero-text-wrapper">
            <h1 className="hero-title">
              <span className="hero-title-main">{title}</span>
            </h1>
            <div className="hero-cta">
              <Link to="/about" className="cta-button primary">
                Learn More
              </Link>
              <Link to="/contact" className="cta-button secondary">
                Get In Touch
              </Link>
              <Link to="/member-login" className="cta-button tertiary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Content Section */}
        {content && (
          <div className="content-section">
            <div className="content-wrapper">
              <div
                className="content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        )}

        {/* Quick Links Section */}
        <div className="quick-links-section">
          <h2 className="section-title">Explore Our Community</h2>
          <div className="quick-links">
            <Link to="/about" className="quick-link">
              <div className="quick-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>About Us</h3>
              <p>Learn about our association and mission</p>
              <span className="quick-link-arrow">→</span>
            </Link>
            <Link to="/resources" className="quick-link">
              <div className="quick-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>Resources</h3>
              <p>Browse our extensive archive</p>
              <span className="quick-link-arrow">→</span>
            </Link>
            <Link to="/news" className="quick-link">
              <div className="quick-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <h3>News & Events</h3>
              <p>Stay updated with latest news</p>
              <span className="quick-link-arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Sections */}
        {page?.sections && page.sections.length > 0 && (
          <div className="sections">
            {page.sections.map((section: any, index: number) => (
              <div key={section.id} className={`section ${index % 2 === 0 ? 'section-left' : 'section-right'}`}>
                {section.image && (
                  <div className="section-image-wrapper">
                    <img src={section.image.image} alt={section.image.alt_text} />
                  </div>
                )}
                <div className="section-content">
                  <h2>{section.title}</h2>
                  <div dangerouslySetInnerHTML={{ __html: section.content }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

