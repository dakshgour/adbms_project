import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Zap, Award, Layers } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../../services/api';

export default function SalesAnalytics() {
  const [topProducts, setTopProducts] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [topRes, revRes, catRes, statusRes] = await Promise.all([
        api.get('/analytics/top-products?limit=10'),
        api.get('/analytics/revenue'),
        api.get('/analytics/category-sales'),
        api.get('/analytics/order-status'),
      ]);

      setTopProducts(topRes.data || []);
      setRevenueData(revRes.data || []);
      setCategorySales(catRes.data || []);
      setOrderStatus(statusRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Advanced SQL Analytics &amp; Window Functions</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Demonstration of Common Table Expressions (CTEs), Aggregate Functions, and Window Functions (ROW_NUMBER, DENSE_RANK, SUM() OVER, LAG).
        </p>
      </div>

      {/* Row 1: Top 10 Best Sellers with ROW_NUMBER */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} style={{ color: 'var(--warning)' }} /> Top 10 Selling Products by Revenue
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Query pattern: <span className="font-mono">WITH Ranked AS (SELECT ..., ROW_NUMBER() OVER(ORDER BY SUM(subtotal) DESC) AS sales_rank ...)</span>
            </p>
          </div>
          <span className="badge badge-primary">Window Function: ROW_NUMBER()</span>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Rank</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Units Sold</th>
                <th style={{ textAlign: 'right' }}>Gross Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.product_id}>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: p.rank === 1 ? '#fef3c7' : p.rank === 2 ? '#e2e8f0' : p.rank === 3 ? '#ffedd5' : '#f8fafc',
                        color: p.rank === 1 ? '#b45309' : p.rank === 2 ? '#475569' : p.rank === 3 ? '#c2410c' : '#64748b',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      {p.rank}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                  <td>{p.category_name}</td>
                  <td>{p.units_sold} units</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                    ${p.total_revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 2: MoM Comparison & Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* LAG Window Function Table */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Month-over-Month Revenue Growth</h3>
            <span className="badge badge-info">Window: LAG()</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Calculates previous period sales via <span className="font-mono">LAG(current_revenue, 1) OVER(ORDER BY month)</span>.
          </p>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Sales Month</th>
                  <th>Orders</th>
                  <th>Current Revenue</th>
                  <th>Previous Month</th>
                  <th style={{ textAlign: 'right' }}>Growth Diff</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((r) => (
                  <tr key={r.month}>
                    <td className="font-mono">{r.month}</td>
                    <td>{r.orders}</td>
                    <td style={{ fontWeight: 600 }}>${r.revenue.toFixed(2)}</td>
                    <td>${r.previous_revenue.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: r.growth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {r.growth >= 0 ? `+$${r.growth.toFixed(2)}` : `-$${Math.abs(r.growth).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Aggregation Table */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Category Performance</h3>
            <span className="badge badge-success">View: vw_sales_summary</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Aggregated relational metrics filtering non-cancelled orders.
          </p>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Orders Count</th>
                  <th>Units Sold</th>
                  <th style={{ textAlign: 'right' }}>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {categorySales.map((c) => (
                  <tr key={c.category_name}>
                    <td style={{ fontWeight: 600 }}>{c.category_name}</td>
                    <td>{c.orders_count} orders</td>
                    <td>{c.units_sold} units</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      ${c.revenue.toFixed(2)}
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
