import React, { useState, useEffect } from 'react';
import { quizResultsAPI } from '../api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const QuizAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const [selectedTopic, setSelectedTopic] = useState('');

  useEffect(() => {
    fetchAnalytics();
    fetchHistory();
    fetchLeaderboard();
  }, [timeframe, selectedTopic]);

  const fetchAnalytics = async () => {
    try {
      const response = await quizResultsAPI.getAnalytics({ timeframe });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await quizResultsAPI.getQuizHistory({ 
        limit: 20,
        topic: selectedTopic || undefined
      });
      setHistory(response.data.results);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await quizResultsAPI.getLeaderboard({ timeframe });
      setLeaderboard(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="quiz-analytics">
      <div className="analytics-header">
        <h2>Quiz Performance Analytics</h2>
        <div className="controls">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          
          <select 
            value={selectedTopic} 
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="topic-select"
          >
            <option value="">All Topics</option>
            {analytics && Object.keys(analytics.topicBreakdown).map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="analytics-summary">
            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>Total Quizzes</h3>
                <p className="stat-number">{analytics.totalQuizzes}</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <h3>Average Score</h3>
                <p className="stat-number">{analytics.averageScore.toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="card-icon">🏆</div>
              <div className="card-content">
                <h3>Best Score</h3>
                <p className="stat-number">{analytics.bestScore}%</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="card-icon">📉</div>
              <div className="card-content">
                <h3>Improvement Needed</h3>
                <p className="stat-number">{analytics.worstScore}%</p>
              </div>
            </div>
          </div>

          {/* Performance Trend Chart */}
          <div className="chart-section">
            <h3>Performance Trend</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value, name) => [`${value}%`, 'Score']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Topic Performance */}
          <div className="chart-section">
            <h3>Topic Performance</h3>
            <div className="topic-performance-grid">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={Object.entries(analytics.topicBreakdown).map(([topic, data]) => ({
                      topic: topic.length > 15 ? topic.substring(0, 15) + '...' : topic,
                      fullTopic: topic,
                      score: data.averageScore,
                      count: data.count
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        name === 'score' ? `${value.toFixed(1)}%` : value,
                        name === 'score' ? 'Average Score' : 'Quiz Count'
                      ]}
                      labelFormatter={(label, payload) => 
                        payload?.[0]?.payload?.fullTopic || label
                      }
                    />
                    <Bar dataKey="score" fill="#8884d8" name="score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.topicBreakdown).map(([topic, data], index) => ({
                        name: topic,
                        value: data.count,
                        fill: COLORS[index % COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.keys(analytics.topicBreakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Quiz History */}
      <div className="quiz-history-section">
        <h3>Recent Quiz History</h3>
        <div className="history-list">
          {history.length > 0 ? (
            history.map((quiz, index) => (
              <div key={quiz._id || index} className="history-item">
                <div className="quiz-info">
                  <h4>{quiz.quizTitle}</h4>
                  <p className="quiz-topic">Topic: {quiz.topic}</p>
                  <p className="quiz-date">
                    {new Date(quiz.completedAt).toLocaleDateString()} at{' '}
                    {new Date(quiz.completedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="quiz-stats">
                  <div className={`score ${quiz.score >= 80 ? 'excellent' : quiz.score >= 70 ? 'good' : quiz.score >= 60 ? 'fair' : 'poor'}`}>
                    {quiz.score}%
                  </div>
                  <div className="details">
                    <span>{quiz.correctAnswers}/{quiz.totalQuestions} correct</span>
                    {quiz.timeTaken && (
                      <span>{Math.floor(quiz.timeTaken / 60)}:{String(quiz.timeTaken % 60).padStart(2, '0')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No quiz history found</p>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="leaderboard-section">
        <h3>Leaderboard (Last {timeframe} days)</h3>
        <div className="leaderboard-list">
          {leaderboard.length > 0 ? (
            leaderboard.map((user, index) => (
              <div key={user._id} className="leaderboard-item">
                <div className="rank">#{index + 1}</div>
                <div className="user-info">
                  <span className="name">{user.name}</span>
                  <span className="stats">
                    {user.totalQuizzes} quizzes • Best: {user.bestScore}%
                  </span>
                </div>
                <div className="average-score">{user.averageScore}%</div>
              </div>
            ))
          ) : (
            <p className="no-data">No leaderboard data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizAnalytics;
