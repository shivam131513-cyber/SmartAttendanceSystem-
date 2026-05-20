const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'rural_school_attendance_secret_key';

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        // Allow all Vercel app domains and localhost
        if (
            origin.includes('vercel.app') ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1')
        ) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Initialize SQLite Database
const db = new sqlite3.Database('./attendance.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table (teachers, admins)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        school_id TEXT NOT NULL,
        profile_picture TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
            return;
        }
        
        // Schools table
        db.run(`CREATE TABLE IF NOT EXISTS schools (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            contact_person TEXT,
            phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating schools table:', err);
                return;
            }
            
            // Students table
            db.run(`CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                roll_number TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                class TEXT NOT NULL,
                section TEXT,
                school_id TEXT NOT NULL,
                rfid_tag TEXT,
                photo_path TEXT,
                parent_contact TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (school_id) REFERENCES schools (id)
            )`, (err) => {
                if (err) {
                    console.error('Error creating students table:', err);
                    return;
                }
                
                // Attendance table
                db.run(`CREATE TABLE IF NOT EXISTS attendance (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    date DATE NOT NULL,
                    time_in TIME,
                    time_out TIME,
                    status TEXT NOT NULL,
                    method TEXT NOT NULL,
                    marked_by TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students (id),
                    FOREIGN KEY (marked_by) REFERENCES users (id)
                )`, (err) => {
                    if (err) {
                        console.error('Error creating attendance table:', err);
                        return;
                    }
                    
                    console.log('All database tables created successfully');
                    // Insert default data only after all tables are created
                    insertDefaultData();
                });
            });
        });
    });
}

function insertDefaultData() {
    // Check if data already exists
    db.get('SELECT COUNT(*) as count FROM schools', (err, result) => {
        if (err) {
            console.error('Error checking schools:', err);
            return;
        }
        
        if (result.count > 0) {
            console.log('Default data already exists');
            return;
        }

        // Create default school
        const schoolId = uuidv4();
        db.run(`INSERT INTO schools (id, name, address, contact_person, phone) 
                VALUES (?, ?, ?, ?, ?)`, 
                [schoolId, 'Rural Primary School', 'Village Bharatpur, District Rajkot', 'Principal Sharma', '+91-9876543210'], 
                function(err) {
                    if (err) {
                        console.error('Error inserting school:', err);
                        return;
                    }
                    
                    // Create default admin user - vaibhav
                    const adminId = uuidv4();
                    const hashedPassword = bcrypt.hashSync('vaibhav123', 10);
                    db.run(`INSERT INTO users (id, username, password, role, school_id) 
                            VALUES (?, ?, ?, ?, ?)`, 
                            [adminId, 'vaibhav', hashedPassword, 'admin', schoolId], 
                            function(err) {
                                if (err) console.error('Error inserting admin:', err);
                                else console.log('Admin user vaibhav created successfully');
                            });

                    // Create second admin user - harsh
                    const harshId = uuidv4();
                    const harshPassword = bcrypt.hashSync('harsh-in-making', 10);
                    db.run(`INSERT INTO users (id, username, password, role, school_id) 
                            VALUES (?, ?, ?, ?, ?)`, 
                            [harshId, 'harsh', harshPassword, 'admin', schoolId], 
                            function(err) {
                                if (err) console.error('Error inserting harsh admin:', err);
                                else console.log('Admin user harsh created successfully');
                            });

                    // Create default teacher user
                    const teacherId = uuidv4();
                    const teacherPassword = bcrypt.hashSync('teacher123', 10);
                    db.run(`INSERT INTO users (id, username, password, role, school_id) 
                            VALUES (?, ?, ?, ?, ?)`, 
                            [teacherId, 'teacher', teacherPassword, 'teacher', schoolId], 
                            function(err) {
                                if (err) console.error('Error inserting teacher:', err);
                                else console.log('Teacher user created successfully');
                            });

                    // Insert sample students
                    const students = [
                        // Class 5 - Section A
                        { name: 'Arjun Patel', class: '5', section: 'A', rollNumber: '5A001', rfidTag: 'RFID001' },
                        { name: 'Priya Sharma', class: '5', section: 'A', rollNumber: '5A002', rfidTag: 'RFID002' },
                        { name: 'Ravi Kumar', class: '5', section: 'A', rollNumber: '5A003', rfidTag: 'RFID003' },
                        { name: 'Anita Singh', class: '5', section: 'A', rollNumber: '5A004', rfidTag: 'RFID004' },
                        { name: 'Deepak Gupta', class: '5', section: 'A', rollNumber: '5A005', rfidTag: 'RFID005' },
                        { name: 'Kavya Reddy', class: '5', section: 'A', rollNumber: '5A006', rfidTag: 'RFID006' },
                        
                        // Class 5 - Section B
                        { name: 'Rohit Verma', class: '5', section: 'B', rollNumber: '5B001', rfidTag: 'RFID007' },
                        { name: 'Meera Joshi', class: '5', section: 'B', rollNumber: '5B002', rfidTag: 'RFID008' },
                        { name: 'Amit Yadav', class: '5', section: 'B', rollNumber: '5B003', rfidTag: 'RFID009' },
                        { name: 'Pooja Agarwal', class: '5', section: 'B', rollNumber: '5B004', rfidTag: 'RFID010' },
                        { name: 'Suresh Nair', class: '5', section: 'B', rollNumber: '5B005', rfidTag: 'RFID011' },
                        
                        // Class 4 - Section A
                        { name: 'Rahul Kumar', class: '4', section: 'A', rollNumber: '4A001', rfidTag: 'RFID012' },
                        { name: 'Sneha Gupta', class: '4', section: 'A', rollNumber: '4A002', rfidTag: 'RFID013' },
                        { name: 'Kiran Desai', class: '4', section: 'A', rollNumber: '4A003', rfidTag: 'RFID014' },
                        { name: 'Neha Pandey', class: '4', section: 'A', rollNumber: '4A004', rfidTag: 'RFID015' },
                        { name: 'Vishal Tiwari', class: '4', section: 'A', rollNumber: '4A005', rfidTag: 'RFID016' },
                        { name: 'Divya Mishra', class: '4', section: 'A', rollNumber: '4A006', rfidTag: 'RFID017' },
                        
                        // Class 4 - Section B
                        { name: 'Sanjay Rao', class: '4', section: 'B', rollNumber: '4B001', rfidTag: 'RFID018' },
                        { name: 'Rekha Sinha', class: '4', section: 'B', rollNumber: '4B002', rfidTag: 'RFID019' },
                        { name: 'Manoj Bhatt', class: '4', section: 'B', rollNumber: '4B003', rfidTag: 'RFID020' },
                        { name: 'Sunita Jain', class: '4', section: 'B', rollNumber: '4B004', rfidTag: 'RFID021' },
                        { name: 'Ajay Saxena', class: '4', section: 'B', rollNumber: '4B005', rfidTag: 'RFID022' },
                        
                        // Class 3 - Section A
                        { name: 'Vikram Singh', class: '3', section: 'A', rollNumber: '3A001', rfidTag: 'RFID023' },
                        { name: 'Lakshmi Iyer', class: '3', section: 'A', rollNumber: '3A002', rfidTag: 'RFID024' },
                        { name: 'Harish Chandra', class: '3', section: 'A', rollNumber: '3A003', rfidTag: 'RFID025' },
                        { name: 'Radha Krishna', class: '3', section: 'A', rollNumber: '3A004', rfidTag: 'RFID026' },
                        { name: 'Gopal Sharma', class: '3', section: 'A', rollNumber: '3A005', rfidTag: 'RFID027' },
                        { name: 'Sita Devi', class: '3', section: 'A', rollNumber: '3A006', rfidTag: 'RFID028' },
                        
                        // Class 3 - Section B
                        { name: 'Ramesh Gupta', class: '3', section: 'B', rollNumber: '3B001', rfidTag: 'RFID029' },
                        { name: 'Gita Patel', class: '3', section: 'B', rollNumber: '3B002', rfidTag: 'RFID030' },
                        { name: 'Mukesh Kumar', class: '3', section: 'B', rollNumber: '3B003', rfidTag: 'RFID031' }
                    ];

                    students.forEach(student => {
                        const studentId = uuidv4();
                        db.run(`INSERT INTO students (id, roll_number, name, class, section, school_id, rfid_tag, parent_contact) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                                [studentId, student.rollNumber, student.name, student.class, student.section, schoolId, student.rfidTag, '+91-9876543210'],
                                function(err) {
                                    if (err) console.error('Error inserting student:', err);
                                });
                    });
                    
                    console.log('Default data inserted successfully');
                });
    });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, school_id: user.school_id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                school_id: user.school_id
            }
        });
    });
});

