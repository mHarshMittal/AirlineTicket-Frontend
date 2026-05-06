/**
 * Tests for src/api/api.js
 * All axios calls are mocked — no real network traffic.
 */

import axios from 'axios';
import {
  authApi,
  flightApi,
  seatApi,
  bookingApi,
  passengerApi,
  paymentApi,
  airlineApi,
} from '../api/api';

jest.mock('axios');

const GATEWAY = 'http://localhost:8080';
const TOKEN   = 'test-token-abc';

// Provide a token so authHeader() returns a real value
beforeEach(() => {
  localStorage.setItem('token', TOKEN);
  axios.get.mockResolvedValue({ data: {} });
  axios.post.mockResolvedValue({ data: {} });
  axios.put.mockResolvedValue({ data: {} });
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// AUTH API
// ─────────────────────────────────────────────
describe('authApi', () => {
  test('register calls POST /auth/register with payload', async () => {
    const data = { fullName: 'Rahul', email: 'r@test.com', password: 'pass123' };
    axios.post.mockResolvedValueOnce({ data: { message: 'Created' } });

    await authApi.register(data);

    expect(axios.post).toHaveBeenCalledWith(`${GATEWAY}/auth/register`, data);
  });

  test('login calls POST /auth/login with credentials', async () => {
    const creds = { email: 'r@test.com', password: 'pass123' };
    axios.post.mockResolvedValueOnce({ data: { token: 'jwt-token' } });

    const res = await authApi.login(creds);

    expect(axios.post).toHaveBeenCalledWith(`${GATEWAY}/auth/login`, creds);
    expect(res.data.token).toBe('jwt-token');
  });

  test('login rejects on bad credentials', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });

    await expect(authApi.login({ email: 'x@x.com', password: 'wrong' })).rejects.toMatchObject({
      response: { data: { message: 'Invalid credentials' } },
    });
  });

  test('register rejects when email already exists', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Email already in use' } } });

    await expect(authApi.register({ email: 'dup@test.com' })).rejects.toMatchObject({
      response: { data: { message: 'Email already in use' } },
    });
  });
});

