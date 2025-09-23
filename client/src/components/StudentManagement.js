import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentManagement = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    roll_number: '',
    name: '',
    class: '',
    section: '',
    parent_contact: '',
    rfid_tag: '',
    photo: null
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students');
      setStudents(response.data);
    } catch (error) {
      setError('Failed to load students');
      console.error('Students fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setNewStudent(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    Object.keys(newStudent).forEach(key => {
      if (newStudent[key]) {
        formData.append(key, newStudent[key]);
      }
    });

    try {
      await axios.post('/api/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess('Student added successfully!');
      setShowAddForm(false);
      setNewStudent({
        roll_number: '',
        name: '',
        class: '',
        section: '',
        parent_contact: '',
        rfid_tag: '',
        photo: null
      });
      fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to add student');
      setTimeout(() => setError(''), 3000);
      console.error('Add student error:', error);
    }
  };

  const generateRfidTag = () => {
    const tag = 'RFID' + Math.random().toString(36).substr(2, 8).toUpperCase();
    setNewStudent(prev => ({ ...prev, rfid_tag: tag }));
  };

  if (user.role !== 'admin') {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
          <h2>Access Denied</h2>
          <p>Only administrators can manage students.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>
          👥 Student Management
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Add, edit, and manage student information
        </p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Add Student Button */}
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#333', margin: 0 }}>📚 Students List</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
            style={{ padding: '10px 20px' }}
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Student'}
          </button>
        </div>

        {/* Add Student Form */}
        {showAddForm && (
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>➕ Add New Student</h3>
            <form onSubmit={handleAddStudent}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div className="form-group">
                  <label htmlFor="roll_number">Roll Number *</label>
                  <input
                    type="text"
                    id="roll_number"
                    name="roll_number"
                    value={newStudent.roll_number}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 5A001"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Student Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newStudent.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="class">Class *</label>
                  <select
                    id="class"
                    name="class"
                    value={newStudent.class}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Class</option>
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3">Class 3</option>
                    <option value="4">Class 4</option>
                    <option value="5">Class 5</option>
                    <option value="6">Class 6</option>
                    <option value="7">Class 7</option>
                    <option value="8">Class 8</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="section">Section</label>
                  <select
                    id="section"
                    name="section"
                    value={newStudent.section}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Section</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="parent_contact">Parent Contact</label>
                  <input
                    type="tel"
                    id="parent_contact"
                    name="parent_contact"
                    value={newStudent.parent_contact}
                    onChange={handleInputChange}
                    placeholder="+91-9876543210"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rfid_tag">RFID Tag</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      id="rfid_tag"
                      name="rfid_tag"
                      value={newStudent.rfid_tag}
                      onChange={handleInputChange}
                      placeholder="RFID tag number"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={generateRfidTag}
                      className="btn btn-secondary"
                      style={{ padding: '10px' }}
                    >
                      🎲 Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="photo">Student Photo</label>
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  onChange={handleInputChange}
                  accept="image/*"
                />
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Upload a clear photo for facial recognition (optional)
                </small>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  ➕ Add Student
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Students List */}
        {students.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👥</div>
            <h3>No students found</h3>
            <p>Add your first student to get started</p>
          </div>
        ) : (
          <div>
            <div style={{ 
              marginBottom: '20px', 
              padding: '10px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '4px',
              color: '#1565c0'
            }}>
              📊 Total Students: {students.length}
            </div>
            
            <div className="attendance-grid">
              {students.map((student) => (
                <div key={student.id} className="student-card">
                  <div className="student-info">
                    <div>
                      <div className="student-name">{student.name}</div>
                      <div className="student-details">
                        Class {student.class}{student.section} • Roll: {student.roll_number}
                      </div>
                      {student.parent_contact && (
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                          📞 {student.parent_contact}
                        </div>
                      )}
                      {student.rfid_tag && (
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                          🏷️ RFID: {student.rfid_tag}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {student.photo_path && (
                        <span style={{ 
                          fontSize: '0.8rem', 
                          color: '#4caf50',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          📷 Photo
                        </span>
                      )}
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#666',
                        textAlign: 'right'
                      }}>
                        Added: {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>🔧 Bulk Actions</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px'
        }}>
          <button 
            className="btn btn-secondary"
            style={{ padding: '12px' }}
            onClick={() => alert('Export feature coming soon!')}
          >
            📊 Export to Excel
          </button>
          <button 
            className="btn btn-secondary"
            style={{ padding: '12px' }}
            onClick={() => alert('Import feature coming soon!')}
          >
            📥 Import from CSV
          </button>
          <button 
            className="btn btn-secondary"
            style={{ padding: '12px' }}
            onClick={() => alert('Print feature coming soon!')}
          >
            🖨️ Print List
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="card" style={{ backgroundColor: '#fff3cd' }}>
        <h3 style={{ color: '#856404', marginBottom: '15px' }}>💡 Tips for Rural Schools</h3>
        <div style={{ fontSize: '0.9rem', color: '#856404', lineHeight: '1.6' }}>
          <p>• <strong>RFID Tags:</strong> Use low-cost RFID stickers or cards for quick attendance</p>
          <p>• <strong>Photos:</strong> Take clear photos in good lighting for better facial recognition</p>
          <p>• <strong>Roll Numbers:</strong> Use consistent format like ClassSection + Number (e.g., 5A001)</p>
          <p>• <strong>Backup:</strong> Keep printed student lists as backup during system maintenance</p>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
