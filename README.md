# 🏫 Rural School Attendance System

> A comprehensive, automated attendance tracking system designed specifically for rural schools in India. Combines **manual marking**, **facial recognition (AI-powered)**, **RFID scanning**, and a built-in **AI chatbot assistant** — all wrapped in a modern, responsive interface with **full dark mode support**.

---

## 🎯 Problem Statement

Many rural schools in India still rely on manual attendance systems, which are:
- Time-consuming and prone to human error
- Reducing instructional time for teachers
- Causing inaccuracies in government reporting
- Affecting resource allocation for schemes like mid-day meals

This system addresses these challenges across **50%+ of rural schools**, impacting millions of students and teachers daily.

---

## ✨ Features

### 🔐 Authentication & User Management
- Multi-role login system: **Admin** and **Teacher** roles
- JWT-based secure session management (24-hour tokens)
- **Profile management** with photo upload support
- Role-based access control (students page for admins only)

### 📝 Attendance Tracking — 3 Methods
| Method | Description |
|---|---|
| ✋ **Manual** | Click Present / Absent for each student in a grid view |
| 📷 **Facial Recognition** | Live camera using `face-api.js` for real AI face detection |
| 🏷️ **RFID** | Enter or scan RFID tags; instant lookup with duplicate prevention |

### 👥 Student Management (Admin only)
- Add students with name, roll number, class/section, parent contact, RFID tag, and photo
- **30 pre-loaded sample students** across Classes 3–5, Sections A & B
- Auto-generate random RFID tags
- View full student list with all details

### 📊 Reports & Analytics
- **Daily reports** by date with per-student breakdown
- **Weekly / Monthly** range reports
- **Class-wise** attendance summary table
- **Export to CSV** (real or demo data)
- **Print reports** directly from the browser
- Government scheme compliance notes (ASER, SSA, Mid-Day Meal)

### 🤖 AI Attendance Chatbot
- Floating chatbot widget (bottom-right) on all authenticated pages
- **Live database queries** — no hardcoded data
- Can answer:
  - "How many students are present today?"
  - "Who is absent today?"
  - "Is Arjun Patel present?"
  - "Show Class 5 attendance"
  - "Weekly trend for the past 7 days"
  - "Who came late today?"
  - "Who are chronic absentees?"
  - "What is the attendance rate?"
- Suggestion chips for quick queries
- Typing indicator animation

### 🌙 Dark Mode
- Toggle between **Light** and **Dark** themes at any time
- Accessible from the **navbar** (🌙/☀️ button) and the **login page**
- Preference **persisted** in `localStorage` — survives page refreshes
- Smooth 0.3s CSS transitions across all elements:
  - Background, cards, tables, forms, chatbot, stat cards, banners

### 📱 Responsive & Mobile-Friendly
- **Sticky navbar** with hamburger menu (☰) on screens ≤ 768px
- Mobile dropdown closes automatically on navigation
- Grid layouts collapse to single-column on small screens

### 🏥 System Status Dashboard (Admin only)
- Real-time health check of all subsystems
- Feature integration status (Authentication, RFID, Reports, etc.)
- Quick statistics: total students, today's attendance, total users
- Auto-refreshes every 30 seconds

---

## 🛠️ Technology Stack

### Frontend (`/client`)
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| React Router DOM | 6.8 | Client-side routing |
| Axios | 1.3 | API communication |
| face-api.js | 0.22 | Real-time facial recognition |
| react-webcam | 7.0 | Camera access |
| Moment.js | 2.29 | Date/time formatting |
| Recharts | 2.5 | Charts & analytics |
| Material-UI | 5.11 | Icon components |
| Vanilla CSS | — | All custom styling (no Tailwind) |

