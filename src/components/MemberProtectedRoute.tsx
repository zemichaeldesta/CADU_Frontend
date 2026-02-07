import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI, UserInfo } from '../api/auth';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
}

const MemberProtectedRoute: React.FC<MemberProtectedRouteProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!authAPI.isAuthenticated()) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check cached user info first
        const cachedUserInfo = localStorage.getItem('user_info');
        if (cachedUserInfo) {
          try {
            const userInfo: UserInfo = JSON.parse(cachedUserInfo);
            // Members should NOT be staff/admin
            if (!userInfo.is_staff && !userInfo.is_admin) {
              setIsAuthorized(true);
              setIsLoading(false);
              return;
            } else {
              // Admin trying to access member area - redirect to admin
              setIsAuthorized(false);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // Invalid cache, continue to fetch
            console.error('Error parsing cached user info:', e);
          }
        }

        // Fetch fresh user info from API
        const userInfo = await authAPI.getUserInfo();
        if (userInfo) {
          // Members should NOT be staff/admin
          if (!userInfo.is_staff && !userInfo.is_admin) {
            setIsAuthorized(true);
          } else {
            // Admin trying to access member area
            setIsAuthorized(false);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error: any) {
        console.error('Failed to verify member status:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#27ae60'
      }}>
        Loading authentication...
      </div>
    );
  }

  if (!authAPI.isAuthenticated()) {
    return <Navigate to="/member-login" replace />;
  }

  if (!isAuthorized) {
    // Admin trying to access member area - redirect to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export default MemberProtectedRoute;

