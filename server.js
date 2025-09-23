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
app.use(cors());
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
