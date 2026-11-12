import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Database, LogOut, Package, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="header">
      <div className="container header-content">
        {/* Brand Logo */}
        <Link to="/" className="logo-brand">
          <Database size={28} className="text-primary" />
          <div>
            Nexus<span>Store</span>
            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)', fontWeight: 400, marginTop: '-3px' }}>
              MySQL 8.0 & MongoDB ADBMS
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products by title, SKU, or specs..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* Navigation Actions */}
        <div className="nav-actions">
          <Link to="/products" className="btn btn-secondary btn-sm">
            Catalog
          </Link>

          {isAdmin && (
            <Link to="/admin" className="btn btn-outline btn-sm" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              <ShieldCheck size={16} /> Admin Portal
            </Link>
          )}

          {/* Cart Icon */}
          {!isAdmin && (
            <Link to="/cart" className="btn btn-secondary btn-sm" style={{ position: 'relative' }}>
              <ShoppingCart size={18} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* User Account / Auth */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/orders" className="btn btn-outline btn-sm" title="Order History">
                <Package size={16} /> Orders
              </Link>
              <Link to="/profile" className="btn btn-secondary btn-sm" title="My Profile">
                <User size={16} /> {user.full_name.split(' ')[0]}
              </Link>
              <button onClick={logout} className="btn btn-outline btn-sm" title="Sign out" style={{ color: 'var(--danger)' }}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
