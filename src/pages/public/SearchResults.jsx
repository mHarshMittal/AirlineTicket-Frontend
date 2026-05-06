import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { flightApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import './SearchResults.css';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const source      = searchParams.get('source');
  const destination = searchParams.get('destination');
  const date        = searchParams.get('date');
  const passengers  = parseInt(searchParams.get('passengers') || 1);

  const [flights, setFlights]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [sortBy, setSortBy]     = useState('price');

  useEffect(() => { fetchFlights(); }, []);

  async function fetchFlights() {
    try {
      setLoading(true);
      const res = await flightApi.search(source, destination, date);
      setFlights(res.data);
    } catch (err) {
      setError('Could not fetch flights. Please try again.');
    } finally { setLoading(false); }
  }

  function handleSelectFlight(flight) {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/seats/${flight.id}?passengers=${passengers}` } });
      return;
    }
    navigate(`/seats/${flight.id}?passengers=${passengers}`, { state: { flightPrice: flight.price } });
  }

  const sorted = [...flights].sort((a, b) =>
    sortBy === 'price' ? a.price - b.price : (a.durationMinutes || 0) - (b.durationMinutes || 0)
  );

  if (loading) return <div className="page-container"><div className="loading">Searching flights…</div></div>;

  return (
    <div className="page-container">
      {/* Summary Bar */}
      <div className="search-summary">
        <div className="summary-route">
          <span>{source}</span>
          <span className="summary-plane">✈</span>
          <span>{destination}</span>
        </div>
        <div className="summary-meta">
          <div className="summary-pill">📅 {date}</div>
          <div className="summary-pill">👤 {passengers} Passenger{passengers > 1 ? 's' : ''}</div>
          <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}
            onClick={() => navigate('/')}>← Change Search</button>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '20px' }}>⚠ {error}</div>}

      {!error && (
        <>
          <div className="results-toolbar">
            <div className="results-count">
              <span>{sorted.length}</span> flight{sorted.length !== 1 ? 's' : ''} found
            </div>
            <div className="sort-group">
              <span className="sort-label">Sort:</span>
              <button className={`sort-btn ${sortBy === 'price' ? 'active' : ''}`}
                onClick={() => setSortBy('price')}>Cheapest</button>
              <button className={`sort-btn ${sortBy === 'duration' ? 'active' : ''}`}
                onClick={() => setSortBy('duration')}>Fastest</button>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="no-flights">
              <div className="no-flights-icon">✈️</div>
              <h3>No flights found</h3>
              <p>Try a different date or route</p>
              <button className="btn-primary" onClick={() => navigate('/')}>Search Again</button>
            </div>
          ) : (
            <div className="flights-list">
              {sorted.map(flight => (
                <div key={flight.id} className="flight-card">
                  <div className="flight-card-left">
                    {/* Airline */}
                    <div className="flight-airline-block">
                      <div className="flight-airline-name">{flight.airline}</div>
                      <span className="flight-number">{flight.flightNumber}</span>
                    </div>

                    {/* Route */}
                    <div className="flight-route">
                      <div className="time-block">
                        <div className="time-value">{flight.departureTime}</div>
                        <div className="time-city">{source}</div>
                      </div>
                      <div className="route-line">
                        <div className="route-line-bar">
                          <span className="route-plane-icon">✈</span>
                        </div>
                        <div className="route-direct">Non-stop</div>
                      </div>
                      <div className="time-block">
                        <div className="time-value">{flight.arrivalTime}</div>
                        <div className="time-city">{destination}</div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flight-badges">
                      <span className={`seat-badge ${flight.availableSeats < 10 ? 'low' : 'ok'}`}>
                        {flight.availableSeats < 10 ? '🔥 ' : ''}
                        {flight.availableSeats} seats left
                      </span>
                    </div>
                  </div>

                  {/* Price + Action */}
                  <div className="flight-card-right">
                    <div>
                      <div className="price-per-person">Per person</div>
                      <div className="price-value">₹{flight.price?.toLocaleString()}</div>
                      {passengers > 1 && (
                        <div className="price-total">Total ₹{(flight.price * passengers)?.toLocaleString()}</div>
                      )}
                    </div>
                    <button className="select-btn"
                      onClick={() => handleSelectFlight(flight)}
                      disabled={flight.availableSeats === 0}>
                      {flight.availableSeats === 0 ? 'Sold Out' : 'Select →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
