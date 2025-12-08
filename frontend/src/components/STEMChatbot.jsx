import { useState, useEffect, useRef } from 'react';
import '../styles/STEMChatbot.css';

const STEMChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [motherTongue, setMotherTongue] = useState('english');
  const [profile, setProfile] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  const languages = [
    { code: 'english', name: 'English', native: 'English' },
    { code: 'kannada', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'hindi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'telugu', name: 'Telugu', native: 'తెలుగు' },
    { code: 'tamil', name: 'Tamil', native: 'தமிழ்' },
    { code: 'bengali', name: 'Bengali', native: 'বাংলা' },
    { code: 'marathi', name: 'Marathi', native: 'मराठी' },
    { code: 'gujarati', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'punjabi', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'malayalam', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'odia', name: 'Odia', native: 'ଓଡ଼ିଆ' }
  ];

  useEffect(() => {
    fetchProfile();
    // Add welcome message
    setMessages([{
      id: Date.now(),
      text: "Hello! I'm your STEM learning assistant. Ask me any science, technology, engineering, or math question, and I'll explain it in your preferred language with examples from your region!",
      sender: 'bot',
      timestamp: new Date(),
      domain: 'general'
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/stem-chatbot/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setMotherTongue(data.profile.motherTongue);
      }
    } catch (error) {
      console.error('Failed to fetch STEM profile:', error);
    }
  };

  const updateLanguage = async (newLanguage) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/stem-chatbot/profile/language', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ motherTongue: newLanguage })
      });
      const data = await response.json();
      if (data.success) {
        setMotherTongue(newLanguage);
        addMessage(`Language updated to ${languages.find(l => l.code === newLanguage)?.name}! Now ask me a STEM question.`, 'bot', 'system');
      }
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const addMessage = (text, sender, domain = 'general', metadata = {}) => {
    const message = {
      id: Date.now() + Math.random(),
      text,
      sender,
      timestamp: new Date(),
      domain,
      ...metadata
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    
    // Add user message
    addMessage(userMessage, 'user');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/stem-chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: userMessage,
          motherTongue: motherTongue
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add bot response with metadata
        addMessage(data.explanation, 'bot', data.domain, {
          hasHistoricalConnection: data.hasHistoricalConnection,
          historicalConnection: data.historicalConnection,
          keyConcepts: data.keyConcepts,
          difficultyLevel: data.difficultyLevel,
          historyCount: data.historyCount
        });
        
        // Update profile
        fetchProfile();
      } else {
        addMessage('Sorry, I encountered an error processing your question. Please try again.', 'bot', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Sorry, I\'m having trouble connecting. Please check your internet connection and try again.', 'bot', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getDomainColor = (domain) => {
    const colors = {
      physics: '#4A90E2',
      chemistry: '#7ED321',
      math: '#F5A623',
      biology: '#50E3C2',
      general: '#9013FE',
      system: '#BD10E0',
      error: '#D0021B'
    };
    return colors[domain] || colors.general;
  };

  const getDomainIcon = (domain) => {
    const icons = {
      physics: '⚡',
      chemistry: '🧪',
      math: '📊',
      biology: '🧬',
      general: '🔬',
      system: 'ℹ️',
      error: '⚠️'
    };
    return icons[domain] || icons.general;
  };

  if (!isExpanded) {
    return (
      <div className="stem-chatbot-minimized">
        <button 
          className="chatbot-toggle-btn"
          onClick={() => setIsExpanded(true)}
          title="Open STEM Assistant"
        >
          🤖 STEM Assistant
        </button>
      </div>
    );
  }

  return (
    <div className="stem-chatbot-container">
      <div className="chatbot-header">
        <div className="header-left">
          <h3>🤖 STEM Learning Assistant</h3>
          {profile && (
            <div className="profile-stats">
              <span>Queries: {profile.totalQueries}</span>
              <span>History: {profile.historyCount}</span>
            </div>
          )}
        </div>
        <div className="header-right">
          <select 
            value={motherTongue} 
            onChange={(e) => updateLanguage(e.target.value)}
            className="language-selector"
            title="Select your preferred language"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.native}
              </option>
            ))}
          </select>
          <button 
            className="minimize-btn" 
            onClick={() => setIsExpanded(false)}
            title="Minimize chatbot"
          >
            ➖
          </button>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              <div className="message-header">
                <span className="domain-badge" style={{ backgroundColor: getDomainColor(message.domain) }}>
                  {getDomainIcon(message.domain)} {message.domain}
                </span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="message-text">
                {message.text}
              </div>
              {message.hasHistoricalConnection && (
                <div className="historical-connection">
                  <div className="connection-badge">
                    🔗 Historical Connection (Interaction #{message.historyCount})
                  </div>
                  {message.keyConcepts && (
                    <div className="key-concepts">
                      <strong>Key Concepts:</strong> {message.keyConcepts.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
                <span>Analyzing your question...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <div className="input-container">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask a STEM question in ${languages.find(l => l.code === motherTongue)?.name}...`}
            disabled={isLoading}
            rows="2"
          />
          <button 
            onClick={handleSendMessage} 
            disabled={isLoading || !currentMessage.trim()}
            className="send-button"
            title="Send message"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
        <div className="input-hints">
          <span>💡 Try: "What is velocity?", "Explain photosynthesis", "How does gravity work?"</span>
        </div>
      </div>
    </div>
  );
};

export default STEMChatbot;