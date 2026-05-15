import React, { useState, useEffect } from 'react';
import { airlineApi, promoApi } from '../../api/api';
import './AdminDashboard.css';

const TODAY = new Date().toISOString().split('T')[0];

export default function AdminDashboard() {
  const [tab, setTab]           = useState('airlines');
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [promos,   setPromos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [msg,      setMsg]      = useState('');
  const [error,    setError]    = useState('');

  const [af,  setAf]  = useState({ name:'', iataCode:'', icaoCode:'', country:'', contactEmail:'', contactPhone:'' });
  const [apf, setApf] = useState({ name:'', iataCode:'', icaoCode:'', city:'', country:'', latitude:'', longitude:'', timezone:'Asia/Kolkata' });
  const [pf,  setPf]  = useState({
    code:'', description:'', discountType:'PERCENTAGE',
    discountValue:'', maxDiscount:'', minOrderAmount:'',
    usageLimit:'', expiryDate:''
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [ar, apr, pr] = await Promise.all([
        airlineApi.getAll(),
        airlineApi.getAllAirports(),
        promoApi.getAll(),
      ]);
      setAirlines(ar.data);
      setAirports(apr.data);
      setPromos(pr.data);
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

  async function handleAddPromo(e) {
    e.preventDefault(); setError(''); setMsg('');
    try {
      const payload = {
        code:            pf.code.toUpperCase().trim(),
        description:     pf.description,
        discountType:    pf.discountType,
        discountValue:   parseFloat(pf.discountValue),
        maxDiscount:     parseFloat(pf.maxDiscount)    || 0,
        minOrderAmount:  parseFloat(pf.minOrderAmount) || 0,
        usageLimit:      parseInt(pf.usageLimit)       || 0,
        expiryDate:      pf.expiryDate,
      };
      await promoApi.create(payload);
      setMsg(`Promo code "${payload.code}" created!`);
      setPf({ code:'', description:'', discountType:'PERCENTAGE', discountValue:'', maxDiscount:'', minOrderAmount:'', usageLimit:'', expiryDate:'' });
      loadAll();
    } catch (err) { setError(err.response?.data?.message || 'Could not create promo code'); }
  }

  async function handleToggleAirline(id) {
    try { await airlineApi.toggleStatus(id); loadAll(); }
    catch { setError('Could not update airline status'); }
  }

  async function handleTogglePromo(id) {
    try { await promoApi.toggle(id); loadAll(); }
    catch { setError('Could not update promo status'); }
  }

  const TABS = [
    ['airlines',    `Airlines (${airlines.length})`],
    ['add-airline', '+ Add Airline'],
    ['airports',    `Airports (${airports.length})`],
    ['add-airport', '+ Add Airport'],
    ['promos',      `Promo Codes (${promos.length})`],
    ['add-promo',   '+ Add Promo'],
  ];

  const stats = [
    { num: airlines.length,                         label: 'Total Airlines',  icon: '✈️', bg: '#eff6ff', color: '#2563eb' },
    { num: airlines.filter(a => a.active).length,   label: 'Active Airlines', icon: '✅', bg: '#f0fdf4', color: '#059669' },
    { num: airports.length,                         label: 'Total Airports',  icon: '🏢', bg: '#fef9c3', color: '#d97706' },
    { num: promos.filter(p => p.active).length,     label: 'Active Promos',   icon: '🎟', bg: '#fdf2f8', color: '#7c3aed' },
  ];

  if (loading) return <div className="page-container"><div className="loading">Loading admin panel…</div></div>;

  return (
    <div className="page-container">
      <div className="dash-header">
        <h1>Admin Dashboard</h1>
        <p>Manage airlines, airports and promo codes</p>
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

      {/* ── Airlines List ── */}
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
                    <button className={a.active ? 'toggle-deactivate' : 'toggle-activate'} onClick={() => handleToggleAirline(a.id)}>
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

      {/* ── Add Airline ── */}
      {tab === 'add-airline' && (
        <div className="card form-section">
          <h2>Add New Airline</h2>
          <form onSubmit={handleAddAirline} className="admin-form">
            <div className="form-grid">
              {[
                { label:'Airline Name', key:'name',         ph:'IndiGo',              req:true },
                { label:'IATA Code',    key:'iataCode',     ph:'6E',    max:3,         req:true },
                { label:'ICAO Code',    key:'icaoCode',     ph:'IGO' },
                { label:'Country',      key:'country',      ph:'India',               req:true },
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

      {/* ── Airports List ── */}
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

      {/* ── Add Airport ── */}
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

      {/* ── Promo Codes List ── */}
      {tab === 'promos' && (
        <div className="card flights-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th><th>Type</th><th>Discount</th><th>Min Order</th>
                <th>Used / Limit</th><th>Expiry</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(p => {
                const isExpired = new Date(p.expiryDate) < new Date(TODAY);
                return (
                  <tr key={p.id}>
                    <td>
                      <strong className="promo-code-chip">{p.code}</strong>
                      {p.description && <div className="promo-desc-small">{p.description}</div>}
                    </td>
                    <td><span className={`badge ${p.discountType === 'PERCENTAGE' ? 'badge-info' : 'badge-warning'}`}>{p.discountType}</span></td>
                    <td>
                      {p.discountType === 'PERCENTAGE'
                        ? `${p.discountValue}%${p.maxDiscount > 0 ? ` (max ₹${p.maxDiscount})` : ''}`
                        : `₹${p.discountValue}`}
                    </td>
                    <td>{p.minOrderAmount > 0 ? `₹${p.minOrderAmount}` : '—'}</td>
                    <td>{p.usedCount} / {p.usageLimit > 0 ? p.usageLimit : '∞'}</td>
                    <td>
                      <span style={{ color: isExpired ? '#dc2626' : '#374151' }}>
                        {p.expiryDate}{isExpired ? ' ⚠' : ''}
                      </span>
                    </td>
                    <td><span className={`badge ${p.active && !isExpired ? 'badge-success' : 'badge-danger'}`}>{p.active && !isExpired ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className={p.active ? 'toggle-deactivate' : 'toggle-activate'} onClick={() => handleTogglePromo(p.id)}>
                        {p.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {promos.length === 0 && <div className="empty-table">No promo codes created yet</div>}
        </div>
      )}

      {/* ── Add Promo Code ── */}
      {tab === 'add-promo' && (
        <div className="card form-section">
          <h2>Create Promo Code</h2>
          <form onSubmit={handleAddPromo} className="admin-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Promo Code *</label>
                <input type="text" placeholder="e.g. SAVE20" maxLength={20}
                  value={pf.code}
                  onChange={e => setPf({ ...pf, code: e.target.value.toUpperCase() })}
                  required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" placeholder="e.g. 20% off on all flights"
                  value={pf.description}
                  onChange={e => setPf({ ...pf, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Discount Type *</label>
                <select value={pf.discountType} onChange={e => setPf({ ...pf, discountType: e.target.value })}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Discount Value * {pf.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}</label>
                <input type="number" min="0.01" step="0.01"
                  placeholder={pf.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 500'}
                  value={pf.discountValue}
                  onChange={e => setPf({ ...pf, discountValue: e.target.value })}
                  required />
              </div>
              {pf.discountType === 'PERCENTAGE' && (
                <div className="form-group">
                  <label>Max Discount Cap (₹) <span className="form-hint">0 = no cap</span></label>
                  <input type="number" min="0" step="1" placeholder="e.g. 1000"
                    value={pf.maxDiscount}
                    onChange={e => setPf({ ...pf, maxDiscount: e.target.value })} />
                </div>
              )}
              <div className="form-group">
                <label>Minimum Order Amount (₹) <span className="form-hint">0 = no minimum</span></label>
                <input type="number" min="0" step="1" placeholder="e.g. 2000"
                  value={pf.minOrderAmount}
                  onChange={e => setPf({ ...pf, minOrderAmount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Usage Limit <span className="form-hint">0 = unlimited</span></label>
                <input type="number" min="0" step="1" placeholder="e.g. 100"
                  value={pf.usageLimit}
                  onChange={e => setPf({ ...pf, usageLimit: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Expiry Date *</label>
                <input type="date" min={TODAY}
                  value={pf.expiryDate}
                  onChange={e => setPf({ ...pf, expiryDate: e.target.value })}
                  required />
              </div>
            </div>

            {/* Preview */}
            {pf.code && pf.discountValue && (
              <div className="promo-preview">
                <div className="promo-preview-chip">{pf.code}</div>
                <div className="promo-preview-desc">
                  {pf.discountType === 'PERCENTAGE'
                    ? `${pf.discountValue}% off${pf.maxDiscount ? ` (max ₹${pf.maxDiscount})` : ''}`
                    : `₹${pf.discountValue} flat off`}
                  {pf.minOrderAmount ? ` · Min order ₹${pf.minOrderAmount}` : ''}
                  {pf.usageLimit ? ` · Limit: ${pf.usageLimit} uses` : ' · Unlimited uses'}
                  {pf.expiryDate ? ` · Expires ${pf.expiryDate}` : ''}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop:'8px' }}>Create Promo Code →</button>
          </form>
        </div>
      )}
    </div>
  );
}
