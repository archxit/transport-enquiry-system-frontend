import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './css/SignupPage.css';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      // Send registration request to backend
      const response = await axios.post('http://localhost:8080/users/register', {
        username,
        password
      });
      
      console.log('Registration successful:', response.data);
      
      // Redirect to login page
      navigate('/login');
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data || 'Registration failed');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-header">
        <h1>Transport Inquiry</h1>
      </div>
      
      <div className="signup-card">
        <h2>Create an Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="signup-button">
            Sign Up
          </button>
        </form>
        
        <div className="signup-options">
          <span>Already have an account?</span>
          <a href="/login">Log In</a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
