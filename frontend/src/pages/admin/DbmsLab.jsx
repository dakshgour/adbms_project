import { useEffect, useState } from 'react';
import { Database, GitBranch, Lock, Server, Workflow } from 'lucide-react';
import api from '../../services/api';

const concepts = [
  {
    title: 'ACID checkout',
    icon: Lock,
    body: 'Order placement locks inventory rows in product-id order, writes the order, payment, and stock movement, then commits. A failure rolls the whole unit back.',
  },
  {
    title: 'Triggers',
    icon: Workflow,
    body: 'MySQL AFTER INSERT/UPDATE/DELETE triggers write audit_logs and stamp the acting user from the @app_user_id session variable.',
  },
  {
    title: 'Stored procedures',
    icon: GitBranch,
    body: 'sp_get_sales_summary, sp_get_low_stock_products, and sp_adjust_inventory encapsulate reporting and locked stock changes inside the database.',
  },
  {
    title: 'Views and windows',
    icon: Database,
    body: 'vw_product_inventory, vw_order_details, and vw_sales_summary simplify joins. Analytics queries add LAG() and ROW_NUMBER() window functions.',
  },
  {
    title: 'Polyglot persistence',
    icon: Server,
    body: 'MySQL is the source of truth for catalog, stock, and orders. MongoDB stores flexible product metadata and can drop out without taking the store down.',
  },
];

export default function DbmsLab() {
  const [health, setHealth] = useState(null);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/health')
      .then((res) => setHealth(res))
      .catch((err) => setError(err.message));
    api.get('/analytics/overview')
      .then((res) => setOverview(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>DBMS Concept Lab</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Live checks against the relational schema, procedures, and the document store.
      </p>

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>MySQL</div>
          <strong>{health?.mysql || 'checking...'}</strong>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>MongoDB</div>
          <strong>{health?.mongodb || 'checking...'}</strong>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Orders in procedure</div>
          <strong>{overview ? overview.total_orders : '...'}</strong>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Revenue</div>
          <strong>{overview ? `$${Number(overview.total_revenue).toFixed(2)}` : '...'}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {concepts.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Icon size={18} />
                <h2 style={{ fontSize: '1rem', margin: 0 }}>{item.title}</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>{item.body}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
