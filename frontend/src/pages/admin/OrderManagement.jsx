import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, CheckCircle2, AlertTriangle, RefreshCw, X } from 'lucide-react';
import api from '../../services/api';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total_items: 0, current_page: 1 });

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), per_page: '15' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/orders?${params.toString()}`);
      setOrders(res.data || []);
      setPagination(res.meta || { total_items: 0, current_page: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      setFeedback({ type: '', text: '' });
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setFeedback({ type: 'success', text: `Order #${orderId} status transitioned to ${newStatus}.` });
      fetchOrders();
    } catch (err) {
      setFeedback({ type: 'danger', text: err.message || 'Status transition rejected.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'DELIVERED': return 'badge-success';
      case 'SHIPPED': return 'badge-info';
      case 'CONFIRMED': return 'badge-primary';
      case 'PLACED': return 'badge-warning';
      case 'CANCELLED': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Order Management &amp; Fulfillment</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Admin controls enforcing valid state machine transitions: PLACED &rarr; CONFIRMED &rarr; SHIPPED &rarr; DELIVERED.
          </p>
        </div>

        <button onClick={fetchOrders} className="btn btn-outline btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {feedback.text && (
        <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: feedback.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)', color: feedback.type === 'success' ? '#15803d' : 'var(--danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {feedback.text}
        </div>
      )}

      {/* Filter toolbar */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Filter by Status:</label>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Total Orders Recorded: <strong>{pagination.total_items}</strong>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Transition Status</th>
                <th style={{ textAlign: 'right' }}>Snapshot</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.order_id}>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {o.order_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customer_email}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 700 }}>${o.total_amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${o.payment?.payment_status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                        {o.payment?.payment_method}: {o.payment?.payment_status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(o.order_status)}`}>
                        {o.order_status}
                      </span>
                    </td>
                    <td>
                      {/* State transition control */}
                      {o.order_status !== 'DELIVERED' && o.order_status !== 'CANCELLED' ? (
                        <select
                          className="form-select"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                          disabled={updatingId === o.order_id}
                          value={o.order_status}
                          onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                        >
                          <option value={o.order_status} disabled>Transition to...</option>
                          {o.order_status === 'PLACED' && <option value="CONFIRMED">CONFIRMED</option>}
                          {o.order_status === 'PLACED' && <option value="CANCELLED">CANCELLED (Restock)</option>}
                          {o.order_status === 'CONFIRMED' && <option value="SHIPPED">SHIPPED</option>}
                          {o.order_status === 'CONFIRMED' && <option value="CANCELLED">CANCELLED (Restock)</option>}
                          {o.order_status === 'SHIPPED' && <option value="DELIVERED">DELIVERED</option>}
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Terminal State</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenDetail(o)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.6rem' }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {selectedOrder.order_number}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Customer: {selectedOrder.customer_name} ({selectedOrder.customer_email})
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-sm">
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Shipping Snapshot:</div>
              <div>{selectedOrder.shipping_name} &bull; {selectedOrder.shipping_address}, {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_postal_code}</div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Itemized Purchase Snapshot</h4>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.order_item_id}>
                        <td>{item.product_name}</td>
                        <td className="font-mono" style={{ fontSize: '0.75rem' }}>{item.sku}</td>
                        <td>${item.unit_price.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700 }}>Total:</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                        ${selectedOrder.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
