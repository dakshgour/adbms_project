import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isOutOfStock = product.quantity_available <= 0 || product.stock_status === 'OUT_OF_STOCK';
  const isLowStock = product.quantity_available > 0 && product.quantity_available <= (product.reorder_level || 5);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    if (isAdmin) return;

    try {
      setAdding(true);
      setErrorMsg('');
      await addToCart(product.product_id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add item');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.product_id}`} className="product-img-wrap">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
          alt={product.product_name}
          className="product-img"
          loading="lazy"
        />

        {/* Stock Status Badge */}
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
          {isOutOfStock ? (
            <span className="badge badge-danger">Out of Stock</span>
          ) : isLowStock ? (
            <span className="badge badge-warning">Only {product.quantity_available} left</span>
          ) : (
            <span className="badge badge-success">In Stock</span>
          )}
        </div>
      </Link>

      <div className="product-info">
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
          {product.category_name} &bull; <span className="font-mono">{product.sku}</span>
        </div>

        <Link to={`/products/${product.product_id}`} style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.product_name}
        </Link>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.description}
        </p>

        {errorMsg && (
          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            ${parseFloat(product.price).toFixed(2)}
          </div>

          {!isAdmin && (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              className={`btn btn-sm ${added ? 'btn-success' : 'btn-primary'}`}
              style={{ padding: '0.45rem 0.85rem' }}
            >
              {added ? (
                <>
                  <Check size={16} /> Added
                </>
              ) : adding ? (
                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
              ) : (
                <>
                  <ShoppingCart size={16} /> Add to Cart
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
