import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home, CreditCard } from 'lucide-react';
import api from '../../services/api';

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (!order) {
      api.get(`/orders/${id}`)
        .then((res) => setOrder(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id, order]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2>Order Information Not Available</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Return Home</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '750px' }}>
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle2 size={38} />
        </div>

        <span className="badge badge-success" style={{ marginBottom: '0.75rem' }}>
          Transaction Committed (ACID)
        </span>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Order Successfully Placed!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Order reference: <strong className="font-mono" style={{ color: 'var(--primary)' }}>{order.order_number}</strong>
        </p>

        {/* Order Metadata Box */}
        <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-color)', textAlign: 'left', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Amount</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>${order.total_amount.toFixed(2)}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Order Status</div>
              <span className="badge badge-info" style={{ marginTop: '0.25rem' }}>{order.order_status}</span>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Payment Method</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' }}>
                {order.payment?.payment_method === 'ONLINE' ? 'Simulated Online Payment' : 'Cash on Delivery'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Payment Status</div>
              <span className={`badge ${order.payment?.payment_status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '0.25rem' }}>
                {order.payment?.payment_status}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Shipping Destination
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <strong>{order.shipping_name}</strong> &bull; {order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/orders/${order.order_id}`} className="btn btn-primary">
            <Package size={18} /> View Order Details &amp; Tracking
          </Link>
          <Link to="/products" className="btn btn-outline">
            <Home size={18} /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
