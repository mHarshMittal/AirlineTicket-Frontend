import React, { useState, useEffect } from 'react';
import { flightApi, seatApi } from '../../api/api';
import './StaffDashboard.css';

const TODAY = new Date().toISOString().split('T')[0];

export default function StaffDashboard() {
  const [tab, setTab]         = useState('flights');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');

  const [ff, setFf] = useState({
    flightNumber: '', airline: '', source: '', destination: '',
    departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '',
    totalSeats: '', price: ''
  });

  const [sf, setSf] = useState({
    flightId: '', seatNumber: '', seatClass: 'ECONOMY',
    row: '', column: '', isWindow: false, isAisle: false,
    hasExtraLegroom: false, priceMultiplier: 1.0
  });

  useEffect(() => { loadFlights(); }, []);

  async function loadFlights() {
    try { const r = await flightApi.getAll(); setFlights(r.data); }
    catch { setError('Could not load flights'); }
    finally { setLoading(false); }
  }

  async function handleAddFlight(e) {
    e.preventDefault(); setError(''); setMsg('');
    if (ff.departureDate < TODAY) { setError('Departure date cannot be in the past.'); return; }
    const arrDate = ff.arrivalDate || ff.departureDate;
    if (arrDate < ff.departureDate) { setError('Arrival date cannot be before departure date.'); return; }
    if (arrDate === ff.departureDate && ff.arrivalTime && ff.arrivalTime <= ff.departureTime) {
      setError('Same-day flight: arrival time must be after departure time.'); return;
    }
    try {
      await flightApi.addFlight({ ...ff, arrivalDate: arrDate, totalSeats: parseInt(ff.totalSeats), price: parseFloat(ff.price) });
      setMsg('Flight added! Seats have been auto-generated.');
      setFf({ flightNumber:'', airline:'', source:'', destination:'', departureDate:'', departureTime:'', arrivalDate:'', arrivalTime:'', totalSeats:'', price:'' });
      loadFlights();
    } catch (err) { setError(err.response?.data?.message || 'Could not add flight'); }
  }

  async function handleAddSeat(e) {
    e.preventDefault(); setError(''); setMsg('');
    try {
      await seatApi.addSeat({ ...sf, flightId: parseInt(sf.flightId), row: parseInt(sf.row), priceMultiplier: parseFloat(sf.priceMultiplier) });
      setMsg('Seat added successfully!');
      setSf({ flightId:'', seatNumber:'', seatClass:'ECONOMY', row:'', column:'', isWindow:false, isAisle:false, hasExtraLegroom:false, priceMultiplier:1.0 });
    } catch (err) { setError(err.response?.data?.message || 'Could not add seat'); }
  }

  function arrivalDisplay(f) {
    const t = f.arrivalTime || '—';
    return f.arrivalDate && f.arrivalDate !== f.departureDate ? `${t} (+1)` : t;
  }

  const TABS = [['flights', `✈ Flights (${flights.length})`], ['add-flight', '+ Add Flight'], ['add-seat', '+ Add Seat']];

  return (
    <div className="page-container">
      <div className="dash-header">
        <h1>Staff Dashboard</h1>
        <p>Manage your flights and seat inventory</p>
      </div>

      {msg   && <div className="alert-success" style={{ marginBottom:'16px' }}>✓ {msg}</div>}
      {error && <div className="alert-error"   style={{ marginBottom:'16px' }}>⚠ {error}</div>}

      <div className="dash-tabs">
        {TABS.map(([key, lbl]) => (
          <button key={key} className={`dash-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{lbl}</button>
        ))}
      </div>

      {/* Flights Table */}
      {tab === 'flights' && (
        <div className="card flights-table-wrap">
          {loading ? <div className="loading">Loading…</div> : flights.length === 0 ? (
            <div className="empty-table">No flights added yet</div>
          ) : (
            <table className="data-table">
              <thead><tr>
                <th>Flight</th><th>Route</th><th>Departure</th><th>Arrival</th><th>Seats</th><th>Price</th>
              </tr></thead>
              <tbody>
                {flights.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.flightNumber}</strong><div className="time-small">{f.airline}</div></td>
                    <td>{f.source}<span className="route-arrow">→</span>{f.destination}</td>
                    <td>{f.departureDate}<div className="time-small">{f.departureTime}</div></td>
                    <td>{f.arrivalDate || f.departureDate}<div className="time-small">{arrivalDisplay(f)}</div></td>
                    <td><span className={f.availableSeats < 10 ? 'seats-low' : 'seats-ok'}>{f.availableSeats}</span></td>
                    <td>₹{f.price?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Flight Form */}
      {tab === 'add-flight' && (
        <div className="card form-section">
          <h2>Add New Flight</h2>
          <form onSubmit={handleAddFlight}>
            <div className="form-grid">
              {[
                { label:'Flight Number', key:'flightNumber', ph:'6E-101' },
                { label:'Airline Name',  key:'airline',      ph:'IndiGo' },
                { label:'Source',        key:'source',       ph:'Delhi' },
                { label:'Destination',   key:'destination',  ph:'Mumbai' },
              ].map(({ label, key, ph }) => (
                <div key={key} className="form-group">
                  <label>{label}</label>
                  <input type="text" placeholder={ph} value={ff[key]}
                    onChange={e => setFf({ ...ff, [key]: e.target.value })} required />
                </div>
              ))}
              <div className="form-group">
                <label>Departure Date</label>
                <input type="date" min={TODAY} value={ff.departureDate}
                  onChange={e => setFf({ ...ff, departureDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Departure Time</label>
                <input type="time" value={ff.departureTime}
                  onChange={e => setFf({ ...ff, departureTime: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Arrival Date</label>
                <input type="date" min={ff.departureDate || TODAY} value={ff.arrivalDate}
                  onChange={e => setFf({ ...ff, arrivalDate: e.target.value })} />
                <div className="field-hint">Leave empty for same-day arrival</div>
              </div>
              <div className="form-group">
                <label>Arrival Time</label>
                <input type="time" value={ff.arrivalTime}
                  onChange={e => setFf({ ...ff, arrivalTime: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Total Seats</label>
                <input type="number" placeholder="150" min="1" value={ff.totalSeats}
                  onChange={e => setFf({ ...ff, totalSeats: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" placeholder="4500" min="1" value={ff.price}
                  onChange={e => setFf({ ...ff, price: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn-primary">Add Flight →</button>
          </form>
        </div>
      )}

      {/* Add Seat Form */}
      {tab === 'add-seat' && (
        <div className="card form-section">
          <h2>Add Seat to Flight</h2>
          <form onSubmit={handleAddSeat}>
            <div className="form-grid">
              <div className="form-group">
                <label>Flight ID</label>
                <input type="number" placeholder="1" value={sf.flightId}
                  onChange={e => setSf({ ...sf, flightId: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Seat Number</label>
                <input type="text" placeholder="12A" value={sf.seatNumber}
                  onChange={e => setSf({ ...sf, seatNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Class</label>
                <select value={sf.seatClass} onChange={e => setSf({ ...sf, seatClass: e.target.value })}>
                  <option value="ECONOMY">Economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First Class</option>
                </select>
              </div>
              <div className="form-group">
                <label>Row</label>
                <input type="number" placeholder="12" value={sf.row}
                  onChange={e => setSf({ ...sf, row: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Column</label>
                <input type="text" placeholder="A" value={sf.column}
                  onChange={e => setSf({ ...sf, column: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Price Multiplier</label>
                <input type="number" step="0.1" placeholder="1.0" value={sf.priceMultiplier}
                  onChange={e => setSf({ ...sf, priceMultiplier: e.target.value })} />
              </div>
            </div>
            <div className="checkboxes">
              {[['isWindow','Window Seat'],['isAisle','Aisle Seat'],['hasExtraLegroom','Extra Legroom']].map(([key,lbl]) => (
                <label key={key} className="checkbox-item">
                  <input type="checkbox" checked={sf[key]} onChange={e => setSf({ ...sf, [key]: e.target.checked })} />
                  {lbl}
                </label>
              ))}
            </div>
            <button type="submit" className="btn-primary">Add Seat →</button>
          </form>
        </div>
      )}
    </div>
  );
}
