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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Schools table
    db.run(`CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        contact_person TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

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
    )`);

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
    )`);

    // Insert default data
    insertDefaultData();
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
                    
                    // Create default admin user
                    const adminId = uuidv4();
                    const hashedPassword = bcrypt.hashSync('admin123', 10);
                    db.run(`INSERT INTO users (id, username, password, role, school_id) 
                            VALUES (?, ?, ?, ?, ?)`, 
                            [adminId, 'admin', hashedPassword, 'admin', schoolId], 
                            function(err) {
                                if (err) console.error('Error inserting admin:', err);
                                else console.log('Admin user created successfully');
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
                        { name: 'Arjun Patel', class: '5', section: 'A', rollNumber: '5A001' },
                        { name: 'Priya Sharma', class: '5', section: 'A', rollNumber: '5A002' },
                        { name: 'Rahul Kumar', class: '4', section: 'B', rollNumber: '4B001' },
                        { name: 'Sneha Gupta', class: '4', section: 'B', rollNumber: '4B002' },
                        { name: 'Vikram Singh', class: '3', section: 'A', rollNumber: '3A001' }
                    ];

                    students.forEach(student => {
                        const studentId = uuidv4();
                        db.run(`INSERT INTO students (id, roll_number, name, class, section, school_id, parent_contact) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                                [studentId, student.rollNumber, student.name, student.class, student.section, schoolId, '+91-9876543210'],
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

// Mock RFID scan endpoint
app.post('/api/rfid-scan', authenticateToken, (req, res) => {
    const { rfid_tag } = req.body;
    
    db.get('SELECT * FROM students WHERE rfid_tag = ? AND school_id = ?', 
           [rfid_tag, req.user.school_id], (err, student) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (student) {
            res.json({
                success: true,
                student: student,
                message: 'Student identified successfully'
            });
        } else {
            res.json({
                success: false,
                message: 'RFID tag not found'
            });
        }
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
    console.log('Admin - Username: admin, Password: admin123');
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
