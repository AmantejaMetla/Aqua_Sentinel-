import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { ApiProvider } from './contexts/ApiContext';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import SystemMonitor from './pages/SystemMonitor';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Settings from './pages/Settings';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const AppRouter = () => {
  return (
    <Router>
      <AuthProvider>
        <DatabaseProvider>
          <ApiProvider>
            <WebSocketProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Protected Dashboard Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Analytics />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/system-monitor" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <SystemMonitor />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Redirect for backwards compatibility */}
                <Route path="/app" element={<Navigate to="/dashboard" replace />} />
                
                {/* 404 Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </WebSocketProvider>
          </ApiProvider>
        </DatabaseProvider>
      </AuthProvider>
    </Router>
  );
};

export default AppRouter; 