import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, UserInfo } from '../api/auth';
import Resources from './Resources';
import './MemberResources.css';

const MemberResources: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const info = await authAPI.getUserInfo();
        setUserInfo(info);
      } catch (error) {
        console.error('Failed to load user info:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserInfo();
  }, []);

  const getResourceTitle = () => {
    if (!userInfo?.member_type) return 'Member Resources';
    switch (userInfo.member_type) {
      case 'executive':
        return 'Executive Resources';
      case 'general_assembly':
        return 'General Assembly Resources';
      case 'regular':
      case 'honorary':
      default:
        return 'Member Resources';
    }
  };

  if (loading) {
    return (
      <div className="member-resources-page">
        <div className="member-resources-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="member-resources-page">
      <div className="member-resources-container">
        <header className="member-resources-header">
          <div className="member-resources-header-main">
            <h1>{getResourceTitle()}</h1>
            <p>Access your member-specific resources</p>
          </div>
          <button
            type="button"
            className="member-back-link"
            onClick={() => navigate('/member-dashboard')}
          >
            ← Back to Dashboard
          </button>
        </header>

        <div className="member-resources-content">
          <Resources memberMode={true} usePersonalResources={true} />
        </div>
      </div>
    </div>
  );
};

export default MemberResources;
