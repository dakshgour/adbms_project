import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Database,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [kpiRes, revRes, topRes, statusRes, catRes, lowRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/revenue'),
        api.get('/analytics/top-products?limit=5'),
        api.get('/analytics/order-status'),
        api.get('/analytics/category-sales'),
        api.get('/inventory/low-stock'),
      ]);

      setKpis(kpiRes.data || {});
      setRevenueData(revRes.data || []);
      setTopProducts(topRes.data || []);
      setOrderStatusData(statusRes.data || []);
      setCategorySales(catRes.data || []);
      setLowStockAlerts(lowRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8rem 0' }}>
        <div className="spinner" style={{ width: '48px', height: '48px' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Title & DB Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Executive Management Dashboard</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time analytics aggregated via MySQL Stored Procedures, Views &amp; Window Functions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/inventory" className="btn btn-outline btn-sm">
            <Boxes size={16} /> Manage Inventory
          </Link>
          <Link to="/admin/products" className="btn btn-primary btn-sm">
            <Package size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Gross Revenue
            </div>
            <div className="kpi-val">${kpis?.total_revenue?.toFixed(2) || '0.00'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
              Avg Order: ${kpis?.average_order_value?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Orders
            </div>
            <div className="kpi-val">{kpis?.total_orders || 0}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {kpis?.total_units_sold || 0} units shipped
            </div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: '#f0f9ff', color: '#0284c7' }}>
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Customers
            </div>
            <div className="kpi-val">{kpis?.total_customers || 0}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Active accounts
            </div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: '#ecfdf5', color: '#059669' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Products
            </div>
            <div className="kpi-val">{kpis?.total_products || 0}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              In catalog
            </div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed' }}>
            <Package size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ borderColor: (kpis?.low_stock_count || 0) > 0 ? '#fde68a' : 'var(--border-color)' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Low Stock Alerts
            </div>
            <div className="kpi-val" style={{ color: (kpis?.low_stock_count || 0) > 0 ? 'var(--warning)' : 'inherit' }}>
              {kpis?.low_stock_count || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.25rem' }}>
              Reorder threshold
            </div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Monthly Revenue Trend */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Monthly Revenue Growth</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Powered by SQL Window Function: <span className="font-mono">LAG(current_month_revenue) OVER(...)</span>
              </p>
            </div>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Best Selling Products */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Top Products by Revenue</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Powered by SQL Window Function: <span className="font-mono">ROW_NUMBER() OVER(ORDER BY revenue DESC)</span>
              </p>
            </div>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <YAxis dataKey="product_name" type="category" width={140} stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="total_revenue" fill="var(--secondary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Sales by Category View */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sales Distribution by Category</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Queried from View: <span className="font-mono">vw_sales_summary</span>
          </p>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySales}
                  dataKey="revenue"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category_name, percent }) => `${category_name} (${(percent * 100).toFixed(0)}%)`}
                  fontSize={11}
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Urgent Reorder Alerts
            </h3>
            <Link to="/admin/inventory" className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
              Restock All
            </Link>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockAlerts.slice(0, 4).map((p) => (
                  <tr key={p.product_id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.product_name}</div>
                      <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</span>
                    </td>
                    <td>
                      <span className={`badge ${p.quantity_available === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {p.quantity_available} units
                      </span>
                    </td>
                    <td>{p.reorder_level}</td>
                    <td>
                      <Link to="/admin/inventory" className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.6rem' }}>
                        Adjust
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
