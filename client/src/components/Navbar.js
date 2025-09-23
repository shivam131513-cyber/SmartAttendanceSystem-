import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Profile from './Profile';
import axios from 'axios';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    fetchProfilePicture();
  }, []);

  const fetchProfilePicture = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.profile_picture) {
        setProfilePicture(`http://localhost:5000/${response.data.profile_picture}`);
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  const handleProfileUpdate = () => {
    fetchProfilePicture();
  };

  const navStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '0 20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  };

  const navContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    height: '60px'
  };

  const logoStyle = {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none'
  };

  const navLinksStyle = {
    display: 'flex',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    gap: '20px'
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    color: 'white'
  };

  const logoutButtonStyle = {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  const profileIconStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid white',
    objectFit: 'cover',
    transition: 'transform 0.2s'
  };

  const defaultProfileIconStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '2px solid white',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    transition: 'transform 0.2s'
  };

  return (
    <nav style={navStyle}>
      <div style={navContainerStyle}>
        <Link to="/dashboard" style={logoStyle}>
          🏫 Attendance System
        </Link>

        <ul style={navLinksStyle}>
          <li>
            <Link 
              to="/dashboard" 
              style={isActive('/dashboard') ? activeLinkStyle : linkStyle}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/attendance" 
              style={isActive('/attendance') ? activeLinkStyle : linkStyle}
            >
              Mark Attendance
            </Link>
          </li>
          {user.role === 'admin' && (
            <li>
              <Link 
                to="/students" 
                style={isActive('/students') ? activeLinkStyle : linkStyle}
              >
                Students
              </Link>
            </li>
          )}
          <li>
            <Link 
              to="/reports" 
              style={isActive('/reports') ? activeLinkStyle : linkStyle}
            >
              Reports
            </Link>
          </li>
          {user.role === 'admin' && (
            <li>
              <Link 
                to="/system-status" 
                style={isActive('/system-status') ? activeLinkStyle : linkStyle}
              >
                System Status
              </Link>
            </li>
          )}
        </ul>

        <div style={userInfoStyle}>
          {profilePicture ? (
            <img 
              src={profilePicture} 
              alt="Profile" 
              style={profileIconStyle}
              onClick={() => setShowProfile(true)}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            />
          ) : (
            <div 
              style={defaultProfileIconStyle}
              onClick={() => setShowProfile(true)}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span>
            Welcome, {user.username} ({user.role})
          </span>
          <button 
            onClick={onLogout}
            style={logoutButtonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          >
            Logout
          </button>
        </div>
      </div>
      
      {showProfile && (
        <Profile 
          user={user}
          onClose={() => setShowProfile(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </nav>
  );
};

export default Navbar;