// Get all students
app.get('/api/students', authenticateToken, (req, res) => {
    db.all('SELECT * FROM students WHERE school_id = ? ORDER BY class, section, name', 
           [req.user.school_id], (err, students) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(students);
    });
});

// Upload profile picture
app.post('/api/profile-picture', authenticateToken, upload.single('profilePicture'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const profilePicturePath = req.file.path;
    
    db.run('UPDATE users SET profile_picture = ? WHERE id = ?', 
           [profilePicturePath, req.user.id], 
           function(err) {
               if (err) {
                   return res.status(500).json({ error: 'Failed to update profile picture' });
               }
               
               res.json({ 
                   message: 'Profile picture updated successfully',
                   profilePicture: profilePicturePath
               });
           });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    db.get('SELECT id, username, role, profile_picture FROM users WHERE id = ?', 
           [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    });
});

// Add new student
app.post('/api/students', authenticateToken, upload.single('photo'), (req, res) => {
    const { roll_number, name, class: studentClass, section, parent_contact, rfid_tag } = req.body;
    const studentId = uuidv4();
    const photoPath = req.file ? req.file.path : null;

    db.run(`INSERT INTO students (id, roll_number, name, class, section, school_id, rfid_tag, photo_path, parent_contact) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [studentId, roll_number, name, studentClass, section, req.user.school_id, rfid_tag, photoPath, parent_contact],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to add student' });
                }
                res.json({ message: 'Student added successfully', id: studentId });
            });
});

// Mark attendance
app.post('/api/attendance', authenticateToken, (req, res) => {
    const { student_id, status, method } = req.body;
    const attendanceId = uuidv4();
    const today = moment().format('YYYY-MM-DD');
    const currentTime = moment().format('HH:mm:ss');

    // Check if attendance already exists for today
    db.get('SELECT * FROM attendance WHERE student_id = ? AND date = ?', 
           [student_id, today], (err, existing) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (existing) {
            // Update existing attendance
            const updateField = status === 'present' ? 'time_in' : 'time_out';
            db.run(`UPDATE attendance SET ${updateField} = ?, status = ?, method = ? WHERE id = ?`,
                   [currentTime, status, method, existing.id], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update attendance' });
                }
                res.json({ message: 'Attendance updated successfully' });
            });
        } else {
            // Create new attendance record
            const timeField = status === 'present' ? currentTime : null;
            db.run(`INSERT INTO attendance (id, student_id, date, time_in, status, method, marked_by) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [attendanceId, student_id, today, timeField, status, method, req.user.id],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to mark attendance' });
                        }
                        res.json({ message: 'Attendance marked successfully', id: attendanceId });
                    });
        }
    });
});

