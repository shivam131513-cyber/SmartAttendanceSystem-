import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = moment().format('YYYY-MM-DD');
      
      const [statsResponse, attendanceResponse] = await Promise.all([
        axios.get('/api/stats'),
        axios.get(`/api/attendance/${today}`)
      ]);

      setStats(statsResponse.data);
      setTodayAttendance(attendanceResponse.data);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>
          📊 Dashboard
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Welcome to the Rural School Attendance System - {moment().format('MMMM Do, YYYY')}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="stat-number">{stats?.totalStudents || 0}</div>
          <div className="stat-label">Total Students</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <div className="stat-number">{stats?.presentToday || 0}</div>
          <div className="stat-label">Present Today</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <div className="stat-number">{stats?.absentToday || 0}</div>
          <div className="stat-label">Absent Today</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <div className="stat-number">{stats?.attendanceRate || 0}%</div>
          <div className="stat-label">Attendance Rate</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 style={{ marginBottom: '20px', color: '#333' }}>🚀 Quick Actions</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/attendance'}
            style={{ 
              padding: '15px', 
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            📝 Mark Attendance
          </button>
          
          {user.role === 'admin' && (
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.href = '/students'}
              style={{ 
                padding: '15px', 
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              👥 Manage Students
            </button>
          )}
          
          <button 
            className="btn btn-success"
            onClick={() => window.location.href = '/reports'}
            style={{ 
              padding: '15px', 
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            📊 View Reports
          </button>
        </div>
      </div>

      {/* Today's Attendance Overview */}
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#333', margin: 0 }}>📅 Today's Attendance</h2>
          <button 
            onClick={fetchDashboardData}
            className="btn btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            🔄 Refresh
          </button>
        </div>

        {todayAttendance.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📋</div>
            <h3>No attendance marked yet today</h3>
            <p>Start marking attendance to see students here</p>
          </div>
        ) : (
          <div className="attendance-grid">
            {todayAttendance.map((record) => (
              <div 
                key={record.id} 
                className={`student-card ${record.status === 'absent' ? 'absent' : ''}`}
              >
                <div className="student-info">
                  <div>
                    <div className="student-name">{record.name}</div>
                    <div className="student-details">
                      Class {record.class}{record.section} • Roll: {record.roll_number}
                    </div>
                  </div>
                  <span className={`attendance-status ${record.status === 'present' ? 'status-present' : 'status-absent'}`}>
                    {record.status === 'present' ? '✅ Present' : '❌ Absent'}
                  </span>
                </div>
                {record.time_in && (
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    Time In: {record.time_in}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                  Method: {record.method} • {moment(record.created_at).format('HH:mm')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>ℹ️ System Information</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '15px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <div>
            <strong>School:</strong> Rural Primary School
          </div>
          <div>
            <strong>Location:</strong> Village Bharatpur, District Rajkot
          </div>
          <div>
            <strong>Contact:</strong> +91-9876543210
          </div>
          <div>
            <strong>System Version:</strong> v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
