# 🚀 Quick Start Guide

## Prerequisites
- Node.js installed
- MongoDB running locally on port 27017
- PowerShell (included with Windows)

## Option 1: Automatic Start (PowerShell)

Run this command from the project root:
```powershell
.\START.ps1
```

This will automatically start both backend and frontend in separate PowerShell windows.

---

## Option 2: Manual Start

### Step 1: Start Backend

Open PowerShell and navigate to backend folder:
```powershell
cd .\backend
npm install
npm start
```

Backend will be available at: **http://localhost:5000**

### Step 2: Start Frontend

Open another PowerShell window and navigate to frontend folder:
```powershell
cd .\frontend
npm install
npm run dev
```

Frontend will be available at: **http://localhost:3000**

---

## 🔑 Login Credentials

After the platform is running, go to `http://localhost:3000` and use these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Principal** | test@principal | password |
| **Teacher** | test@teacher | password |
| **Student** | test@student | password |

> **Tip:** You can register new accounts using the registration form. Use emails ending with `@principal`, `@teacher`, or `@student` to automatically assign roles.

---

## 🎯 What You Can Do

### Principal Dashboard
- View total students and teachers
- See teacher activity heatmap
- Monitor login frequency and session duration
- View activity distribution chart

### Teacher Dashboard
- See assigned students count and list
- View student reports on struggling topics
- Search for specific topics where students need help
- Track student performance

### Student Dashboard
- View your performance metrics
- Generate custom quizzes by topic
- Access AI helper (demo)
- Join language-based community forums
- Browse educational video resources

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```powershell
# Check if MongoDB is running
mongosh
```

If MongoDB is not running, start it or install MongoDB Community Edition.

### Port Already in Use
If port 3000 or 5000 is already in use:
- Kill the process using the port
- Or modify `vite.config.js` (frontend) and `server.js` (backend)

### npm Dependencies Issues
```powershell
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
cd backend
npm install

cd ..\frontend
npm install
```

---

## 📚 Additional Resources

- Full documentation: See `SETUP.md`
- API documentation: Available at `http://localhost:5000/api/health`
- Frontend source: `./frontend/src/`
- Backend source: `./backend/`

---

**Happy Learning! 🎓**