### Backend (`/server.js`)
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 14+ | Server runtime |
| Express.js | 4.18 | Web framework |
| SQLite3 | 5.1 | Lightweight local database |
| bcryptjs | 2.4 | Password hashing |
| jsonwebtoken | 9.0 | JWT authentication |
| Multer | 1.4 | File/photo upload handling |
| Moment.js | 2.29 | Date formatting in queries |
| uuid | 9.0 | Unique ID generation |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14 or higher
- **npm** package manager
- A modern web browser (Chrome recommended for camera access)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/harshgupta372/SmartAttendanceSystem.git
   cd SmartAttendanceSystem
   ```

2. **Install server dependencies**
   ```bash
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Start the development server** (runs both backend + frontend)
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `vaibhav` | `vaibhav123` |
| Admin | `harsh` | `harsh-in-making` |
| Teacher | `teacher` | `teacher123` |

> 💡 **Tip:** On the login page, click the **"Use"** button next to any credential to auto-fill it.

---

## 📱 Usage Guide

### For Administrators
1. Login with an admin account
2. **Dashboard** → Overview of today's attendance stats and quick actions
3. **Students** → Add/view students, assign RFID tags, upload photos
4. **Mark Attendance** → Choose Manual, Facial Recognition, or RFID method
5. **Reports** → Generate daily/weekly/monthly reports, export CSV, print
6. **System Status** → Monitor subsystem health in real-time
7. **Chatbot** → Ask natural-language questions about attendance (bottom-right 💬)

### For Teachers
1. Login with teacher account
2. **Mark Attendance** → Select method and mark students
3. **Reports** → View and export attendance data
4. **Dashboard** → Check today's statistics
5. **Chatbot** → Quick queries like "who is absent today?"

### Attendance Methods — How to Use

#### ✋ Manual
- Go to **Mark Attendance → Manual**
- All students load in a card grid
- Click **✅ Present** or **❌ Absent** for each student
- Status updates instantly with confirmation

#### 📷 Facial Recognition
- Click **📹 Start Camera** to activate webcam
- The AI (face-api.js) detects faces in real time
- Recognized students appear in a results list
- Click **✅ Mark Present** per student, or **Mark All Present**

#### 🏷️ RFID
- Type or scan an RFID tag number into the input field
- Press **Enter** or click the submit button
- Instant lookup → marks student present with timestamp
- Duplicate attendance for the same day is prevented automatically

**Sample RFID tags for testing:**

| RFID Tag | Student | Roll No. |
|---|---|---|
| `RFID001` | Arjun Patel | 5A001 |
| `RFID002` | Priya Sharma | 5A002 |
| `RFID007` | Rohit Verma | 5B001 |
| `RFID012` | Rahul Kumar | 4A001 |
| `RFID023` | Vikram Singh | 3A001 |
| `RFID030` | Gita Patel | 3B002 |

---

## 📊 Pre-loaded Sample Data

The database is auto-seeded on first run with:

**School:**
- Name: Rural Primary School
- Location: Village Bharatpur, District Rajkot
- Contact: +91-9876543210

**30 Students across Classes 3–5:**

| Class | Section | Students |
|---|---|---|
| Class 5 | A | Arjun Patel, Priya Sharma, Ravi Kumar, Anita Singh, Deepak Gupta, Kavya Reddy |
| Class 5 | B | Rohit Verma, Meera Joshi, Amit Yadav, Pooja Agarwal, Suresh Nair |
| Class 4 | A | Rahul Kumar, Sneha Gupta, Kiran Desai, Neha Pandey, Vishal Tiwari, Divya Mishra |
| Class 4 | B | Sanjay Rao, Rekha Sinha, Manoj Bhatt, Sunita Jain, Ajay Saxena |
| Class 3 | A | Vikram Singh, Lakshmi Iyer, Harish Chandra, Radha Krishna, Gopal Sharma, Sita Devi |
| Class 3 | B | Ramesh Gupta, Gita Patel, Mukesh Kumar |

---

## 🌙 Dark Mode

Dark mode can be toggled from **two places**:

1. **Navbar** — click the 🌙 / ☀️ button (visible on all authenticated pages)
2. **Login page** — floating toggle button in the top-right corner

