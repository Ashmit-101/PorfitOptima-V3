import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(formData.email, formData.password, formData.displayName);
      navigate('/');
    } catch (error) {
      setError('Failed to create account: ' + error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      setError('Failed to sign up with Google: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Start your ProfitOptima journey</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
                minLength="6"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                minLength="6"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Or continue with</span>
        </div>

        <button 
          onClick={handleGoogleSignup}
          disabled={loading}
          className="btn-google"
        >
          <img src="/google-icon.svg" alt="Google" />
          Sign up with Google
        </button>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;