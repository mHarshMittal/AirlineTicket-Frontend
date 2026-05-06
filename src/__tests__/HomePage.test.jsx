/**
 * Tests for src/pages/public/HomePage.jsx
 *
 * userEvent.setup() is called BEFORE render in every test that fires interactions.
 * fireEvent.change is used for the native date <input> because userEvent.type on
 * date inputs is unreliable in jsdom.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/public/HomePage';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

global.alert = jest.fn();
global.scrollTo = jest.fn();

/** Creates userEvent instance BEFORE render and returns it with the screen. */
function setup() {
  const user = userEvent.setup();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HomePage />
    </MemoryRouter>
  );
  return user;
}

afterEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
describe('HomePage — rendering', () => {
  test('renders hero headline text', () => {
    setup();
    expect(screen.getByText(/Find & Book Flights/i)).toBeInTheDocument();
  });

  test('renders Search Flights submit button', () => {
    setup();
    expect(screen.getByRole('button', { name: /Search Flights/i })).toBeInTheDocument();
  });

  test('renders From and To city inputs', () => {
    setup();
    // Two inputs share the same placeholder
    const inputs = screen.getAllByPlaceholderText(/City or airport/i);
    expect(inputs).toHaveLength(2);
  });

  test('renders passengers select with options 1–6', () => {
    setup();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.options).toHaveLength(6);
  });

  test('renders all 4 popular route Direct Flight labels', () => {
    setup();
    expect(screen.getAllByText(/Direct Flight/i)).toHaveLength(4);
  });

  test('renders all 4 feature cards', () => {
    setup();
    expect(screen.getByText('Instant Booking')).toBeInTheDocument();
    expect(screen.getByText('Lowest Fares')).toBeInTheDocument();
    expect(screen.getByText('Secure Payments')).toBeInTheDocument();
    expect(screen.getByText('Easy Management')).toBeInTheDocument();
  });

  test('renders hero stats: 2M+, 500+, ₹999', () => {
    setup();
    expect(screen.getByText('2M+')).toBeInTheDocument();
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('₹999')).toBeInTheDocument();
  });

  test('renders swap button', () => {
    setup();
    expect(screen.getByTitle('Swap cities')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
describe('HomePage — search form', () => {
  test('shows alert when form is submitted with empty fields', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /Search Flights/i }));
    expect(global.alert).toHaveBeenCalledWith('Please fill all fields');
  });

  test('navigates to /search with correct query params on valid submit', async () => {
    const user = setup();

    const inputs = screen.getAllByPlaceholderText(/City or airport/i);
    await user.type(inputs[0], 'Delhi');
    await user.type(inputs[1], 'Mumbai');

    // Use fireEvent.change for the date input — more reliable in jsdom than userEvent.type
    const dateInput = screen.getByDisplayValue('');
    fireEvent.change(dateInput, { target: { value: '2026-12-01' } });

    await user.click(screen.getByRole('button', { name: /Search Flights/i }));

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('source=Delhi'));
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('destination=Mumbai'));
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('date=2026-12-01'));
  });

  test('passenger count is included in the navigation URL', async () => {
    const user = setup();

    const inputs = screen.getAllByPlaceholderText(/City or airport/i);
    await user.type(inputs[0], 'Delhi');
    await user.type(inputs[1], 'Mumbai');
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '2026-12-01' } });

    await user.selectOptions(screen.getByRole('combobox'), '3');
    await user.click(screen.getByRole('button', { name: /Search Flights/i }));

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('passengers=3'));
  });

  test('swap button swaps source and destination values', async () => {
    const user = setup();

    const inputs = screen.getAllByPlaceholderText(/City or airport/i);
    await user.type(inputs[0], 'Kolkata');
    await user.type(inputs[1], 'Chennai');
    await user.click(screen.getByTitle('Swap cities'));

    expect(inputs[0].value).toBe('Chennai');
    expect(inputs[1].value).toBe('Kolkata');
  });
});

// ─────────────────────────────────────────────
describe('HomePage — popular routes & CTA', () => {
  test('clicking a popular route card pre-fills From and To fields', async () => {
    const user = setup();
    // First card is Delhi → Mumbai
    const cards = screen.getAllByText('Direct Flight');
    await user.click(cards[0]);

    const inputs = screen.getAllByPlaceholderText(/City or airport/i);
    expect(inputs[0].value).toBe('Delhi');
    expect(inputs[1].value).toBe('Mumbai');
  });

  test('CTA "Search Flights →" button scrolls to top', async () => {
    const user = setup();
    await user.click(screen.getByText('Search Flights →'));
    expect(global.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
