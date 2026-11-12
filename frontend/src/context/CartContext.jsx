import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState({ items: [], total_items: 0, total_price: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated || user?.role === 'admin') return;
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      fetchCart();
    } else {
      setCart({ items: [], total_items: 0, total_price: 0 });
    }
  }, [isAuthenticated, user]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to your shopping cart.');
    }
    const res = await api.post('/cart/items', {
      product_id: productId,
      quantity,
    });
    setCart(res.data);
    return res.data;
  };

  const updateQuantity = async (cartItemId, quantity) => {
    const res = await api.put(`/cart/items/${cartItemId}`, { quantity });
    setCart(res.data);
    return res.data;
  };

  const removeItem = async (cartItemId) => {
    const res = await api.delete(`/cart/items/${cartItemId}`);
    setCart(res.data);
    return res.data;
  };

  const clearCart = async () => {
    await api.post('/cart/clear');
    setCart({ items: [], total_items: 0, total_price: 0 });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartCount: cart?.total_items || 0,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
