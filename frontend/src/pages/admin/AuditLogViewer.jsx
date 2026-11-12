import React, { useState, useEffect } from 'react';
import { FileText, Filter, RefreshCw, Eye, CheckCircle2, User, Clock, Database } from 'lucide-react';
import api from '../../services/api';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('');
  const [opFilter, setOpFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total_items: 0, current_page: 1 });

  // Detail Modal for JSON Diff
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [tableFilter, opFilter, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), per_page: '20' });
      if (tableFilter) params.set('table_name', tableFilter);
      if (opFilter) params.set('operation', opFilter);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data || []);
      setPagination(res.meta || { total_items: 0, current_page: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getOpBadge = (op) => {
    switch (op) {
      case 'INSERT': return 'badge-success';
      case 'UPDATE': return 'badge-warning';
      case 'DELETE': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Automated Trigger Audit Logs</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Captured automatically by MySQL database triggers using session variable <span className="font-mono">@app_user_id</span>.
          </p>
        </div>

        <button onClick={fetchLogs} className="btn btn-outline btn-sm">
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Table:</label>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={tableFilter}
            onChange={(e) => { setTableFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Tables</option>
            <option value="products">products</option>
            <option value="inventory">inventory</option>
            <option value="orders">orders</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Operation:</label>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={opFilter}
            onChange={(e) => { setOpFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Operations</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Total Audit Records: <strong>{pagination.total_items}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Table</th>
                <th>Operation</th>
                <th>Record ID</th>
                <th>Acting User</th>
                <th style={{ textAlign: 'right' }}>JSON Diff</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No audit records logged for this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.log_id}>
                    <td className="font-mono">#{log.log_id}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.changed_at).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-neutral font-mono">{log.table_name}</span>
                    </td>
                    <td>
                      <span className={`badge ${getOpBadge(log.operation)}`}>
                        {log.operation}
                      </span>
                    </td>
                    <td className="font-mono">#{log.record_id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{log.changed_by_name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.6rem' }}
                      >
                        <Eye size={14} /> Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Diff Modal */}
      {selectedLog && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Audit Trail: {selectedLog.table_name.toUpperCase()} #{selectedLog.record_id}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Triggered on {new Date(selectedLog.changed_at).toLocaleString()} by {selectedLog.changed_by_name}
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="btn btn-sm">
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Old Values */}
              <div>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  OLD VALUES (Pre-change)
                </h4>
                <pre style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.75rem', overflowX: 'auto', minHeight: '120px' }}>
                  {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : '(NULL / INSERT)'}
                </pre>
              </div>

              {/* New Values */}
              <div>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--success)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  NEW VALUES (Post-change)
                </h4>
                <pre style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.75rem', overflowX: 'auto', minHeight: '120px' }}>
                  {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : '(NULL / DELETE)'}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedLog(null)} className="btn btn-secondary btn-sm">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
