/**
 * Tests for src/components/Navbar.jsx
 *
 * userEvent.setup() is called BEFORE render in every test that fires interactions.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/**
 * Seeds localStorage then creates a userEvent instance BEFORE rendering the Navbar.
 * Returns the user instance for tests that need to interact.
 */
function setup({ token = null, userEmail = null, userRole = null } = {}) {
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', userEmail ?? '');
    localStorage.setItem('userRole', userRole ?? '');
  }
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
      </MemoryRouter>
    </AuthProvider>
  );
  return user;
}

afterEach(() => localStorage.clear());

// ─────────────────────────────────────────────
describe('Navbar — unauthenticated', () => {
  test('renders SkyBooker brand logo text', () => {
    setup();
    expect(screen.getByText('SkyBooker')).toBeInTheDocument();
  });

  test('shows Sign In button when not logged in', () => {
    setup();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('does NOT show Sign Out when not logged in', () => {
    setup();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });

  test('shows Flights link', () => {
    setup();
    expect(screen.getByText('Flights')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
describe('Navbar — authenticated as PASSENGER', () => {
  const passengerSetup = () =>
    setup({ token: 'tok', userEmail: 'rahul@test.com', userRole: 'PASSENGER' });

  test('shows Sign Out button', () => {
    passengerSetup();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  test('does NOT show Sign In button', () => {
    passengerSetup();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  test('shows My Bookings link for PASSENGER', () => {
    passengerSetup();
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
  });

  test('shows user email in navbar', () => {
    passengerSetup();
    expect(screen.getByText('rahul@test.com')).toBeInTheDocument();
  });

  test('shows first 2 chars of email uppercased as avatar initials', () => {
    passengerSetup();
    expect(screen.getByText('RA')).toBeInTheDocument();
  });

  test('sign out clears localStorage token', async () => {
    const user = passengerSetup();
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    expect(localStorage.getItem('token')).toBeNull();
  });
});

// ─────────────────────────────────────────────
describe('Navbar — authenticated as ADMIN', () => {
  test('shows Admin Panel link', () => {
    setup({ token: 'tok', userEmail: 'admin@x.com', userRole: 'ADMIN' });
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });
});

describe('Navbar — authenticated as AIRLINE_STAFF', () => {
  test('shows Staff Panel link', () => {
    setup({ token: 'tok', userEmail: 'staff@x.com', userRole: 'AIRLINE_STAFF' });
    expect(screen.getByText('Staff Panel')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
describe('Navbar — avatar initials edge cases', () => {
  test('shows first 2 chars of any email as initials', () => {
    setup({ token: 't', userEmail: 'zq@mail.com', userRole: 'PASSENGER' });
    expect(screen.getByText('ZQ')).toBeInTheDocument();
  });

  test('shows fallback U when email is empty string', () => {
    setup({ token: 't', userEmail: '', userRole: 'PASSENGER' });
    expect(screen.getByText('U')).toBeInTheDocument();
  });
});
