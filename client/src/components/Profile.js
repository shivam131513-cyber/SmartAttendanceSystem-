import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = ({ user, onClose, onProfileUpdate }) => {
  const [profileData, setProfileData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
      if (response.data.profile_picture) {
        setPreviewUrl(`http://localhost:5000/${response.data.profile_picture}`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/profile-picture', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Profile picture updated successfully!');
      setSelectedFile(null);
      fetchProfile();
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  const contentStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90vw',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
  };

  const profileImageStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #667eea',
    margin: '0 auto 20px',
    display: 'block'
  };

  const defaultAvatarStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    color: 'white',
    fontSize: '48px',
    fontWeight: 'bold'
  };

  const buttonStyle = {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '10px',
    fontSize: '14px'
  };

  const closeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6c757d'
  };

  if (!profileData) {
    return (
      <div style={modalStyle}>
        <div style={contentStyle}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
          Profile Settings
        </h2>

        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Profile" 
            style={profileImageStyle}
          />
        ) : (
          <div style={defaultAvatarStyle}>
            {profileData.username.charAt(0).toUpperCase()}
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
            {profileData.username}
          </h3>
          <p style={{ margin: 0, color: '#666', textTransform: 'capitalize' }}>
            {profileData.role}
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Update Profile Picture:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ marginBottom: '10px', width: '100%' }}
          />
          {selectedFile && (
            <p style={{ fontSize: '14px', color: '#666' }}>
              Selected: {selectedFile.name}
            </p>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={buttonStyle}
            >
              {uploading ? 'Uploading...' : 'Upload Picture'}
            </button>
          )}
          <button onClick={onClose} style={closeButtonStyle}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
