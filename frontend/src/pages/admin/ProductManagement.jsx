import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Server, Check, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total_items: 0, current_page: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    category_id: '',
    price: '',
    description: '',
    image_url: '',
    initial_stock: 10,
    reorder_level: 5,
    is_active: true,
    brand: '',
    warranty: '',
    tags: '',
    specifications_json: '{\n  "spec_key": "spec_value"\n}'
  });

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data || []));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryId, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        is_active: 'false' // Admin wants to see all products (active and inactive)
      });
      if (search) params.set('search', search);
      if (categoryId) params.set('category_id', categoryId);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data || []);
      setPagination(res.meta || { total_items: 0, current_page: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedProduct(null);
    setFormData({
      product_name: '',
      sku: 'PROD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      category_id: categories[0]?.category_id || '',
      price: '',
      description: '',
      image_url: '',
      initial_stock: 10,
      reorder_level: 5,
      is_active: true,
      brand: '',
      warranty: '1 Year Manufacturer Warranty',
      tags: 'new, featured',
      specifications_json: '{\n  "color": "Black",\n  "material": "Standard"\n}'
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = async (p) => {
    setModalMode('edit');
    setSelectedProduct(p);
    setErrorMsg('');
    setShowModal(true);
    setFormLoading(true);

    try {
      // Fetch fresh detail with MongoDB metadata
      const res = await api.get(`/products/${p.product_id}`);
      const detailed = res.data;
      const meta = detailed.metadata || {};

      setFormData({
        product_name: detailed.product_name,
        sku: detailed.sku,
        category_id: detailed.category_id,
        price: detailed.price,
        description: detailed.description || '',
        image_url: detailed.image_url || '',
        initial_stock: detailed.quantity_available,
        reorder_level: detailed.reorder_level,
        is_active: detailed.is_active,
        brand: meta.brand || '',
        warranty: meta.warranty || '',
        tags: meta.tags ? meta.tags.join(', ') : '',
        specifications_json: meta.specifications ? JSON.stringify(meta.specifications, null, 2) : '{}'
      });
    } catch (err) {
      setErrorMsg('Failed to load full product specifications.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    let parsedSpecs = {};
    try {
      if (formData.specifications_json.trim()) {
        parsedSpecs = JSON.parse(formData.specifications_json);
      }
    } catch (err) {
      setErrorMsg('Invalid JSON format for MongoDB specifications.');
      return;
    }

    const payload = {
      product_name: formData.product_name,
      sku: formData.sku,
      category_id: parseInt(formData.category_id, 10),
      price: parseFloat(formData.price),
      description: formData.description,
      image_url: formData.image_url,
      is_active: formData.is_active,
      initial_stock: parseInt(formData.initial_stock, 10),
      reorder_level: parseInt(formData.reorder_level, 10),
      metadata: {
        brand: formData.brand,
        warranty: formData.warranty,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        specifications: parsedSpecs
      }
    };

    try {
      setFormLoading(true);
      if (modalMode === 'create') {
        await api.post('/products', payload);
      } else {
        await api.put(`/products/${selectedProduct.product_id}`, payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (p) => {
    try {
      await api.put(`/products/${p.product_id}`, { is_active: !p.is_active });
      fetchProducts();
    } catch (err) {
      alert('Failed to update product state: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Product &amp; Specification Management</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Transactional records stored in MySQL, flexible document attributes stored in MongoDB.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.category_name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price (MySQL)</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.product_id} style={{ opacity: p.is_active ? 1 : 0.6 }}>
                    <td className="font-mono">#{p.product_id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.product_name}</div>
                      <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</span>
                    </td>
                    <td>{p.category_name}</td>
                    <td style={{ fontWeight: 700 }}>${parseFloat(p.price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.quantity_available === 0 ? 'badge-danger' : p.quantity_available <= p.reorder_level ? 'badge-warning' : 'badge-success'}`}>
                        {p.quantity_available} units
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`badge ${p.is_active ? 'badge-success' : 'badge-neutral'}`}
                        style={{ cursor: 'pointer' }}
                        title="Click to toggle active status"
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="btn btn-secondary btn-sm"
                          title="Edit product and MongoDB specs"
                        >
                          <Edit size={14} /> Edit
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

      {/* Modal for Create / Edit */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {modalMode === 'create' ? 'Create New Product' : `Edit Product #${selectedProduct?.product_id}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn btn-sm">
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              {/* Relational Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.75rem' }}>
                  MySQL Relational Attributes (InnoDB)
                </h4>

                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">SKU *</label>
                    <input
                      type="text"
                      required
                      className="form-input font-mono"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="form-input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>

                {modalMode === 'create' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Initial Stock</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={formData.initial_stock}
                        onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reorder Alert Level</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={formData.reorder_level}
                        onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* NoSQL MongoDB Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Server size={16} /> MongoDB Document Metadata (ecommerce_nosql)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Samsung, Apple, Sony"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Warranty Statement</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 2 Years Comprehensive"
                      value={formData.warranty}
                      onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Search Tags (Comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="electronics, wireless, 5g"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Technical Specifications (JSON format)</label>
                  <textarea
                    rows={4}
                    className="form-textarea font-mono"
                    style={{ fontSize: '0.8rem' }}
                    value={formData.specifications_json}
                    onChange={(e) => setFormData({ ...formData, specifications_json: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving...' : modalMode === 'create' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
