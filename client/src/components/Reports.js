import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const Reports = ({ user }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD')
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('daily');

  useEffect(() => {
    fetchReportData();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, reportType]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (reportType === 'daily') {
        const response = await axios.get(`/api/attendance/${selectedDate}`);
        setAttendanceData(response.data);
      } else {
        // For weekly/monthly reports, we'll fetch multiple days
        const dates = [];
        const start = moment(dateRange.startDate);
        const end = moment(dateRange.endDate);
        
        while (start.isSameOrBefore(end)) {
          dates.push(start.format('YYYY-MM-DD'));
          start.add(1, 'day');
        }
        
        const promises = dates.map(date => 
          axios.get(`/api/attendance/${date}`).catch(() => ({ data: [] }))
        );
        
        const responses = await Promise.all(promises);
        const allData = responses.flatMap(response => response.data);
        setAttendanceData(allData);
      }
    } catch (error) {
      setError('Failed to load report data');
      console.error('Report fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSummaryReport = () => {
    if (!attendanceData.length) return null;

    const summary = attendanceData.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = { present: 0, absent: 0, total: 0 };
      }
      
      if (record.status === 'present') {
        acc[date].present++;
      } else {
        acc[date].absent++;
      }
      acc[date].total++;
      
      return acc;
    }, {});

    return Object.entries(summary).map(([date, data]) => ({
      date,
      ...data,
      percentage: Math.round((data.present / data.total) * 100)
    }));
  };

  const getClassWiseReport = () => {
    if (!attendanceData.length) return [];

    const classData = attendanceData.reduce((acc, record) => {
      const classKey = `${record.class}${record.section || ''}`;
      if (!acc[classKey]) {
        acc[classKey] = { 
          class: record.class, 
          section: record.section || '', 
          present: 0, 
          absent: 0, 
          total: 0 
        };
      }
      
      if (record.status === 'present') {
        acc[classKey].present++;
      } else {
        acc[classKey].absent++;
      }
      acc[classKey].total++;
      
      return acc;
    }, {});

    return Object.values(classData).map(data => ({
      ...data,
      percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
    }));
  };

  const exportToCSV = () => {
    let dataToExport = attendanceData;
    
    // If no real data, create mock data for demo
    if (!dataToExport.length) {
      console.log('No attendance data found, creating mock data for CSV export demo');
      dataToExport = [
        {
          date: moment().format('YYYY-MM-DD'),
          name: 'Arjun Patel',
          roll_number: '5A001',
          class: '5',
          section: 'A',
          status: 'present',
          time_in: '09:15:00',
          method: 'manual'
        },
        {
          date: moment().format('YYYY-MM-DD'),
          name: 'Priya Sharma',
          roll_number: '5A002',
          class: '5',
          section: 'A',
          status: 'present',
          time_in: '09:20:00',
          method: 'facial'
        },
        {
          date: moment().format('YYYY-MM-DD'),
          name: 'Rahul Kumar',
          roll_number: '4B001',
          class: '4',
          section: 'B',
          status: 'absent',
          time_in: '',
          method: 'manual'
        },
        {
          date: moment().format('YYYY-MM-DD'),
          name: 'Sneha Gupta',
          roll_number: '4B002',
          class: '4',
          section: 'B',
          status: 'present',
          time_in: '09:10:00',
          method: 'rfid'
        },
        {
          date: moment().format('YYYY-MM-DD'),
          name: 'Vikram Singh',
          roll_number: '3A001',
          class: '3',
          section: 'A',
          status: 'present',
          time_in: '09:25:00',
          method: 'facial'
        }
      ];
    }

    const headers = ['Date', 'Student Name', 'Roll Number', 'Class', 'Section', 'Status', 'Time In', 'Method'];
    const csvData = [
      headers.join(','),
      ...dataToExport.map(record => [
        record.date,
        `"${record.name}"`,
        record.roll_number,
        record.class,
        record.section || '',
        record.status,
        record.time_in || '',
        record.method
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${selectedDate}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('CSV export completed');
    alert(`CSV file downloaded successfully!\nFile: attendance_report_${selectedDate}.csv\nRecords: ${dataToExport.length}`);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    const reportHtml = `
      <html>
        <head>
          <title>Attendance Report - ${selectedDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏫 Rural School Attendance Report</h1>
            <p>Date: ${moment(selectedDate).format('MMMM Do, YYYY')}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <h3>${stats?.presentToday || 0}</h3>
              <p>Present</p>
            </div>
            <div class="stat">
              <h3>${stats?.absentToday || 0}</h3>
              <p>Absent</p>
            </div>
            <div class="stat">
              <h3>${stats?.attendanceRate || 0}%</h3>
              <p>Attendance Rate</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Status</th>
                <th>Time In</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              ${attendanceData.map(record => `
                <tr>
                  <td>${record.roll_number}</td>
                  <td>${record.name}</td>
                  <td>${record.class}${record.section || ''}</td>
                  <td>${record.status}</td>
                  <td>${record.time_in || '-'}</td>
                  <td>${record.method}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            Generated on ${moment().format('MMMM Do, YYYY [at] HH:mm')} by Rural School Attendance System
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.print();
  };

  const classWiseData = getClassWiseReport();

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>
          📊 Reports & Analytics
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          View attendance reports and generate insights
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Report Controls */}
      <div className="card">
        <h2 style={{ marginBottom: '20px', color: '#333' }}>🔧 Report Settings</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div className="form-group">
            <label>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="form-control"
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>

          {reportType === 'daily' ? (
            <div className="form-group">
              <label>Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={moment().format('YYYY-MM-DD')}
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  max={moment().format('YYYY-MM-DD')}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  max={moment().format('YYYY-MM-DD')}
                />
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchReportData}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔍 Generate Report'}
          </button>
          <button
            onClick={() => {
              // Generate mock attendance data for testing
              const mockData = [
                {
                  date: selectedDate,
                  name: 'Arjun Patel',
                  roll_number: '5A001',
                  class: '5',
                  section: 'A',
                  status: 'present',
                  time_in: '09:15:00',
                  method: 'manual'
                },
                {
                  date: selectedDate,
                  name: 'Priya Sharma',
                  roll_number: '5A002',
                  class: '5',
                  section: 'A',
                  status: 'present',
                  time_in: '09:20:00',
                  method: 'facial'
                },
                {
                  date: selectedDate,
                  name: 'Rahul Kumar',
                  roll_number: '4B001',
                  class: '4',
                  section: 'B',
                  status: 'absent',
                  time_in: '',
                  method: 'manual'
                },
                {
                  date: selectedDate,
                  name: 'Sneha Gupta',
                  roll_number: '4B002',
                  class: '4',
                  section: 'B',
                  status: 'present',
                  time_in: '09:10:00',
                  method: 'rfid'
                },
                {
                  date: selectedDate,
                  name: 'Vikram Singh',
                  roll_number: '3A001',
                  class: '3',
                  section: 'A',
                  status: 'present',
                  time_in: '09:25:00',
                  method: 'facial'
                }
              ];
              setAttendanceData(mockData);
              alert('Demo attendance data loaded! Now you can test CSV export and print features.');
            }}
            className="btn btn-info"
            style={{ fontSize: '0.9rem' }}
          >
            🧪 Load Demo Data
          </button>
          <button
            onClick={exportToCSV}
            className="btn btn-success"
            title={!attendanceData.length ? 'Will export demo data since no real data is available' : 'Export current attendance data'}
          >
            📊 Export CSV {!attendanceData.length && '(Demo)'}
          </button>
          <button
            onClick={printReport}
            className="btn btn-secondary"
            disabled={!attendanceData.length}
          >
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      {stats && (
        <div className="card">
          <h2 style={{ marginBottom: '20px', color: '#333' }}>📈 Summary Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="stat-number">{stats.totalStudents}</div>
              <div className="stat-label">Total Students</div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <div className="stat-number">{stats.presentToday}</div>
              <div className="stat-label">Present Today</div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <div className="stat-number">{stats.weeklyAverage}</div>
              <div className="stat-label">Weekly Average</div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <div className="stat-number">{stats.attendanceRate}%</div>
              <div className="stat-label">Attendance Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Class-wise Report */}
      {classWiseData.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: '20px', color: '#333' }}>🏫 Class-wise Attendance</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Class</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Present</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Absent</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Total</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {classWiseData.map((classData, index) => (
                  <tr key={index}>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      Class {classData.class}{classData.section}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', color: '#2e7d32' }}>
                      {classData.present}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', color: '#c62828' }}>
                      {classData.absent}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {classData.total}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      border: '1px solid #ddd', 
                      textAlign: 'center',
                      color: classData.percentage >= 75 ? '#2e7d32' : classData.percentage >= 50 ? '#f57c00' : '#c62828'
                    }}>
                      {classData.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Attendance Report */}
      <div className="card">
        <h2 style={{ marginBottom: '20px', color: '#333' }}>📋 Detailed Attendance Report</h2>
        
        {loading ? (
          <div className="loading">Loading report data...</div>
        ) : attendanceData.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📊</div>
            <h3>No attendance data found</h3>
            <p>Select a different date or ensure attendance has been marked</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Roll No.</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Student Name</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Class</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Time In</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Method</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((record, index) => (
                  <tr key={index} style={{ 
                    backgroundColor: record.status === 'present' ? '#f1f8e9' : '#ffebee' 
                  }}>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {moment(record.date).format('MMM DD, YYYY')}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {record.roll_number}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {record.name}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {record.class}{record.section}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      border: '1px solid #ddd', 
                      textAlign: 'center',
                      color: record.status === 'present' ? '#2e7d32' : '#c62828',
                      fontWeight: '500'
                    }}>
                      {record.status === 'present' ? '✅ Present' : '❌ Absent'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {record.time_in || '-'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        backgroundColor: record.method === 'manual' ? '#e3f2fd' : 
                                        record.method === 'facial' ? '#f3e5f5' : '#e8f5e8',
                        color: record.method === 'manual' ? '#1565c0' : 
                               record.method === 'facial' ? '#7b1fa2' : '#2e7d32'
                      }}>
                        {record.method}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Government Reporting */}
      <div className="card" style={{ backgroundColor: '#fff3cd' }}>
        <h3 style={{ color: '#856404', marginBottom: '15px' }}>🏛️ Government Reporting</h3>
        <div style={{ fontSize: '0.9rem', color: '#856404', lineHeight: '1.6' }}>
          <p>This system helps maintain accurate records for government schemes:</p>
          <ul style={{ marginLeft: '20px' }}>
            <li><strong>Mid-day Meal Scheme:</strong> Daily attendance for meal planning</li>
            <li><strong>Sarva Shiksha Abhiyan:</strong> Student enrollment and attendance tracking</li>
            <li><strong>State Education Reports:</strong> Monthly and annual attendance statistics</li>
            <li><strong>ASER Compliance:</strong> Data for Annual Status of Education Report</li>
          </ul>
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#fff', 
            borderRadius: '4px',
            border: '1px solid #ffc107'
          }}>
            <strong>📋 Export formats available:</strong> CSV for Excel, PDF for printing, and JSON for digital systems
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
