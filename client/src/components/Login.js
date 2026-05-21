import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin, darkMode, onToggleDarkMode }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/login', credentials);
      onLogin(response.data.user, response.data.token);
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const bgStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: darkMode
      ? 'linear-gradient(135deg, #1a1d2e 0%, #0f1117 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative',
    transition: 'background 0.3s ease'
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '420px',
    margin: '20px',
    background: darkMode ? '#1a1d2e' : 'white',
    borderRadius: '16px',
    padding: '36px',
    boxShadow: darkMode
      ? '0 20px 60px rgba(0,0,0,0.7)'
      : '0 20px 60px rgba(0,0,0,0.15)',
    border: darkMode ? '1px solid #2d3250' : 'none'
  };

  const labelStyle = { color: darkMode ? '#c8d0e0' : '#333' };
  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${darkMode ? '#3d4275' : '#ddd'}`,
    borderRadius: '6px',
    fontSize: '1rem',
    background: darkMode ? '#252840' : 'white',
    color: darkMode ? '#e2e8f0' : '#333',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  };

  return (
    <div style={bgStyle}>
      {/* Dark mode toggle on login page */}
      <button
        onClick={onToggleDarkMode}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        style={{
          position: 'fixed',
          top: '18px',
          right: '18px',
          background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
          borderRadius: '24px',
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 100,
          transition: 'background 0.2s'
        }}
      >
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div style={cardStyle}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏫</div>
          <h1 style={{
            color: darkMode ? '#e2e8f0' : '#333',
            marginBottom: '6px',
            fontSize: '1.8rem',
            fontWeight: 700
          }}>
            Rural School
          </h1>
          <h2 style={{
            color: '#667eea',
            marginBottom: '8px',
            fontSize: '1.2rem',
            fontWeight: 500
          }}>
            Attendance System
          </h2>
          <p style={{ color: darkMode ? '#8b9bb4' : '#888', fontSize: '0.9rem', margin: 0 }}>
            Automated attendance tracking for rural schools
          </p>
        </div>

        {error && (
          <div style={{
            background: darkMode ? '#3b1515' : '#ffebee',
            color: darkMode ? '#fca5a5' : '#c62828',
            border: `1px solid ${darkMode ? '#7f1d1d' : '#ef9a9a'}`,
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', ...labelStyle }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={credentials.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
              style={inputStyle}
              onFocus={e => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = darkMode ? '#3d4275' : '#ddd';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', ...labelStyle }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              style={inputStyle}
              onFocus={e => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = darkMode ? '#3d4275' : '#ddd';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading
                ? '#9aa5e0'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s, transform 0.15s',
              boxShadow: '0 4px 14px rgba(102,126,234,0.4)'
            }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? '⏳ Logging in...' : '🔐 Login'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: '28px',
          padding: '18px',
          backgroundColor: darkMode ? '#1e2235' : '#f8f9fa',
          borderRadius: '10px',
          border: `1px solid ${darkMode ? '#2d3250' : '#e9ecef'}`,
          fontSize: '0.85rem'
        }}>
          <h4 style={{
            marginBottom: '10px',
            color: darkMode ? '#9ba8d0' : '#555',
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            🔑 Demo Credentials
          </h4>
          {[
            { label: 'Admin', user: 'shivam', pass: 'shivam@123' },
            { label: 'Admin', user: 'prince', pass: 'prince@123' },
            { label: 'Teacher', user: 'teacher', pass: 'teacher123' }
          ].map(({ label, user, pass }) => (
            <div key={user} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '5px 0',
              borderBottom: `1px solid ${darkMode ? '#2d3250' : '#eee'}`,
              gap: '8px'
            }}>
              <span style={{
                background: label === 'Admin' ? '#667eea' : '#43a047',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                flexShrink: 0
              }}>
                {label}
              </span>
              <span style={{ color: darkMode ? '#b0bcd0' : '#555', fontSize: '0.85rem' }}>
                {user} / <strong style={{ color: darkMode ? '#e2e8f0' : '#333' }}>{pass}</strong>
              </span>
              <button
                type="button"
                onClick={() => setCredentials({ username: user, password: pass })}
                style={{
                  background: 'transparent',
                  border: `1px solid ${darkMode ? '#3d4275' : '#ccc'}`,
                  color: darkMode ? '#9ba8d0' : '#667eea',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  flexShrink: 0
                }}
              >
                Use
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
