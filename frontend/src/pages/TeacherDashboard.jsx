import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import '../styles/Dashboard.css';

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTopic, setSearchTopic] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getTeacherStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredTopics = searchTopic
    ? Object.entries(stats?.strugglingTopics || {}).filter(([topic]) =>
        topic.toLowerCase().includes(searchTopic.toLowerCase())
      )
    : Object.entries(stats?.strugglingTopics || {});

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>👨‍🏫 Teacher Dashboard</h1>
          <p>Classroom Management & Student Progress</p>
        </div>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Overview Cards */}
        <section className="overview-cards">
          <div className="card stat-card">
            <div className="card-icon">👥</div>
            <h3>Assigned Students</h3>
            <p className="stat-number">{stats?.assignedStudentsCount || 0}</p>
            <p className="stat-label">Class Size</p>
          </div>
          <div className="card stat-card">
            <div className="card-icon">📋</div>
            <h3>Total Assignments</h3>
            <p className="stat-number">{stats?.totalAssignments || 0}</p>
            <p className="stat-label">Given</p>
          </div>
        </section>

        {/* Assigned Students */}
        <section className="students-section">
          <h2>📚 Assigned Students</h2>
          <div className="students-container">
            {stats?.assignedStudents && stats.assignedStudents.length > 0 ? (
              <div className="students-list">
                {stats.assignedStudents.map((student, idx) => (
                  <div key={idx} className="student-card">
                    <div className="student-avatar">
                      {student.userId?.name?.charAt(0) || 'S'}
                    </div>
                    <div className="student-info">
                      <h4>{student.userId?.name || 'Student'}</h4>
                      <p>Grade: {student.grade || 'N/A'}</p>
                      <p>Class: {student.class || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No students assigned yet</p>
            )}
          </div>
        </section>

        {/* Struggling Topics Report */}
        <section className="report-section">
          <h2>⚠️ Student Reports - Areas of Struggle</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="reports-container">
            {filteredTopics.length > 0 ? (
              <div className="topics-grid">
                {filteredTopics.map(([topic, students]) => (
                  <div key={topic} className="report-card">
                    <h3>📌 {topic}</h3>
                    <div className="struggling-students">
                      {students.map((student, idx) => (
                        <div key={idx} className="struggling-item">
                          <p className="student-name">{student.studentName}</p>
                          <p className="score-badge">Score: {student.score}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">
                {searchTopic ? 'No matching topics found' : 'All students are performing well!'}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
