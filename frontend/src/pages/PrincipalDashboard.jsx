import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import '../styles/Dashboard.css';

export default function PrincipalDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getPrincipalStats();
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

      <main className="dashboard-main">
        {/* Overview Cards */}
        <section className="overview-cards">
          <div className="card stat-card">
            <div className="card-icon">👨‍🎓</div>
            <h3>Total Students</h3>
            <p className="stat-number">{stats?.totalStudents || 0}</p>
            <p className="stat-label">Enrolled</p>
          </div>
          <div className="card stat-card">
            <div className="card-icon">👨‍🏫</div>
            <h3>Total Teachers</h3>
            <p className="stat-number">{stats?.totalTeachers || 0}</p>
            <p className="stat-label">Active</p>
          </div>
        </section>

        {/* Teacher Activity Heatmap */}
        <section className="heatmap-section">
          <h2>👥 Teacher Activity Heatmap</h2>
          <div className="heatmap-container">
            {stats?.activityHeatmap && stats.activityHeatmap.length > 0 ? (
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Teacher Name</th>
                    <th>Activity Level</th>
                    <th>Total Logins</th>
                    <th>Avg Session (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.activityHeatmap.map((teacher, idx) => (
                    <tr key={idx} className={`activity-${teacher.activity}`}>
                      <td>{teacher.name}</td>
                      <td>
                        <span className={`badge badge-${teacher.activity}`}>
                          {teacher.activity.toUpperCase()}
                        </span>
                      </td>
                      <td>{teacher.logins}</td>
                      <td>{teacher.avgDuration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No teacher activity data yet</p>
            )}
          </div>
        </section>

        {/* Activity Chart */}
        <section className="chart-section">
          <h2>📊 Activity Distribution</h2>
          <div className="activity-bars">
            {stats?.activityHeatmap && stats.activityHeatmap.map((teacher, idx) => (
              <div key={idx} className="bar-item">
                <span className="bar-label">{teacher.name}</span>
                <div className="bar">
                  <div 
                    className={`bar-fill bar-fill-${teacher.activity}`}
                    style={{ width: `${(teacher.logins / (stats.activityHeatmap.reduce((max, t) => Math.max(max, t.logins), 0) || 1)) * 100}%` }}
                  >
                    {teacher.logins}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
