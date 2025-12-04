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

  const handleVideoConvert = async () => {
    try {
      const res = await dashboardAPI.videoConvert();
      alert(res.data.message);
    } catch (error) {
      alert('Conversion failed');
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
          <h1>🎓 Student Dashboard</h1>
          <p>Learning & Progress Tracker</p>
        </div>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <div className="streak-badge">🔥 Streak: {stats?.student?.streak || 0} days</div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'tools' ? 'active' : ''} onClick={() => setActiveTab('tools')}>AI & Tools</button>
        <button className={activeTab === 'quizzes' ? 'active' : ''} onClick={() => setActiveTab('quizzes')}>Quizzes</button>
        <button className={activeTab === 'community' ? 'active' : ''} onClick={() => setActiveTab('community')}>Community</button>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'overview' && (
          <>
            <section className="overview-cards">
              <div className="card stat-card">
                <div className="card-icon">📊</div>
                <h3>Average Score</h3>
                <p className="stat-number">{stats?.performanceData?.averageScore || 0}%</p>
              </div>
              <div className="card stat-card">
                <div className="card-icon">📝</div>
                <h3>Quizzes Taken</h3>
                <p className="stat-number">{stats?.totalAssignments || 0}</p>
              </div>
            </section>

            <section className="chart-section">
              <h2>📈 Performance by Topic</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.performanceData?.topics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#82ca9d" name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        {activeTab === 'tools' && (
          <section className="tools-section">
            <div className="tool-card ai-helper">
              <h2>🤖 AI Study Helper</h2>
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

            <div className="tool-card video-converter">
              <h2>🎥 Video Converter</h2>
              <p>Convert educational videos to audio or other formats.</p>
              <button onClick={handleVideoConvert} className="btn-secondary">Start Conversion</button>
            </div>
          </section>
        )}

        {activeTab === 'quizzes' && (
          <section className="quizzes-section">
            <h2>📝 Upcoming Quizzes</h2>
            <div className="quiz-list">
              {quizzes.length > 0 ? quizzes.map(quiz => (
                <div key={quiz._id} className="quiz-card">
                  <h3>{quiz.title}</h3>
                  <p>Topic: {quiz.topic}</p>
                  <p>Scheduled: {new Date(quiz.scheduledAt).toLocaleString()}</p>
                  <button className="btn-primary">Start Quiz</button>
                </div>
              )) : <p>No upcoming quizzes.</p>}
            </div>
          </section>
        )}

        {activeTab === 'community' && (
          <section className="community-section">
            <div className="forum-form-container">
              <h2>💬 Start Discussion</h2>
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
  );
}
