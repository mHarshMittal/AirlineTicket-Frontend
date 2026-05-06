/**
 * Tests for src/context/AuthContext.jsx
 *
 * userEvent.setup() is called BEFORE render() in every interactive test — this is
 * the required v14 pattern. It ensures all state updates dispatched inside user
 * interactions are wrapped in act() automatically.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ── Helper consumer component ────────────────────────────────────────────────
function AuthConsumer() {
  const { token, userEmail, userRole, isLoggedIn, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="token">{token ?? 'null'}</div>
      <div data-testid="email">{userEmail ?? 'null'}</div>
      <div data-testid="role">{userRole ?? 'null'}</div>
      <div data-testid="loggedIn">{String(isLoggedIn)}</div>
      <button onClick={() => login('tok', 'a@b.com', 'PASSENGER')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

/** Returns a userEvent instance created BEFORE the render call (v14 requirement). */
function setup() {
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
  return user;
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

// ─────────────────────────────────────────────
describe('AuthContext — initial state', () => {
  test('isLoggedIn is false when localStorage is empty', () => {
    setup();
    expect(screen.getByTestId('loggedIn').textContent).toBe('false');
  });

  test('token, email and role are null initially', () => {
    setup();
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('email').textContent).toBe('null');
    expect(screen.getByTestId('role').textContent).toBe('null');
  });

  test('hydrates from localStorage when values already stored', () => {
    localStorage.setItem('token', 'existing-tok');
    localStorage.setItem('userEmail', 'user@x.com');
    localStorage.setItem('userRole', 'ADMIN');

    setup();

    expect(screen.getByTestId('token').textContent).toBe('existing-tok');
    expect(screen.getByTestId('email').textContent).toBe('user@x.com');
    expect(screen.getByTestId('role').textContent).toBe('ADMIN');
    expect(screen.getByTestId('loggedIn').textContent).toBe('true');
  });
});

// ─────────────────────────────────────────────
describe('AuthContext — login()', () => {
  test('sets token, email and role in state', async () => {
    const user = setup();
    await user.click(screen.getByText('Login'));

    expect(screen.getByTestId('token').textContent).toBe('tok');
    expect(screen.getByTestId('email').textContent).toBe('a@b.com');
    expect(screen.getByTestId('role').textContent).toBe('PASSENGER');
    expect(screen.getByTestId('loggedIn').textContent).toBe('true');
  });

  test('persists values to localStorage after login', async () => {
    const user = setup();
    await user.click(screen.getByText('Login'));

    expect(localStorage.getItem('token')).toBe('tok');
    expect(localStorage.getItem('userEmail')).toBe('a@b.com');
    expect(localStorage.getItem('userRole')).toBe('PASSENGER');
  });
});

// ─────────────────────────────────────────────
describe('AuthContext — logout()', () => {
  test('clears state after logout', async () => {
    const user = setup();
    await user.click(screen.getByText('Login'));
    await user.click(screen.getByText('Logout'));

    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('email').textContent).toBe('null');
    expect(screen.getByTestId('role').textContent).toBe('null');
    expect(screen.getByTestId('loggedIn').textContent).toBe('false');
  });

  test('clears localStorage after logout', async () => {
    const user = setup();
    await user.click(screen.getByText('Login'));
    await user.click(screen.getByText('Logout'));

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userEmail')).toBeNull();
    expect(localStorage.getItem('userRole')).toBeNull();
  });

  test('isLoggedIn is false after logout', async () => {
    const user = setup();
    await user.click(screen.getByText('Login'));
    expect(screen.getByTestId('loggedIn').textContent).toBe('true');

    await user.click(screen.getByText('Logout'));
    expect(screen.getByTestId('loggedIn').textContent).toBe('false');
  });
});

// ─────────────────────────────────────────────
describe('AuthContext — multiple logins', () => {
  test('second login overwrites the first session', async () => {
    function MultiLogin() {
      const { login, userRole } = useAuth();
      return (
        <>
          <div data-testid="role">{userRole}</div>
          <button onClick={() => login('t1', 'a@b.com', 'PASSENGER')}>Login Passenger</button>
          <button onClick={() => login('t2', 'admin@b.com', 'ADMIN')}>Login Admin</button>
        </>
      );
    }

    // setup() before render — userEvent v14 requirement
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <MultiLogin />
      </AuthProvider>
    );

    await user.click(screen.getByText('Login Passenger'));
    expect(screen.getByTestId('role').textContent).toBe('PASSENGER');

    await user.click(screen.getByText('Login Admin'));
    expect(screen.getByTestId('role').textContent).toBe('ADMIN');
    expect(localStorage.getItem('userRole')).toBe('ADMIN');
  });
});
