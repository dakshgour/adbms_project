import React from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Shield, Package, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CustomerProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem', maxWidth: '750px' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800 }}>
            {user.full_name?.[0] || 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{user.full_name}</h1>
              <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
                {user.role}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Account ID: #{user.user_id} &bull; MySQL <span className="font-mono">users</span> table
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <Mail size={14} /> Email Address
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user.email}</div>
          </div>

          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <Phone size={14} /> Contact Phone
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user.phone || 'Not provided'}</div>
          </div>

          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <Calendar size={14} /> Member Since
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
            </div>
          </div>

          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <Shield size={14} /> Account Status
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#15803d' }}>
              {user.is_active ? 'Active & Verified' : 'Deactivated'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <Link to="/orders" className="btn btn-primary btn-sm">
            <Package size={16} /> View Order History <ArrowRight size={16} />
          </Link>

          {user.role === 'admin' && (
            <Link to="/admin" className="btn btn-outline btn-sm">
              Open Admin Console
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
