import React, { useState, useEffect } from 'react';
import { airlineApi } from '../../api/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [tab, setTab]         = useState('airlines');
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');

  const [af, setAf] = useState({ name:'', iataCode:'', icaoCode:'', country:'', contactEmail:'', contactPhone:'' });
  const [apf, setApf] = useState({ name:'', iataCode:'', icaoCode:'', city:'', country:'', latitude:'', longitude:'', timezone:'Asia/Kolkata' });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [ar, apr] = await Promise.all([airlineApi.getAll(), airlineApi.getAllAirports()]);
      setAirlines(ar.data); setAirports(apr.data);
    } catch { setError('Could not load data'); }
    finally { setLoading(false); }
  }

  async function handleAddAirline(e) {
    e.preventDefault(); setError(''); setMsg('');
    try {
      await airlineApi.addAirline(af);
      setMsg('Airline added!');
      setAf({ name:'', iataCode:'', icaoCode:'', country:'', contactEmail:'', contactPhone:'' });
      loadAll();
    } catch (err) { setError(err.response?.data?.message || 'Could not add airline'); }
  }

  async function handleAddAirport(e) {
    e.preventDefault(); setError(''); setMsg('');
    try {
      await airlineApi.addAirport({ ...apf, latitude: parseFloat(apf.latitude), longitude: parseFloat(apf.longitude) });
      setMsg('Airport added!');
      setApf({ name:'', iataCode:'', icaoCode:'', city:'', country:'', latitude:'', longitude:'', timezone:'Asia/Kolkata' });
      loadAll();
    } catch (err) { setError(err.response?.data?.message || 'Could not add airport'); }
  }

  async function handleToggle(id) {
    try { await airlineApi.toggleStatus(id); loadAll(); }
    catch { setError('Could not update airline status'); }
  }

  const TABS = [
    ['airlines',    `Airlines (${airlines.length})`],
    ['add-airline', '+ Add Airline'],
    ['airports',    `Airports (${airports.length})`],
    ['add-airport', '+ Add Airport'],
  ];

  const stats = [
    { num: airlines.length, label: 'Total Airlines', icon: '✈️', bg: '#eff6ff', color: '#2563eb' },
    { num: airlines.filter(a => a.active).length, label: 'Active Airlines', icon: '✅', bg: '#f0fdf4', color: '#059669' },
    { num: airports.length, label: 'Total Airports', icon: '🏢', bg: '#fef9c3', color: '#d97706' },
  ];

  if (loading) return <div className="page-container"><div className="loading">Loading admin panel…</div></div>;

  return (
    <div className="page-container">
      <div className="dash-header">
        <h1>Admin Dashboard</h1>
        <p>Manage airlines and airport network</p>
      </div>

      {msg   && <div className="alert-success" style={{ marginBottom:'20px' }}>✓ {msg}</div>}
      {error && <div className="alert-error"   style={{ marginBottom:'20px' }}>⚠ {error}</div>}

      {/* Stats */}
      <div className="stats-row">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-number" style={{ color: s.color }}>{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-tabs">
        {TABS.map(([key, lbl]) => (
          <button key={key} className={`dash-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{lbl}</button>
        ))}
      </div>

      {/* Airlines List */}
      {tab === 'airlines' && (
        <div className="card flights-table-wrap">
          <table className="data-table">
            <thead><tr><th>Airline</th><th>IATA</th><th>Country</th><th>Contact</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {airlines.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td><span className="iata-chip">{a.iataCode}</span></td>
                  <td>{a.country}</td>
                  <td>{a.contactEmail || '—'}</td>
                  <td><span className={`badge ${a.active ? 'badge-success' : 'badge-danger'}`}>{a.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className={a.active ? 'toggle-deactivate' : 'toggle-activate'} onClick={() => handleToggle(a.id)}>
                      {a.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {airlines.length === 0 && <div className="empty-table">No airlines added yet</div>}
        </div>
      )}

      {/* Add Airline */}
      {tab === 'add-airline' && (
        <div className="card form-section">
          <h2>Add New Airline</h2>
          <form onSubmit={handleAddAirline} className="admin-form">
            <div className="form-grid">
              {[
                { label:'Airline Name', key:'name',         ph:'IndiGo',           req:true },
                { label:'IATA Code',    key:'iataCode',     ph:'6E',   max:3,       req:true },
                { label:'ICAO Code',    key:'icaoCode',     ph:'IGO' },
                { label:'Country',      key:'country',      ph:'India',             req:true },
                { label:'Contact Email',key:'contactEmail', ph:'support@airline.com', type:'email' },
                { label:'Contact Phone',key:'contactPhone', ph:'1800-xxx-xxxx' },
              ].map(({ label, key, ph, req, max, type }) => (
                <div key={key} className="form-group">
                  <label>{label}</label>
                  <input type={type || 'text'} placeholder={ph} maxLength={max}
                    value={af[key]} onChange={e => setAf({ ...af, [key]: e.target.value })} required={!!req} />
                </div>
              ))}
            </div>
            <button type="submit" className="btn-primary">Add Airline →</button>
          </form>
        </div>
      )}

      {/* Airports List */}
      {tab === 'airports' && (
        <div className="card flights-table-wrap">
          <table className="data-table">
            <thead><tr><th>Airport</th><th>IATA</th><th>City</th><th>Country</th><th>Timezone</th></tr></thead>
            <tbody>
              {airports.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td><span className="iata-chip">{a.iataCode}</span></td>
                  <td>{a.city}</td>
                  <td>{a.country}</td>
                  <td>{a.timezone}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {airports.length === 0 && <div className="empty-table">No airports added yet</div>}
        </div>
      )}

      {/* Add Airport */}
      {tab === 'add-airport' && (
        <div className="card form-section">
          <h2>Add New Airport</h2>
          <form onSubmit={handleAddAirport} className="admin-form">
            <div className="form-grid">
              {[
                { label:'Airport Name', key:'name',      ph:'Indira Gandhi International Airport', req:true },
                { label:'IATA Code',    key:'iataCode',  ph:'DEL', max:3, req:true },
                { label:'ICAO Code',    key:'icaoCode',  ph:'VIDP' },
                { label:'City',         key:'city',      ph:'Delhi', req:true },
                { label:'Country',      key:'country',   ph:'India', req:true },
                { label:'Latitude',     key:'latitude',  ph:'28.5562', type:'number', step:'0.0001' },
                { label:'Longitude',    key:'longitude', ph:'77.1000', type:'number', step:'0.0001' },
                { label:'Timezone',     key:'timezone',  ph:'Asia/Kolkata' },
              ].map(({ label, key, ph, req, max, type, step }) => (
                <div key={key} className="form-group">
                  <label>{label}</label>
                  <input type={type || 'text'} placeholder={ph} maxLength={max} step={step}
                    value={apf[key]} onChange={e => setApf({ ...apf, [key]: e.target.value })} required={!!req} />
                </div>
              ))}
            </div>
            <button type="submit" className="btn-primary">Add Airport →</button>
          </form>
        </div>
      )}
    </div>
  );
}
