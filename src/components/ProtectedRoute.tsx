import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI, UserInfo } from '../api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
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
            if (userInfo.is_staff || userInfo.is_admin) {
              setIsAuthorized(true);
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
          if (userInfo.is_staff || userInfo.is_admin) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error: any) {
        console.error('Failed to verify admin status:', error);
        // If API call fails, let backend handle the actual permission check
        // We'll allow the request through and let the backend reject if not authorized
        setIsAuthorized(true);
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

  if (!authAPI.isAuthenticated() || !isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

