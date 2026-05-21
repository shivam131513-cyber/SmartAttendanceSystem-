import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const Profile = ({ user, onClose, onProfileUpdate }) => {
  const [profileData, setProfileData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
      if (response.data.profile_picture) {
        setPreviewUrl(`${API_URL}/${response.data.profile_picture}`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: 'File too large. Max 5MB allowed.', type: 'error' });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target.result);
      reader.readAsDataURL(file);
      setMessage({ text: '', type: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setMessage({ text: '', type: '' });
    const formData = new FormData();
    formData.append('profilePicture', selectedFile);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/profile-picture', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage({ text: '✅ Profile picture updated!', type: 'success' });
      setSelectedFile(null);
      // Pass the current previewUrl (base64) directly to Navbar so it updates immediately
      if (onProfileUpdate) onProfileUpdate(previewUrl);
    } catch (error) {
      setMessage({ text: '❌ Upload failed. Please try again.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const initial = profileData?.username?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || '?';
  const roleBadgeColor = profileData?.role === 'admin' ? '#667eea' : '#43a047';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        {/* Modal card — stop click propagation so clicking inside doesn't close */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(145deg, #1a1d2e, #252840)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Header strip */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            padding: '28px 28px 60px',
            position: 'relative'
          }}>
            <h2 style={{
              color: 'white',
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: 700,
              letterSpacing: '-0.3px'
            }}>
              👤 Profile Settings
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', fontSize: '0.85rem' }}>
              Manage your account information
            </p>
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'white', borderRadius: '50%',
                width: '32px', height: '32px',
                cursor: 'pointer', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>

          {/* Avatar — overlapping header */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '-50px',
            paddingBottom: '8px'
          }}>
            <div style={{ position: 'relative' }}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  style={{
                    width: '100px', height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #1a1d2e',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                  }}
                />
              ) : (
                <div style={{
                  width: '100px', height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: '4px solid #1a1d2e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  userSelect: 'none'
                }}>
                  {initial}
                </div>
              )}
            </div>

            {/* Name & role */}
            <div style={{ textAlign: 'center', marginTop: '14px', padding: '0 28px' }}>
              {profileData ? (
                <>
                  <h3 style={{
                    color: '#e2e8f0', margin: '0 0 6px',
                    fontSize: '1.3rem', fontWeight: 700
                  }}>
                    {profileData.username}
                  </h3>
                  <span style={{
                    background: roleBadgeColor,
                    color: 'white',
                    padding: '3px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    letterSpacing: '0.5px'
                  }}>
                    {profileData.role}
                  </span>
                </>
              ) : (
                <div style={{ color: '#8b9bb4', fontSize: '0.9rem' }}>Loading…</div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            margin: '20px 28px 0',
            height: '1px',
            background: 'rgba(255,255,255,0.08)'
          }} />

          {/* Upload section */}
          <div style={{ padding: '20px 28px 28px' }}>
            <label style={{
              display: 'block',
              color: '#9ba8d0',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '12px'
            }}>
              Update Profile Picture
            </label>

            {/* File drop zone */}
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              border: '2px dashed rgba(102,126,234,0.4)',
              borderRadius: '12px',
              cursor: 'pointer',
              background: 'rgba(102,126,234,0.05)',
              transition: 'border-color 0.2s',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</span>
              <span style={{ color: '#9ba8d0', fontSize: '0.85rem' }}>
                {selectedFile ? selectedFile.name : 'Click to choose a photo'}
              </span>
              <span style={{ color: '#667eea', fontSize: '0.75rem', marginTop: '4px' }}>
                JPG, PNG, GIF — max 5 MB
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>

            {/* Message */}
            {message.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '0.85rem',
                background: message.type === 'success'
                  ? 'rgba(67,160,71,0.15)'
                  : 'rgba(229,57,53,0.15)',
                color: message.type === 'success' ? '#81c784' : '#ef9a9a',
                border: `1px solid ${message.type === 'success' ? 'rgba(67,160,71,0.3)' : 'rgba(229,57,53,0.3)'}`
              }}>
                {message.text}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: uploading
                      ? 'rgba(102,126,234,0.4)'
                      : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                    boxShadow: '0 4px 14px rgba(102,126,234,0.3)'
                  }}
                >
                  {uploading ? '⏳ Uploading…' : '⬆️ Upload Photo'}
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  flex: selectedFile ? '0 0 auto' : 1,
                  padding: '11px 20px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#9ba8d0',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
