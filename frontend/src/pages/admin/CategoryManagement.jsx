import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Layers, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCat, setSelectedCat] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedCat(null);
    setName('');
    setDescription('');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setModalMode('edit');
    setSelectedCat(c);
    setName(c.category_name);
    setDescription(c.description || '');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setFormLoading(true);
      if (modalMode === 'create') {
        await api.post('/categories', { category_name: name, description });
      } else {
        await api.put(`/categories/${selectedCat.category_id}`, { category_name: name, description });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setErrorMsg(err.message || 'Action failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category? (Will fail if products are assigned)')) {
      return;
    }
    try {
      await api.delete(`/categories/${catId}`);
      fetchCategories();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Category Taxonomy</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Relational parent hierarchy mapped via <span className="font-mono">categories.category_id</span> foreign key.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No categories defined.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.category_id}>
                    <td className="font-mono">#{c.category_id}</td>
                    <td style={{ fontWeight: 600 }}>{c.category_name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.description || '—'}</td>
                    <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Active'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEdit(c)} className="btn btn-secondary btn-sm">
                          <Edit size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(c.category_id)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {modalMode === 'create' ? 'Create Category' : 'Edit Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-sm">
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Gaming Gear"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  placeholder="Category scope and catalog tags..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm" disabled={formLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
