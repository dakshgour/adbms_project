import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  BarChart3,
  FileText,
  FlaskConical,
  Store,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: 'Overview Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Products & Metadata', icon: Package },
    { to: '/admin/categories', label: 'Categories', icon: Layers },
    { to: '/admin/inventory', label: 'Inventory & Stock Alerts', icon: Boxes },
    { to: '/admin/orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
    { to: '/admin/analytics', label: 'Sales & Window Metrics', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Trigger Audit Logs', icon: FileText },
    { to: '/admin/dbms-lab', label: 'DBMS Concept Lab', icon: FlaskConical },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <ShieldAlert size={24} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>NexusAdmin</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ADBMS Console 2026</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div style={{ marginTop: 'auto', borderTop: '1px solid #1e293b', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/" className="admin-nav-link" style={{ color: 'var(--secondary)' }}>
              <Store size={18} />
              <span>Back to Storefront</span>
            </Link>

            <button onClick={handleLogout} className="admin-nav-link" style={{ color: 'var(--danger)', width: '100%', textAlign: 'left' }}>
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Admin Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header style={{ height: '4rem', background: '#fff', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-primary" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
              ADMIN CONSOLE
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Relational DB: <strong style={{ color: '#059669' }}>ecommerce_db (InnoDB)</strong> &bull; NoSQL DB: <strong style={{ color: '#0284c7' }}>ecommerce_nosql (MongoDB)</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.full_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {user?.full_name?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Dynamic Route Body */}
        <main className="admin-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
