import axios from 'axios';

// API Gateway - all requests go through here
const GATEWAY_URL = 'http://localhost:8080';

function authHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

// ==================== AUTH (→ 8081) ====================
export const authApi = {
  register: (data) =>
    axios.post(`${GATEWAY_URL}/auth/register`, data),

  login: (data) =>
    axios.post(`${GATEWAY_URL}/auth/login`, data),

  // NOTE: /auth/profile does NOT exist in backend - removed
};

// ==================== FLIGHTS (→ 8082) ====================
export const flightApi = {
  // Public - no login needed
  search: (source, destination, date) =>
    axios.get(`${GATEWAY_URL}/flights/search`, {
      params: { source, destination, date },
    }),

  getAll: () =>
    axios.get(`${GATEWAY_URL}/flights`, { headers: authHeader() }),

  addFlight: (data) =>
    axios.post(`${GATEWAY_URL}/flights`, data, { headers: authHeader() }),

  reduceSeats: (flightId, seats) =>
    axios.put(`${GATEWAY_URL}/flights/${flightId}/reduce-seats`, null, {
      params: { seats },
      headers: authHeader(),
    }),
};

// ==================== SEATS (→ 8086) ====================
export const seatApi = {
  getSeatsByFlight: (flightId) =>
    axios.get(`${GATEWAY_URL}/seats/flight/${flightId}`, { headers: authHeader() }),

  getAvailableSeats: (flightId) =>
    axios.get(`${GATEWAY_URL}/seats/flight/${flightId}/available`, { headers: authHeader() }),

  holdSeat: (flightId, seatNumber) =>
    axios.put(`${GATEWAY_URL}/seats/flight/${flightId}/hold/${seatNumber}`, null, {
      headers: authHeader(),
    }),

  confirmSeat: (flightId, seatNumber) =>
    axios.put(`${GATEWAY_URL}/seats/flight/${flightId}/confirm/${seatNumber}`, null, {
      headers: authHeader(),
    }),

  addSeat: (data) =>
    axios.post(`${GATEWAY_URL}/seats`, data, { headers: authHeader() }),
};

// ==================== BOOKING (→ 8083) ====================
export const bookingApi = {
  // Backend expects: { flightId, userEmail, seats }
  // BookingController reads Authorization header automatically
  createBooking: (data) =>
    axios.post(`${GATEWAY_URL}/bookings`, data, { headers: authHeader() }),
};

// ==================== PASSENGER (→ 8084) ====================
export const passengerApi = {
  // Backend PassengerRequest: { bookingId(String), title, firstName, lastName,
  //   dateOfBirth(LocalDate), gender, passportNumber, nationality,
  //   passportExpiry(LocalDate), passengerType }
  addPassenger: (data) =>
    axios.post(`${GATEWAY_URL}/passengers`, data, { headers: authHeader() }),

  getByBooking: (bookingId) =>
    axios.get(`${GATEWAY_URL}/passengers/booking/${bookingId}`, { headers: authHeader() }),
};

// ==================== PAYMENT (→ 8085) ====================
export const paymentApi = {
  /**
   * Step 1 – Create a Razorpay order on the backend.
   * Returns { razorpayOrderId, keyId, amountInPaise, currency, bookingId, userEmail }
   */
  createRazorpayOrder: (data) =>
    axios.post(`${GATEWAY_URL}/payments/create-order`, data, { headers: authHeader() }),

  /**
   * Step 2 – Verify Razorpay signature + confirm booking + trigger email.
   * Payload: { razorpayOrderId, razorpayPaymentId, razorpaySignature,
   *            bookingId, userEmail, amount, paymentMode }
   */
  verifyPayment: (data) =>
    axios.post(`${GATEWAY_URL}/payments/verify`, data, { headers: authHeader() }),

  // Returns single PaymentResponse (not array)
  getByBooking: (bookingId) =>
    axios.get(`${GATEWAY_URL}/payments/booking/${bookingId}`, { headers: authHeader() }),

  // Returns List<PaymentResponse>
  getByUser: (email) =>
    axios.get(`${GATEWAY_URL}/payments/user/${email}`, { headers: authHeader() }),

  refund: (bookingId) =>
    axios.post(`${GATEWAY_URL}/payments/refund/${bookingId}`, null, { headers: authHeader() }),
};

// ==================== AIRLINE (→ 8087) ====================
export const airlineApi = {
  getAll: () =>
    axios.get(`${GATEWAY_URL}/airlines`, { headers: authHeader() }),

  addAirline: (data) =>
    axios.post(`${GATEWAY_URL}/airlines`, data, { headers: authHeader() }),

  toggleStatus: (id) =>
    axios.put(`${GATEWAY_URL}/airlines/${id}/toggle-status`, null, { headers: authHeader() }),

  searchAirports: (keyword) =>
    axios.get(`${GATEWAY_URL}/airports/search`, {
      params: { keyword },
      headers: authHeader(),
    }),

  getAllAirports: () =>
    axios.get(`${GATEWAY_URL}/airports`, { headers: authHeader() }),

  addAirport: (data) =>
    axios.post(`${GATEWAY_URL}/airports`, data, { headers: authHeader() }),
};
