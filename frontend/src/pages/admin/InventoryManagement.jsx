import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, ArrowUpDown, History, Plus, RefreshCw, X, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'movements'
  const [inventoryList, setInventoryList] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Adjust Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState('Procurement Restock');
  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory();
    } else {
      fetchMovements();
    }
  }, [activeTab, lowStockFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const url = lowStockFilter ? '/inventory?low_stock=true' : '/inventory';
      const res = await api.get(url);
      setInventoryList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/movements');
      setMovements(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = (inv) => {
    setSelectedProduct(inv);
    setAdjustQty(10);
    setAdjustReason('Procurement Restock');
    setFeedback({ type: '', text: '' });
    setShowModal(true);
  };

  const handleExecuteAdjustment = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    try {
      setFormLoading(true);
      // Invokes backend calling stored procedure sp_adjust_inventory
      const res = await api.post('/inventory/adjustments', {
        product_id: selectedProduct.product_id,
        adjustment_qty: parseInt(adjustQty, 10),
        reason: adjustReason,
      });

      setFeedback({
        type: 'success',
        text: `Stored Procedure executed: Stock updated from ${res.data.quantity_before} to ${res.data.quantity_after} units.`
      });

      setTimeout(() => {
        setShowModal(false);
        fetchInventory();
      }, 1500);
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.message || 'Stored procedure execution failed.'
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Inventory &amp; Stock Ledger</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Maintained via Stored Procedure <span className="font-mono">sp_adjust_inventory</span> with pessimistic row locks.
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`btn btn-sm ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Boxes size={16} /> Current Stock
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`btn btn-sm ${activeTab === 'movements' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <History size={16} /> Movement Ledger
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Controls Bar */}
          <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
              />
              <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
              Show Low Stock Alerts Only (&le; Reorder Level)
            </label>

            <button onClick={fetchInventory} className="btn btn-outline btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Available Stock</th>
                    <th>Reorder Level</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'right' }}>Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                      </td>
                    </tr>
                  ) : (
                    inventoryList.map((inv) => (
                      <tr key={inv.inventory_id}>
                        <td style={{ fontWeight: 600 }}>{inv.product_name}</td>
                        <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.sku}</td>
                        <td style={{ fontSize: '1.05rem', fontWeight: 700 }}>{inv.quantity_available}</td>
                        <td>{inv.reorder_level}</td>
                        <td>
                          <span className={`badge ${inv.stock_status === 'OUT_OF_STOCK' ? 'badge-danger' : inv.stock_status === 'LOW_STOCK' ? 'badge-warning' : 'badge-success'}`}>
                            {inv.stock_status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {inv.updated_at ? new Date(inv.updated_at).toLocaleString() : 'Recent'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenAdjust(inv)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.35rem 0.75rem' }}
                          >
                            <ArrowUpDown size={14} /> Adjust Stock
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Movements Tab */
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Permanent Inventory Movements Ledger</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Audit-protected ledger table <span className="font-mono">inventory_movements</span>. Every sale, restock, or return writes an immutable row.
            </p>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Movement Type</th>
                  <th>Change</th>
                  <th>Before &rarr; After</th>
                  <th>Reason / Ref</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No movement records logged.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.movement_id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.product_name}</td>
                      <td>
                        <span className={`badge ${m.movement_type === 'SALE' ? 'badge-info' : m.movement_type === 'RESTOCK' ? 'badge-success' : m.movement_type === 'CANCELLATION_RETURN' ? 'badge-warning' : 'badge-neutral'}`}>
                          {m.movement_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: m.quantity_changed > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {m.quantity_changed > 0 ? `+${m.quantity_changed}` : m.quantity_changed}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                        {m.quantity_before} &rarr; {m.quantity_after}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {m.reason} {m.reference_id ? `(#${m.reference_id})` : ''}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{m.created_by_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Stored Procedure Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Adjust Inventory via Stored Procedure
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-sm">
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div>Product: <strong>{selectedProduct?.product_name}</strong></div>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Current Available Stock: <strong>{selectedProduct?.quantity_available} units</strong>
              </div>
            </div>

            {feedback.text && (
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: feedback.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)', color: feedback.type === 'success' ? '#15803d' : 'var(--danger)', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleExecuteAdjustment}>
              <div className="form-group">
                <label className="form-label">
                  Adjustment Quantity (+ to add, - to deduct) *
                </label>
                <input
                  type="number"
                  required
                  className="form-input font-mono"
                  placeholder="+10 or -5"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Resulting quantity must not be negative (enforced by CHECK and procedure logic).
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Adjustment Reason *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Procurement restock batch #501"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm" disabled={formLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={formLoading}>
                  {formLoading ? 'Executing Procedure...' : 'CALL sp_adjust_inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
