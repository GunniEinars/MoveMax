
import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffMember, Role } from '../types';
import { INITIAL_STAFF } from '../services/mockData';

interface AuthContextType {
  currentUser: StaffMember | null;
  login: (userId: string) => void;
  logout: () => void;
  hasPermission: (page: keyof StaffMember['permissions'], action: 'view' | 'edit' | 'delete') => boolean;
  availableUsers: StaffMember[]; // For dev switcher
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  
  const availableUsers = INITIAL_STAFF;

  const login = (userId: string) => {
    const user = availableUsers.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const hasPermission = (page: keyof StaffMember['permissions'], action: 'view' | 'edit' | 'delete') => {
    if (!currentUser) return false;
    // Admins always have access (failsafe), though the mock data defines it explicitly too.
    if (currentUser.role === Role.ADMIN) return true;
    
    return currentUser.permissions[page]?.[action] || false;
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, hasPermission, availableUsers }}>
      {children}
    </AuthContext.Provider>
  );
};
