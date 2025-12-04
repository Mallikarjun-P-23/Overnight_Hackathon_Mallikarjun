import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import '../styles/Dashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [quizForm, setQuizForm] = useState({
    title: '',
    targetClass: '',
    topic: '',
    difficulty: 'Medium',
    questions: [],
    scheduledAt: '',
    durationMinutes: 30
  });
  const [reminderForm, setReminderForm] = useState({ title: '', description: '', dueDate: '' });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, remindersRes] = await Promise.all([
        dashboardAPI.getTeacherStats(),
        dashboardAPI.getReminders()
      ]);
      setStats(statsRes.data);
      setReminders(remindersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      await dashboardAPI.createQuiz(quizForm);
      alert('Quiz created successfully!');
      setQuizForm({
        title: '', targetClass: '', topic: '', difficulty: 'Medium',
        questions: [], scheduledAt: '', durationMinutes: 30
      });
    } catch (error) {
      alert('Failed to create quiz');
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      await dashboardAPI.createReminder(reminderForm);
      alert('Reminder set!');
      setReminderForm({ title: '', description: '', dueDate: '' });
      const res = await dashboardAPI.getReminders();
      setReminders(res.data);
    } catch (error) {
      alert('Failed to set reminder');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🍎 Teacher Dashboard</h1>
          <p>Classroom Management & Analytics</p>
        </div>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'quiz' ? 'active' : ''} onClick={() => setActiveTab('quiz')}>Create Quiz</button>
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>Student Reports</button>
        <button className={activeTab === 'reminders' ? 'active' : ''} onClick={() => setActiveTab('reminders')}>Reminders</button>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'overview' && (
          <>
            <section className="overview-cards">
              <div className="card stat-card">
                <div className="card-icon">📚</div>
                <h3>Assigned Students</h3>
                <p className="stat-number">{stats?.assignedStudentsCount || 0}</p>
              </div>
              <div className="card stat-card">
                <div className="card-icon">📝</div>
                <h3>Total Assignments</h3>
                <p className="stat-number">{stats?.totalAssignments || 0}</p>
              </div>
            </section>

            <section className="chart-section">
              <h2>📉 Struggling Topics</h2>
              <div className="chart-container">
                {stats?.strugglingTopics && Object.keys(stats.strugglingTopics).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(stats.strugglingTopics).map(([topic, students]) => ({ topic, count: students.length }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="topic" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ff8042" name="Struggling Students" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="no-data">No struggling topics detected yet.</p>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'quiz' && (
          <section className="quiz-section">
            <h2>📝 Create New Quiz</h2>
            <form onSubmit={handleCreateQuiz} className="quiz-form">
              <div className="form-row">
                <input type="text" placeholder="Quiz Title" value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} required />
                <input type="text" placeholder="Target Class" value={quizForm.targetClass} onChange={e => setQuizForm({ ...quizForm, targetClass: e.target.value })} required />
              </div>
              <div className="form-row">
                <input type="text" placeholder="Topic" value={quizForm.topic} onChange={e => setQuizForm({ ...quizForm, topic: e.target.value })} required />
                <select value={quizForm.difficulty} onChange={e => setQuizForm({ ...quizForm, difficulty: e.target.value })}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="form-row">
                <input type="datetime-local" value={quizForm.scheduledAt} onChange={e => setQuizForm({ ...quizForm, scheduledAt: e.target.value })} />
                <input type="number" placeholder="Duration (min)" value={quizForm.durationMinutes} onChange={e => setQuizForm({ ...quizForm, durationMinutes: parseInt(e.target.value) })} />
              </div>
              {/* Question adding UI would go here - simplified for now */}
              <p className="hint">Note: Question adding interface is simplified for this demo.</p>
              <button type="submit" className="btn-primary">Create Quiz</button>
            </form>
          </section>
        )}

        {activeTab === 'students' && (
          <section className="students-section">
            <h2>📊 Student Performance Reports</h2>
            <div className="student-list">
              {stats?.assignedStudents?.map(student => (
                <div key={student._id} className="student-card">
                  <h3>{student.userId?.name || 'Student'}</h3>
                  <p>Grade: {student.grade}</p>
                  <p>Total Score: {student.totalScore}</p>
                  {/* Add 'View Analytics' button here to open modal */}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'reminders' && (
          <section className="reminders-section">
            <div className="reminder-form-container">
              <h2>⏰ Set Reminder</h2>
              <form onSubmit={handleCreateReminder} className="reminder-form">
                <input type="text" placeholder="Title" value={reminderForm.title} onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })} required />
                <input type="text" placeholder="Description" value={reminderForm.description} onChange={e => setReminderForm({ ...reminderForm, description: e.target.value })} />
                <input type="datetime-local" value={reminderForm.dueDate} onChange={e => setReminderForm({ ...reminderForm, dueDate: e.target.value })} />
                <button type="submit" className="btn-secondary">Add Reminder</button>
              </form>
            </div>
            <div className="reminders-list">
              <h3>My Reminders</h3>
              {reminders.map(rem => (
                <div key={rem._id} className="reminder-item">
                  <h4>{rem.title}</h4>
                  <p>{rem.description}</p>
                  <span className="due-date">Due: {new Date(rem.dueDate).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
