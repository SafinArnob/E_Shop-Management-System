import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import ApiService from '../services/apiService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token, userRole, isLoggedIn } = useAuth();

  // Load cart when user logs in
  useEffect(() => {
    if (isLoggedIn && userRole === 'customer' && token) {
      loadCart();
    } else {
      // Clear cart when user logs out or is not a customer
      setCart(null);
      setCartItemCount(0);
    }
  }, [isLoggedIn, userRole, token]);

  const loadCart = useCallback(async () => {
    if (!token || userRole !== 'customer') return;

    try {
      setError('');
      const cartData = await ApiService.getCart(token);
      setCart(cartData);
      setCartItemCount(cartData?.total_items || 0);
    } catch (error) {
      console.warn('Cart loading error (non-critical):', error.message);
      setCart(null);
      setCartItemCount(0);
    }
  }, [token, userRole]);

  const addToCart = async (productId, quantity = 1) => {
    if (!token || userRole !== 'customer') {
      setError('Only customers can add items to cart');
      return false;
    }

    try {
      setLoading(true);
      setError('');
      const result = await ApiService.addToCart(productId, quantity, token);

      if (result.success) {
        await loadCart();
        return true;
      } else {
        setError(result.message || 'Failed to add item to cart');
        return false;
      }
    } catch (error) {
      setError('Error adding item to cart: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    if (!token || userRole !== 'customer') {
      setError('Only customers can update cart items');
      return false;
    }

    try {
      setLoading(true);
      setError('');
      const result = await ApiService.updateCartItem(productId, quantity, token);

      if (result.success) {
        await loadCart();
        return true;
      } else {
        setError(result.message || 'Failed to update cart item');
        return false;
      }
    } catch (error) {
      setError('Error updating cart item: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    if (!token || userRole !== 'customer') {
      setError('Only customers can remove cart items');
      return false;
    }

    try {
      setLoading(true);
      setError('');
      const result = await ApiService.removeFromCart(productId, token);

      if (result.success) {
        await loadCart();
        return true;
      } else {
        setError(result.message || 'Failed to remove item from cart');
        return false;
      }
    } catch (error) {
      setError('Error removing item from cart: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!token || userRole !== 'customer') {
      setError('Only customers can clear cart');
      return false;
    }

    try {
      setLoading(true);
      setError('');
      const result = await ApiService.clearCart(token);

      if (result.success) {
        setCart(null);
        setCartItemCount(0);
        return true;
      } else {
        setError(result.message || 'Failed to clear cart');
        return false;
      }
    } catch (error) {
      setError('Error clearing cart: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateCart = async () => {
    if (!token || userRole !== 'customer') return null;

    try {
      setLoading(true);
      setError('');
      const result = await ApiService.validateCart(token);
      return result;
    } catch (error) {
      setError('Error validating cart: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    if (token && userRole === 'customer') {
      await loadCart();
    }
  };

  const createOrder = async (orderData) => {
    if (!token || userRole !== 'customer') {
      setError('Only customers can create orders');
      return false;
    }

    try {
      setLoading(true);
      setError('');
      const result = await ApiService.createOrder(orderData, token);

      if (result.success) {
        // Clear cart and reset states after order creation
        await clearCart();
        return result;
      } else {
        setError(result.message || 'Failed to create order');
        return false;
      }
    } catch (error) {
      setError('Error creating order: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    cartItemCount,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    validateCart,
    refreshCart,
    createOrder,
    loadCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
