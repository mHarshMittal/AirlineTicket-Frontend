/**
 * Tests for src/pages/public/SearchResults.jsx
 *
 * userEvent.setup() is called BEFORE render in every interactive test.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import SearchResults from '../pages/public/SearchResults';
import { flightApi } from '../api/api';

jest.mock('../api/api', () => ({ flightApi: { search: jest.fn() } }));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const FLIGHTS = [
  {
    id: 1, airline: 'IndiGo', flightNumber: '6E-101',
    departureTime: '06:00', arrivalTime: '08:15',
    price: 4500, availableSeats: 30, durationMinutes: 135,
  },
  {
    id: 2, airline: 'Air India', flightNumber: 'AI-202',
    departureTime: '10:00', arrivalTime: '11:45',
    price: 3800, availableSeats: 5, durationMinutes: 105,
  },
  {
    id: 3, airline: 'SpiceJet', flightNumber: 'SG-303',
    departureTime: '14:00', arrivalTime: '16:00',
    price: 5200, availableSeats: 0, durationMinutes: 120,
  },
];

function setup({
  token = null,
  search = '?source=Delhi&destination=Mumbai&date=2026-06-01&passengers=1',
} = {}) {
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', 'u@test.com');
    localStorage.setItem('userRole', 'PASSENGER');
  }
  // userEvent.setup() BEFORE render — v14 requirement
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[`/search${search}`]}>
        <Routes>
          <Route path="/search" element={<SearchResults />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/seats/:flightId" element={<div>Seats Page</div>} />
          <Route path="/" element={<div>Home</div>} />
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
describe('SearchResults — loading and error states', () => {
  test('shows loading indicator initially', () => {
    flightApi.search.mockImplementation(() => new Promise(() => {}));
    setup();
    expect(screen.getByText(/Searching flights/i)).toBeInTheDocument();
  });

  test('shows error message when API call fails', async () => {
    flightApi.search.mockRejectedValueOnce(new Error('Network Error'));
    setup();
    await waitFor(() =>
      expect(screen.getByText(/Could not fetch flights/i)).toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────
describe('SearchResults — rendering results', () => {
  beforeEach(() => flightApi.search.mockResolvedValue({ data: FLIGHTS }));

  test('renders all three flight cards', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('IndiGo')).toBeInTheDocument());
    expect(screen.getByText('Air India')).toBeInTheDocument();
    expect(screen.getByText('SpiceJet')).toBeInTheDocument();
  });

  test('shows correct flight count in toolbar', async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByText(/3 flights found/i)).toBeInTheDocument()
    );
  });

  test('shows source and destination in summary bar', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('Delhi')).toBeInTheDocument());
    expect(screen.getByText('Mumbai')).toBeInTheDocument();
  });

  test('displays formatted price for each flight', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('₹4,500')).toBeInTheDocument());
    expect(screen.getByText('₹3,800')).toBeInTheDocument();
  });

  test('shows Sold Out label for flights with 0 seats', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('Sold Out')).toBeInTheDocument());
  });

  test('Sold Out button is disabled', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('Sold Out')).toBeDisabled());
  });
});

// ─────────────────────────────────────────────
describe('SearchResults — empty state', () => {
  test('shows "No flights found" when API returns empty array', async () => {
    flightApi.search.mockResolvedValueOnce({ data: [] });
    setup();
    await waitFor(() =>
      expect(screen.getByText('No flights found')).toBeInTheDocument()
    );
  });

  test('shows "0 flights found" in toolbar', async () => {
    flightApi.search.mockReturnValue({ data: [] });
    await act(async () => { setup(); await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(screen.getByText(/0 flights found/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
describe('SearchResults — sorting', () => {
  beforeEach(() => flightApi.search.mockResolvedValue({ data: FLIGHTS }));

  test('default sort is by price — cheapest (₹3,800) appears first', async () => {
    setup();
    await waitFor(() => screen.getByText('IndiGo'));
    const prices = screen.getAllByText(/₹[0-9,]+/).map((el) => el.textContent);
    expect(prices[0]).toBe('₹3,800');
  });

  test('Fastest sort puts shortest duration first', async () => {
    const user = setup();
    await waitFor(() => screen.getByText('IndiGo'));
    await user.click(screen.getByRole('button', { name: /Fastest/i }));
    const prices = screen.getAllByText(/₹[0-9,]+/).map((el) => el.textContent);
    // Air India 105 min is the fastest
    expect(prices[0]).toBe('₹3,800');
  });

  test('Cheapest button restores price sort', async () => {
    const user = setup();
    await waitFor(() => screen.getByText('IndiGo'));
    await user.click(screen.getByRole('button', { name: /Fastest/i }));
    await user.click(screen.getByRole('button', { name: /Cheapest/i }));
    const prices = screen.getAllByText(/₹[0-9,]+/).map((el) => el.textContent);
    expect(prices[0]).toBe('₹3,800');
  });
});

// ─────────────────────────────────────────────
describe('SearchResults — navigation', () => {
  beforeEach(() => flightApi.search.mockResolvedValue({ data: FLIGHTS }));

  test('logged-in user is sent to /seats/:id on Select', async () => {
    const user = setup({ token: 'tok' });
    await waitFor(() => screen.getByText('IndiGo'));

    const selectBtns = screen.getAllByRole('button', { name: /Select →/i });
    await user.click(selectBtns[0]);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/seats/'),
      expect.any(Object)
    );
  });

  test('guest user is redirected to /login on Select', async () => {
    const user = setup(); // no token
    await waitFor(() => screen.getByText('IndiGo'));

    const selectBtns = screen.getAllByRole('button', { name: /Select →/i });
    await user.click(selectBtns[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.any(Object));
  });

  test('← Change Search navigates back to home', async () => {
    const user = setup({ token: 'tok' });
    await waitFor(() => screen.getByText('IndiGo'));

    await user.click(screen.getByRole('button', { name: /← Change Search/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('total price is multiplied by passenger count', async () => {
    setup({
      token: 'tok',
      search: '?source=Delhi&destination=Mumbai&date=2026-06-01&passengers=2',
    });
    await waitFor(() => screen.getByText('IndiGo'));
    // IndiGo ₹4,500 × 2 = ₹9,000
    expect(screen.getByText('Total ₹9,000')).toBeInTheDocument();
  });
});
