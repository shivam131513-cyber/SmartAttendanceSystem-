import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const SystemStatus = ({ user }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSystemHealth();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHealthData(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching system health:', error);
      setError('Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'demo_mode': return '#ffc107';
      case 'healthy': return '#28a745';
      case 'connected': return '#28a745';
      default: return '#dc3545';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '✅';
      case 'demo_mode': return '🔄';
      case 'healthy': return '💚';
      case 'connected': return '🔗';
      default: return '❌';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔄 Loading System Status...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#dc3545' }}>❌ {error}</h2>
        <button 
          onClick={fetchSystemHealth}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>
          🏥 System Health Dashboard
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Real-time system status and integration monitoring
        </p>
      </div>

      {/* System Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>
            📊 System Overview
          </h3>
          <div style={{ fontSize: '14px' }}>
            <p><strong>Status:</strong> <span style={{ color: getStatusColor(healthData.status) }}>
              {getStatusIcon(healthData.status)} {healthData.status.toUpperCase()}
            </span></p>
            <p><strong>Last Updated:</strong> {healthData.timestamp}</p>
            <p><strong>Database:</strong> <span style={{ color: getStatusColor(healthData.database) }}>
              {getStatusIcon(healthData.database)} {healthData.database.toUpperCase()}
            </span></p>
            <p><strong>Current User:</strong> {healthData.user.username} ({healthData.user.role})</p>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>
            📈 Quick Statistics
          </h3>
          <div style={{ fontSize: '14px' }}>
            <p><strong>Total Students:</strong> {healthData.statistics.totalStudents || 'N/A'}</p>
            <p><strong>Today's Attendance:</strong> {healthData.statistics.todayAttendance || 0}</p>
            <p><strong>Total Users:</strong> {healthData.statistics.totalUsers || 'N/A'}</p>
            <p><strong>Attendance Rate:</strong> {
              healthData.statistics.totalStudents && healthData.statistics.todayAttendance
                ? `${Math.round((healthData.statistics.todayAttendance / healthData.statistics.totalStudents) * 100)}%`
                : 'N/A'
            }</p>
          </div>
        </div>
      </div>

      {/* Feature Status Grid */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#333', marginBottom: '20px' }}>
          🔧 Feature Integration Status
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '15px'
        }}>
          {Object.entries(healthData.features).map(([feature, status]) => (
            <div key={feature} style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: `2px solid ${getStatusColor(status)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                {feature.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span style={{ 
                color: getStatusColor(status),
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {getStatusIcon(status)} {status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Test Results */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ color: '#333', marginBottom: '20px' }}>
          🔄 System Integration Summary
        </h3>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#28a745', marginBottom: '10px' }}>✅ Successfully Integrated Features:</h4>
            <ul style={{ paddingLeft: '20px', color: '#666' }}>
              <li><strong>Authentication System:</strong> Multi-user login with profile management</li>
              <li><strong>Student Management:</strong> 30 students with RFID tags across multiple classes</li>
              <li><strong>RFID Attendance:</strong> Real-time scanning with duplicate prevention</li>
              <li><strong>Manual Attendance:</strong> Click-based marking with status tracking</li>
              <li><strong>Reports System:</strong> Comprehensive data with method tracking</li>
              <li><strong>Profile System:</strong> Picture upload with dynamic navbar display</li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#ffc107', marginBottom: '10px' }}>🔄 Demo Mode Features:</h4>
            <ul style={{ paddingLeft: '20px', color: '#666' }}>
              <li><strong>Facial Recognition:</strong> Simulated processing with mock results</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#17a2b8', marginBottom: '10px' }}>🔗 Data Flow Integration:</h4>
            <p style={{ color: '#666' }}>
              All attendance methods (Manual, RFID, Facial) → Database → Reports → CSV Export
              <br />
              User Authentication → Profile Management → Dynamic UI Updates
              <br />
              RFID System → Student Lookup → Attendance Marking → Real-time Feedback
            </p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={fetchSystemHealth}
          style={{
            padding: '12px 30px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          🔄 Refresh System Status
        </button>
      </div>
    </div>
  );
};

export default SystemStatus;
