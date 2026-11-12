import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Cart() {
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (loading && (!cart || cart.items?.length === 0)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem' }}>
          <ShoppingBag size={48} style={{ color: 'var(--text-light)', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Browse our catalog to find laptops, audio devices, books, and high-performance hardware.
          </p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Shopping Cart</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        {/* Cart Item Lines */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cart Items ({cart.total_items})</h3>
            <button onClick={clearCart} className="btn btn-sm" style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>
              Clear Cart
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {cart.items.map((item) => (
              <div
                key={item.cart_item_id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  paddingBottom: '1.25rem',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                  alt={item.product_name}
                  style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/products/${item.product_id}`} style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', display: 'block' }}>
                    {item.product_name}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    SKU: <span className="font-mono">{item.sku}</span> &bull; ${item.price.toFixed(2)} each
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: '#fff' }}>
                  <button
                    onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    style={{ padding: '0.25rem 0.6rem', fontWeight: 600 }}
                  >
                    -
                  </button>
                  <span style={{ padding: '0.25rem 0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                    disabled={item.quantity >= item.quantity_available}
                    style={{ padding: '0.25rem 0.6rem', fontWeight: 600 }}
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                  ${item.subtotal.toFixed(2)}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.cart_item_id)}
                  className="btn btn-sm"
                  style={{ color: 'var(--text-muted)' }}
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/products" className="btn btn-outline btn-sm">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Checkout Card */}
        <div className="card" style={{ padding: '1.75rem', background: '#fff' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Order Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Items Subtotal ({cart.total_items} items)</span>
              <span>${cart.total_price.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Standard Delivery</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Estimated Sales Tax</span>
              <span>$0.00</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
              <span>Total Amount</span>
              <span style={{ color: 'var(--primary)' }}>${cart.total_price.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={() => navigate('/checkout')} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Proceed to Checkout <ArrowRight size={18} />
          </button>

          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Transactions protected by InnoDB row-level locking &amp; idempotency control.
          </div>
        </div>
      </div>
    </div>
  );
}
