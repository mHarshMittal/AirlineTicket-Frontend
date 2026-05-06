/**
 * Tests for AdminDashboard and StaffDashboard pages
 *
 * userEvent.setup() is called BEFORE render in every interactive test.
 * fireEvent.change is used for native date inputs (more reliable in jsdom).
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import AdminDashboard from '../pages/admin/AdminDashboard';
import StaffDashboard from '../pages/staff/StaffDashboard';
import { airlineApi, flightApi, seatApi } from '../api/api';

jest.mock('../api/api', () => ({
  airlineApi: {
    getAll: jest.fn(),
    addAirline: jest.fn(),
    toggleStatus: jest.fn(),
    getAllAirports: jest.fn(),
    addAirport: jest.fn(),
  },
  flightApi: {
    getAll: jest.fn(),
    addFlight: jest.fn(),
  },
  seatApi: {
    addSeat: jest.fn(),
  },
}));

const AIRLINES = [
  { id: 1, name: 'IndiGo',   iataCode: '6E', country: 'India', active: true  },
  { id: 2, name: 'SpiceJet', iataCode: 'SG', country: 'India', active: false },
];

const AIRPORTS = [
  { id: 1, name: 'Indira Gandhi International', iataCode: 'DEL', city: 'Delhi',  country: 'India' },
  { id: 2, name: 'Chhatrapati Shivaji Maharaj', iataCode: 'BOM', city: 'Mumbai', country: 'India' },
];

const FLIGHTS = [
  {
    id: 1, flightNumber: 'AI-101', airline: 'Air India',
    source: 'DEL', destination: 'BOM',
    departureDate: '2026-06-01', departureTime: '06:00',
    arrivalDate: '2026-06-01', arrivalTime: '08:15',
    totalSeats: 180, price: 4500,
  },
];

function setupAdmin() {
  localStorage.setItem('token', 'admin-tok');
  localStorage.setItem('userRole', 'ADMIN');
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminDashboard />
      </MemoryRouter>
    </AuthProvider>
  );
  return user;
}

function setupStaff() {
  localStorage.setItem('token', 'staff-tok');
  localStorage.setItem('userRole', 'AIRLINE_STAFF');
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <StaffDashboard />
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
// ADMIN DASHBOARD
// ═════════════════════════════════════════════
describe('AdminDashboard — loading & rendering', () => {
  beforeEach(() => {
    airlineApi.getAll.mockResolvedValue({ data: AIRLINES });
    airlineApi.getAllAirports.mockResolvedValue({ data: AIRPORTS });
  });

  test('renders Admin Dashboard heading', async () => {
    setupAdmin();
    await waitFor(() =>
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    );
  });

  test('renders Total Airlines and Active Airlines stat cards', async () => {
    setupAdmin();
    await waitFor(() =>
      expect(screen.getByText('Total Airlines')).toBeInTheDocument()
    );
    expect(screen.getByText('Active Airlines')).toBeInTheDocument();
  });

  test('shows correct total airline count in tab', async () => {
    setupAdmin();
    await waitFor(() =>
      expect(screen.getByText('Airlines (2)')).toBeInTheDocument()
    );
  });

  test('shows correct airport count in tab', async () => {
    setupAdmin();
    await waitFor(() =>
      expect(screen.getByText('Airports (2)')).toBeInTheDocument()
    );
  });

  test('renders airline names in the table', async () => {
    setupAdmin();
    await waitFor(() => expect(screen.getByText('IndiGo')).toBeInTheDocument());
    expect(screen.getByText('SpiceJet')).toBeInTheDocument();
  });

  test('shows error message when API fails', async () => {
    airlineApi.getAll.mockRejectedValueOnce(new Error('Fail'));
    airlineApi.getAllAirports.mockRejectedValueOnce(new Error('Fail'));
    setupAdmin();
    await waitFor(() =>
      expect(screen.getByText(/Could not load data/i)).toBeInTheDocument()
    );
  });
});

describe('AdminDashboard — tab navigation', () => {
  beforeEach(() => {
    airlineApi.getAll.mockResolvedValue({ data: AIRLINES });
    airlineApi.getAllAirports.mockResolvedValue({ data: AIRPORTS });
  });

  test('+ Add Airline tab shows the add-airline form', async () => {
    const user = setupAdmin();
    await waitFor(() => screen.getByText('+ Add Airline'));
    await user.click(screen.getByText('+ Add Airline'));
    expect(screen.getByRole('button', { name: /Add Airline/i })).toBeInTheDocument();
  });

  test('Airports tab shows airport list', async () => {
    const user = setupAdmin();
    await waitFor(() => screen.getByText('Airports (2)'));
    await user.click(screen.getByText('Airports (2)'));
    await waitFor(() => expect(screen.getByText('DEL')).toBeInTheDocument());
  });

  test('+ Add Airport tab shows the add-airport form', async () => {
    const user = setupAdmin();
    await waitFor(() => screen.getByText('+ Add Airport'));
    await user.click(screen.getByText('+ Add Airport'));
    expect(screen.getByRole('button', { name: /Add Airport/i })).toBeInTheDocument();
  });
});

describe('AdminDashboard — add airline', () => {
  beforeEach(() => {
    airlineApi.getAll.mockResolvedValue({ data: AIRLINES });
    airlineApi.getAllAirports.mockResolvedValue({ data: AIRPORTS });
    airlineApi.addAirline.mockResolvedValue({ data: { id: 3 } });
  });

  test('successfully adds an airline and shows success message', async () => {
    const user = setupAdmin();
    await waitFor(() => screen.getByText('+ Add Airline'));
    await user.click(screen.getByText('+ Add Airline'));

    await user.type(screen.getByPlaceholderText(/Airline Name/i), 'Vistara');
    await user.type(screen.getByPlaceholderText(/IATA Code/i), 'UK');
    await user.click(screen.getByRole('button', { name: /Add Airline/i }));

    await waitFor(() =>
      expect(screen.getByText('Airline added!')).toBeInTheDocument()
    );
    expect(airlineApi.addAirline).toHaveBeenCalled();
  });

  test('shows error message when add airline API fails', async () => {
    airlineApi.addAirline.mockRejectedValueOnce({
      response: { data: { message: 'Airline already exists' } },
    });
    const user = setupAdmin();
    await waitFor(() => screen.getByText('+ Add Airline'));
    await user.click(screen.getByText('+ Add Airline'));

    await user.type(screen.getByPlaceholderText(/Airline Name/i), 'IndiGo');
    await user.click(screen.getByRole('button', { name: /Add Airline/i }));

    await waitFor(() =>
      expect(screen.getByText('Airline already exists')).toBeInTheDocument()
    );
  });
});

describe('AdminDashboard — toggle airline status', () => {
  beforeEach(() => {
    airlineApi.getAll.mockResolvedValue({ data: AIRLINES });
    airlineApi.getAllAirports.mockResolvedValue({ data: AIRPORTS });
    airlineApi.toggleStatus.mockResolvedValue({ data: { active: false } });
  });

  test('calls toggleStatus with the correct airline id', async () => {
    const user = setupAdmin();
    await waitFor(() => screen.getByText('IndiGo'));

    const toggleBtns = screen.getAllByRole('button', { name: /Deactivate|Activate/i });
    await user.click(toggleBtns[0]);

    await waitFor(() =>
      expect(airlineApi.toggleStatus).toHaveBeenCalledWith(expect.any(Number))
    );
  });
});

// ═════════════════════════════════════════════
// STAFF DASHBOARD
// ═════════════════════════════════════════════
describe('StaffDashboard — loading & rendering', () => {
  beforeEach(() => flightApi.getAll.mockResolvedValue({ data: FLIGHTS }));

  test('renders Staff Dashboard heading', async () => {
    setupStaff();
    await waitFor(() =>
      expect(screen.getByText('Staff Dashboard')).toBeInTheDocument()
    );
  });

  test('renders flight number in the flights list', async () => {
    setupStaff();
    await waitFor(() => expect(screen.getByText('AI-101')).toBeInTheDocument());
  });

  test('shows correct flight count in tab', async () => {
    setupStaff();
    await waitFor(() =>
      expect(screen.getByText('Flights (1)')).toBeInTheDocument()
    );
  });

  test('shows error message when flight API fails', async () => {
    flightApi.getAll.mockRejectedValueOnce(new Error('Server error'));
    setupStaff();
    await waitFor(() =>
      expect(screen.getByText(/Could not load flights/i)).toBeInTheDocument()
    );
  });
});

describe('StaffDashboard — add flight form', () => {
  beforeEach(() => {
    flightApi.getAll.mockResolvedValue({ data: FLIGHTS });
    flightApi.addFlight.mockResolvedValue({ data: { id: 99 } });
  });

  test('+ Add Flight tab shows the add-flight form', async () => {
    const user = setupStaff();
    await waitFor(() => screen.getByText('+ Add Flight'));
    await user.click(screen.getByText('+ Add Flight'));
    expect(screen.getByRole('button', { name: /Add Flight/i })).toBeInTheDocument();
  });

  test('shows error when departure date is in the past', async () => {
    const user = setupStaff();
    await waitFor(() => screen.getByText('+ Add Flight'));
    await user.click(screen.getByText('+ Add Flight'));

    // Use fireEvent.change for date inputs — more reliable in jsdom
    const dateInputs = screen.getAllByDisplayValue('');
    fireEvent.change(dateInputs[0], { target: { value: '2020-01-01' } });

    await user.click(screen.getByRole('button', { name: /Add Flight/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Departure date cannot be in the past/i)
      ).toBeInTheDocument()
    );
  });

  test('shows error when arrival date is before departure date', async () => {
    const user = setupStaff();
    await waitFor(() => screen.getByText('+ Add Flight'));
    await user.click(screen.getByText('+ Add Flight'));

    const dateInputs = screen.getAllByDisplayValue('');
    fireEvent.change(dateInputs[0], { target: { value: '2027-01-15' } });
    fireEvent.change(dateInputs[1], { target: { value: '2027-01-10' } });

    await user.click(screen.getByRole('button', { name: /Add Flight/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Arrival date cannot be before departure date/i)
      ).toBeInTheDocument()
    );
  });
});

describe('StaffDashboard — add seat form', () => {
  beforeEach(() => {
    flightApi.getAll.mockResolvedValue({ data: FLIGHTS });
    seatApi.addSeat.mockResolvedValue({ data: { id: 1 } });
  });

  test('+ Add Seat tab shows the add-seat form', async () => {
    const user = setupStaff();
    await waitFor(() => screen.getByText('+ Add Seat'));
    await user.click(screen.getByText('+ Add Seat'));
    expect(screen.getByRole('button', { name: /Add Seat/i })).toBeInTheDocument();
  });

  test('shows success message after seat is added', async () => {
    const user = setupStaff();
    await waitFor(() => screen.getByText('+ Add Seat'));
    await user.click(screen.getByText('+ Add Seat'));

    await user.type(screen.getByPlaceholderText(/Flight ID/i), '1');
    await user.type(screen.getByPlaceholderText(/Seat Number/i), '1A');
    await user.type(screen.getByPlaceholderText(/Row/i), '1');
    await user.type(screen.getByPlaceholderText(/Column/i), 'A');

    await user.click(screen.getByRole('button', { name: /Add Seat/i }));

    await waitFor(() =>
      expect(screen.getByText('Seat added successfully!')).toBeInTheDocument()
    );
    expect(seatApi.addSeat).toHaveBeenCalled();
  });
});
