import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import '../styles/Dashboard.css';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStudentStats();
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
          <h1>👨‍🎓 Student Dashboard</h1>
          <p>Your Learning Hub</p>
        </div>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Tab Navigation */}
        <section className="tabs-section">
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              📊 Performance
            </button>
            <button
              className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              ❓ Quiz Generator
            </button>
            <button
              className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              🤖 AI Helper
            </button>
            <button
              className={`tab-btn ${activeTab === 'forum' ? 'active' : ''}`}
              onClick={() => setActiveTab('forum')}
            >
              💬 Community
            </button>
            <button
              className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >
              🎥 Video Resources
            </button>
          </div>
        </section>

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <section className="content-section">
            <h2>📊 Performance Report</h2>
            <div className="overview-cards">
              <div className="card stat-card">
                <div className="card-icon">⭐</div>
                <h3>Average Score</h3>
                <p className="stat-number">{stats?.performanceData?.averageScore || 0}%</p>
                <p className="stat-label">Overall Performance</p>
              </div>
              <div className="card stat-card">
                <div className="card-icon">📚</div>
                <h3>Topics Covered</h3>
                <p className="stat-number">{stats?.performanceData?.topics?.length || 0}</p>
                <p className="stat-label">Learning Areas</p>
              </div>
              <div className="card stat-card">
                <div className="card-icon">✅</div>
                <h3>Assignments</h3>
                <p className="stat-number">{stats?.totalAssignments || 0}</p>
                <p className="stat-label">Completed</p>
              </div>
            </div>

            {/* Topic Performance */}
            <div className="performance-details">
              <h3>📈 Topic Breakdown</h3>
              <div className="topics-performance">
                {stats?.performanceData?.topics && stats.performanceData.topics.length > 0 ? (
                  stats.performanceData.topics.map((topic, idx) => (
                    <div key={idx} className="topic-card">
                      <div className="topic-header">
                        <h4>{topic.topic}</h4>
                        <span className={`status-badge status-${topic.status.replace('_', '-')}`}>
                          {topic.status === 'Needs Improvement' ? '⚠️' : '✅'} {topic.status}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${topic.avgScore}%` }}
                        >
                          {topic.avgScore}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No performance data yet. Start taking quizzes!</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Quiz Generator Tab */}
        {activeTab === 'quiz' && (
          <section className="content-section">
            <h2>❓ Concept-Based Quiz Generator</h2>
            <div className="feature-card large-card">
              <div className="feature-icon">🎯</div>
              <h3>Generate Custom Quizzes</h3>
              <p>Select a topic to generate a personalized quiz with multiple-choice and short-answer questions.</p>
              <div className="topics-input">
                <input 
                  type="text" 
                  placeholder="Enter topic (e.g., Algebra, Biology, History)" 
                  className="topic-input"
                />
                <button className="action-btn">Generate Quiz</button>
              </div>
              <p className="feature-note">✨ Currently in demo mode. AI integration coming soon!</p>
            </div>
          </section>
        )}

        {/* AI Helper Tab */}
        {activeTab === 'ai' && (
          <section className="content-section">
            <h2>🤖 AI-Powered Query Assistant</h2>
            <div className="feature-card large-card">
              <div className="feature-icon">💬</div>
              <h3>Ask Your Questions</h3>
              <p>Get instant answers to your educational questions from our AI ChatBot.</p>
              <div className="chat-interface">
                <div className="chat-messages">
                  <div className="message ai-message">
                    <p>Hi! I'm your educational AI assistant. Ask me anything about your subjects!</p>
                  </div>
                </div>
                <div className="chat-input-box">
                  <input 
                    type="text" 
                    placeholder="Ask a question..." 
                    className="chat-input"
                  />
                  <button className="action-btn">Send</button>
                </div>
              </div>
              <p className="feature-note">🚀 AI Integration coming soon! Currently showing demo interface.</p>
            </div>
          </section>
        )}

        {/* Community Forum Tab */}
        {activeTab === 'forum' && (
          <section className="content-section">
            <h2>💬 Language-Based Community Forums</h2>
            <div className="forums-grid">
              {['English', 'Konkani', 'Marathi', 'Hindi'].map((lang, idx) => (
                <div key={idx} className="forum-card">
                  <div className="forum-icon">🗣️</div>
                  <h3>{lang} Community</h3>
                  <p>Join discussions in {lang}</p>
                  <button className="action-btn">Enter Forum</button>
                </div>
              ))}
            </div>
            <p className="feature-note">Connect with peers, share resources, and learn together!</p>
          </section>
        )}

        {/* Video Resources Tab */}
        {activeTab === 'videos' && (
          <section className="content-section">
            <h2>🎥 Regional Language Video Translation</h2>
            <div className="feature-card large-card">
              <div className="feature-icon">📹</div>
              <h3>Upload or Browse Educational Videos</h3>
              <p>Access videos with translations/subtitles in regional languages.</p>
              <div className="video-upload">
                <input 
                  type="file" 
                  accept="video/*" 
                  className="file-input"
                />
                <button className="action-btn">Upload Video</button>
              </div>
              <div className="sample-videos">
                <h4>📚 Sample Videos</h4>
                <div className="video-grid">
                  {['Math Basics', 'Science Concepts', 'History Lessons'].map((title, idx) => (
                    <div key={idx} className="video-item">
                      <div className="video-thumbnail">🎬</div>
                      <p>{title}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="feature-note">🌐 ML-powered translations coming soon!</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
