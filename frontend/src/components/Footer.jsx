import React from 'react';
import { Database, Server, Cpu, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', borderTop: '1px solid #1e293b', padding: '3rem 0 2rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <Database size={24} style={{ color: 'var(--primary)' }} /> NexusStore ADBMS
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
              Advanced Database Management Systems (ADBMS) full-stack e-commerce implementation demonstrating 3NF normalization, ACID transactions, pessimistic locking, deadlock retry, stored procedures, triggers, and MySQL + MongoDB integration.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={18} style={{ color: 'var(--secondary)' }} /> Persistence Engines
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>MySQL 8.0:</strong> InnoDB Clustered PK, ACID Orders, Row Locks</li>
              <li><strong>MongoDB:</strong> Schema-less Technical Specs & Metadata</li>
              <li><strong>Redis / PyMySQL:</strong> Connection Pooling & Session Scopes</li>
              <li><strong>Triggers:</strong> Automated JSON Audit Trails</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} style={{ color: 'var(--success)' }} /> Academic Concepts
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><CheckCircle size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--success)' }} /> 1NF, 2NF, 3NF Normalization</li>
              <li><CheckCircle size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--success)' }} /> SELECT ... FOR UPDATE Concurrency</li>
              <li><CheckCircle size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--success)' }} /> Idempotency Order Protection</li>
              <li><CheckCircle size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--success)' }} /> Window Functions (ROW_NUMBER, LAG)</li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem' }}>
          <div>&copy; 2026 NexusStore ADBMS Project. Developed by dakshgour.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Relational Source of Truth: MySQL</span>
            <span>NoSQL Metadata: MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
