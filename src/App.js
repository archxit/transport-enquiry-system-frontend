import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import './css/App.css';
import Dashboard from './Dashboard';

// These would be your protected routes once implemented
// import UserDashboard from './UserDashboard';
// import AdminDashboard from './AdminDashboard';

// Simple auth check function - you'll expand this later
const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

const isAdminAuthenticated = () => {
  return localStorage.getItem('adminToken') !== null;
};

// Protected route component
const ProtectedRoute = ({ children, isAdmin = false }) => {
  const authCheck = isAdmin ? isAdminAuthenticated() : isAuthenticated();
  
  if (!authCheck) {
    return <Navigate to={isAdmin ? "/admin-login" : "/login"} />;
  }
  
  return children;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        
        {/* Protected Routes - uncomment when you implement these components */}
         <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admins/dashboard" 
          element={
            <ProtectedRoute isAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect to login if no route matches */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
