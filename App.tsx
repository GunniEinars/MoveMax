
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProfilesPage } from './pages/Profiles';
import { MovesPage } from './pages/Moves';
import { DashboardPage } from './pages/Dashboard';
import { DispatchPage } from './pages/Dispatch';
import { SettingsPage } from './pages/Settings';
import { MobileTasksPage } from './pages/MobileTasks';
import { ClientPortalPage } from './pages/ClientPortal';
import { AuditorPage } from './pages/Auditor';
import { LoginPage } from './pages/Login';
import { ToastProvider } from './components/Toast';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/portal/:moveId" element={<ClientPortalPage />} />
              
              {/* Standalone Mobile Route */}
              <Route path="/audit" element={<AuditorPage />} />

              {/* Protected Admin Routes */}
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/profiles" element={<ProfilesPage />} />
                    <Route path="/moves" element={<MovesPage />} />
                    <Route path="/dispatch" element={<DispatchPage />} />
                    <Route path="/reports" element={<DashboardPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/my-tasks" element={<MobileTasksPage />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </StoreProvider>
  );
};

export default App;
