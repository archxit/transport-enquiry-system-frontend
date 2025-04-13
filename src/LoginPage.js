import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './css/LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8080/users/login', {
        username,
        password
      });
      
      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>Transport Inquiry</h1>
      </div>
      
      <div className="login-card">
        <div className="user-icon">
          <svg viewBox="0 0 24 24" width="64" height="64">
            <circle cx="12" cy="8" r="4" fill="white" />
            <path d="M12 12c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z" fill="white" />
          </svg>
        </div>
        
        <h2>User Login</h2>
        
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
          
          <button type="submit" className="login-button">
            Log In
          </button>
        </form>
        
        <div className="login-options">
          <a href="/admin-login">Admin Login</a>
          <a href="/signup">Sign up as user</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
