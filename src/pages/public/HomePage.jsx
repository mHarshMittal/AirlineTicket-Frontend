import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const popularRoutes = [
  { from: 'Delhi', to: 'Mumbai', price: '4,499', tag: 'Popular', color: '#eff6ff' },
  { from: 'Mumbai', to: 'Bengaluru', price: '4,799', tag: 'Trending', color: '#f0fdf4' },
  { from: 'Delhi', to: 'Bengaluru', price: '4,999', tag: 'Direct', color: '#fef9c3' },
  { from: 'Mumbai', to: 'Delhi', price: '4,299', tag: 'Best Value', color: '#fdf2f8' },
];

const features = [
  { icon: '⚡', title: 'Instant Booking', desc: 'Book your flight in under 2 minutes with our streamlined checkout flow.', bg: '#eff6ff', color: '#2563eb' },
  { icon: '💰', title: 'Lowest Fares', desc: 'Compare real-time prices across all airlines and get the best deal.', bg: '#f0fdf4', color: '#059669' },
  { icon: '🔒', title: 'Secure Payments', desc: 'Bank-grade encryption keeps your payment information always safe.', bg: '#fef9c3', color: '#d97706' },
  { icon: '📋', title: 'Easy Management', desc: 'View, manage and cancel bookings from your personal dashboard.', bg: '#fdf2f8', color: '#db2777' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ source: '', destination: '', date: '', passengers: 1 });

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  function handleSwap() { setForm({ ...form, source: form.destination, destination: form.source }); }

  function handleSearch(e) {
    e.preventDefault();
    if (!form.source || !form.destination || !form.date) { alert('Please fill all fields'); return; }
    navigate(`/search?source=${form.source}&destination=${form.destination}&date=${form.date}&passengers=${form.passengers}`);
  }

  function handleRouteClick(route) {
    setForm({ ...form, source: route.from, destination: route.to });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            India's fastest flight booking platform
          </div>
          <h1>Find & Book Flights<br /><span>at the Best Price</span></h1>
          <p>Search across all major airlines, compare fares in real-time, and book your journey in seconds.</p>

          {/* Search Card */}
          <div className="search-card">
            <div className="search-card-title">Search Flights</div>
            <form onSubmit={handleSearch}>
              <div className="search-fields">
                <div className="search-field-wrap">
                  <div className="search-field-label">From</div>
                  <input className="search-input" type="text" name="source"
                    placeholder="City or airport" value={form.source} onChange={handleChange} />
                </div>

                <button type="button" className="swap-btn" onClick={handleSwap} title="Swap cities">⇄</button>

                <div className="search-field-wrap">
                  <div className="search-field-label">To</div>
                  <input className="search-input" type="text" name="destination"
                    placeholder="City or airport" value={form.destination} onChange={handleChange} />
                </div>

                <div className="search-field-wrap">
                  <div className="search-field-label">Date</div>
                  <input className="search-input" type="date" name="date"
                    value={form.date} min={new Date().toISOString().split('T')[0]} onChange={handleChange} />
                </div>

                <div className="search-field-wrap">
                  <div className="search-field-label">Passengers</div>
                  <select className="search-input" name="passengers" value={form.passengers} onChange={handleChange}>
                    {[1,2,3,4,5,6].map(n => (
                      <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="search-submit-btn" style={{ width: '100%' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Search Flights
              </button>
            </form>
          </div>

          {/* Hero Stats */}
          <div className="hero-stats">
            {[['2M+', 'Happy Travellers'], ['500+', 'Daily Flights'], ['₹999', 'Lowest Fare']].map(([num, label]) => (
              <div key={label} className="hero-stat"><strong>{num}</strong>{label}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="home-content">
        {/* Popular Routes */}
        <div className="section-eyebrow">Top Destinations</div>
        <div className="section-title">Popular Routes</div>
        <div className="routes-grid">
          {popularRoutes.map((route, i) => (
            <div key={i} className="route-card" onClick={() => handleRouteClick(route)}
              style={{ background: route.color }}>
              <div className="route-airline">Direct Flight</div>
              <div className="route-cities">
                <span>{route.from}</span>
                <span className="route-arrow">✈</span>
                <span>{route.to}</span>
              </div>
              <div className="route-meta">
                <div className="route-price">
                  <small>Starting from</small>
                  ₹{route.price}
                </div>
                <span className="route-tag">{route.tag}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ marginTop: '64px' }}>
          <div className="section-eyebrow">Why SkyBooker</div>
          <div className="section-title">Built for modern travellers</div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrap" style={{ background: f.bg }}>
                  <span style={{ color: f.color }}>{f.icon}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="cta-banner">
          <div>
            <h2>Ready to take off?</h2>
            <p>Join over 2 million travellers who book with SkyBooker every month.</p>
          </div>
          <button className="cta-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Search Flights →
          </button>
        </div>
      </div>
    </div>
  );
}