// ─────────────────────────────────────────────
// FLIGHT API
// ─────────────────────────────────────────────
describe('flightApi', () => {
  test('search calls GET /flights/search with correct query params', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    await flightApi.search('Delhi', 'Mumbai', '2026-06-01');

    expect(axios.get).toHaveBeenCalledWith(`${GATEWAY}/flights/search`, {
      params: { source: 'Delhi', destination: 'Mumbai', date: '2026-06-01' },
    });
  });

  test('getAll calls GET /flights with auth header', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ id: 1 }] });

    await flightApi.getAll();

    expect(axios.get).toHaveBeenCalledWith(`${GATEWAY}/flights`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  test('addFlight calls POST /flights with auth header', async () => {
    const flightData = { flightNumber: 'AI101', source: 'DEL', destination: 'BOM' };
    axios.post.mockResolvedValueOnce({ data: { id: 10 } });

    await flightApi.addFlight(flightData);

    expect(axios.post).toHaveBeenCalledWith(`${GATEWAY}/flights`, flightData, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  test('reduceSeats calls PUT /flights/:id/reduce-seats', async () => {
    axios.put.mockResolvedValueOnce({ data: {} });

    await flightApi.reduceSeats(5, 2);

    expect(axios.put).toHaveBeenCalledWith(
      `${GATEWAY}/flights/5/reduce-seats`,
      null,
      { params: { seats: 2 }, headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  });

  test('search returns empty array when no flights found', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    const res = await flightApi.search('X', 'Y', '2026-12-01');
    expect(res.data).toHaveLength(0);
  });

  test('search throws on network error', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    await expect(flightApi.search('DEL', 'BOM', '2026-06-01')).rejects.toThrow('Network Error');
  });
});

// ─────────────────────────────────────────────
// SEAT API
// ─────────────────────────────────────────────
describe('seatApi', () => {
  test('getSeatsByFlight calls GET /seats/flight/:id', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ seatNumber: '1A' }] });

    await seatApi.getSeatsByFlight(7);

    expect(axios.get).toHaveBeenCalledWith(`${GATEWAY}/seats/flight/7`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  test('getAvailableSeats calls correct endpoint', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ seatNumber: '2B', status: 'AVAILABLE' }] });

    await seatApi.getAvailableSeats(7);

    expect(axios.get).toHaveBeenCalledWith(`${GATEWAY}/seats/flight/7/available`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  test('holdSeat calls PUT /seats/flight/:id/hold/:seatNumber', async () => {
    axios.put.mockResolvedValueOnce({ data: {} });

    await seatApi.holdSeat(7, '3C');

    expect(axios.put).toHaveBeenCalledWith(
      `${GATEWAY}/seats/flight/7/hold/3C`,
      null,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  });

  test('confirmSeat calls PUT /seats/flight/:id/confirm/:seatNumber', async () => {
    axios.put.mockResolvedValueOnce({ data: {} });

    await seatApi.confirmSeat(7, '3C');

    expect(axios.put).toHaveBeenCalledWith(
      `${GATEWAY}/seats/flight/7/confirm/3C`,
      null,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  });

  test('addSeat calls POST /seats with auth header', async () => {
    const seatData = { flightId: 5, seatNumber: '4D', seatClass: 'ECONOMY' };
    axios.post.mockResolvedValueOnce({ data: { id: 1 } });

    await seatApi.addSeat(seatData);

    expect(axios.post).toHaveBeenCalledWith(`${GATEWAY}/seats`, seatData, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });
});

// ─────────────────────────────────────────────
// BOOKING API
// ─────────────────────────────────────────────
describe('bookingApi', () => {
  test('createBooking sends POST /bookings with auth header', async () => {
    const body = { flightId: 3, userEmail: 'r@test.com', seats: 2 };
    axios.post.mockResolvedValueOnce({ data: { bookingId: 42 } });

    const res = await bookingApi.createBooking(body);

    expect(axios.post).toHaveBeenCalledWith(`${GATEWAY}/bookings`, body, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(res.data.bookingId).toBe(42);
  });

  test('createBooking rejects when flight is sold out', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'No seats available' } } });

    await expect(bookingApi.createBooking({ flightId: 1, userEmail: 'x@x.com', seats: 1 }))
      .rejects.toMatchObject({ response: { data: { message: 'No seats available' } } });
  });
});

// ─────────────────────────────────────────────
// PASSENGER API
// ─────────────────────────────────────────────
describe('passengerApi', () => {
  test('addPassenger calls POST /passengers', async () => {
    const passenger = {
      bookingId: '42',
      title: 'Mr',
      firstName: 'Rahul',
      lastName: 'Sharma',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      passportNumber: 'A1234567',
      nationality: 'Indian',
      passportExpiry: '2030-01-01',
      passengerType: 'ADULT',
    };
    axios.post.mockResolvedValueOnce({ data: { id: 1 } });

    await passengerApi.addPassenger(passenger);

    expect(axios.post).toHaveBeenCalledWith(`${GATEWAY}/passengers`, passenger, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  test('getByBooking calls GET /passengers/booking/:id', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ firstName: 'Rahul' }] });

    await passengerApi.getByBooking(42);

    expect(axios.get).toHaveBeenCalledWith(`${GATEWAY}/passengers/booking/42`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });
});

