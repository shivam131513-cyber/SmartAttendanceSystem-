import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import './darkmode.css';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AttendanceMarking from './components/AttendanceMarking';
import StudentManagement from './components/StudentManagement';
import Reports from './components/Reports';
import SystemStatus from './components/SystemStatus';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';

// Set up axios defaults
axios.defaults.baseURL = process.env.NODE_ENV === 'production'
  ? (process.env.REACT_APP_API_URL || '')
  : 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Apply / remove dark-mode class on <body>
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  if (loading) {
    return (
      <div className="loading" style={{ height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {user && (
          <Navbar
            user={user}
            onLogout={handleLogout}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}

        <main className="main-content">
          <Routes>
            <Route
              path="/login"
              element={
                user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
              }
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/attendance"
              element={user ? <AttendanceMarking user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/students"
              element={user ? <StudentManagement user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/reports"
              element={user ? <Reports user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/system-status"
              element={user ? <SystemStatus user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>

        {user && <Chatbot user={user} />}
      </div>
    </Router>
  );
}

export default App;
