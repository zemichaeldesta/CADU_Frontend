import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { authAPI, UserInfo } from '../api/auth';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsDropdownOpen, setNewsDropdownOpen] = useState(false);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const [galleryDropdownOpen, setGalleryDropdownOpen] = useState(false);
  const [membersDropdownOpen, setMembersDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const newsDropdownRef = useRef<HTMLDivElement>(null);
  const programsDropdownRef = useRef<HTMLDivElement>(null);
  const galleryDropdownRef = useRef<HTMLDivElement>(null);
  const membersDropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;
  const isNewsActive = () => {
    return location.pathname === '/news' || location.pathname === '/events' || location.pathname === '/member-events';
  };
  const isProgramsActive = () => {
    return location.pathname === '/programs' || location.pathname === '/initiatives';
  };
  const isGalleryActive = () => {
    return location.pathname === '/gallery' || location.pathname === '/photos' || location.pathname === '/videos';
  };
  const isMembersActive = () => {
    return location.pathname === '/members' || location.pathname === '/register' || location.pathname === '/member-login';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [mobileMenuOpen]);

  const handleNewsDropdownToggle = () => {
    setNewsDropdownOpen(!newsDropdownOpen);
    if (!newsDropdownOpen) {
      setProgramsDropdownOpen(false);
      setGalleryDropdownOpen(false);
    }
  };

  const handleNewsDropdownClose = () => {
    setNewsDropdownOpen(false);
  };

  const handleProgramsDropdownToggle = () => {
    setProgramsDropdownOpen(!programsDropdownOpen);
    if (!programsDropdownOpen) {
      setNewsDropdownOpen(false);
      setGalleryDropdownOpen(false);
    }
  };

  const handleProgramsDropdownClose = () => {
    setProgramsDropdownOpen(false);
  };

  const handleGalleryDropdownToggle = () => {
    setGalleryDropdownOpen(!galleryDropdownOpen);
    if (!galleryDropdownOpen) {
      setNewsDropdownOpen(false);
      setProgramsDropdownOpen(false);
    }
  };

  const handleGalleryDropdownClose = () => {
    setGalleryDropdownOpen(false);
  };

  const handleMembersDropdownToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMembersDropdownOpen(!membersDropdownOpen);
    if (!membersDropdownOpen) {
      setNewsDropdownOpen(false);
      setProgramsDropdownOpen(false);
      setGalleryDropdownOpen(false);
    }
  };

  const handleMembersDropdownClose = () => {
    setMembersDropdownOpen(false);
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authAPI.isAuthenticated();
      
      // Only update state if authentication status changed
      setIsAuthenticated(prev => {
        if (prev !== authenticated) {
          return authenticated;
        }
        return prev;
      });
      
      if (authenticated) {
        try {
          const userInfoStr = localStorage.getItem('user_info');
          if (userInfoStr) {
            const info: UserInfo = JSON.parse(userInfoStr);
            setUserInfo(prev => {
              // Only update if user info actually changed
              if (!prev || prev.id !== info.id || prev.member_type !== info.member_type) {
                return info;
              }
              return prev;
            });
          } else {
            // Fetch user info if not cached
            authAPI.getUserInfo().then(info => {
              setUserInfo(prev => {
                if (!prev || prev.id !== info.id || prev.member_type !== info.member_type) {
                  localStorage.setItem('user_info', JSON.stringify(info));
                  return info;
                }
                return prev;
              });
            }).catch(() => {
              setIsAuthenticated(false);
              setUserInfo(null);
            });
          }
        } catch (e) {
          console.error('Error parsing user info:', e);
        }
      } else {
        setUserInfo(prev => {
          if (prev !== null) {
            return null;
          }
          return prev;
        });
      }
    };

    // Initial check
    checkAuth();
    
    // Listen for storage changes (when login/logout happens in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'user_info') {
        checkAuth();
      }
    };
    
    // Listen for custom events (when login/logout happens in same tab)
    const handleAuthChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUserInfo(null);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
    closeMobileMenu();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newsDropdownRef.current && !newsDropdownRef.current.contains(event.target as Node)) {
        setNewsDropdownOpen(false);
      }
      if (programsDropdownRef.current && !programsDropdownRef.current.contains(event.target as Node)) {
        setProgramsDropdownOpen(false);
      }
      if (galleryDropdownRef.current && !galleryDropdownRef.current.contains(event.target as Node)) {
        setGalleryDropdownOpen(false);
      }
      if (membersDropdownRef.current && !membersDropdownRef.current.contains(event.target as Node)) {
        setMembersDropdownOpen(false);
      }
    };

    if (newsDropdownOpen || programsDropdownOpen || galleryDropdownOpen || membersDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [newsDropdownOpen, programsDropdownOpen, galleryDropdownOpen, membersDropdownOpen]);

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-top">
              <Link to="/" className="logo" onClick={closeMobileMenu}>
                <img src={`${process.env.PUBLIC_URL || ''}/cadu.png`} alt="Cadu-Ardu Logo" className="logo-image" />
                <h1>Cadu-Ardu Family and Friends Association</h1>
              </Link>
              <button 
                className="mobile-menu-toggle"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
            </div>
            <nav className={`nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <Link to="/" className={isActive('/') ? 'active' : ''} onClick={closeMobileMenu}>
                {t('home')}
              </Link>
              <Link to="/resources" className={isActive('/resources') ? 'active' : ''} onClick={closeMobileMenu}>
                {t('resources')}
              </Link>
              <Link to="/about" className={isActive('/about') ? 'active' : ''} onClick={closeMobileMenu}>
                {t('about')}
              </Link>
              <div 
                ref={programsDropdownRef}
                className={`nav-dropdown ${programsDropdownOpen ? 'open' : ''} ${isProgramsActive() ? 'active' : ''}`}
                onMouseEnter={() => !mobileMenuOpen && setProgramsDropdownOpen(true)}
                onMouseLeave={() => !mobileMenuOpen && setProgramsDropdownOpen(false)}
              >
                <button 
                  className={`nav-dropdown-toggle ${isProgramsActive() ? 'active' : ''}`}
                  onClick={handleProgramsDropdownToggle}
                  onMouseEnter={() => !mobileMenuOpen && setProgramsDropdownOpen(true)}
                >
                  {t('programs')}
                  <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="nav-dropdown-menu">
                  <Link 
                    to="/programs" 
                    className={isActive('/programs') ? 'active' : ''} 
                    onClick={() => { closeMobileMenu(); handleProgramsDropdownClose(); }}
                  >
                    {t('programs_only')}
                  </Link>
                  <Link 
                    to="/initiatives" 
                    className={isActive('/initiatives') ? 'active' : ''} 
                    onClick={() => { closeMobileMenu(); handleProgramsDropdownClose(); }}
                  >
                    {t('initiatives')}
                  </Link>
                </div>
              </div>
              <div 
                ref={newsDropdownRef}
                className={`nav-dropdown ${newsDropdownOpen ? 'open' : ''} ${isNewsActive() ? 'active' : ''}`}
                onMouseEnter={() => !mobileMenuOpen && setNewsDropdownOpen(true)}
                onMouseLeave={() => !mobileMenuOpen && setNewsDropdownOpen(false)}
              >
                <button 
                  className={`nav-dropdown-toggle ${isNewsActive() ? 'active' : ''}`}
                  onClick={handleNewsDropdownToggle}
                  onMouseEnter={() => !mobileMenuOpen && setNewsDropdownOpen(true)}
                >
                  {t('news')}
                  <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="nav-dropdown-menu">
                  <Link 
                    to="/news" 
                    className={isActive('/news') ? 'active' : ''} 
                    onClick={() => { closeMobileMenu(); handleNewsDropdownClose(); }}
                  >
                    {t('news_only')}
                  </Link>
                  <Link 
                    to="/events" 
                    className={isActive('/events') ? 'active' : ''} 
                    onClick={() => { closeMobileMenu(); handleNewsDropdownClose(); }}
                  >
                    {t('events')}
                  </Link>
                  {isAuthenticated && (
                    <Link 
                      to="/member-events" 
                      className={isActive('/member-events') ? 'active' : ''} 
                      onClick={() => { closeMobileMenu(); handleNewsDropdownClose(); }}
                    >
                      {t('member_events')}
                    </Link>
                  )}
                </div>
              </div>
              <div 
                ref={galleryDropdownRef}
                className={`nav-dropdown ${galleryDropdownOpen ? 'open' : ''} ${isGalleryActive() ? 'active' : ''}`}
                onMouseEnter={() => !mobileMenuOpen && setGalleryDropdownOpen(true)}
                onMouseLeave={() => !mobileMenuOpen && setGalleryDropdownOpen(false)}
              >
                <button 
                  className={`nav-dropdown-toggle ${isGalleryActive() ? 'active' : ''}`}
                  onClick={handleGalleryDropdownToggle}
                  onMouseEnter={() => !mobileMenuOpen && setGalleryDropdownOpen(true)}
                >
                  {t('gallery')}
                  <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="nav-dropdown-menu">
                  <Link 
                    to="/photos" 
                    className={isActive('/gallery') || isActive('/photos') ? 'active' : ''} 
                    onClick={() => { closeMobileMenu(); handleGalleryDropdownClose(); }}
                  >
                    {t('photos')}
                  </Link>
                  <Link 
                    to="/videos" 
                    className={isActive('/videos') ? 'active' : ''} 
                    onClick={() => { closeMobileMenu(); handleGalleryDropdownClose(); }}
                  >
                    {t('videos')}
                  </Link>
                </div>
              </div>
              <div 
                ref={membersDropdownRef}
                className={`nav-dropdown ${membersDropdownOpen ? 'open' : ''} ${isMembersActive() ? 'active' : ''}`}
                onMouseEnter={() => !mobileMenuOpen && setMembersDropdownOpen(true)}
                onMouseLeave={() => !mobileMenuOpen && setMembersDropdownOpen(false)}
              >
                <button 
                  className={`nav-dropdown-toggle ${isMembersActive() ? 'active' : ''}`}
                  onClick={handleMembersDropdownToggle}
                  onMouseEnter={() => !mobileMenuOpen && setMembersDropdownOpen(true)}
                >
                  {t('members')}
                  <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="nav-dropdown-menu">
                  <Link 
                    to="/members" 
                    className={isActive('/members') ? 'active' : ''} 
                    onClick={() => { closeMobileMenu(); handleMembersDropdownClose(); }}
                  >
                    {t('members')}
                  </Link>
                  <Link 
                    to="/member-login" 
                    className={isActive('/member-login') ? 'active' : ''} 
                    onClick={() => { closeMobileMenu(); handleMembersDropdownClose(); }}
                  >
                    {t('members_login')}
                  </Link>
                  <Link 
                    to="/register" 
                    className={isActive('/register') ? 'active' : ''} 
                    onClick={() => { closeMobileMenu(); handleMembersDropdownClose(); }}
                  >
                    {t('register')}
                  </Link>
                </div>
              </div>
              <Link to="/contact" className={isActive('/contact') ? 'active' : ''} onClick={closeMobileMenu}>
                {t('contact')}
              </Link>
              {isAuthenticated && !userInfo?.is_admin && (
                <>
                  <Link 
                    to="/member-account" 
                    className={isActive('/member-account') ? 'active' : ''} 
                    onClick={closeMobileMenu}
                  >
                    My Account
                  </Link>
                  <Link 
                    to="/member-payments" 
                    className={isActive('/member-payments') ? 'active' : ''} 
                    onClick={closeMobileMenu}
                  >
                    Payments
                  </Link>
                  {/* Member-specific resources based on member type */}
                  <Link 
                    to="/member-resources" 
                    className={isActive('/member-resources') ? 'active' : ''} 
                    onClick={closeMobileMenu}
                  >
                    {userInfo?.member_type === 'executive' ? 'Executive Resources' : 
                     userInfo?.member_type === 'general_assembly' ? 'General Assembly Resources' : 
                     'Member Resources'}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="nav-logout-btn"
                  >
                    Logout
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <Link 
                  to="/member-login" 
                  className={isActive('/member-login') ? 'active' : ''} 
                  onClick={closeMobileMenu}
                >
                  Sign In
                </Link>
              )}
              <div className="language-switcher mobile-language-switcher">
                <button
                  onClick={() => {
                    setLanguage('en');
                    closeMobileMenu();
                  }}
                  className={language === 'en' ? 'active' : ''}
                >
                  EN
                </button>
                <button
                  onClick={() => {
                    setLanguage('am');
                    closeMobileMenu();
                  }}
                  className={language === 'am' ? 'active' : ''}
                >
                  AM
                </button>
              </div>
            </nav>
            <div className="language-switcher desktop-language-switcher">
              <button
                onClick={() => setLanguage('en')}
                className={language === 'en' ? 'active' : ''}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('am')}
                className={language === 'am' ? 'active' : ''}
              >
                AM
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Cadu-Ardu Family and Friends Association. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

