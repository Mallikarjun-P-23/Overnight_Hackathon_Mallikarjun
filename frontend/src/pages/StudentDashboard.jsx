import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import QuizResultHandler from '../components/QuizResultHandler';
import QuizAnalytics from '../components/QuizAnalytics';
import '../styles/Dashboard.css';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLanguage, setAiLanguage] = useState('english');
  const [aiLoading, setAiLoading] = useState(false);
  const [forumForm, setForumForm] = useState({ title: '', content: '', language: 'English', category: 'Discussion' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    console.log('Student Dashboard mounted, current user:', user);
    console.log('Token from localStorage:', localStorage.getItem('token'));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching student data...');
      const [statsRes, quizzesRes] = await Promise.all([
        dashboardAPI.getStudentStats(),
        dashboardAPI.getStudentQuizzes()
      ]);
      console.log('Stats response:', statsRes.data);
      console.log('Quizzes response:', quizzesRes.data);
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
    if (!aiQuery.trim()) return;
    
    setAiLoading(true);
    setAiResponse('');
    
    try {
      console.log('Sending AI query:', { query: aiQuery, mother_tongue: aiLanguage });
      const res = await dashboardAPI.aiHelper({ 
        query: aiQuery.trim(), 
        mother_tongue: aiLanguage 
      });
      console.log('AI response received:', res.data);
      setAiResponse(res.data.answer);
    } catch (error) {
      console.error('AI Helper error:', error);
      setAiResponse(`Error: ${error.response?.data?.message || 'AI service unavailable. Please try again later.'}`);
    } finally {
      setAiLoading(false);
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
              className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`} 
              onClick={() => setActiveTab('analytics')}
              data-tooltip="Quiz Analytics"
            >
              <span className="sidebar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,3V21H21V19H5V3H3M9,17H7V10H9V17M13,17H11V7H13V17M17,17H15V13H17V17M21,17H19V4H21V17Z"/>
                </svg>
              </span>
              <span className="sidebar-text">Analytics</span>
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
            <button 
              className={`sidebar-item ${activeTab === 'debug' ? 'active' : ''}`} 
              onClick={() => setActiveTab('debug')}
              data-tooltip="Debug"
            >
              <span className="sidebar-icon">🔧</span>
              <span className="sidebar-text">Debug</span>
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
                <p className="stat-number">{stats?.totalQuizzes || stats?.additionalMetrics?.totalQuizzesTaken || 0}</p>
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

            {/* Quick AI Helper Widget */}
            <section className="quick-ai-widget">
              <div className="widget-card">
                <h3>🤖 Quick AI Help</h3>
                <p>Got a quick STEM question? Ask our AI!</p>
                <div className="quick-ai-form">
                  <input 
                    type="text" 
                    placeholder="Ask a quick question..."
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAiQuery(e)}
                  />
                  <button 
                    onClick={handleAiQuery} 
                    disabled={!aiQuery.trim() || aiLoading}
                    className="quick-ask-btn"
                  >
                    {aiLoading ? '⟳' : '🚀'}
                  </button>
                </div>
                {aiResponse && (
                  <div className="quick-response">
                    <p>{aiResponse.substring(0, 200)}...</p>
                    <button onClick={() => setActiveTab('tools')} className="view-full-btn">
                      View Full Response
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => setActiveTab('tools')} 
                  className="full-ai-link"
                >
                  Open Full AI Helper →
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === 'tools' && (
          <section className="tools-section">
            <div className="tool-card ai-helper">
              <h2>AI STEM Learning Helper</h2>
              <p className="helper-description">
                Ask questions about Science, Technology, Engineering, or Mathematics. 
                Our AI connects your questions to historical scientific discoveries and provides personalized explanations in your preferred language!
                <br /><br />
                <strong>Features:</strong> Historical context awareness • Multilingual support • Cultural examples • Learning progression tracking
              </p>
              
              <form onSubmit={handleAiQuery} className="ai-form">
                <div className="form-group">
                  <label htmlFor="aiLanguage">Preferred Language:</label>
                  <select 
                    id="aiLanguage"
                    value={aiLanguage} 
                    onChange={e => setAiLanguage(e.target.value)}
                    className="language-select"
                  >
                    <option value="english">English</option>
                    <option value="hindi">हिन्दी (Hindi)</option>
                    <option value="kannada">ಕನ್ನಡ (Kannada)</option>
                    <option value="marathi">मराठी (Marathi)</option>
                    <option value="tamil">தமிழ் (Tamil)</option>
                    <option value="telugu">తెలుగు (Telugu)</option>
                    <option value="bengali">বাংলা (Bengali)</option>
                    <option value="gujarati">ગુજરાતી (Gujarati)</option>
                    <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                    <option value="malayalam">മലയാളം (Malayalam)</option>
                    <option value="odia">ଓଡ଼ିଆ (Odia)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="aiQuery">Your Question:</label>
                  <textarea
                    id="aiQuery"
                    placeholder={`Ask a STEM question in ${aiLanguage}...\n\n`}
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    rows={6}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn-primary ai-submit-btn" 
                  disabled={aiLoading || !aiQuery.trim()}
                >
                  {aiLoading ? (
                    <>
                      <span className="loading-spinner">⟳</span>
                      Thinking...
                    </>
                  ) : (
                    <>
                      <span></span>
                      Ask AI Helper
                    </>
                  )}
                </button>
              </form>
              
              {aiResponse && (
                <div className="ai-response">
                  <h4>🎯 AI Response:</h4>
                  <div className="response-content">
                    {aiResponse.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
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

        {activeTab === 'analytics' && (
          <section className="analytics-section">
            <QuizAnalytics />
            
            {/* AI Performance Analyzer */}
            <div className="ai-analytics-helper">
              <h3>AI Performance Insights</h3>
              <p>Want to understand your performance better? Ask our AI!</p>
              <div className="analytics-ai-suggestions">
                <button 
                  onClick={() => {
                    const avgScore = stats?.performanceData?.averageScore || 0;
                    const suggestion = avgScore < 70 
                      ? "How can I improve my quiz scores in weak subjects?"
                      : "What advanced topics should I explore next?";
                    setAiQuery(suggestion);
                    setActiveTab('tools');
                  }}
                  className="suggestion-btn"
                >
                   Get Study Suggestions
                </button>
                <button 
                  onClick={() => {
                    setAiQuery("Explain the concepts I struggled with in my recent quizzes");
                    setActiveTab('tools');
                  }}
                  className="suggestion-btn"
                >
                   Explain Difficult Topics
                </button>
                <button 
                  onClick={() => {
                    setAiQuery("What are some real-world applications of the topics I've been learning?");
                    setActiveTab('tools');
                  }}
                  className="suggestion-btn"
                >
                   Real-World Applications
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Debug Section - Remove this after testing */}
        {activeTab === 'debug' && (
          <section className="debug-section">
            <h2>Debug Quiz Integration</h2>
            <button 
              className="btn-primary" 
              onClick={async () => {
                try {
                  // Simulate a quiz result submission
                  const testResult = {
                    quizTitle: 'Debug Test Quiz',
                    topic: 'Testing',
                    questions: [{ question: 'Test?', isCorrect: true }],
                    totalQuestions: 1,
                    correctAnswers: 1,
                    score: 100,
                    rawScore: 1,
                    maxScore: 1,
                    timeTaken: 30
                  };
                  
                  const response = await fetch('http://localhost:5001/api/quiz-results/submit', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(testResult)
                  });
                  
                  if (response.ok) {
                    console.log('Test quiz submitted successfully');
                    fetchData(); // Refresh data
                    alert('Test quiz submitted! Check the quiz count.');
                  } else {
                    console.error('Failed to submit test quiz');
                    alert('Failed to submit test quiz');
                  }
                } catch (error) {
                  console.error('Error submitting test quiz:', error);
                  alert('Error: ' + error.message);
                }
              }}
            >
              Test Quiz Submission
            </button>
            
            <button
              className="btn-secondary"
              onClick={() => {
                // Test message listener
                window.postMessage({
                  type: 'QUIZ_COMPLETED',
                  payload: {
                    title: 'Self Test Quiz',
                    topic: 'Self Testing',
                    questions: [{ question: 'Self test?', isCorrect: true }],
                    totalQuestions: 1,
                    correctAnswers: 1,
                    score: 100,
                    rawScore: 1,
                    maxScore: 1,
                    timeTaken: 15
                  }
                }, '*');
                console.log('Sent test message to self');
              }}
              style={{marginLeft: '10px'}}
            >
              Test Message Listener
            </button>
          </section>
        )}

        {activeTab === 'community' && (
          <section className="community-section">
            {/* AI Discussion Helper */}
            <div className="ai-discussion-helper">
              <h3>🤝 AI Discussion Assistant</h3>
              <div className="discussion-ai-options">
                <button 
                  onClick={() => {
                    setAiQuery("Help me start a discussion about a STEM topic I'm curious about");
                    setActiveTab('tools');
                  }}
                  className="discussion-btn"
                >
                   Get Discussion Ideas
                </button>
                <button 
                  onClick={() => {
                    setAiQuery("Explain a complex topic in simple terms for a forum post");
                    setActiveTab('tools');
                  }}
                  className="discussion-btn"
                >
                   Simplify Complex Topics
                </button>
              </div>
            </div>

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
      
      {/* Quiz Result Handler - handles quiz submissions from external quiz app */}
      <QuizResultHandler onQuizSubmitted={(result) => {
        console.log('Quiz submitted:', result);
        // Refresh stats when a quiz is submitted
        fetchData();
      }} />

      {/* Floating AI Assistant */}
      <div className="floating-ai-assistant">
        <button 
          className="floating-ai-btn"
          onClick={() => setActiveTab('tools')}
          title="Ask AI Helper"
        >
          🤖
        </button>
        {activeTab !== 'tools' && aiResponse && (
          <div className="floating-notification">
            <span>New AI response available!</span>
          </div>
        )}
      </div>
    </div>
  );
}
