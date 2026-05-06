/**
 * Tests for ProtectedRoute and RoleRoute components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleRoute from '../components/RoleRoute';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Render a route tree with a pre-populated auth state */
function renderWithAuth({ token = null, userRole = null } = {}, ui) {
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', userRole ?? '');
    localStorage.setItem('userEmail', 'test@test.com');
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/protected']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
          {ui}
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

afterEach(() => localStorage.clear());

// ─────────────────────────────────────────────
// ProtectedRoute
// ─────────────────────────────────────────────
describe('ProtectedRoute', () => {
  test('renders children when user is logged in', () => {
    renderWithAuth({ token: 'valid-token' }, (
      <Route
        path="/protected"
        element={<ProtectedRoute><div>Secret Content</div></ProtectedRoute>}
      />
    ));

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  test('redirects to /login when user is NOT logged in', () => {
    renderWithAuth({}, (
      <Route
        path="/protected"
        element={<ProtectedRoute><div>Secret Content</div></ProtectedRoute>}
      />
    ));

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  test('does not render children at all when unauthenticated', () => {
    renderWithAuth({}, (
      <Route
        path="/protected"
        element={<ProtectedRoute><div data-testid="child">Child</div></ProtectedRoute>}
      />
    ));

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  test('renders multiple children when authenticated', () => {
    renderWithAuth({ token: 'valid-token' }, (
      <Route
        path="/protected"
        element={
          <ProtectedRoute>
            <div>First</div>
            <div>Second</div>
          </ProtectedRoute>
        }
      />
    ));

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// RoleRoute
// ─────────────────────────────────────────────
describe('RoleRoute', () => {
  test('renders children when role matches', () => {
    renderWithAuth({ token: 'valid-token', userRole: 'ADMIN' }, (
      <Route
        path="/protected"
        element={<RoleRoute role="ADMIN"><div>Admin Panel</div></RoleRoute>}
      />
    ));

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  test('redirects to /login when user is not logged in', () => {
    renderWithAuth({}, (
      <Route
        path="/protected"
        element={<RoleRoute role="ADMIN"><div>Admin Panel</div></RoleRoute>}
      />
    ));

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  test('redirects to / when logged in but wrong role', () => {
    renderWithAuth({ token: 'valid-token', userRole: 'PASSENGER' }, (
      <Route
        path="/protected"
        element={<RoleRoute role="ADMIN"><div>Admin Panel</div></RoleRoute>}
      />
    ));

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  test('AIRLINE_STAFF can access staff route', () => {
    renderWithAuth({ token: 'valid-token', userRole: 'AIRLINE_STAFF' }, (
      <Route
        path="/protected"
        element={<RoleRoute role="AIRLINE_STAFF"><div>Staff Panel</div></RoleRoute>}
      />
    ));

    expect(screen.getByText('Staff Panel')).toBeInTheDocument();
  });

  test('ADMIN cannot access AIRLINE_STAFF route', () => {
    renderWithAuth({ token: 'valid-token', userRole: 'ADMIN' }, (
      <Route
        path="/protected"
        element={<RoleRoute role="AIRLINE_STAFF"><div>Staff Panel</div></RoleRoute>}
      />
    ));

    expect(screen.queryByText('Staff Panel')).not.toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  test('PASSENGER cannot access ADMIN route', () => {
    renderWithAuth({ token: 'valid-token', userRole: 'PASSENGER' }, (
      <Route
        path="/protected"
        element={<RoleRoute role="ADMIN"><div>Admin Panel</div></RoleRoute>}
      />
    ));

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
