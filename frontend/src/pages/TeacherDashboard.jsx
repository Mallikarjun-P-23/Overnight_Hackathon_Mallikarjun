import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import '../styles/Dashboard.css';

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [students, setStudents] = useState([]); // For reports tab
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
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

  const fetchStudents = async () => {
    try {
      const res = await dashboardAPI.getTeacherReports();
      setStudents(res.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab]);

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

  const filteredStudents = students.filter(s =>
    s.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              {/* Removed Total Assignments card as requested */}
            </section>

            <section className="chart-section">
              <h2>📉 Struggling Topics</h2>
              <div className="chart-container">
                {stats?.strugglingTopics && Object.keys(stats.strugglingTopics).length > 0 ? (
                  <div className="tags-container">
                    {Object.keys(stats.strugglingTopics).map(topic => (
                      <span key={topic} className="topic-tag struggling">
                        {topic} ({stats.strugglingTopics[topic].length} students)
                      </span>
                    ))}
                  </div>
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
              <p className="hint">Note: Question adding interface is simplified for this demo.</p>
              <button type="submit" className="btn-primary">Create Quiz</button>
            </form>
          </section>
        )}

        {activeTab === 'students' && (
          <section className="students-section">
            <div className="section-header">
              <h2>📊 Student Performance Reports</h2>
              <input
                type="text"
                placeholder="Search student by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="student-list-detailed">
              {filteredStudents.map(student => (
                <div key={student._id} className="student-row">
                  <div className="student-info">
                    <h3>{student.userId?.name || 'Student'}</h3>
                    <p>{student.class} | Grade: {student.grade}</p>
                  </div>

                  <div className="student-sparkline">
                    <span className="label">Recent Performance:</span>
                    <div style={{ width: 150, height: 50 }}>
                      <ResponsiveContainer>
                        <LineChart data={student.sparklineData?.map((score, i) => ({ i, score })) || []}>
                          <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="student-topics">
                    <span className="label">Struggling Topics:</span>
                    <div className="tags">
                      {student.performanceMetrics?.weaknesses?.length > 0 ? (
                        student.performanceMetrics.weaknesses.map(topic => (
                          <span key={topic} className="tag tag-weak">{topic}</span>
                        ))
                      ) : (
                        <span className="tag tag-good">None</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && <p>No students found.</p>}
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