// Get attendance for a specific date
app.get('/api/attendance/:date', authenticateToken, (req, res) => {
    const { date } = req.params;
    
    db.all(`SELECT a.*, s.name, s.roll_number, s.class, s.section 
            FROM attendance a 
            JOIN students s ON a.student_id = s.id 
            WHERE a.date = ? AND s.school_id = ?
            ORDER BY s.class, s.section, s.name`, 
           [date, req.user.school_id], (err, attendance) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(attendance);
    });
});

// Get attendance statistics
app.get('/api/stats', authenticateToken, (req, res) => {
    const today = moment().format('YYYY-MM-DD');
    
    // Get total students
    db.get('SELECT COUNT(*) as total FROM students WHERE school_id = ?', 
           [req.user.school_id], (err, totalStudents) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Get today's attendance
        db.get(`SELECT COUNT(*) as present FROM attendance 
                WHERE date = ? AND status = 'present' AND student_id IN 
                (SELECT id FROM students WHERE school_id = ?)`, 
               [today, req.user.school_id], (err, presentToday) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Get this week's average attendance
            const weekStart = moment().startOf('week').format('YYYY-MM-DD');
            db.get(`SELECT AVG(daily_count) as avg_attendance FROM (
                        SELECT COUNT(*) as daily_count FROM attendance 
                        WHERE date >= ? AND status = 'present' AND student_id IN 
                        (SELECT id FROM students WHERE school_id = ?)
                        GROUP BY date
                    )`, 
                   [weekStart, req.user.school_id], (err, weeklyAvg) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                    totalStudents: totalStudents.total,
                    presentToday: presentToday.present,
                    absentToday: totalStudents.total - presentToday.present,
                    weeklyAverage: Math.round(weeklyAvg.avg_attendance || 0),
                    attendanceRate: totalStudents.total > 0 ? 
                        Math.round((presentToday.present / totalStudents.total) * 100) : 0
                });
            });
        });
    });
});

