import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, Banknote, AlertCircle, Lock, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Checkout() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingName, setShippingName] = useState(user?.full_name || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Generate or maintain an idempotency key for this checkout attempt
  const [idempotencyKey] = useState(() => 'IDEMP-' + Math.random().toString(36).substring(2, 12).toUpperCase());

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2>No items to checkout</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>Your cart is empty.</p>
        <Link to="/products" className="btn btn-primary">Return to Catalog</Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!shippingName || !shippingAddress || !shippingCity || !shippingPostalCode) {
      setErrorMsg('Please complete all required shipping fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        '/orders',
        {
          shipping_name: shippingName,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          shipping_state: shippingState,
          shipping_postal_code: shippingPostalCode,
          payment_method: paymentMethod,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      // Refresh cart state
      await fetchCart();

      // Navigate to confirmation page
      navigate(`/orders/confirmed/${res.data.order_id}`, { state: { order: res.data } });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/cart" className="btn btn-outline btn-sm" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Complete Your Order</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ACID Transactional Checkout protected by MySQL InnoDB row-level locking.
        </p>
      </div>

      {/* Simulated Payment Notice Banner */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <ShieldCheck size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
          <strong>Academic Simulation Notice:</strong> This e-commerce project simulates payment capture for educational and demonstration purposes. No actual financial transaction is executed, and no credit card numbers or real banking credentials are requested or stored.
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Shipping & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Shipping Form Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>1. Shipping Details</h3>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Receiver name"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Street Address *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. 123 Maple Street, Apt 4B"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Seattle"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">State / Province</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="WA"
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Postal / ZIP Code *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="98101"
                value={shippingPostalCode}
                onChange={(e) => setShippingPostalCode(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>2. Payment Selection</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${paymentMethod === 'ONLINE' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: paymentMethod === 'ONLINE' ? 'var(--primary-light)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                />
                <CreditCard size={22} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Simulated Online Payment</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Immediate atomic payment authorization simulation
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${paymentMethod === 'COD' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: paymentMethod === 'COD' ? 'var(--primary-light)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <Banknote size={22} style={{ color: '#059669' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Cash on Delivery (COD)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Payment collected in person upon delivery confirmation
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Review & Idempotency Key */}
        <div>
          <div className="card" style={{ padding: '1.75rem', position: 'sticky', top: '5.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              Review Items
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', maxHeight: '220px', overflowY: 'auto' }}>
              {cart.items.map((item) => (
                <div key={item.cart_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.product_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Qty: {item.quantity} &times; ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700 }}>${item.subtotal.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
              <span>Total:</span>
              <span style={{ color: 'var(--primary)' }}>${cart.total_price.toFixed(2)}</span>
            </div>

            {/* Idempotency Details Display */}
            <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Idempotency Protection Key:</div>
              <div className="font-mono" style={{ color: 'var(--primary)', fontWeight: 600 }}>{idempotencyKey}</div>
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Placing Order...
                </>
              ) : (
                <>
                  <Lock size={18} /> Confirm and Place Order
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
