# 🎓 Hackathon Platform - Educational Excellence Hub

A comprehensive web platform for educational purposes with role-based access control, designed for hackathons. This platform provides separate dashboards for principals, teachers, and students with real-time features for school administration, classroom management, and personalized learning.

## 🌟 Features Overview

### 🔐 Email-Based Role Assignment
- Automatic role detection based on email domain
- `@principal` → Principal Dashboard
- `@teacher` → Teacher Dashboard  
- `@student` → Student Dashboard

### 📌 Principal Dashboard
- **Student Enrollment Overview**: Total enrolled students with metrics
- **Teacher Activity Heatmap**: Visual representation of teacher platform engagement
- **Login Frequency Tracking**: Monitor visit patterns and session duration
- **Activity Distribution**: Chart showing teacher engagement levels

### 👨‍🏫 Teacher Dashboard
- **Student Assignment Summary**: Number of assigned students with detailed list
- **Student Reports**: Track struggling topics and areas of improvement
- **Searchable Filters**: Find students by name or topic
- **Performance Tracking**: Monitor individual and group progress

### 👨‍🎓 Student Dashboard
- **Performance Report**: Visual breakdown of topics with progress indicators
- **AI-Powered Query Section**: Chat-like interface for educational questions (demo)
- **Concept-Based Quiz Generator**: Create custom quizzes by topic
- **Performance Visualizations**: Charts showing strengths and weaknesses
- **Regional Language Forums**: Join language-specific community discussions
- **Video Translation**: Upload/browse educational videos with translations

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for persistent data storage
- **JWT** for secure authentication
- **Bcryptjs** for password hashing
- **CORS** for frontend communication

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Vite** as build tool for fast development
- **Axios** for API calls
- **CSS3** with responsive design

## 📋 Installation & Setup

### Prerequisites
- Node.js v14+ 
- MongoDB running on `mongodb://localhost:27017/`
- PowerShell or any terminal

### Quick Start

1. **Navigate to project:**
```powershell
cd Team_BeyondMinus
```

2. **Run startup script:**
```powershell
.\START.ps1
```

Or manually:

**Terminal 1 - Backend:**
```powershell
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

3. **Access the platform:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Principal | test@principal | password |
| Teacher | test@teacher | password |
| Student | test@student | password |

## 📁 Project Structure

```
Team_BeyondMinus/
├── backend/
│   ├── models/              # MongoDB schemas
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Assignment.js
│   │   ├── Quiz.js
│   │   └── Report.js
│   ├── routes/              # API endpoints
│   │   ├── auth.js
│   │   └── dashboard.js
│   ├── middleware/          # Authentication
│   │   └── auth.js
│   ├── server.js            # Main server file
│   ├── .env                 # Environment config
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # React components
│   │   │   ├── Login.jsx
│   │   │   ├── PrincipalDashboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── *.css
│   │   ├── styles/          # Global styles
│   │   │   ├── global.css
│   │   │   └── Dashboard.css
│   │   ├── api.js           # API calls
│   │   ├── App.jsx          # Main component
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── SETUP.md                 # Detailed setup guide
├── QUICKSTART.md            # Quick start guide
├── START.ps1                # Startup script
└── README.md
```

## 🔄 API Endpoints

### Authentication
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Login user
```

### Dashboard
```
GET  /api/dashboard/principal/stats    - Principal stats
GET  /api/dashboard/teacher/stats      - Teacher stats
GET  /api/dashboard/student/stats      - Student stats
GET  /api/dashboard/students           - All students list
POST /api/submit-assignment            - Submit assignment
```

## 🎨 UI/UX Highlights

- **Modern Design**: Gradient backgrounds with smooth animations
- **Responsive Layout**: Works on desktop and mobile devices
- **Interactive Charts**: Visual representation of data
- **Tab Navigation**: Easy access to different features
- **User-Friendly Forms**: Clear validation and feedback
- **Card-based Layout**: Organized information display
- **Color Coded Status**: Quick visual indicators

## 🔒 Security Features

- **Password Hashing**: Bcryptjs for secure password storage
- **JWT Authentication**: Token-based access control
- **Role-Based Access**: Protected routes by user role
- **CORS Protection**: Cross-origin request handling
- **Environment Variables**: Secure configuration

## 🚀 Future Enhancements

- [ ] AI Chatbot integration for student queries
- [ ] ML-based quiz generation
- [ ] Video translation with regional languages
- [ ] Advanced performance analytics
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Websocket support for live updates

## 🤝 Contributing

This project is open for contributions. Feel free to extend features and improvements.

## 📝 License

Educational use for hackathon purposes.

## 💡 Tips & Tricks

1. **Register New Users**: Use emails ending with @principal, @teacher, or @student
2. **Reset Data**: Delete MongoDB database and restart server
3. **Development Mode**: Frontend hot-reloads with Vite
4. **Debug**: Use browser DevTools for frontend debugging
5. **Backend Logs**: Check terminal for server logs

## 🆘 Troubleshooting

**MongoDB Connection Error**
```powershell
# Check if MongoDB is running
mongosh

# If not installed, install MongoDB Community Edition
```

**Port Already in Use**
```powershell
# Find and kill process
netstat -ano | findstr :3000  # or :5000
taskkill /PID <PID> /F
```

**Dependencies Not Installing**
```powershell
npm cache clean --force
npm install
```

## 📞 Support

For issues or questions, refer to:
- SETUP.md for detailed setup
- QUICKSTART.md for quick start
- Frontend console for client-side errors
- Backend terminal for server-side errors

---

**Built with ❤️ for educational excellence**
