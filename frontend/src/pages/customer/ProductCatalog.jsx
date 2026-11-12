import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';

export default function ProductCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total_items: 0, total_pages: 1, current_page: 1 });
  const [loading, setLoading] = useState(true);

  // Filter states
  const categoryId = searchParams.get('category_id') || '';
  const search = searchParams.get('search') || '';
  const stockStatus = searchParams.get('stock_status') || '';
  const sortBy = searchParams.get('sort_by') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams);
      if (!params.has('page')) params.set('page', '1');
      if (!params.has('per_page')) params.set('per_page', '12');

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data || []);
      setPagination(res.meta || { total_items: 0, total_pages: 1, current_page: 1 });
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Title & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Product Catalog</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Showing {products.length} of {pagination.total_items} items (MySQL Source of Truth)
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Sort by:</label>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={sortBy}
            onChange={(e) => updateFilter('sort_by', e.target.value)}
          >
            <option value="newest">Newest Additions</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Filters Sidebar */}
        <aside className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} /> Filters
            </h3>
            {(categoryId || search || stockStatus) && (
              <button
                onClick={() => setSearchParams({})}
                className="btn btn-sm"
                style={{ color: 'var(--danger)', fontSize: '0.75rem', padding: 0 }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search Term */}
          <div className="form-group">
            <label className="form-label">Search Query</label>
            <input
              type="text"
              className="form-input"
              placeholder="Filter by title or SKU..."
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {/* Categories */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => updateFilter('category_id', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="form-group">
            <label className="form-label">Availability</label>
            <select
              className="form-select"
              value={stockStatus}
              onChange={(e) => updateFilter('stock_status', e.target.value)}
            >
              <option value="">All Inventory Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock (Alert)</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
              <div className="spinner" style={{ width: '40px', height: '40px' }} />
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <SlidersHorizontal size={40} style={{ color: 'var(--text-light)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No products match your criteria</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Try adjusting your search terms or clearing your filters to see more results.
              </p>
              <button onClick={() => setSearchParams({})} className="btn btn-secondary btn-sm">
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((p) => (
                  <ProductCard key={p.product_id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
                  <button
                    disabled={pagination.current_page <= 1}
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    className="btn btn-outline btn-sm"
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0.5rem' }}>
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <button
                    disabled={pagination.current_page >= pagination.total_pages}
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    className="btn btn-outline btn-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
