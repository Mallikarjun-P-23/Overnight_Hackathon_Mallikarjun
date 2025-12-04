import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../styles/Dashboard.css';

export default function PrincipalDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    targetAudience: 'all',
    targetClass: ''
  });
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStats();
  }, [selectedClass]); // Refetch when class changes

  const fetchStats = async () => {
    try {
      // Pass selectedClass to API (need to update api.js to accept params if not already)
      // Assuming api.js getPrincipalStats can take query params or we append it
      const response = await dashboardAPI.getPrincipalStats(selectedClass);
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

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await dashboardAPI.postAnnouncement(announcementForm);
      alert('Announcement posted successfully!');
      setAnnouncementForm({ title: '', content: '', targetAudience: 'all', targetClass: '' });
      fetchStats();
    } catch (error) {
      alert('Failed to post announcement');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📌 Principal Dashboard</h1>
          <p>School Administration Overview</p>
        </div>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview & Analysis
        </button>
        <button
          className={activeTab === 'teachers' ? 'active' : ''}
          onClick={() => setActiveTab('teachers')}
        >
          Teacher Performance
        </button>
        <button
          className={activeTab === 'announcements' ? 'active' : ''}
          onClick={() => setActiveTab('announcements')}
        >
          Announcements
        </button>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'overview' && (
          <>
            <section className="overview-cards">
              <div className="card stat-card">
                <div className="card-icon">👨‍🎓</div>
                <h3>Total Students</h3>
                <p className="stat-number">{stats?.totalStudents || 0}</p>
              </div>
              <div className="card stat-card">
                <div className="card-icon">👨‍🏫</div>
                <h3>Total Teachers</h3>
                <p className="stat-number">{stats?.totalTeachers || 0}</p>
              </div>
            </section>

            <section className="chart-section">
              <div className="section-header">
                <h2>📊 Class-wise Topic Performance</h2>
                <div className="class-selector">
                  <label>Select Class: </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {stats?.availableClasses?.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="chart-container">
                {stats?.topicPerformance && stats.topicPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={stats.topicPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="topic" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgScore" fill="#8884d8" name="Average Score (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="no-data">No performance data available for this selection.</p>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'teachers' && (
          <section className="heatmap-section">
            <h2>👥 Teacher Performance & Activity</h2>
            <div className="heatmap-container">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Teacher Name</th>
                    <th>Activity Level</th>
                    <th>Last Active</th>
                    <th>Total Logins</th>
                    <th>Avg Session (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.activityHeatmap?.map((teacher, idx) => (
                    <tr key={idx}>
                      <td>{teacher.name}</td>
                      <td>
                        <span className={`badge badge-${teacher.activity}`}>
                          {teacher.activity.toUpperCase()}
                        </span>
                      </td>
                      <td>{teacher.lastActive ? new Date(teacher.lastActive).toLocaleDateString() : 'N/A'}</td>
                      <td>{teacher.logins}</td>
                      <td>{teacher.avgDuration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'announcements' && (
          <section className="announcements-section">
            <div className="announcement-form-container">
              <h2>📢 Post New Announcement</h2>
              <form onSubmit={handlePostAnnouncement} className="announcement-form">
                <input
                  type="text"
                  placeholder="Title"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Content"
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  required
                />
                <div className="form-row">
                  <select
                    value={announcementForm.targetAudience}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, targetAudience: e.target.value })}
                  >
                    <option value="all">All Users</option>
                    <option value="teachers">Teachers Only</option>
                    <option value="students">Students Only</option>
                    <option value="class">Specific Class</option>
                  </select>
                  {announcementForm.targetAudience === 'class' && (
                    <input
                      type="text"
                      placeholder="Target Class (e.g., 10A)"
                      value={announcementForm.targetClass}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, targetClass: e.target.value })}
                    />
                  )}
                </div>
                <button type="submit" className="btn-primary">Post Announcement</button>
              </form>
            </div>

            <div className="recent-announcements">
              <h2>Recent Announcements</h2>
              <div className="announcement-list">
                {stats?.announcements?.map((ann, idx) => (
                  <div key={idx} className="announcement-card">
                    <h3>{ann.title}</h3>
                    <p>{ann.content}</p>
                    <div className="announcement-meta">
                      <span>Posted by: {ann.sender?.name}</span>
                      <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      <span className="badge">{ann.targetAudience}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
