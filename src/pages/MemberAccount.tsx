import React from 'react';
import MemberProtectedRoute from '../components/MemberProtectedRoute';
import AccountManagement from '../components/AccountManagement';

const MemberAccount: React.FC = () => {
  return (
    <MemberProtectedRoute>
      <AccountManagement />
    </MemberProtectedRoute>
  );
};

export default MemberAccount;

