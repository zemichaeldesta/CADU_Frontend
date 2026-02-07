import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Gallery.css';

const Gallery: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="gallery-page">
      <div className="container">
        <div className="content-section">
          <h1>{language === 'am' ? 'ጋለሪ' : 'Gallery'}</h1>
          <div className="gallery-content">
            <div className="gallery-links">
              <Link to="/photos" className="gallery-link">
                <div className="gallery-link-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <h2>{language === 'am' ? 'ፎቶዎች' : 'Photos'}</h2>
                <p>{language === 'am' ? 'የፎቶ ማህደር ይመልከቱ' : 'View photo gallery'}</p>
              </Link>
              <Link to="/videos" className="gallery-link">
                <div className="gallery-link-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
                <h2>{language === 'am' ? 'ቪዲዮዎች' : 'Videos'}</h2>
                <p>{language === 'am' ? 'የቪዲዮ ማህደር ይመልከቱ' : 'View video gallery'}</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;

