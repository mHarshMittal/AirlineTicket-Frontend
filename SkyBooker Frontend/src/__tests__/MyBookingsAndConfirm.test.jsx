/**
 * Tests for MyBookings and BookingConfirm pages
 *
 * userEvent.setup() is called BEFORE render in every interactive test.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import MyBookings from '../pages/passenger/MyBookings';
import BookingConfirm from '../pages/passenger/BookingConfirm';
import { paymentApi } from '../api/api';

jest.mock('../api/api', () => ({
  paymentApi: {
    getByUser: jest.fn(),
    refund: jest.fn(),
    getByBooking: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

global.confirm = jest.fn();
global.alert = jest.fn();

const PAYMENTS = [
  {
    paymentId: 1, bookingId: 42, status: 'PAID', amount: 5310,
    paymentMode: 'UPI', transactionId: 'TXN123',
    paidAt: '2026-05-01T10:00:00', refundAmount: null,
  },
  {
    paymentId: 2, bookingId: 43, status: 'REFUNDED', amount: 4500,
    paymentMode: 'CARD', transactionId: 'TXN456',
    paidAt: '2026-04-20T09:00:00', refundAmount: 4500,
  },
  {
    paymentId: 3, bookingId: 44, status: 'PENDING', amount: 3000,
    paymentMode: 'NETBANKING', transactionId: 'TXN789',
    paidAt: null, refundAmount: null,
  },
];

function setupMyBookings() {
  localStorage.setItem('token', 'tok');
  localStorage.setItem('userEmail', 'user@test.com');
  localStorage.setItem('userRole', 'PASSENGER');
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/my-bookings']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
  return user;
}

function setupBookingConfirm(bookingId = '99') {
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[`/booking-confirm/${bookingId}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/booking-confirm/:bookingId" element={<BookingConfirm />} />
          <Route path="/my-bookings" element={<div>My Bookings</div>} />
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

// ═════════════════════════════════════════════
// MY BOOKINGS
// ═════════════════════════════════════════════
describe('MyBookings — rendering', () => {
  test('shows loading indicator initially', () => {
    paymentApi.getByUser.mockImplementation(() => new Promise(() => {}));
    setupMyBookings();
    expect(screen.getByText(/Loading bookings/i)).toBeInTheDocument();
  });

  test('shows empty state when no bookings', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: [] });
    setupMyBookings();
    await waitFor(() => expect(screen.getByText('No bookings yet')).toBeInTheDocument());
  });

  test('renders all booking cards', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: PAYMENTS });
    setupMyBookings();
    await waitFor(() => expect(screen.getByText('#42')).toBeInTheDocument());
    expect(screen.getByText('#43')).toBeInTheDocument();
    expect(screen.getByText('#44')).toBeInTheDocument();
  });

  test('renders correct booking count in header', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: PAYMENTS });
    setupMyBookings();
    await waitFor(() =>
      expect(screen.getByText('3 bookings found')).toBeInTheDocument()
    );
  });

  test('renders PAID status badge', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: PAYMENTS });
    setupMyBookings();
    await waitFor(() => expect(screen.getByText('PAID')).toBeInTheDocument());
  });

  test('renders REFUNDED status badge', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: PAYMENTS });
    setupMyBookings();
    await waitFor(() => expect(screen.getByText('REFUNDED')).toBeInTheDocument());
  });

  test('renders PENDING status badge', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: PAYMENTS });
    setupMyBookings();
    await waitFor(() => expect(screen.getByText('PENDING')).toBeInTheDocument());
  });

  test('shows refund amount text for REFUNDED booking', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: PAYMENTS });
    setupMyBookings();
    await waitFor(() =>
      expect(screen.getByText(/Refund of ₹4,500 initiated/i)).toBeInTheDocument()
    );
  });

  test('shows Cancel & Refund button only for PAID bookings', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: PAYMENTS });
    setupMyBookings();
    await waitFor(() => {
      const btns = screen.getAllByRole('button', { name: /Cancel & Refund/i });
      expect(btns).toHaveLength(1);
    });
  });

  test('shows formatted payment date', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: PAYMENTS });
    setupMyBookings();
    await waitFor(() =>
      expect(screen.getByText('1 May 2026')).toBeInTheDocument()
    );
  });

  test('shows — for null paidAt', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: PAYMENTS });
    setupMyBookings();
    await waitFor(() => expect(screen.getByText('—')).toBeInTheDocument());
  });
});

// ─────────────────────────────────────────────
describe('MyBookings — refund flow', () => {
  test('calls refund API when user confirms cancellation', async () => {
    paymentApi.getByUser.mockResolvedValue({ data: PAYMENTS });
    paymentApi.refund.mockResolvedValueOnce({});
    global.confirm.mockReturnValueOnce(true);

    const user = setupMyBookings();
    await waitFor(() => screen.getByText('Cancel & Refund'));
    await user.click(screen.getByRole('button', { name: /Cancel & Refund/i }));

    await waitFor(() => expect(paymentApi.refund).toHaveBeenCalledWith(42));
  });

  test('does NOT call refund API when user dismisses confirmation', async () => {
    paymentApi.getByUser.mockResolvedValue({ data: PAYMENTS });
    global.confirm.mockReturnValueOnce(false);

    const user = setupMyBookings();
    await waitFor(() => screen.getByText('Cancel & Refund'));
    await user.click(screen.getByRole('button', { name: /Cancel & Refund/i }));

    expect(paymentApi.refund).not.toHaveBeenCalled();
  });

  test('shows success message after refund completes', async () => {
    paymentApi.getByUser.mockResolvedValue({ data: PAYMENTS });
    paymentApi.refund.mockResolvedValueOnce({});
    global.confirm.mockReturnValueOnce(true);

    const user = setupMyBookings();
    await waitFor(() => screen.getByText('Cancel & Refund'));
    await user.click(screen.getByRole('button', { name: /Cancel & Refund/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Booking cancelled. Refund will be processed/i)
      ).toBeInTheDocument()
    );
  });

  test('shows alert when refund API returns an error', async () => {
    paymentApi.getByUser.mockResolvedValue({ data: PAYMENTS });
    paymentApi.refund.mockRejectedValueOnce({
      response: { data: { message: 'Refund failed' } },
    });
    global.confirm.mockReturnValueOnce(true);

    const user = setupMyBookings();
    await waitFor(() => screen.getByText('Cancel & Refund'));
    await user.click(screen.getByRole('button', { name: /Cancel & Refund/i }));

    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Refund failed'));
  });
});

// ─────────────────────────────────────────────
describe('MyBookings — empty state navigation', () => {
  test('Search Flights button in empty state navigates to home', async () => {
    paymentApi.getByUser.mockResolvedValueOnce({ data: [] });

    const user = setupMyBookings();
    await waitFor(() => screen.getByText('No bookings yet'));

    await user.click(screen.getByRole('button', { name: /Search Flights/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

// ═════════════════════════════════════════════
// BOOKING CONFIRM
// ═════════════════════════════════════════════
describe('BookingConfirm — rendering', () => {
  test('shows Booking Confirmed! heading', () => {
    paymentApi.getByBooking.mockResolvedValueOnce({ data: {} });
    setupBookingConfirm('99');
    expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
  });

  test('shows correct booking ID passed via URL param', () => {
    paymentApi.getByBooking.mockResolvedValueOnce({ data: null });
    setupBookingConfirm('77');
    expect(screen.getByText('#77')).toBeInTheDocument();
  });

  test('shows payment details once the API resolves', async () => {
    paymentApi.getByBooking.mockResolvedValueOnce({
      data: { amount: 5310, paymentMode: 'UPI', transactionId: 'TXN999', status: 'PAID' },
    });
    setupBookingConfirm('99');
    await waitFor(() => expect(screen.getByText('₹5,310')).toBeInTheDocument());
    expect(screen.getByText('UPI')).toBeInTheDocument();
    expect(screen.getByText('TXN999')).toBeInTheDocument();
  });

  test('shows e-ticket email note', () => {
    paymentApi.getByBooking.mockResolvedValueOnce({ data: {} });
    setupBookingConfirm('99');
    expect(
      screen.getByText(/E-ticket sent to your registered email/i)
    ).toBeInTheDocument();
  });

  test('View My Bookings button navigates to /my-bookings', async () => {
    paymentApi.getByBooking.mockResolvedValueOnce({ data: {} });
    const user = setupBookingConfirm('99');

    await user.click(screen.getByRole('button', { name: /View My Bookings/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-bookings');
  });

  test('Book Another Flight button navigates to home', async () => {
    paymentApi.getByBooking.mockResolvedValueOnce({ data: {} });
    const user = setupBookingConfirm('99');

    await user.click(screen.getByRole('button', { name: /Book Another Flight/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('renders gracefully when payment API fails (no payment section shown)', async () => {
    paymentApi.getByBooking.mockRejectedValueOnce(new Error('Not found'));
    setupBookingConfirm('99');
    await waitFor(() =>
      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument()
    );
    expect(screen.queryByText('Amount Paid')).not.toBeInTheDocument();
  });
});
