import React, { useState, useEffect } from 'react';
import { quizResultsAPI } from '../api';

const QuizResultHandler = ({ onQuizSubmitted }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Listen for quiz results from the external quiz app
    const handleMessage = async (event) => {
      // Only accept messages from our quiz app domain (port 9002)
      console.log('Received message:', event.data, 'from origin:', event.origin);
      
      if (event.origin !== 'http://localhost:9002' && event.origin !== 'http://127.0.0.1:9002') {
        console.log('Ignoring message from unauthorized origin:', event.origin);
        return;
      }
      
      if (event.data.type === 'QUIZ_COMPLETED') {
        console.log('Quiz completed message received:', event.data.payload);
        await handleQuizSubmission(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleQuizSubmission = async (quizData) => {
    setIsProcessing(true);
    console.log('Processing quiz submission:', quizData);
    
    try {
      // Process the quiz data and submit to backend
      const submissionData = {
        quizTitle: quizData.title || 'Quiz',
        topic: quizData.topic || 'General',
        questions: quizData.questions || [],
        totalQuestions: quizData.questions?.length || 0,
        correctAnswers: quizData.questions?.filter(q => q.isCorrect).length || 0,
        score: quizData.score || 0,
        rawScore: quizData.rawScore || 0,
        maxScore: quizData.maxScore || 100,
        timeTaken: quizData.timeTaken || 0,
        difficulty: quizData.difficulty || 'medium',
        category: quizData.category || 'general'
      };

      console.log('Submitting data to backend:', submissionData);
      const response = await quizResultsAPI.submitQuiz(submissionData);
      console.log('Backend response:', response.data);
      
      if (onQuizSubmitted) {
        onQuizSubmitted(response.data);
      }

      // Show success message
      showNotification('Quiz submitted successfully!', 'success');
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      showNotification('Error submitting quiz. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const showNotification = (message, type) => {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `quiz-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10B981' : '#EF4444'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
  };

  // Add CSS for animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    return () => style.remove();
  }, []);

  return (
    <div style={{ display: 'none' }}>
      {isProcessing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10001
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '16px' }}>Processing Quiz Results...</div>
            <div className="spinner" style={{
              width: '24px',
              height: '24px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResultHandler;
