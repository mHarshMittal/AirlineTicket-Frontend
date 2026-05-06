import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import './PaymentPage.css';

const METHODS = [
  { value: 'UPI',        label: 'UPI',                desc: 'Google Pay, PhonePe, Paytm & more', icon: '📱', bg: '#f0fdf4' },
  { value: 'CARD',       label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay',           icon: '💳', bg: '#eff6ff' },
  { value: 'NETBANKING', label: 'Net Banking',          desc: 'All major Indian banks',            icon: '🏦', bg: '#fef9c3' },
  { value: 'WALLET',     label: 'Wallet',               desc: 'Paytm, MobiKwik & more',           icon: '👛', bg: '#fdf2f8' },
];

/**
 * Dynamically loads the Razorpay Checkout script from their CDN.
 * Returns a Promise that resolves when the script is ready.
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src   = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const { bookingId }     = useParams();
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const { userEmail }     = useAuth();

  const amount = parseFloat(searchParams.get('amount') || 4500);
  const taxes  = Math.round(amount * 0.18);
  const total  = amount + taxes;

  const [mode,    setMode]    = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [rzpReady, setRzpReady] = useState(false);

  // Pre-load Razorpay script as soon as the page mounts
  useEffect(() => {
    loadRazorpayScript().then((ok) => {
      if (!ok) setError('Could not load Razorpay. Check your internet connection.');
      else setRzpReady(true);
    });
  }, []);

  async function handlePay() {
    if (!rzpReady) { setError('Razorpay is not ready yet. Please wait a moment.'); return; }
    setLoading(true);
    setError('');

    try {
      // ── Step 1: Create Razorpay order on backend ───────────────────────────
      const orderRes = await paymentApi.createRazorpayOrder({
        bookingId: parseInt(bookingId),
        userEmail,
        amount:   total,   // total including taxes
        currency: 'INR',
      });

      const { razorpayOrderId, keyId, amountInPaise, currency } = orderRes.data;

      // ── Step 2: Open Razorpay Checkout modal ───────────────────────────────
      const options = {
        key:      keyId,
        amount:   amountInPaise,
        currency: currency,
        name:     'SkyBooker',
        description: `Flight Booking #${bookingId}`,
        image:    'https://cdn-icons-png.flaticon.com/512/3125/3125713.png',
        order_id: razorpayOrderId,

        // Called by Razorpay after user completes payment
        handler: async function (rzpResponse) {
          try {
            // ── Step 3: Verify signature on backend ─────────────────────────
            const verifyRes = await paymentApi.verifyPayment({
              razorpayOrderId:   rzpResponse.razorpay_order_id,
              razorpayPaymentId: rzpResponse.razorpay_payment_id,
              razorpaySignature: rzpResponse.razorpay_signature,
              bookingId:         parseInt(bookingId),
              userEmail,
              amount:            total,
              paymentMode:       mode,
            });

            if (verifyRes.data?.status === 'PAID') {
              navigate(`/booking-confirm/${bookingId}`);
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },

        prefill: {
          email: userEmail,
          // name and contact can be added from user profile if available
        },

        notes: {
          bookingId,
          userEmail,
        },

        theme: { color: '#2563eb' },

        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment was cancelled. You can try again.');
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);

      // Razorpay fires this event when the payment fails inside the widget
      rzpInstance.on('payment.failed', (response) => {
        setLoading(false);
        setError(`Payment failed: ${response.error?.description || 'Unknown error'}. Please try again.`);
      });

      rzpInstance.open();

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Could not initiate payment. Please try again.');
    }
  }

  return (
    <div className="page-container">
      <div className="payment-layout">

        {/* ── Left panel: payment method selector ── */}
        <div className="card payment-card">
          <h2>Choose Payment Method</h2>
          <p className="payment-subtitle">Secure checkout powered by Razorpay — all transactions are encrypted</p>

          <div className="payment-methods">
            {METHODS.map(m => (
              <div
                key={m.value}
                className={`payment-method ${mode === m.value ? 'active' : ''}`}
                onClick={() => setMode(m.value)}
              >
                <div className="method-icon-wrap" style={{ background: m.bg }}>{m.icon}</div>
                <div className="method-info">
                  <div className="method-name">{m.label}</div>
                  <div className="method-desc">{m.desc}</div>
                </div>
                <div className={`method-radio ${mode === m.value ? 'active' : ''}`} />
              </div>
            ))}
          </div>

          {!rzpReady && !error && (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '13px', marginBottom: '12px' }}>
              ⏳ Loading payment gateway…
            </p>
          )}

          {error && (
            <div className="alert-error" style={{ marginBottom: '16px' }}>⚠ {error}</div>
          )}

          <button
            className="btn-primary pay-btn"
            onClick={handlePay}
            disabled={loading || !rzpReady}
          >
            {loading ? 'Opening Razorpay…' : `Pay ₹${total.toLocaleString()} →`}
          </button>

          <p className="secure-note">🔒 Powered by Razorpay · 256-bit SSL · PCI-DSS compliant</p>
        </div>

        {/* ── Right panel: fare summary ── */}
        <div>
          <div className="card fare-summary-card">
            <h3>Fare Summary</h3>
            <div className="fare-line"><span>Base Fare</span><span>₹{amount.toLocaleString()}</span></div>
            <div className="fare-line"><span>GST (18%)</span><span>₹{taxes.toLocaleString()}</span></div>
            <div className="fare-line"><span>Convenience Fee</span><span className="fare-free">FREE</span></div>
            <div className="fare-line total"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
            <div className="booking-ref-box">
              <span className="booking-ref-label">Booking ID</span>
              <span className="booking-ref-value">#{bookingId}</span>
            </div>
          </div>

          <div className="card info-box">
            <h4>Important Notes</h4>
            <div className="info-item-list">
              {[
                'Razorpay test mode — use card 4111 1111 1111 1111, any future expiry, any CVV.',
                'Cancellation charges may apply based on airline policy.',
                'Refunds are processed in 5–7 working days.',
                'E-ticket will be emailed to your registered address after payment.',
              ].map(txt => (
                <div key={txt} className="info-item-row">
                  <div className="info-dot" />
                  <span>{txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
