import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Profile from './Profile';
import axios from 'axios';

const Navbar = ({ user, onLogout, darkMode, onToggleDarkMode }) => {
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    fetchProfilePicture();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const fetchProfilePicture = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.profile_picture) {
        const apiUrl = process.env.REACT_APP_API_URL || '';
        setProfilePicture(`${apiUrl}/${response.data.profile_picture}`);
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  // Called by Profile modal after upload — accepts direct base64 URL for instant update
  const handleProfileUpdate = (directUrl) => {
    if (directUrl) {
      setProfilePicture(directUrl);
    } else {
      fetchProfilePicture();
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/attendance', label: 'Mark Attendance' },
    ...(user.role === 'admin' ? [{ to: '/students', label: 'Students' }] : []),
    { to: '/reports', label: 'Reports' },
    ...(user.role === 'admin' ? [{ to: '/system-status', label: 'System Status' }] : []),
  ];

  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '7px 13px',
    borderRadius: '4px',
    fontSize: '0.9rem',
    display: 'block',
    transition: 'background 0.2s'
  };

  return (
    <>
      <nav style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '0 20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        {/* Main bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          height: '62px',
          gap: '12px'
        }}>
          {/* Logo */}
          <Link to="/dashboard" style={{
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            letterSpacing: '-0.3px'
          }}>
            🏫 Attendance System
          </Link>

          {/* Desktop nav links */}
          <ul className="navbar-links" style={{
            display: 'flex',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            gap: '2px',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center'
          }}>
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  style={{
                    ...linkStyle,
                    backgroundColor: isActive(to) ? 'rgba(255,255,255,0.22)' : 'transparent'
                  }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0
          }}>
            {/* 🌙 Dark Mode Toggle */}
            <button
              className="dark-toggle-btn"
              onClick={onToggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
              <span className="navbar-username" style={{ fontSize: '0.8rem' }}>
                {darkMode ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Avatar */}
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                onClick={() => setShowProfile(true)}
                style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  border: '2px solid white',
                  objectFit: 'cover',
                  cursor: 'pointer'
                }}
              />
            ) : (
              <div
                onClick={() => setShowProfile(true)}
                style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '15px',
                  flexShrink: 0
                }}
                title="View Profile"
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            <span className="navbar-username" style={{
              color: 'white',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}>
              {user.username} <span style={{ opacity: 0.7 }}>({user.role})</span>
            </span>

            <button
              onClick={onLogout}
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.30)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            >
              Logout
            </button>

            {/* Hamburger (mobile only via CSS) */}
            <button
              className="navbar-hamburger"
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: 'none',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '1.3rem',
                lineHeight: 1
              }}
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{
            background: 'rgba(50, 20, 90, 0.97)',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            paddingBottom: '8px'
          }}>
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'block',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '13px 20px',
                  fontSize: '1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  background: isActive(to) ? 'rgba(255,255,255,0.12)' : 'transparent'
                }}
              >
                {label}
              </Link>
            ))}
            {/* Dark mode toggle in mobile menu */}
            <button
              onClick={onToggleDarkMode}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                color: 'white',
                padding: '13px 20px',
                fontSize: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.07)'
              }}
            >
              {darkMode ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
            </button>
          </div>
        )}
      </nav>

      {/* Profile modal */}
      {showProfile && (
        <Profile
          user={user}
          onClose={() => setShowProfile(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .navbar-links { display: none !important; }
          .navbar-hamburger { display: block !important; }
          .navbar-username { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
