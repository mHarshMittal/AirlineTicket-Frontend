import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { isLoggedIn, userEmail, userRole, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/'); }

  function getDashboardLink() {
    if (userRole === 'ADMIN') return '/admin';
    if (userRole === 'AIRLINE_STAFF') return '/staff';
    return '/my-bookings';
  }

  function getDashboardLabel() {
    if (userRole === 'ADMIN') return 'Admin Panel';
    if (userRole === 'AIRLINE_STAFF') return 'Staff Panel';
    return 'My Bookings';
  }

  function getInitials(email) {
    return email ? email.slice(0, 2).toUpperCase() : 'U';
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">✈</div>
          SkyBooker
        </Link>

        <div className="navbar-right">
          <Link to="/" className="navbar-link">Flights</Link>

          {isLoggedIn ? (
            <>
              <Link to={getDashboardLink()} className="navbar-link">{getDashboardLabel()}</Link>
              <div className="navbar-divider" />
              <div className="navbar-user">
                <div className="navbar-avatar">{getInitials(userEmail)}</div>
                <span className="navbar-email">{userEmail}</span>
              </div>
              <button className="btn-ghost" style={{ fontSize: '14px', padding: '8px 14px' }} onClick={handleLogout}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login">
              <button className="btn-primary" style={{ padding: '9px 20px', fontSize: '14px' }}>
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
