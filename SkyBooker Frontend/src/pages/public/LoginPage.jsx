import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    role: 'PASSENGER', staffSecretKey: '', adminSecretKey: '',
  });

  const redirectTo = location.state?.from || '/';

  async function handleLogin(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await authApi.login(loginForm);
      const token = res.data.token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || 'PASSENGER';
      login(token, loginForm.email, role);
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'AIRLINE_STAFF') navigate('/staff');
      else navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const payload = {
        fullName: registerForm.fullName, email: registerForm.email,
        password: registerForm.password, phone: registerForm.phone,
        role: registerForm.role,
        staffSecretKey: registerForm.role === 'AIRLINE_STAFF' ? registerForm.staffSecretKey : undefined,
        adminSecretKey: registerForm.role === 'ADMIN' ? registerForm.adminSecretKey : undefined,
      };
      await authApi.register(payload);
      setSuccess('Account created! Please sign in.');
      setTab('login');
      setLoginForm({ email: registerForm.email, password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  }

  const roles = [
    { value: 'PASSENGER', label: 'Passenger', icon: '👤' },
    { value: 'AIRLINE_STAFF', label: 'Staff', icon: '👷' },
    { value: 'ADMIN', label: 'Admin', icon: '🛡️' },
  ];

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">✈</div>
          <span className="login-logo-text">SkyBooker</span>
        </div>

        <h2 className="login-heading">{tab === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p className="login-subheading">{tab === 'login' ? 'Sign in to manage your bookings' : 'Start booking flights in minutes'}</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); setSuccess(''); }}>Sign In</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); setSuccess(''); }}>Register</button>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: '16px' }}>⚠ {error}</div>}
        {success && <div className="alert-success" style={{ marginBottom: '16px' }}>✓ {success}</div>}

        {tab === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Enter your password" value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Rahul Sharma" value={registerForm.fullName}
                onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={registerForm.email}
                onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Minimum 6 characters" value={registerForm.password}
                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" placeholder="9876543210" value={registerForm.phone}
                onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Account Type</label>
              <div className="role-select-option">
                {roles.map(r => (
                  <div key={r.value}
                    className={`role-option ${registerForm.role === r.value ? 'active' : ''}`}
                    onClick={() => setRegisterForm({ ...registerForm, role: r.value, staffSecretKey: '', adminSecretKey: '' })}>
                    <span className="role-icon">{r.icon}</span>{r.label}
                  </div>
                ))}
              </div>
            </div>

            {registerForm.role === 'AIRLINE_STAFF' && (
              <div className="form-group">
                <label>Staff Secret Key</label>
                <input type="password" placeholder="Provided by your administrator"
                  value={registerForm.staffSecretKey}
                  onChange={e => setRegisterForm({ ...registerForm, staffSecretKey: e.target.value })} required />
                <div className="secret-key-info">ℹ Contact your airline administrator for the staff secret key.</div>
              </div>
            )}
            {registerForm.role === 'ADMIN' && (
              <div className="form-group">
                <label>Admin Secret Key</label>
                <input type="password" placeholder="System admin key required"
                  value={registerForm.adminSecretKey}
                  onChange={e => setRegisterForm({ ...registerForm, adminSecretKey: e.target.value })} required />
                <div className="secret-key-info">ℹ Admin accounts are restricted. Only one admin is allowed per system.</div>
              </div>
            )}
            <button type="submit" className="btn-primary submit-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
