import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import './Login.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Client-side validation for role-based email domains when registering
      const roleEmailRegex = /@(?:principal|teacher|student)(?:$|\.)/i;
      if (!isLogin && !roleEmailRegex.test(formData.email)) {
        setError('Invalid email domain. Use @principal, @teacher, or @student (e.g. user@principal.com)');
        setLoading(false);
        return;
      }
      if (isLogin) {
        const response = await authAPI.login(formData.email, formData.password);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate(`/dashboard/${response.data.user.role}`);
      } else {
        const response = await authAPI.register(formData.name, formData.email, formData.password);
        setIsLogin(true);
        setFormData({ name: '', email: '', password: '' });
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Educational Excellence Hub</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required={!isLogin}
              className="form-input"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email (e.g. user@principal.com or user@teacher.com)"
            value={formData.email}
            onChange={handleChange}
            required
            className="form-input"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="form-input"
          />

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="toggle-auth">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ name: '', email: '', password: '' });
              }}
              className="toggle-btn"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>

        <div className="email-examples">
          <h4>Demo Accounts:</h4>
          <p>Principal: test@principal.com</p>
          <p>Teacher: test@teacher.com</p>
          <p>Student: test@student.com</p>
        </div>
      </div>
    </div>
  );
}
