import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Database, Server, Cpu, ShieldCheck, Zap } from 'lucide-react';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?per_page=8'),
      api.get('/categories')
    ])
      .then(([prodRes, catRes]) => {
        setFeaturedProducts(prodRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', color: '#fff', padding: '5rem 0 4rem' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
              <Zap size={14} /> Advanced DBMS College Project 2026
            </div>
            <h1 style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-0.025em' }}>
              Enterprise E-Commerce with <span style={{ color: '#818cf8' }}>MySQL 8.0</span> &amp; <span style={{ color: '#38bdf8' }}>MongoDB</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '2rem' }}>
              A full-stack demonstration of ACID transaction management, row-level pessimistic locking, idempotency control, automated audit triggers, stored procedures, and flexible NoSQL document integration.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/products" className="btn btn-primary btn-lg">
                Explore Product Catalog <ArrowRight size={18} />
              </Link>
              <Link to="/admin" className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                Open Admin Console
              </Link>
            </div>
          </div>

          {/* Architecture Visual Card */}
          <div className="card" style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={20} style={{ color: '#818cf8' }} /> Architectural Database Split
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <strong style={{ color: '#a5b4fc', fontSize: '0.9rem' }}>MySQL 8.0 (InnoDB)</strong>
                  <span className="badge badge-success">Relational / ACID</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Users, Categories, Products, Inventory, Orders, Snapshots, Movements, Audit Triggers, Stored Procedures.
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <strong style={{ color: '#7dd3fc', fontSize: '0.9rem' }}>MongoDB Community</strong>
                  <span className="badge badge-info">NoSQL / Document</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Flexible Technical Specifications, Hardware Attributes, Warranty, Tags, Dynamic Product Metadata.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>Strict 3NF Schema</span>
              <span>Pessimistic Row Locking</span>
              <span>Deadlock Retry Loop</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section style={{ padding: '2.5rem 0', background: '#fff', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Shop by Category</h2>
            <Link to="/products" style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600 }}>
              View All Categories &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {categories.map((c) => (
              <Link
                key={c.category_id}
                to={`/products?category_id=${c.category_id}`}
                className="card card-hover"
                style={{ textAlign: 'center', padding: '1.25rem' }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {c.category_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Browse Collection
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>Live Catalog</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Featured Products</h2>
            </div>
            <Link to="/products" className="btn btn-outline btn-sm">
              Explore Full Catalog ({featuredProducts.length}+ Items)
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div className="spinner" style={{ width: '40px', height: '40px' }} />
            </div>
          ) : (
            <div className="product-grid">
              {featuredProducts.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
