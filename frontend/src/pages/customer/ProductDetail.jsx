import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Check, AlertCircle, Database, Server, ShieldCheck, Tag, Info } from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    try {
      setAdding(true);
      setErrorMsg('');
      await addToCart(product.product_id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8rem 0' }}>
        <div className="spinner" style={{ width: '48px', height: '48px' }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2>Product Not Found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>The product you are looking for does not exist or has been deactivated.</p>
        <Link to="/products" className="btn btn-primary">Back to Catalog</Link>
      </div>
    );
  }

  const isOutOfStock = product.quantity_available <= 0 || product.stock_status === 'OUT_OF_STOCK';
  const isLowStock = product.quantity_available > 0 && product.quantity_available <= product.reorder_level;
  const metadata = product.metadata || {};

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'var(--primary)' }}>Home</Link> &rsaquo;{' '}
        <Link to={`/products?category_id=${product.category_id}`} style={{ color: 'var(--primary)' }}>{product.category_name}</Link> &rsaquo;{' '}
        <span>{product.product_name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '3.5rem', marginBottom: '3.5rem' }}>
        {/* Product Image */}
        <div>
          <div className="card" style={{ padding: '0', overflow: 'hidden', height: '440px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
              alt={product.product_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Product Core Attributes (MySQL Relational Source of Truth) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-info">{product.category_name}</span>
            <span className="badge badge-neutral font-mono">{product.sku}</span>
            {metadata.brand && <span className="badge badge-neutral">{metadata.brand}</span>}
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
            {product.product_name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ${parseFloat(product.price).toFixed(2)}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>USD (Taxes Included)</span>
          </div>

          {/* Real-time Inventory Status from MySQL */}
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: isOutOfStock ? 'var(--danger-light)' : isLowStock ? 'var(--warning-light)' : 'var(--success-light)', border: `1px solid ${isOutOfStock ? '#fca5a5' : isLowStock ? '#fcd34d' : '#86efac'}`, marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isOutOfStock ? '#dc2626' : isLowStock ? '#b45309' : '#15803d' }}>
                {isOutOfStock ? 'Currently Out of Stock' : isLowStock ? `Low Stock Alert: Only ${product.quantity_available} units left!` : 'In Stock & Ready to Ship'}
              </span>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Stock Available: {product.quantity_available}
              </span>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
            {product.description}
          </p>

          {/* Add to Cart Actions */}
          {!isAdmin && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: '#fff' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  style={{ padding: '0.5rem 0.85rem', fontWeight: 600 }}
                >
                  -
                </button>
                <span style={{ padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.95rem' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.quantity_available, quantity + 1))}
                  disabled={quantity >= product.quantity_available || isOutOfStock}
                  style={{ padding: '0.5rem 0.85rem', fontWeight: 600 }}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || adding}
                className={`btn btn-lg ${added ? 'btn-success' : 'btn-primary'}`}
                style={{ flex: 1 }}
              >
                {added ? (
                  <>
                    <Check size={20} /> Added to Cart!
                  </>
                ) : adding ? (
                  <span className="spinner" style={{ width: '20px', height: '20px' }} />
                ) : (
                  <>
                    <ShoppingCart size={20} /> Add to Cart
                  </>
                )}
              </button>
            </div>
          )}

          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* ================= Hybrid NoSQL Integration Section (MongoDB) ================= */}
      <section className="card" style={{ padding: '2rem', borderTop: '4px solid var(--secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={22} style={{ color: 'var(--secondary)' }} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Technical Specifications &amp; Metadata</h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Dynamically fetched from MongoDB collection <span className="font-mono">product_metadata</span> via logical key <span className="font-mono">product_id: {product.product_id}</span>
            </p>
          </div>
          <span className="badge badge-info">MongoDB NoSQL Document</span>
        </div>

        {/* Specifications Grid */}
        {metadata.specifications ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {Object.entries(metadata.specifications).map(([key, val]) => (
              <div key={key} style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {String(val)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            No additional MongoDB specifications registered for this product.
          </div>
        )}

        {/* Attributes & Warranty */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          {metadata.warranty && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <ShieldCheck size={16} style={{ color: 'var(--success)' }} /> Warranty Coverage
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{metadata.warranty}</div>
            </div>
          )}

          {metadata.tags && metadata.tags.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Tag size={16} /> Search Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {metadata.tags.map((tag) => (
                  <span key={tag} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* DBMS Educational Architecture Note */}
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#eef2ff', borderRadius: 'var(--radius-md)', border: '1px solid #c7d2fe', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#3730a3', lineHeight: 1.5 }}>
            <strong>ADBMS Architecture Separation:</strong> Core price, transactional state, and inventory counts are maintained strictly within MySQL under InnoDB ACID guarantees. Flexible metadata is persisted in MongoDB. In case of temporary MongoDB latency or maintenance, orders are processed without downtime.
          </div>
        </div>
      </section>
    </div>
  );
}
