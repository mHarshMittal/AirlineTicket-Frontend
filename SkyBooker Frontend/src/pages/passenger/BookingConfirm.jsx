import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { paymentApi } from '../../api/api';
import './BookingConfirm.css';

export default function BookingConfirm() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    paymentApi.getByBooking(bookingId).then(res => setPayment(res.data)).catch(() => {});
  }, []);

  return (
    <div className="confirm-page">
      <div className="confirm-card">
        <div className="success-ring">✓</div>
        <h1>Booking Confirmed!</h1>
        <p className="confirm-sub">Your flight has been successfully booked.<br/>Have a wonderful journey!</p>

        <div className="confirm-details">
          <div className="detail-row">
            <span className="detail-label">Booking ID</span>
            <span className="detail-value">#{bookingId}</span>
          </div>
          {payment && (<>
            <div className="detail-row">
              <span className="detail-label">Amount Paid</span>
              <span className="detail-value">₹{payment.amount?.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value">{payment.paymentMode}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Transaction ID</span>
              <span className="detail-value txn-value">{payment.transactionId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className="badge badge-success">{payment.status}</span>
            </div>
          </>)}
        </div>

        <div className="email-note">📧 E-ticket sent to your registered email address</div>

        <div className="confirm-actions">
          <button className="btn-primary" onClick={() => navigate('/my-bookings')}>View My Bookings</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>Book Another Flight</button>
        </div>
      </div>
    </div>
  );
}