The preference is automatically saved and restored on next visit.

**Dark palette used:**
- Page background: `#0f1117`
- Card background: `#1a1d2e`
- Input background: `#252840`
- Text: `#e2e8f0`

---

## 🔧 Configuration

### Environment
The app runs in development mode using `concurrently` — no `.env` file is required for local use.

| Config | Value |
|---|---|
| Backend port | `5000` |
| Frontend port | `3000` |
| JWT secret | `rural_school_attendance_secret_key` |
| JWT expiry | `24 hours` |
| Database | `./attendance.db` (SQLite, auto-created) |

### Camera (Facial Recognition)
- Grant camera permissions when prompted by the browser
- Use **Chrome** for best compatibility
- Ensure **good lighting** for accurate detection
- Face-api.js models must be available in `/client/public/models`

### RFID Setup
- **Physical RFID readers**: Connect via USB HID — they type tag values automatically
- **Manual testing**: Type the RFID tag number directly into the input field
- Supports 125kHz and 13.56MHz standard RFID cards

---

## 📈 Government Compliance

| Scheme | Support |
|---|---|
| **Mid-Day Meal** | Daily attendance for meal planning |
| **Sarva Shiksha Abhiyan (SSA)** | Enrollment + attendance tracking |
| **ASER** | Annual Status of Education Report format |
| **State Monthly Reports** | Monthly/quarterly export via CSV |

---

## 🌍 Rural School Design Goals

### Low Infrastructure
- Works on **basic laptops and tablets**
- Optimized for **slow internet** — minimal payload
- SQLite database requires **no database server**
- Can run fully **on a local intranet**

### Cost-Effective
- **RFID tags**: ₹10–20 per student
- **No cloud subscription** required
- **Open-source** — free to deploy and modify
- Standard USB webcam is sufficient

---

## 🔮 Future Enhancements

- [ ] **SMS/WhatsApp notifications** to parents on absence
- [ ] **Android/iOS mobile app**
- [ ] **Biometric fingerprint** integration
- [ ] **Multi-school / district-level** management
- [ ] **Predictive analytics** — identify at-risk students early
- [ ] **Offline-first PWA** with sync on reconnect
- [ ] **Regional language** (Hindi, Gujarati, etc.) UI
- [ ] **Cloud backup** (optional)

---

## 📁 Project Structure

```
SmartAttendanceSystem/
├── server.js               # Express backend (API + auth + DB)
├── attendance.db           # SQLite database (auto-created)
├── package.json            # Root scripts (npm run dev)
├── uploads/                # Uploaded photos stored here
└── client/                 # React frontend
    ├── public/
    │   └── models/         # face-api.js AI model files
    └── src/
        ├── App.js          # Root component (dark mode state)
        ├── index.css       # Global styles
        ├── darkmode.css    # Dark theme overrides
        └── components/
            ├── Navbar.js         # Sticky navbar + dark toggle
            ├── Login.js          # Login page + dark toggle
            ├── Dashboard.js      # Stats overview
            ├── AttendanceMarking.js  # Manual / RFID / Facial
            ├── FaceRecognition.js    # face-api.js camera component
            ├── StudentManagement.js  # Admin student CRUD
            ├── Reports.js            # Reports + CSV export
            ├── SystemStatus.js       # Health dashboard
            ├── Chatbot.js            # AI chatbot widget
            └── Profile.js            # Profile picture upload
```

---

## 📄 License

This project is licensed under the **MIT License** — free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- **Rural school teachers** — for real-world feedback and requirements
- **face-api.js** — for the open-source face detection library
- **Government Education Department** — for policy guidance
- **ASER Centre** — for highlighting the scale of the problem
- **Open Source Community** — for all the underlying tools

---

<div align="center">

**Built with ❤️ for Rural Education in India**

*Making attendance tracking efficient, accurate, and accessible for every school — no matter how remote.*

</div>
# SmartAttendanceSystem
