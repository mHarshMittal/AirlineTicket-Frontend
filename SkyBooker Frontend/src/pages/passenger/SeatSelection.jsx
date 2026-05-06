import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { seatApi, bookingApi, passengerApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import './SeatSelection.css';

function StepsBar({ current }) {
  const steps = ['Select Seats', 'Passenger Details', 'Payment'];
  return (
    <div className="steps-bar">
      {steps.map((s, i) => {
        const num = i + 1;
        const state = num < current ? 'done' : num === current ? 'active' : '';
        return (
          <React.Fragment key={s}>
            <div className="step-item">
              <div className={`step-circle ${state}`}>{state === 'done' ? '✓' : num}</div>
              <span className={`step-label ${state}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`step-connector ${num < current ? 'done' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function SeatSelection() {
  const { flightId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail } = useAuth();

  const passengers   = parseInt(searchParams.get('passengers') || 1);
  const flightPrice  = location.state?.flightPrice || 4500;

  const [step, setStep]               = useState(1);
  const [seats, setSeats]             = useState([]);
  const [selectedSeats, setSelected]  = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [bookingId, setBookingId]     = useState(null);

  const [passengerForms, setPassengerForms] = useState(
    Array(passengers).fill(null).map(() => ({
      title: 'Mr', firstName: '', lastName: '', dateOfBirth: '',
      gender: 'MALE', passportNumber: '', nationality: 'Indian',
      passportExpiry: '', passengerType: 'ADULT',
    }))
  );

  useEffect(() => { fetchSeats(); }, []);

  async function fetchSeats() {
    try {
      const res = await seatApi.getAvailableSeats(flightId);
      setSeats(res.data);
    } catch { setError('Could not load seat map.'); }
    finally { setLoading(false); }
  }

  async function handleSeatClick(seat) {
    if (seat.status !== 'AVAILABLE') return;
    if (selectedSeats.find(s => s.id === seat.id)) {
      setSelected(selectedSeats.filter(s => s.id !== seat.id)); return;
    }
    if (selectedSeats.length >= passengers) { alert(`Select ${passengers} seat(s)`); return; }
    try {
      await seatApi.holdSeat(flightId, seat.seatNumber);
      setSelected([...selectedSeats, seat]);
      setSeats(seats.map(s => s.id === seat.id ? { ...s, status: 'HELD' } : s));
    } catch (err) { alert(err.response?.data?.message || 'Could not hold seat'); }
  }

  async function handleProceed() {
    if (selectedSeats.length !== passengers) { alert(`Select exactly ${passengers} seat(s)`); return; }
    try {
      const res = await bookingApi.createBooking({ flightId: parseInt(flightId), userEmail, seats: passengers });
      setBookingId(res.data.bookingId);
      setStep(2);
    } catch (err) { setError(err.response?.data?.message || 'Booking failed'); }
  }

  async function handleSubmitPassengers(e) {
    e.preventDefault();
    try {
      for (const form of passengerForms) {
        await passengerApi.addPassenger({ ...form, bookingId: bookingId.toString() });
      }
      navigate(`/payment/${bookingId}?amount=${flightPrice * passengers}`);
    } catch (err) { setError(err.response?.data?.message || 'Failed to add passengers'); }
  }

  function updateForm(index, field, value) {
    const updated = [...passengerForms];
    updated[index] = { ...updated[index], [field]: value };
    setPassengerForms(updated);
  }

  const bySeatClass = (cls) => seats.filter(s => s.seatClass === cls);
  const taxes = Math.round(flightPrice * passengers * 0.18);
  const total  = flightPrice * passengers + taxes;

  if (loading) return <div className="page-container"><div className="loading">Loading seat map…</div></div>;

  return (
    <div className="page-container">
      <StepsBar current={step} />
      {error && <div className="alert-error" style={{ marginBottom: '20px' }}>⚠ {error}</div>}

      {step === 1 && (
        <div className="seat-layout">
          {/* Seat Map */}
          <div className="card seat-map-card">
            <div className="seat-map-header">
              <h2>Select Your Seats</h2>
              <p>{selectedSeats.length} of {passengers} selected</p>
            </div>

            <div className="seat-legend">
              {[['available','Available'],['selected','Selected'],['held','Held'],['confirmed','Booked']].map(([cls,lbl]) => (
                <div key={cls} className="legend-item">
                  <div className={`legend-dot ${cls}`} />{lbl}
                </div>
              ))}
            </div>

            {[['FIRST','first','👑 First Class'],['BUSINESS','business','✨ Business'],['ECONOMY','economy','Economy']].map(([cls, badge, label]) => {
              const seatList = bySeatClass(cls);
              if (!seatList.length) return null;
              return (
                <div key={cls} className="seat-class-section">
                  <div className="class-header">
                    <span className={`class-badge ${badge}`}>{label}</span>
                    <div className="class-divider" />
                  </div>
                  <div className="seats-grid">
                    {seatList.map(seat => {
                      const isSelected = !!selectedSeats.find(s => s.id === seat.id);
                      const stClass = isSelected ? 'selected' : seat.status.toLowerCase();
                      return (
                        <div key={seat.id} className={`seat ${stClass}`}
                          onClick={() => handleSeatClick(seat)} title={`${seat.seatNumber} — ${seat.status}`}>
                          {seat.seatNumber}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {seats.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-400)' }}>
                No seats available for this flight
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="seat-sidebar">
            <div className="card price-info-card">
              <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Fare Breakdown</h3>
              <div className="price-row"><span className="label">Base fare (×{passengers})</span><span className="value">₹{(flightPrice * passengers).toLocaleString()}</span></div>
              <div className="price-row"><span className="label">GST (18%)</span><span className="value">₹{taxes.toLocaleString()}</span></div>
              <div className="price-row"><span className="label">Convenience fee</span><span className="value" style={{ color: 'var(--emerald)' }}>FREE</span></div>
              <div className="price-total-row"><span>Total</span><span style={{ color: 'var(--blue)' }}>₹{total.toLocaleString()}</span></div>
            </div>

            {selectedSeats.length > 0 && (
              <div className="card selected-seats-card">
                <h4>Selected Seats</h4>
                <div className="selected-chips">
                  {selectedSeats.map(s => <span key={s.id} className="seat-chip">{s.seatNumber}</span>)}
                </div>
                <button className="btn-primary proceed-btn"
                  onClick={handleProceed} disabled={selectedSeats.length !== passengers}>
                  Continue to Passenger Details →
                </button>
              </div>
            )}

            {selectedSeats.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-500)', fontSize: '14px' }}>
                Click a seat on the map to select it
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmitPassengers} className="passenger-step">
          {passengerForms.map((form, i) => (
            <div key={i} className="card passenger-card">
              <h3>Passenger {i + 1}</h3>
              <div className="passenger-grid">
                {[
                  { label: 'Title', field: 'title', type: 'select', options: ['Mr','Mrs','Ms','Dr'] },
                  { label: 'First Name', field: 'firstName', type: 'text', placeholder: 'Rahul' },
                  { label: 'Last Name', field: 'lastName', type: 'text', placeholder: 'Sharma' },
                  { label: 'Date of Birth', field: 'dateOfBirth', type: 'date' },
                  { label: 'Gender', field: 'gender', type: 'select', options: ['MALE','FEMALE','OTHER'] },
                  { label: 'Passport Number', field: 'passportNumber', type: 'text', placeholder: 'P1234567' },
                  { label: 'Nationality', field: 'nationality', type: 'text', placeholder: 'Indian' },
                  { label: 'Passport Expiry', field: 'passportExpiry', type: 'date' },
                  { label: 'Passenger Type', field: 'passengerType', type: 'select', options: ['ADULT','CHILD','INFANT'] },
                ].map(({ label, field, type, options, placeholder }) => (
                  <div key={field} className="form-group">
                    <label>{label}</label>
                    {type === 'select' ? (
                      <select value={form[field]} onChange={e => updateForm(i, field, e.target.value)}>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={type} placeholder={placeholder} value={form[field]}
                        onChange={e => updateForm(i, field, e.target.value)}
                        required={['firstName','lastName','dateOfBirth','passportNumber','passportExpiry'].includes(field)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="step-actions">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button type="submit" className="btn-primary">Continue to Payment →</button>
          </div>
        </form>
      )}
    </div>
  );
}