// Mock facial recognition endpoint
app.post('/api/facial-recognition', authenticateToken, upload.single('image'), (req, res) => {
    // Simulate facial recognition processing
    setTimeout(() => {
        // Get random students from database for demo
        db.all('SELECT * FROM students WHERE school_id = ? ORDER BY RANDOM() LIMIT 2', 
               [req.user.school_id], (err, students) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Database error during recognition'
                });
            }

            if (students.length === 0) {
                return res.json({
                    success: false,
                    message: 'No students found for recognition'
                });
            }

            // Mock response with actual student data
            const mockStudents = students.map(student => ({
                id: student.id,
                name: student.name,
                roll_number: student.roll_number,
                class: student.class,
                section: student.section,
                confidence: Math.random() * 0.3 + 0.7 // Random confidence between 0.7-1.0
            }));
            
            res.json({
                success: true,
                recognizedStudents: mockStudents,
                message: 'Facial recognition completed (demo mode)'
            });
        });
    }, 2000); // 2 second delay to simulate processing
});

// RFID attendance marking endpoint
app.post('/api/rfid-scan', authenticateToken, (req, res) => {
    const { rfid_tag } = req.body;
    
    if (!rfid_tag) {
        return res.status(400).json({ error: 'RFID tag is required' });
    }
    
    db.get('SELECT * FROM students WHERE rfid_tag = ? AND school_id = ?', 
           [rfid_tag, req.user.school_id], (err, student) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!student) {
            return res.json({
                success: false,
                message: 'RFID tag not found'
            });
        }

        // Check if attendance already marked today
        const today = moment().format('YYYY-MM-DD');
        db.get('SELECT * FROM attendance WHERE student_id = ? AND date = ?', 
               [student.id, today], (err, existingAttendance) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingAttendance) {
                return res.json({
                    success: false,
                    message: `Attendance already marked for ${student.name} today`,
                    student: student
                });
            }

            // Mark attendance
            const attendanceId = uuidv4();
            const currentTime = moment().format('HH:mm:ss');
            
            db.run(`INSERT INTO attendance (id, student_id, date, time_in, status, method, marked_by) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [attendanceId, student.id, today, currentTime, 'present', 'rfid', req.user.id],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to mark attendance' });
                        }

                        res.json({
                            success: true,
                            message: `Attendance marked successfully for ${student.name}`,
                            student: student,
                            attendance: {
                                id: attendanceId,
                                date: today,
                                time_in: currentTime,
                                status: 'present',
                                method: 'rfid'
                            }
                        });
                    });
        });
    });
});

// System health check endpoint
app.get('/api/health', authenticateToken, (req, res) => {
    const healthCheck = {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        status: 'healthy',
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        },
        database: 'connected',
        features: {
            authentication: 'active',
            studentManagement: 'active',
            attendanceMarking: 'active',
            rfidSystem: 'active',
            facialRecognition: 'demo_mode',
            reports: 'active',
            profileManagement: 'active'
        },
        statistics: {}
    };

    // Get quick stats
    db.get('SELECT COUNT(*) as total FROM students WHERE school_id = ?', 
           [req.user.school_id], (err, studentCount) => {
        if (!err && studentCount) {
            healthCheck.statistics.totalStudents = studentCount.total;
        }

        db.get('SELECT COUNT(*) as total FROM attendance WHERE date = ?', 
               [moment().format('YYYY-MM-DD')], (err, attendanceCount) => {
            if (!err && attendanceCount) {
                healthCheck.statistics.todayAttendance = attendanceCount.total;
            }

            db.get('SELECT COUNT(*) as total FROM users', (err, userCount) => {
                if (!err && userCount) {
                    healthCheck.statistics.totalUsers = userCount.total;
                }

                res.json(healthCheck);
            });
        });
    });
});

// ─── Chatbot Endpoint ───────────────────────────────────────────────────────
app.post('/api/chatbot', authenticateToken, (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: 'Please send a message.' });

    const msg = message.toLowerCase().trim();
    const schoolId = req.user.school_id;
    const today = moment().format('YYYY-MM-DD');

    // ── Intent: weekly trend ────────────────────────────────────────────────
    if (/week|trend|7 day|seven day|daily average|this week/i.test(msg)) {
        const weekStart = moment().subtract(6, 'days').format('YYYY-MM-DD');
        db.all(`
            SELECT a.date, COUNT(*) as present_count
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.date >= ? AND a.status = 'present' AND s.school_id = ?
            GROUP BY a.date
            ORDER BY a.date ASC
        `, [weekStart, schoolId], (err, rows) => {
            if (err) return res.json({ reply: '⚠️ Sorry, I had trouble fetching the weekly data.' });
            if (rows.length === 0) return res.json({ reply: '📈 No attendance data found for the past 7 days.' });
            const lines = rows.map(r => `• ${moment(r.date).format('ddd MMM D')}: ${r.present_count} present`).join('\n');
            const avg = (rows.reduce((s, r) => s + r.present_count, 0) / rows.length).toFixed(1);
            res.json({ reply: `📈 *Last 7-Day Attendance Trend:*\n${lines}\n\n📊 Average: ${avg} students/day` });
        });
        return;
    }

    // ── Intent: student lookup ───────────────────────────────────────────────
    const studentMatch = msg.match(/(?:is|check|find|status of|did)\s+([a-z\s]{3,30})(?:\s+present|\s+absent|\s+come|\s+attend|[?]|$)/i);
    if (studentMatch) {
        const namePart = studentMatch[1].trim();
        db.get(`
            SELECT s.name, s.class, s.section,
                   a.status, a.time_in
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
            WHERE s.school_id = ? AND LOWER(s.name) LIKE ?
            LIMIT 1
        `, [today, schoolId, `%${namePart}%`], (err, row) => {
            if (err) return res.json({ reply: '⚠️ Error looking up student.' });
            if (!row) return res.json({ reply: `🔍 I couldn't find any student matching *"${namePart}"*. Please check the name.` });
            if (!row.status) return res.json({ reply: `📋 *${row.name}* (Class ${row.class}${row.section}) — No attendance recorded yet today.` });
            if (row.status === 'present') {
                const timeStr = row.time_in ? ` at ${moment(row.time_in, 'HH:mm:ss').format('hh:mm A')}` : '';
                return res.json({ reply: `✅ *${row.name}* (Class ${row.class}${row.section}) is **PRESENT** today${timeStr}.` });
            }
            res.json({ reply: `❌ *${row.name}* (Class ${row.class}${row.section}) is **ABSENT** today.` });
        });
        return;
    }

    // ── Intent: late arrivals ───────────────────────────────────────────────
    if (/late|after 9|after nine|slow|delay/i.test(msg)) {
        db.all(`
            SELECT s.name, s.class, s.section, a.time_in
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.date = ? AND a.status = 'present' AND a.time_in >= '09:00:00' AND s.school_id = ?
            ORDER BY a.time_in ASC
        `, [today, schoolId], (err, rows) => {
            if (err) return res.json({ reply: '⚠️ Error fetching late arrivals.' });
            if (rows.length === 0) return res.json({ reply: '⏰ No late arrivals today! Everyone who came was on time (before 9:00 AM).' });
            const lines = rows.map(r => `• ${r.name} (Class ${r.class}${r.section}) — ${moment(r.time_in, 'HH:mm:ss').format('hh:mm A')}`).join('\n');
            res.json({ reply: `⏰ *Late Arrivals Today (after 9:00 AM):*\n${lines}` });
        });
        return;
    }

    // ── Intent: class-specific report ────────────────────────────────────────
    const classMatch = msg.match(/class\s*([3-9]|10)/i);
    if (classMatch) {
        const cls = classMatch[1];
        db.all(`
            SELECT s.section,
                   COUNT(DISTINCT s.id) as total,
                   SUM(CASE WHEN a.status = 'present' AND a.date = ? THEN 1 ELSE 0 END) as present
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
            WHERE s.school_id = ? AND s.class = ?
            GROUP BY s.section
            ORDER BY s.section
        `, [today, today, schoolId, cls], (err, rows) => {
            if (err) return res.json({ reply: '⚠️ Error fetching class data.' });
            if (rows.length === 0) return res.json({ reply: `🔍 No students found in Class ${cls}.` });
            const lines = rows.map(r => `• Section ${r.section}: ${r.present}/${r.total} present`).join('\n');
            const totalP = rows.reduce((s, r) => s + r.present, 0);
            const totalS = rows.reduce((s, r) => s + r.total, 0);
            res.json({ reply: `📚 *Class ${cls} Attendance Today:*\n${lines}\n\n📊 Total: ${totalP}/${totalS} present` });
        });
        return;
    }

    // ── Intent: chronic absentees / who misses most ──────────────────────────
    if (/chronic|miss|skip|bunk|frequent|most absent|often absent/i.test(msg)) {
        db.all(`
            SELECT s.name, s.class, s.section, COUNT(a.id) as absent_count
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.status = 'absent'
            WHERE s.school_id = ?
            GROUP BY s.id
            ORDER BY absent_count DESC
            LIMIT 5
        `, [schoolId], (err, rows) => {
            if (err) return res.json({ reply: '⚠️ Error fetching absentee data.' });
            if (!rows || rows[0].absent_count === 0) return res.json({ reply: '🎉 Great news! No chronic absentees found.' });
            const lines = rows.filter(r => r.absent_count > 0).map((r, i) => `${i + 1}. ${r.name} (Class ${r.class}${r.section}) — ${r.absent_count} absences`).join('\n');
            res.json({ reply: `⚠️ *Top Absentees (All Time):*\n${lines}` });
        });
        return;
    }

    // ── Intent: who is absent today (list) ──────────────────────────────────
    if (/who.*absent|absent.*list|absent.*student|list.*absent|name.*absent/i.test(msg)) {
        db.all(`
            SELECT s.name, s.class, s.section
            FROM students s
            WHERE s.school_id = ? AND s.id NOT IN (
                SELECT student_id FROM attendance WHERE date = ? AND status = 'present'
            )
            ORDER BY s.class, s.section, s.name
        `, [schoolId, today], (err, rows) => {
            if (err) return res.json({ reply: '⚠️ Error fetching absent students.' });
            if (rows.length === 0) return res.json({ reply: '🎉 Wow! All students are present today!' });
            const lines = rows.slice(0, 15).map(r => `• ${r.name} (Class ${r.class}${r.section})`).join('\n');
            const more = rows.length > 15 ? `\n...and ${rows.length - 15} more.` : '';
            res.json({ reply: `❌ *Absent Today (${rows.length} students):*\n${lines}${more}` });
        });
        return;
    }

    // ── Intent: who is present today (list) ─────────────────────────────────
    if (/who.*present|present.*list|present.*student|list.*present|name.*present/i.test(msg)) {
        db.all(`
            SELECT s.name, s.class, s.section, a.time_in
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.date = ? AND a.status = 'present' AND s.school_id = ?
            ORDER BY s.class, s.section, s.name
        `, [today, schoolId], (err, rows) => {
            if (err) return res.json({ reply: '⚠️ Error fetching present students.' });
            if (rows.length === 0) return res.json({ reply: `📋 No students have been marked present yet today (${moment().format('MMM D, YYYY')}).` });
            const lines = rows.slice(0, 15).map(r => `• ${r.name} (Class ${r.class}${r.section})`).join('\n');
            const more = rows.length > 15 ? `\n...and ${rows.length - 15} more.` : '';
            res.json({ reply: `✅ *Present Today (${rows.length} students):*\n${lines}${more}` });
        });
        return;
    }

    // ── Intent: absent count ─────────────────────────────────────────────────
    if (/absent|how many.*not|missing|didn.*come|not.*come/i.test(msg)) {
        db.get('SELECT COUNT(*) as total FROM students WHERE school_id = ?', [schoolId], (err, total) => {
            if (err) return res.json({ reply: '⚠️ Error fetching data.' });
            db.get(`SELECT COUNT(*) as present FROM attendance WHERE date = ? AND status = 'present' AND student_id IN (SELECT id FROM students WHERE school_id = ?)`, [today, schoolId], (err2, present) => {
                if (err2) return res.json({ reply: '⚠️ Error fetching data.' });
                const absent = total.total - present.present;
                const rate = total.total > 0 ? ((present.present / total.total) * 100).toFixed(1) : 0;
                res.json({ reply: `❌ *Absent Today:* ${absent} out of ${total.total} students (${(100 - rate).toFixed(1)}% absent)\n✅ Present: ${present.present} students\n📊 Attendance Rate: ${rate}%\n📅 Date: ${moment().format('MMMM Do, YYYY')}` });
            });
        });
        return;
    }

    // ── Intent: attendance rate / percentage ────────────────────────────────
    if (/rate|percent|%|ratio|score/i.test(msg)) {
        db.get('SELECT COUNT(*) as total FROM students WHERE school_id = ?', [schoolId], (err, total) => {
            if (err) return res.json({ reply: '⚠️ Error.' });
            db.get(`SELECT COUNT(*) as present FROM attendance WHERE date = ? AND status = 'present' AND student_id IN (SELECT id FROM students WHERE school_id = ?)`, [today, schoolId], (err2, present) => {
                if (err2) return res.json({ reply: '⚠️ Error.' });
                const rate = total.total > 0 ? ((present.present / total.total) * 100).toFixed(1) : 0;
                const emoji = rate >= 90 ? '🌟' : rate >= 75 ? '✅' : rate >= 60 ? '⚠️' : '❌';
                res.json({ reply: `${emoji} *Today's Attendance Rate: ${rate}%*\n✅ Present: ${present.present}\n❌ Absent: ${total.total - present.present}\n👥 Total Students: ${total.total}\n📅 ${moment().format('MMMM Do, YYYY')}` });
            });
        });
        return;
    }

    // ── Intent: present count (default numbers question) ────────────────────
    if (/present|how many|count|total.*today|today.*count|attendance today|came|showed up/i.test(msg)) {
        db.get('SELECT COUNT(*) as total FROM students WHERE school_id = ?', [schoolId], (err, total) => {
            if (err) return res.json({ reply: '⚠️ Error fetching student count.' });
            db.get(`SELECT COUNT(*) as present FROM attendance WHERE date = ? AND status = 'present' AND student_id IN (SELECT id FROM students WHERE school_id = ?)`, [today, schoolId], (err2, present) => {
                if (err2) return res.json({ reply: '⚠️ Error fetching attendance.' });
                const rate = total.total > 0 ? ((present.present / total.total) * 100).toFixed(1) : 0;
                res.json({ reply: `📊 *Today's Attendance — ${moment().format('MMMM Do, YYYY')}*\n✅ Present: ${present.present} students\n❌ Absent: ${total.total - present.present} students\n👥 Total: ${total.total} students\n📈 Rate: ${rate}%` });
            });
        });
        return;
    }

    // ── Intent: help / what can you do ──────────────────────────────────────
    if (/help|what can|what do|how to use|guide|commands|options/i.test(msg)) {
        return res.json({ reply: `🤖 *I can answer questions like:*\n\n• "How many students are present today?"\n• "Who is absent today?"\n• "Show me class 5 attendance"\n• "Is Arjun Patel present?"\n• "Show weekly trend"\n• "Who came late today?"\n• "Who misses school the most?"\n• "What is the attendance rate?"\n\nJust ask naturally! 😊` });
    }

    // ── Fallback ─────────────────────────────────────────────────────────────
    res.json({ reply: `🤔 I'm not sure how to answer that. Try asking:\n• "How many present today?"\n• "Who is absent?"\n• "Class 5 attendance"\n• "Weekly trend"\n\nOr type *help* to see all I can do!` });
});

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Default login credentials:');
    console.log('Admin - Username: vaibhav, Password: vaibhav123');
    console.log('Admin - Username: harsh, Password: harsh-in-making');
    console.log('Teacher - Username: teacher, Password: teacher123');
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
