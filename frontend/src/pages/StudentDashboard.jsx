import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import '../styles/Dashboard.css';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [forumForm, setForumForm] = useState({ title: '', content: '', language: 'English', category: 'Discussion' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, quizzesRes] = await Promise.all([
        dashboardAPI.getStudentStats(),
        dashboardAPI.getStudentQuizzes()
      ]);
      setStats(statsRes.data);
      setQuizzes(quizzesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForumPosts = async () => {
    try {
      const res = await dashboardAPI.getForumPosts();
      setForumPosts(res.data);
    } catch (error) {
      console.error('Failed to fetch forum posts:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'community') {
      fetchForumPosts();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleAiQuery = async (e) => {
    e.preventDefault();
    try {
      const res = await dashboardAPI.aiHelper({ query: aiQuery });
      setAiResponse(res.data.answer);
    } catch (error) {
      setAiResponse('Error: AI service unavailable.');
    }
  };



  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await dashboardAPI.createForumPost(forumForm);
      alert('Post created!');
      setForumForm({ title: '', content: '', language: 'English', category: 'Discussion' });
      fetchForumPosts();
    } catch (error) {
      alert('Failed to create post');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <button 
            className="sidebar-toggle" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            ☰
          </button>
          <h1>Student Dashboard</h1>
          <p>Learning & Progress Tracker</p>
        </div>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <div className="streak-badge">Streak: {stats?.student?.streak || 0} days</div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-layout">
        <nav className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-content">
            <button 
              className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} 
              onClick={() => setActiveTab('overview')}
              data-tooltip="Overview"
            >
              <span className="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
              </span>
              <span className="sidebar-text">Overview</span>
            </button>
            <button 
              className={`sidebar-item ${activeTab === 'tools' ? 'active' : ''}`} 
              onClick={() => setActiveTab('tools')}
              data-tooltip="AI & Tools"
            >
              <span className="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c0 4 2.91 6.71 6 7.5V18h6v-2.5c3.09-.79 6-3.5 6-7.5l-.5-2z"/>
                  <circle cx="9" cy="12" r="1"/>
                  <circle cx="15" cy="12" r="1"/>
                  <path d="M12 15.5c-1.25 0-2.27-.86-2.27-2h4.54c0 1.14-1.02 2-2.27 2z"/>
                </svg>
              </span>
              <span className="sidebar-text">AI & Tools</span>
            </button>
            <button 
              className={`sidebar-item ${activeTab === 'quizzes' ? 'active' : ''}`} 
              onClick={() => window.open('http://localhost:9002', '_blank')}
              data-tooltip="Quizzes"
            >
              <span className="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </span>
              <span className="sidebar-text">Quizzes</span>
            </button>
            <button 
              className={`sidebar-item ${activeTab === 'videos' ? 'active' : ''}`} 
              onClick={() => window.open('http://127.0.0.1:3050', '_blank')}
              data-tooltip="Video Processing"
            >
              <span className="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
                </svg>
              </span>
              <span className="sidebar-text">Video Processing</span>
            </button>
            <button 
              className={`sidebar-item ${activeTab === 'community' ? 'active' : ''}`} 
              onClick={() => setActiveTab('community')}
              data-tooltip="Community"
            >
              <span className="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16.5c-.8 0-1.54.5-1.85 1.26l-1.92 5.63A2 2 0 0 0 14.62 17H16v5h4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9l-1.5-4.5A2 2 0 0 0 5.62 9H3.5C2.67 9 2 9.67 2 10.5l1.24 3.86c.25.78 1.01 1.3 1.85 1.3H7v6.34h.5z"/>
                </svg>
              </span>
              <span className="sidebar-text">Community</span>
            </button>
          </div>
        </nav>

        <main className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {activeTab === 'overview' && (
          <>
            <section className="overview-cards">
              <div className="card stat-card">
                <div className="card-icon"></div>
                <h3>Average Score</h3>
                <p className="stat-number">{stats?.performanceData?.averageScore || 0}%</p>
              </div>
              <div className="card stat-card">
                <div className="card-icon"></div>
                <h3>Quizzes Taken</h3>
                <p className="stat-number">{stats?.totalAssignments || 0}</p>
              </div>
            </section>

            <section className="chart-section">
              <h2>Performance by Topic</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.performanceData?.topics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#F2C94C" name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        {activeTab === 'tools' && (
          <section className="tools-section">
            <div className="tool-card ai-helper">
              <h2>AI Study Helper</h2>
              <form onSubmit={handleAiQuery}>
                <textarea
                  placeholder="Ask a question..."
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary">Ask AI</button>
              </form>
              {aiResponse && (
                <div className="ai-response">
                  <h4>AI Response:</h4>
                  <p>{aiResponse}</p>
                </div>
              )}
            </div>


          </section>
        )}

        {activeTab === 'quizzes' && (
          <section className="quizzes-section">
            <h2>Upcoming Quizzes</h2>
            <div className="quiz-list">
              {quizzes.length > 0 ? quizzes.map(quiz => (
                <div key={quiz._id} className="quiz-card">
                  <h3>{quiz.title}</h3>
                  <p>Topic: {quiz.topic}</p>
                  <p>Scheduled: {new Date(quiz.scheduledAt).toLocaleString()}</p>
                  <button className="btn-primary" onClick={() => window.open('http://localhost:9002', '_blank')}>Start Quiz</button>
                </div>
              )) : <p>No upcoming quizzes.</p>}
            </div>
          </section>
        )}

        {activeTab === 'community' && (
          <section className="community-section">
            <div className="forum-form-container">
              <h2>Start Discussion</h2>
              <form onSubmit={handleCreatePost} className="forum-form">
                <input type="text" placeholder="Title" value={forumForm.title} onChange={e => setForumForm({ ...forumForm, title: e.target.value })} required />
                <textarea placeholder="Content" value={forumForm.content} onChange={e => setForumForm({ ...forumForm, content: e.target.value })} required />
                <div className="form-row">
                  <select value={forumForm.language} onChange={e => setForumForm({ ...forumForm, language: e.target.value })}>
                    <option value="English">English</option>
                    <option value="Konkani">Konkani</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                  <select value={forumForm.category} onChange={e => setForumForm({ ...forumForm, category: e.target.value })}>
                    <option value="Discussion">Discussion</option>
                    <option value="Q&A">Q&A</option>
                    <option value="Resource">Resource</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">Post</button>
              </form>
            </div>

            <div className="forum-posts">
              {forumPosts.map(post => (
                <div key={post._id} className="post-card">
                  <h3>{post.title} <span className="badge">{post.language}</span></h3>
                  <p>{post.content}</p>
                  <div className="post-meta">
                    <span>By: {post.author?.name}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        </main>
      </div>
    </div>
  );
}
