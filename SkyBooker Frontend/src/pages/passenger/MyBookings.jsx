import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { paymentApi } from '../../api/api';
import './MyBookings.css';

const STATUS_BADGE = {
  PAID:     'badge-success',
  REFUNDED: 'badge-warning',
  PENDING:  'badge-blue',
  FAILED:   'badge-danger',
};

export default function MyBookings() {
  const { userEmail } = useAuth();
  const navigate      = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try { const res = await paymentApi.getByUser(userEmail); setPayments(res.data); }
    catch { /* empty state */ } finally { setLoading(false); }
  }

  async function handleRefund(bookingId) {
    if (!window.confirm('Cancel this booking and request a refund?')) return;
    try {
      await paymentApi.refund(bookingId);
      setMsg('Booking cancelled. Refund will be processed in 5–7 working days.');
      load();
    } catch (err) { alert(err.response?.data?.message || 'Could not cancel booking'); }
  }

  if (loading) return <div className="page-container"><div className="loading">Loading bookings…</div></div>;

  return (
    <div className="page-container">
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <p>{payments.length} booking{payments.length !== 1 ? 's' : ''} found</p>
      </div>

      {msg && <div className="alert-success" style={{ marginBottom: '20px' }}>✓ {msg}</div>}

      {payments.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">🎫</div>
          <h3>No bookings yet</h3>
          <p>Your flight bookings will appear here once you've booked.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Search Flights</button>
        </div>
      ) : (
        <div className="bookings-list">
          {payments.map(p => (
            <div key={p.paymentId} className="card booking-card">
              <div className="booking-card-body">
                <div className="booking-top">
                  <div className="booking-id-block">
                    <div className="booking-id-label">Booking Reference</div>
                    <div className="booking-id-value">#{p.bookingId}</div>
                  </div>
                  <span className={`badge ${STATUS_BADGE[p.status] || 'badge-neutral'}`}>{p.status}</span>
                </div>

                <div className="booking-grid">
                  <div>
                    <div className="booking-field-label">Amount Paid</div>
                    <div className="booking-field-value">₹{p.amount?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="booking-field-label">Payment Method</div>
                    <div className="booking-field-value">{p.paymentMode}</div>
                  </div>
                  <div>
                    <div className="booking-field-label">Transaction ID</div>
                    <div className="booking-field-value txn-mono">{p.transactionId}</div>
                  </div>
                  <div>
                    <div className="booking-field-label">Date</div>
                    <div className="booking-field-value">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                    </div>
                  </div>
                </div>

                <div className="booking-footer">
                  {p.status === 'PAID' && (
                    <button className="btn-danger" onClick={() => handleRefund(p.bookingId)}>
                      Cancel & Refund
                    </button>
                  )}
                  {p.status === 'REFUNDED' && (
                    <div className="refund-badge">✓ Refund of ₹{p.refundAmount?.toLocaleString()} initiated</div>
                  )}
                  {p.status !== 'PAID' && p.status !== 'REFUNDED' && <span />}
                  <span style={{ fontSize: '13px', color: 'var(--gray-400)' }}>Payment ID #{p.paymentId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
