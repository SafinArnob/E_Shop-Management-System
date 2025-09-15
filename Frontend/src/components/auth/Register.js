import React, { useState } from 'react';
import ApiService from '../../services/apiService';
import './Auth.css';

const Register = ({ onToggleLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'customer',
    salesman_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await ApiService.register(formData);
      
      if (data.message) {
        setSuccess('Registration successful! Please login.');
        setFormData({
          username: '',
          email: '',
          password: '',
          role: 'customer',
          salesman_id: ''
        });
        setTimeout(() => {
          onToggleLogin();
        }, 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Registration error: ' + error.message);
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
      <h2>Register</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
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
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="customer">Customer</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        
        {formData.role === 'customer' && (
          <input
            type="text"
            name="salesman_id"
            placeholder="Salesman ID (optional)"
            value={formData.salesman_id}
            onChange={handleChange}
          />
        )}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p>
        Already have an account?{' '}
        <button className="link-btn" onClick={onToggleLogin}>
          Login
        </button>
      </p>
    </div>
  );
};

export default Register;


