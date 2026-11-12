import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, MapPin, CreditCard, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      setFeedbackMsg({ type: '', text: '' });
      const res = await api.post(`/orders/${id}/cancel`);
      setOrder(res.data);
      setShowCancelModal(false);
      setFeedbackMsg({
        type: 'success',
        text: 'Order successfully cancelled. Inventory stock has been restored atomically in MySQL.'
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'danger',
        text: err.message || 'Failed to cancel order.'
      });
    } finally {
      setCancelling(false);
    }
  };

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
        <h2>Order Not Found</h2>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Orders</Link>
      </div>
    );
  }

  const isCancellable = ['PLACED', 'CONFIRMED'].includes(order.order_status);

  // Status progression steps
  const steps = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  const currentStepIdx = steps.indexOf(order.order_status);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/orders" className="btn btn-outline btn-sm">
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
      </div>

      {feedbackMsg.text && (
        <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: feedbackMsg.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)', color: feedbackMsg.type === 'success' ? '#15803d' : 'var(--danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {feedbackMsg.text}
        </div>
      )}

      {/* Header Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {order.order_number}
              </h1>
              <span className={`badge ${order.order_status === 'DELIVERED' ? 'badge-success' : order.order_status === 'CANCELLED' ? 'badge-danger' : 'badge-info'}`}>
                {order.order_status}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} /> Placed on {new Date(order.created_at).toLocaleString()}
            </div>
          </div>

          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn btn-danger btn-sm"
            >
              <XCircle size={16} /> Cancel Order
            </button>
          )}
        </div>

        {/* Visual Lifecycle Progress Bar */}
        {order.order_status !== 'CANCELLED' ? (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Delivery Progression
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              {steps.map((st, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={st}>
                    <div
                      style={{
                        height: '8px',
                        borderRadius: 'var(--radius-full)',
                        background: isPassed ? 'var(--primary)' : 'var(--bg-muted)',
                        marginBottom: '0.5rem',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 700 : 500, color: isPassed ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {st}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ padding: '1rem', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle size={18} /> This order was cancelled. Reserved inventory was restored back to the stock ledger.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Shipping Address Snapshot */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MapPin size={18} style={{ color: 'var(--primary)' }} /> Shipping Snapshot
          </h3>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600 }}>{order.shipping_name}</div>
            <div style={{ color: 'var(--text-muted)' }}>{order.shipping_address}</div>
            <div style={{ color: 'var(--text-muted)' }}>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            Captured at checkout time to preserve historical order integrity.
          </div>
        </div>

        {/* Payment Snapshot */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CreditCard size={18} style={{ color: 'var(--secondary)' }} /> Payment Details
          </h3>
          <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Method:</span>
              <strong>{order.payment?.payment_method === 'ONLINE' ? 'Simulated Online Payment' : 'Cash on Delivery'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span className={`badge ${order.payment?.payment_status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                {order.payment?.payment_status}
              </span>
            </div>
            {order.payment?.transaction_reference && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Txn Ref:</span>
                <span className="font-mono" style={{ fontSize: '0.75rem' }}>{order.payment.transaction_reference}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Purchased Items Snapshot</h3>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Product Snapshot</th>
                <th>SKU Snapshot</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.order_item_id}>
                  <td>
                    <strong>{item.product_name}</strong>
                  </td>
                  <td>
                    <span className="badge badge-neutral font-mono">{item.sku}</span>
                  </td>
                  <td>${item.unit_price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    ${item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', borderTop: '2px solid var(--border-color)' }}>
                  Total Order Amount:
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', borderTop: '2px solid var(--border-color)' }}>
                  ${order.total_amount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={24} /> Confirm Order Cancellation
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to cancel order <strong>{order.order_number}</strong>?
              <br /><br />
              This will trigger a MySQL ACID rollback flow: order status will change to CANCELLED, payment will be marked REFUNDED, and the {order.items_count || order.items?.length} items will be atomically returned to inventory stock.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn btn-secondary btn-sm"
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="btn btn-danger btn-sm"
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel and Restore Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
