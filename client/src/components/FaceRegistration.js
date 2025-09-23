import React, { useState } from 'react';

const FaceRegistration = ({ students, onRegister, onClose, faceData }) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [registering, setRegistering] = useState(false);

  // Debug logging
  console.log('FaceRegistration modal rendered with:', { students: students?.length, faceData });

  const handleRegister = async () => {
    if (!selectedStudent || !faceData) return;
    
    setRegistering(true);
    try {
      await onRegister(selectedStudent, faceData);
      onClose();
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px', textAlign: 'center' }}>
          👤 Register Your Face
        </h2>
        
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          color: '#1565c0'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            🎯 <strong>Face Detected!</strong> Please select which student this face belongs to.
            This will help the system recognize you in future attendance sessions.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="student-select" style={{ fontWeight: '500', marginBottom: '10px', display: 'block' }}>
            Select Student:
          </label>
          <select
            id="student-select"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '1rem',
              backgroundColor: 'white'
            }}
          >
            <option value="">-- Choose a student --</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} - Class {student.class}{student.section} (Roll: {student.roll_number})
              </option>
            ))}
          </select>
        </div>

        <div style={{
          backgroundColor: '#fff3cd',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '0.85rem',
          color: '#856404'
        }}>
          💡 <strong>Tip:</strong> Make sure you're looking directly at the camera with good lighting for best recognition results.
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={registering}
            style={{ padding: '10px 20px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleRegister}
            className="btn btn-primary"
            disabled={!selectedStudent || registering}
            style={{ padding: '10px 20px' }}
          >
            {registering ? '🔄 Registering...' : '✅ Register Face'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
