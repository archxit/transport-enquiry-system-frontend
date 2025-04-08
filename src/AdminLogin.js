import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './css/AdminLogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8080/admins/login', {
        username,
        password
      });
      
      // Store admin token and info
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminInfo', JSON.stringify(response.data.admin));
      
      // Redirect to admin dashboard
      navigate('/admins/dashboard');
    } catch (err) {
      console.error('Admin login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-header">
        <h1>Transport Inquiry</h1>
      </div>
      
      <div className="admin-login-card">
        <div className="admin-icon">
          <svg viewBox="0 0 24 24" width="64" height="64">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="white" />
          </svg>
        </div>
        
        <h2>Admin Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="admin-login-button">
            Log In
          </button>
        </form>
        
        <div className="admin-login-options">
          <a href="/login">User Login</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
