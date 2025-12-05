# 🚀 QUICK REFERENCE - Hackathon Platform

## 🎯 Start Here

```powershell
# Navigate to project
cd C:\Users\sudar\8th_Mile_Rv\Team_BeyondMinus

# Start everything with one command
.\START.ps1

# Open in browser
# http://localhost:3000
```

---

## 🔑 Demo Logins

```
📌 Principal:  test@principal / password
👨‍🏫 Teacher:    test@teacher / password
👨‍🎓 Student:    test@student / password
```

---

## 📍 URLs

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| 🔌 Backend API | http://localhost:5000 |
| 📊 Health Check | http://localhost:5000/api/health |

---

## 📁 Quick Directories

```
Backend:   C:\Users\sudar\8th_Mile_Rv\Team_BeyondMinus\backend
Frontend:  C:\Users\sudar\8th_Mile_Rv\Team_BeyondMinus\frontend
```

---

## 🔧 Commands

```powershell
# Backend only
cd backend
npm install
npm start

# Frontend only
cd frontend
npm install
npm run dev

# Build frontend for production
npm run build

# Preview production build
npm run preview
```

---

## 🗂️ Key Files

**Backend:**
- `server.js` - Main server
- `models/*.js` - Database schemas
- `routes/auth.js` - Login/Register
- `routes/dashboard.js` - Dashboard data
- `.env` - MongoDB config

**Frontend:**
- `App.jsx` - Main router
- `pages/*.jsx` - Dashboard components
- `api.js` - API calls
- `styles/*.css` - Styling

---

## 📊 Dashboard Pages

```
/                          → Login page
/dashboard/principal       → Principal dashboard
/dashboard/teacher         → Teacher dashboard
/dashboard/student         → Student dashboard
```

---

## 🎯 Features by Role

### Principal
- [ ] Total students & teachers count
- [ ] Teacher activity heatmap
- [ ] Login frequency chart
- [ ] Activity distribution

### Teacher
- [ ] Assigned students list
- [ ] Student details (grade, class)
- [ ] Struggling topics report
- [ ] Search functionality

### Student
- [ ] Performance report
- [ ] Quiz generator
- [ ] AI chat helper
- [ ] Community forums
- [ ] Video resources

---

## 🛠️ Troubleshooting Commands

```powershell
# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill process using port
taskkill /PID <number> /F

# Check MongoDB
mongosh

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm node_modules
npm install
```

---

## 📖 Documentation Files

```
HACKATHON_README.md    - Complete feature overview
SETUP.md               - Detailed setup guide
QUICKSTART.md          - Quick start instructions
PROJECT_SUMMARY.md     - Project overview
START.ps1              - Automatic startup script
```

---

## 🌟 What's Included

✅ Complete working platform
✅ No external APIs required
✅ MongoDB database setup
✅ Authentication system
✅ 3 Full dashboards
✅ Responsive design
✅ Beautiful UI
✅ API endpoints
✅ Error handling
✅ Documentation

---

## ⚡ Next Actions

1. **Start:** `.\START.ps1`
2. **Login:** Use demo credentials above
3. **Explore:** Test each dashboard
4. **Extend:** Modify components as needed
5. **Deploy:** Ready for cloud hosting

---

## 💾 Database Info

- **Type:** MongoDB
- **URI:** mongodb://localhost:27017/hackathon
- **Collections:** User, Student, Teacher, Assignment, Quiz, Report

---

## 🔐 Authentication

- **Method:** JWT (JSON Web Tokens)
- **Duration:** 24 hours
- **Password:** Hashed with bcryptjs
- **Role:** Auto-assigned from email domain

---

## 📱 Responsive Design

✅ Desktop (1920px+)
✅ Tablet (768px+)
✅ Mobile (320px+)
✅ All screens supported

---

## 🎨 Color Scheme

- **Primary:** Purple (#667eea)
- **Secondary:** Pink (#764ba2)
- **Success:** Green (#28a745)
- **Warning:** Orange (#fd7e14)
- **Danger:** Red (#dc3545)

---

## 🚀 Ready to Go!

Your platform is fully functional and ready to:
- ✅ Demo at hackathon
- ✅ Extend with features
- ✅ Deploy online
- ✅ Impress judges

**Start now:** `.\START.ps1`

---

*For more details, see PROJECT_SUMMARY.md*
