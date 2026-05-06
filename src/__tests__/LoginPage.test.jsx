/**
 * Tests for src/pages/public/LoginPage.jsx
 *
 * Requires @testing-library/user-event v14.
 * Every interactive test calls userEvent.setup() BEFORE render so that all
 * state updates triggered by user interactions are properly batched inside act().
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LoginPage from '../pages/public/LoginPage';
import { authApi } from '../api/api';

jest.mock('../api/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

/** Minimal valid JWT: header.base64payload.sig */
const makeJwt = (role = 'PASSENGER') => {
  const payload = btoa(JSON.stringify({ role, sub: 'test@test.com' }));
  return `header.${payload}.sig`;
};

/**
 * Creates a userEvent instance BEFORE render (required by v14) and returns it
 * together with the rendered helpers.
 */
function setup() {
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home</div>} />
          <Route path="/admin" element={<div>Admin</div>} />
          <Route path="/staff" element={<div>Staff</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
  return user;
}

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
describe('LoginPage — rendering', () => {
  test('renders SkyBooker brand', () => {
    setup();
    expect(screen.getByText('SkyBooker')).toBeInTheDocument();
  });

  test('shows Welcome back heading on login tab by default', () => {
    setup();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  test('switching to Register tab shows Create account heading', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  test('email and password inputs are present on login tab', () => {
    setup();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
describe('LoginPage — login flow', () => {
  test('PASSENGER login navigates to /', async () => {
    authApi.login.mockResolvedValueOnce({ data: { token: makeJwt('PASSENGER') } });
    const user = setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'p@test.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'pass123');
    await user.click(screen.getByRole('button', { name: /sign in →/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  test('ADMIN login navigates to /admin', async () => {
    authApi.login.mockResolvedValueOnce({ data: { token: makeJwt('ADMIN') } });
    const user = setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'admin@test.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'pass123');
    await user.click(screen.getByRole('button', { name: /sign in →/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
  });

  test('AIRLINE_STAFF login navigates to /staff', async () => {
    authApi.login.mockResolvedValueOnce({ data: { token: makeJwt('AIRLINE_STAFF') } });
    const user = setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'staff@test.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'pass123');
    await user.click(screen.getByRole('button', { name: /sign in →/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/staff'));
  });

  test('shows server error message on login failure', async () => {
    authApi.login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });
    const user = setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad@test.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in →/i }));

    await waitFor(() =>
      expect(screen.getByText('⚠ Invalid credentials')).toBeInTheDocument()
    );
  });

  test('shows generic error when response has no message', async () => {
    authApi.login.mockRejectedValueOnce({});
    const user = setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'x@x.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'x');
    await user.click(screen.getByRole('button', { name: /sign in →/i }));

    await waitFor(() =>
      expect(
        screen.getByText('⚠ Login failed. Check your credentials.')
      ).toBeInTheDocument()
    );
  });

  test('button shows Signing in… while request is in-flight', async () => {
    let resolveLogin;
    authApi.login.mockImplementationOnce(
      () => new Promise((r) => { resolveLogin = r; })
    );
    const user = setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@a.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in →/i }));

    // Promise still pending — loading text must be visible
    expect(screen.getByText('Signing in…')).toBeInTheDocument();

    // Resolve inside act() so the subsequent state updates (setLoading, navigate)
    // are properly batched and don't produce "not wrapped in act()" warnings.
    await act(async () => {
      resolveLogin({ data: { token: makeJwt() } });
    });
  });
});

// ─────────────────────────────────────────────
describe('LoginPage — register flow', () => {
  /** Opens the register tab and returns the same user instance for chaining. */
  async function openRegister() {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /register/i }));
    return user;
  }

  test('Full Name input is visible on register tab', async () => {
    await openRegister();
    expect(screen.getByPlaceholderText('Rahul Sharma')).toBeInTheDocument();
  });

  test('successful registration shows success message and returns to login', async () => {
    authApi.register.mockResolvedValueOnce({ data: {} });
    const user = await openRegister();

    await user.type(screen.getByPlaceholderText('Rahul Sharma'), 'Rahul');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'rahul@test.com');
    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'abc123');
    await user.click(screen.getByRole('button', { name: /create account →/i }));

    await waitFor(() =>
      expect(screen.getByText('✓ Account created! Please sign in.')).toBeInTheDocument()
    );
    // Should auto-switch back to login tab
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  test('registration failure shows error message', async () => {
    authApi.register.mockRejectedValueOnce({
      response: { data: { message: 'Email already in use' } },
    });
    const user = await openRegister();

    await user.type(screen.getByPlaceholderText('Rahul Sharma'), 'Rahul');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'dup@test.com');
    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'abc123');
    await user.click(screen.getByRole('button', { name: /create account →/i }));

    await waitFor(() =>
      expect(screen.getByText('⚠ Email already in use')).toBeInTheDocument()
    );
  });

  test('selecting AIRLINE_STAFF shows staff secret key input', async () => {
    const user = await openRegister();
    await user.click(screen.getByText('Staff'));
    expect(
      screen.getByPlaceholderText('Provided by your administrator')
    ).toBeInTheDocument();
  });

  test('selecting ADMIN shows admin secret key input', async () => {
    const user = await openRegister();
    await user.click(screen.getByText('Admin'));
    expect(screen.getByPlaceholderText('System admin key required')).toBeInTheDocument();
  });

  test('switching from STAFF back to PASSENGER hides secret key', async () => {
    const user = await openRegister();
    await user.click(screen.getByText('Staff'));
    expect(
      screen.getByPlaceholderText('Provided by your administrator')
    ).toBeInTheDocument();

    await user.click(screen.getByText('Passenger'));
    expect(
      screen.queryByPlaceholderText('Provided by your administrator')
    ).not.toBeInTheDocument();
  });

  test('switching tabs clears any existing error message', async () => {
    authApi.login.mockRejectedValueOnce({
      response: { data: { message: 'Bad creds' } },
    });
    const user = setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'x@x.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'x');
    await user.click(screen.getByRole('button', { name: /sign in →/i }));
    await waitFor(() =>
      expect(screen.getByText('⚠ Bad creds')).toBeInTheDocument()
    );

    // Switch to register tab — onClick handler calls setError('') which clears error
    await user.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.queryByText('⚠ Bad creds')).not.toBeInTheDocument();
  });
});
