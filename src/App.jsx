import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import HomePage from './pages/public/HomePage';
import SearchResults from './pages/public/SearchResults';
import LoginPage from './pages/public/LoginPage';

import SeatSelection from './pages/passenger/SeatSelection';
import PaymentPage from './pages/passenger/PaymentPage';
import BookingConfirm from './pages/passenger/BookingConfirm';
import MyBookings from './pages/passenger/MyBookings';

import StaffDashboard from './pages/staff/StaffDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/seats/:flightId" element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} />
          <Route path="/payment/:bookingId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/booking-confirm/:bookingId" element={<ProtectedRoute><BookingConfirm /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />

          <Route path="/staff" element={<RoleRoute role="AIRLINE_STAFF"><StaffDashboard /></RoleRoute>} />
          <Route path="/admin" element={<RoleRoute role="ADMIN"><AdminDashboard /></RoleRoute>} />

          <Route path="*" element={
            <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '40px' }}>
              <div style={{ fontSize: '80px' }}>✈️</div>
              <h2 style={{ fontSize: '28px', color: 'var(--text)' }}>Page Not Found</h2>
              <p style={{ color: 'var(--gray-500)' }}>The page you're looking for doesn't exist.</p>
              <a href="/" style={{ color: 'var(--blue)', fontWeight: 600 }}>← Back to Home</a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