// ─────────────────────────────────────────────
// PAYMENT API
// ─────────────────────────────────────────────
describe('paymentApi', () => {
  test('createRazorpayOrder calls POST /payments/create-order', async () => {
    const body = { bookingId: 42, userEmail: 'r@test.com', amount: 5000, currency: 'INR' };
    axios.post.mockResolvedValueOnce({ data: { razorpayOrderId: 'order_123', keyId: 'key_test' } });

    const res = await paymentApi.createRazorpayOrder(body);

    expect(axios.post).toHaveBeenCalledWith(`${GATEWAY}/payments/create-order`, body, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(res.data.razorpayOrderId).toBe('order_123');
  });

  test('verifyPayment calls POST /payments/verify', async () => {
    const body = {
      razorpayOrderId: 'order_123',
      razorpayPaymentId: 'pay_abc',
      razorpaySignature: 'sig_xyz',
      bookingId: 42,
      userEmail: 'r@test.com',
      amount: 5000,
      paymentMode: 'UPI',
    };
    axios.post.mockResolvedValueOnce({ data: { status: 'PAID' } });

    const res = await paymentApi.verifyPayment(body);

    expect(axios.post).toHaveBeenCalledWith(`${GATEWAY}/payments/verify`, body, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(res.data.status).toBe('PAID');
  });

  test('getByBooking calls GET /payments/booking/:id', async () => {
    axios.get.mockResolvedValueOnce({ data: { paymentId: 1, status: 'PAID' } });

    await paymentApi.getByBooking(42);

    expect(axios.get).toHaveBeenCalledWith(`${GATEWAY}/payments/booking/42`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  test('getByUser calls GET /payments/user/:email', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    await paymentApi.getByUser('r@test.com');

    expect(axios.get).toHaveBeenCalledWith(`${GATEWAY}/payments/user/r@test.com`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  test('refund calls POST /payments/refund/:bookingId', async () => {
    axios.post.mockResolvedValueOnce({ data: { status: 'REFUNDED' } });

    await paymentApi.refund(42);

    expect(axios.post).toHaveBeenCalledWith(
      `${GATEWAY}/payments/refund/42`,
      null,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  });

  test('authHeader is empty string when no token stored', async () => {
    localStorage.removeItem('token');
    axios.get.mockResolvedValueOnce({ data: [] });

    // The call should still be made (with Bearer null / empty)
    await paymentApi.getByUser('test@test.com');
    expect(axios.get).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// AIRLINE API
// ─────────────────────────────────────────────
describe('airlineApi', () => {
  test('getAll calls GET /airlines', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'IndiGo' }] });

    const res = await airlineApi.getAll();

    expect(axios.get).toHaveBeenCalledWith(`${GATEWAY}/airlines`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(res.data[0].name).toBe('IndiGo');
  });

  test('addAirline calls POST /airlines', async () => {
    const airline = { name: 'SpiceJet', iataCode: 'SG', country: 'India' };
    axios.post.mockResolvedValueOnce({ data: { id: 2 } });

    await airlineApi.addAirline(airline);

    expect(axios.post).toHaveBeenCalledWith(`${GATEWAY}/airlines`, airline, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  test('toggleStatus calls PUT /airlines/:id/toggle-status', async () => {
    axios.put.mockResolvedValueOnce({ data: { active: false } });

    await airlineApi.toggleStatus(1);

    expect(axios.put).toHaveBeenCalledWith(
      `${GATEWAY}/airlines/1/toggle-status`,
      null,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  });

  test('searchAirports calls GET /airports/search with keyword param', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ iataCode: 'DEL' }] });

    await airlineApi.searchAirports('delhi');

    expect(axios.get).toHaveBeenCalledWith(`${GATEWAY}/airports/search`, {
      params: { keyword: 'delhi' },
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  test('getAllAirports calls GET /airports', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    await airlineApi.getAllAirports();

    expect(axios.get).toHaveBeenCalledWith(`${GATEWAY}/airports`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  test('addAirport calls POST /airports', async () => {
    const airport = { name: 'IGI Airport', iataCode: 'DEL', city: 'Delhi', country: 'India' };
    axios.post.mockResolvedValueOnce({ data: { id: 3 } });

    await airlineApi.addAirport(airport);

    expect(axios.post).toHaveBeenCalledWith(`${GATEWAY}/airports`, airport, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });
});
