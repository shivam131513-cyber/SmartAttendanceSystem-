import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import moment from 'moment';
import FaceRecognition from './FaceRecognition';

const AttendanceMarking = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [attendanceMethod, setAttendanceMethod] = useState('manual');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rfidInput, setRfidInput] = useState('');
  const [recognitionResults, setRecognitionResults] = useState([]);
  const [rfidProcessing, setRfidProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [markingAllPresent, setMarkingAllPresent] = useState(false);
  
  const rfidInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (attendanceMethod === 'rfid' && rfidInputRef.current) {
      rfidInputRef.current.focus();
    }
  }, [attendanceMethod]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students');
      console.log('Students fetched from API:', response.data);
      
      if (response.data && response.data.length > 0) {
        setStudents(response.data);
      } else {
        // If no students from API, use mock data
        console.log('No students from API, using mock data');
        const mockStudents = [
          { 
            id: '1', 
            name: 'Arjun Patel', 
            class: '5', 
            section: 'A', 
            roll_number: '5A001',
            parent_contact: '+91-9876543210'
          },
          { 
            id: '2', 
            name: 'Priya Sharma', 
            class: '5', 
            section: 'A', 
            roll_number: '5A002',
            parent_contact: '+91-9876543211'
          },
          { 
            id: '3', 
            name: 'Rahul Kumar', 
            class: '4', 
            section: 'B', 
            roll_number: '4B001',
            parent_contact: '+91-9876543212'
          },
          { 
            id: '4', 
            name: 'Sneha Gupta', 
            class: '4', 
            section: 'B', 
            roll_number: '4B002',
            parent_contact: '+91-9876543213'
          },
          { 
            id: '5', 
            name: 'Vikram Singh', 
            class: '3', 
            section: 'A', 
            roll_number: '3A001',
            parent_contact: '+91-9876543214'
          }
        ];
        setStudents(mockStudents);
      }
    } catch (error) {
      console.error('Students fetch error:', error);
      setError('Failed to load students from server, using demo data');
      
      // Fallback to mock students on error
      const mockStudents = [
        { 
          id: '1', 
          name: 'Arjun Patel', 
          class: '5', 
          section: 'A', 
          roll_number: '5A001',
          parent_contact: '+91-9876543210'
        },
        { 
          id: '2', 
          name: 'Priya Sharma', 
          class: '5', 
          section: 'A', 
          roll_number: '5A002',
          parent_contact: '+91-9876543211'
        },
        { 
          id: '3', 
          name: 'Rahul Kumar', 
          class: '4', 
          section: 'B', 
          roll_number: '4B001',
          parent_contact: '+91-9876543212'
        },
        { 
          id: '4', 
          name: 'Sneha Gupta', 
          class: '4', 
          section: 'B', 
          roll_number: '4B002',
          parent_contact: '+91-9876543213'
        },
        { 
          id: '5', 
          name: 'Vikram Singh', 
          class: '3', 
          section: 'A', 
          roll_number: '3A001',
          parent_contact: '+91-9876543214'
        }
      ];
      setStudents(mockStudents);
      
      // Clear error after showing mock data
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      await axios.post('/api/attendance', {
        student_id: studentId,
        status: status,
        method: attendanceMethod
      });
      
      setSuccess(`Attendance marked successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Update local state to reflect the change
      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, attendanceMarked: true, attendanceStatus: status }
          : student
      ));
    } catch (error) {
      setError('Failed to mark attendance');
      setTimeout(() => setError(''), 3000);
      console.error('Attendance marking error:', error);
    }
  };


  const handleRfidScan = async (e) => {
    if (e.key === 'Enter' && rfidInput.trim()) {
      await processRfidAttendance();
    }
  };

  const processRfidAttendance = async () => {
    if (!rfidInput.trim()) {
      setError('❌ Please enter an RFID tag number');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setRfidProcessing(true);
      
      const response = await axios.post('/api/rfid-scan', {
        rfid_tag: rfidInput.trim()
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const student = response.data.student;
        const attendance = response.data.attendance;
        setRfidInput('');
        setSuccess(`✅ ${student.name} (${student.roll_number}) marked present via RFID at ${attendance.time_in}!`);
        
        // Refresh students list to update attendance status
        fetchStudents();
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(`❌ ${response.data.message}`);
        setRfidInput('');
        
        // Auto-clear error message after 3 seconds
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('❌ RFID scan failed. Please try again.');
      setRfidInput('');
      console.error('RFID scan error:', error);
      
      // Auto-clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setRfidProcessing(false);
    }
  };

  const markRecognizedAttendance = async (studentId) => {
    await markAttendance(studentId, 'present');
    setRecognitionResults(results => 
      results.filter(result => result.id !== studentId)
    );
  };

  const markAllRecognizedPresent = async () => {
    if (recognitionResults.length === 0) return;
    
    setMarkingAllPresent(true);
    setError('');
    setSuccess('');
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const student of recognitionResults) {
        try {
          await markAttendance(student.id, 'present');
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to mark attendance for ${student.name}:`, error);
        }
      }
      
      if (successCount > 0) {
        setSuccess(`✅ Successfully marked ${successCount} student(s) present via facial recognition!`);
        setRecognitionResults([]); // Clear all results after marking
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      }
      
      if (errorCount > 0) {
        setError(`❌ Failed to mark ${errorCount} student(s). Please try again.`);
        setTimeout(() => setError(''), 3000);
      }
      
    } catch (error) {
      setError('❌ Failed to mark attendance for recognized students.');
      console.error('Bulk attendance marking error:', error);
      setTimeout(() => setError(''), 3000);
    } finally {
      setMarkingAllPresent(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>
          📝 Mark Attendance
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          {moment().format('MMMM Do, YYYY')} - Choose your preferred method
        </p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Method Selection */}
      <div className="card">
        <h2 style={{ marginBottom: '20px', color: '#333' }}>🔧 Attendance Method</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          <button
            className={`btn ${attendanceMethod === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAttendanceMethod('manual')}
            style={{ padding: '15px' }}
          >
            ✋ Manual
          </button>
          <button
            className={`btn ${attendanceMethod === 'facial' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAttendanceMethod('facial')}
            style={{ padding: '15px' }}
          >
            📷 Facial Recognition
          </button>
          <button
            className={`btn ${attendanceMethod === 'rfid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAttendanceMethod('rfid')}
            style={{ padding: '15px' }}
          >
            🏷️ RFID
          </button>
        </div>
      </div>

      {/* RFID Scanner */}
      {attendanceMethod === 'rfid' && (
        <div className="card">
          <div className="rfid-scanner">
            <h2 style={{ marginBottom: '20px' }}>🏷️ RFID Scanner</h2>
            <p style={{ marginBottom: '20px', opacity: 0.9 }}>
              Scan or enter RFID tag number and press Enter
            </p>
            <input
              ref={rfidInputRef}
              type="text"
              className="rfid-input"
              value={rfidInput}
              onChange={(e) => setRfidInput(e.target.value)}
              onKeyPress={handleRfidScan}
              placeholder="Scan RFID tag here..."
              autoFocus
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                border: '2px solid #667eea',
                borderRadius: '8px',
                marginBottom: '15px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}
            />
            
            <button
              onClick={processRfidAttendance}
              disabled={!rfidInput.trim() || rfidProcessing}
              style={{
                width: '100%',
                padding: '15px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: rfidProcessing ? '#ffc107' : 
                                (rfidInput.trim() ? '#28a745' : '#6c757d'),
                border: 'none',
                borderRadius: '8px',
                cursor: (rfidInput.trim() && !rfidProcessing) ? 'pointer' : 'not-allowed',
                marginBottom: '15px',
                transition: 'all 0.3s ease',
                opacity: rfidProcessing ? 0.8 : 1
              }}
              onMouseOver={(e) => {
                if (rfidInput.trim() && !rfidProcessing) {
                  e.target.style.backgroundColor = '#218838';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={(e) => {
                if (rfidInput.trim() && !rfidProcessing) {
                  e.target.style.backgroundColor = '#28a745';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {rfidProcessing ? '⏳ Processing RFID...' : '🏷️ Mark Attendance with RFID'}
            </button>
            
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '10px' }}>
              💡 Enter RFID tag and click the button above, or press Enter
            </p>
            
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <h4 style={{ marginBottom: '10px', color: '#333' }}>Sample RFID Tags for Testing:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div><strong>RFID001</strong> - Arjun Patel (5A001)</div>
                <div><strong>RFID002</strong> - Priya Sharma (5A002)</div>
                <div><strong>RFID012</strong> - Rahul Kumar (4A001)</div>
                <div><strong>RFID023</strong> - Vikram Singh (3A001)</div>
                <div><strong>RFID007</strong> - Rohit Verma (5B001)</div>
                <div><strong>RFID030</strong> - Gita Patel (3B002)</div>
              </div>
              <p style={{ marginTop: '10px', color: '#666', fontSize: '0.8rem' }}>
                💡 Tip: Type any of these RFID tags above and press Enter to mark attendance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Facial Recognition */}
      {attendanceMethod === 'facial' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#333', margin: 0 }}>📷 Real-Time Facial Recognition</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setCameraActive(!cameraActive);
                  if (cameraActive) {
                    // Clear results when stopping camera
                    setRecognitionResults([]);
                    setSuccess('');
                  }
                }}
                className={`btn ${cameraActive ? 'btn-danger' : 'btn-success'}`}
                style={{ 
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                {cameraActive ? '🛑 Stop Camera' : '📹 Start Camera'}
              </button>
              
              {recognitionResults.length > 0 && (
                <button
                  onClick={() => {
                    setRecognitionResults([]);
                    setSuccess('Recognition results cleared.');
                  }}
                  className="btn btn-warning"
                  style={{ 
                    padding: '8px 16px',
                    fontSize: '0.9rem'
                  }}
                >
                  🧹 Clear Results
                </button>
              )}
            </div>
          </div>
          
          <FaceRecognition
            students={students}
            isActive={attendanceMethod === 'facial' && cameraActive}
            onRecognitionResult={(recognizedStudents) => {
              // Cumulative results - add new students without removing existing ones
              setRecognitionResults(prevResults => {
                const existingIds = prevResults.map(r => r.id);
                const newStudents = recognizedStudents.filter(student => !existingIds.includes(student.id));
                const updatedResults = [...prevResults, ...newStudents];
                
                if (newStudents.length > 0) {
                  setSuccess(`Added ${newStudents.length} new student(s)! Total: ${updatedResults.length} students detected.`);
                }
                
                return updatedResults;
              });
            }}
            onCameraStatusChange={setCameraActive}
          />

          {/* Recognition Results */}
          {recognitionResults.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ 
                backgroundColor: '#e8f5e8', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '20px',
                border: '2px solid #4caf50'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ color: '#2e7d32', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🎯 Face Recognition Results
                    <span style={{ 
                      fontSize: '0.8rem', 
                      backgroundColor: '#4caf50', 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '12px' 
                    }}>
                      {recognitionResults.length} student(s) found
                    </span>
                  </h3>
                  
                  <button
                    onClick={markAllRecognizedPresent}
                    disabled={markingAllPresent || recognitionResults.length === 0}
                    className="btn btn-success"
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      backgroundColor: markingAllPresent ? '#ffc107' : '#28a745',
                      borderColor: markingAllPresent ? '#ffc107' : '#28a745',
                      opacity: markingAllPresent ? 0.8 : 1
                    }}
                  >
                    {markingAllPresent ? '⏳ Marking All...' : '✅ Mark All Present'}
                  </button>
                </div>
                <p style={{ color: '#2e7d32', margin: 0, fontSize: '0.9rem' }}>
                  Click "Mark Present" for individual students or "Mark All Present" to mark everyone at once.
                </p>
              </div>
              
              <div className="attendance-grid">
                {recognitionResults.map((result) => (
                  <div key={result.id} className="student-card" style={{ 
                    border: '2px solid #4caf50',
                    backgroundColor: '#f1f8e9'
                  }}>
                    <div className="student-info">
                      <div>
                        <div className="student-name" style={{ color: '#2e7d32' }}>
                          {result.name}
                        </div>
                        <div className="student-details">
                          Class {result.class}{result.section} • Roll: {result.roll_number}
                        </div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#4caf50', 
                          fontWeight: '500',
                          marginTop: '5px'
                        }}>
                          🤖 AI Confidence: {Math.round(result.confidence * 100)}%
                        </div>
                      </div>
                      <button
                        onClick={() => markRecognizedAttendance(result.id)}
                        className="btn btn-success"
                        style={{ 
                          padding: '10px 16px',
                          fontSize: '0.9rem',
                          boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
                        }}
                      >
                        ✅ Mark Present
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                marginTop: '20px', 
                textAlign: 'center',
                padding: '15px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                color: '#1565c0'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  🤖 <strong>Real AI Recognition:</strong> This system uses face-api.js for actual face detection and recognition. 
                  Position your face clearly in the camera for best results.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Attendance */}
      {attendanceMethod === 'manual' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#333', margin: 0 }}>✋ Manual Attendance</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666',
                backgroundColor: '#f8f9fa',
                padding: '8px 12px',
                borderRadius: '6px'
              }}>
                👥 {students.length} students loaded
              </div>
              <button
                onClick={fetchStudents}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                disabled={loading}
              >
                {loading ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
          
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
              <p>Please add students first to mark attendance</p>
            </div>
          ) : (
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
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          📞 {student.parent_contact}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => markAttendance(student.id, 'present')}
                        className="btn btn-success"
                        style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                        disabled={student.attendanceMarked && student.attendanceStatus === 'present'}
                      >
                        {student.attendanceMarked && student.attendanceStatus === 'present' ? '✅ Present' : '✅ Present'}
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'absent')}
                        className="btn btn-danger"
                        style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                        disabled={student.attendanceMarked && student.attendanceStatus === 'absent'}
                      >
                        {student.attendanceMarked && student.attendanceStatus === 'absent' ? '❌ Absent' : '❌ Absent'}
                      </button>
                    </div>
                  </div>
                  {student.attendanceMarked && (
                    <div style={{ 
                      marginTop: '10px', 
                      fontSize: '0.8rem', 
                      color: student.attendanceStatus === 'present' ? '#2e7d32' : '#c62828',
                      fontWeight: '500'
                    }}>
                      ✓ Attendance marked as {student.attendanceStatus}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>💡 Instructions</h3>
        <div style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.6' }}>
          <p><strong>Manual:</strong> Click Present/Absent buttons for each student individually.</p>
          <p><strong>Facial Recognition:</strong> Use camera to automatically identify students (demo mode).</p>
          <p><strong>RFID:</strong> Scan student RFID tags or enter tag numbers manually.</p>
          <p style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', color: '#856404' }}>
            <strong>Note:</strong> This is a prototype system. Facial recognition uses mock data for demonstration purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMarking;
