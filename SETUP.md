# 🎓 Hackathon Platform - Educational Excellence Hub

A comprehensive web platform for educational purposes with role-based access control, designed for hackathons.

## 🚀 Features

### Role-Based Access Control
- **Principal Dashboard**: School administration overview with student enrollment and teacher activity heatmap
- **Teacher Dashboard**: Classroom management with student assignment tracking and performance reports
- **Student Dashboard**: Personalized learning hub with performance tracking, quiz generator, AI helper, community forums, and video resources

### Email-Based Role Assignment
- `@principal` → Principal Dashboard
- `@teacher` → Teacher Dashboard  
- `@student` → Student Dashboard

## 📋 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for database
- **JWT** for authentication
- **Bcryptjs** for password hashing
- **CORS** enabled for frontend communication

### Frontend
- **React** with React Router
- **Vite** as build tool
- **Axios** for API calls
- **CSS3** for responsive design

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB running on `mongodb://localhost:27017/`
- PowerShell (for Windows)

### Backend Setup

```powershell
cd .\backend
npm install
npm start
```

Backend will run on `http://localhost:5000`

### Frontend Setup

```powershell
cd .\frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🔐 Demo Accounts

Use these credentials to test different roles:

| Role | Email | Password |
|------|-------|----------|
| Principal | test@principal | password |
| Teacher | test@teacher | password |
| Student | test@student | password |

## 📊 Dashboard Features

### Principal Dashboard
- Total student and teacher count
- Teacher activity heatmap with login frequency and session duration
- Activity distribution chart

### Teacher Dashboard
- Assigned students count
- Student list with grades and classes
- Struggling topics report with searchable filters
- Student performance tracking

### Student Dashboard
- **Performance Tab**: Topic breakdown with progress bars and status indicators
- **Quiz Generator Tab**: Create custom quizzes by topic
- **AI Helper Tab**: Ask questions to AI chatbot (placeholder for future integration)
- **Community Tab**: Join language-specific forums (English, Konkani, Marathi, Hindi)
- **Video Resources Tab**: Upload/browse educational videos with translations

## 📁 Project Structure

```
Team_BeyondMinus/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Assignment.js
│   │   ├── Quiz.js
│   │   └── Report.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── dashboard.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── PrincipalDashboard.jsx
    │   │   ├── TeacherDashboard.jsx
    │   │   └── StudentDashboard.jsx
    │   ├── styles/
    │   │   ├── global.css
    │   │   ├── Dashboard.css
    │   │   └── Login.css
    │   ├── api.js
    │   ├── App.jsx
    │   ├── GlobalStyles.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Dashboard
- `GET /api/dashboard/principal/stats` - Principal dashboard statistics
- `GET /api/dashboard/teacher/stats` - Teacher dashboard statistics
- `GET /api/dashboard/student/stats` - Student dashboard statistics
- `GET /api/dashboard/students` - Get all students

## 🌟 Future Enhancements

- AI-powered chatbot integration for student queries
- ML-based quiz generation
- Video translation with regional language support
- Advanced performance analytics
- Real-time notifications
- Mobile app development

## 🤝 Contributing

This project is developed for hackathon purposes. Feel free to extend and customize it as needed.

## 📝 License

Educational use only for hackathon participation.

## 💡 Notes

- MongoDB must be running locally on port 27017
- All passwords are hashed using bcryptjs
- Tokens expire in 24 hours
- The platform uses JWT for authentication and authorization
