import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/customer/Home';
import ProductCatalog from './pages/customer/ProductCatalog';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import MyOrders from './pages/customer/MyOrders';
import OrderDetail from './pages/customer/OrderDetail';
import OrderConfirmation from './pages/customer/OrderConfirmation';
import CustomerProfile from './pages/customer/CustomerProfile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import OrderManagement from './pages/admin/OrderManagement';
import SalesAnalytics from './pages/admin/SalesAnalytics';
import AuditLogViewer from './pages/admin/AuditLogViewer';
import DbmsLab from './pages/admin/DbmsLab';

function RequireAuth({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return <div className="container" style={{ padding: '3rem 1.5rem' }}>Loading session...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductCatalog />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
              <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
              <Route path="/orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
              <Route path="/orders/confirmed/:id" element={<RequireAuth><OrderConfirmation /></RequireAuth>} />
              <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><CustomerProfile /></RequireAuth>} />
            </Route>

            <Route
              path="/admin"
              element={<RequireAuth adminOnly><AdminLayout /></RequireAuth>}
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="analytics" element={<SalesAnalytics />} />
              <Route path="audit-logs" element={<AuditLogViewer />} />
              <Route path="dbms-lab" element={<DbmsLab />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
