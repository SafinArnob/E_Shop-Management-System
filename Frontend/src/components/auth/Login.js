import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/apiService';
import './Auth.css';

const Login = ({ onToggleRegister }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await ApiService.login(formData.email, formData.password);
      
      if (data.token) {
        login(data.token, data.role);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Login error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p>
        Don't have an account?{' '}
        <button className="link-btn" onClick={onToggleRegister}>
          Register
        </button>
      </p>
    </div>
  );
};

export default Login;


