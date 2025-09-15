import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';  // React Router import
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Header from './components/layout/Header';
import ProductList from './components/product/ProductList';
import ProductForm from './components/product/ProductForm';
import Cart from './components/cart/Cart'; // Cart page import
import OrderConfirmation from './components/order/OrderConfirmation'; // Order confirmation page import
import './App.css';

const AppContent = () => {
  const { isLoggedIn, userRole, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [currentView, setCurrentView] = useState('products'); // 'products' or 'orders'

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          {!showRegister ? (
            <Login onToggleRegister={() => setShowRegister(true)} />
          ) : (
            <Register onToggleLogin={() => setShowRegister(false)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="content-container">
          <div className="page-header">
            <h2>{userRole === 'customer' ? 'Shop Products' : 'Management Dashboard'}</h2>
            <div className="header-actions">
              {(userRole === 'admin' || userRole === 'employee') && (
                <div className="view-tabs">
                  <button
                    className={`tab-btn ${currentView === 'products' ? 'active' : ''}`}
                    onClick={() => setCurrentView('products')}
                  >
                    Products
                  </button>
                  <button
                    className={`tab-btn ${currentView === 'orders' ? 'active' : ''}`}
                    onClick={() => setCurrentView('orders')}
                  >
                    Orders
                  </button>
                </div>
              )}
              {(userRole === 'admin' || userRole === 'employee') && currentView === 'products' && (
                <button
                  className="add-product-btn"
                  onClick={() => setShowProductForm(!showProductForm)}
                >
                  {showProductForm ? 'Cancel' : 'Add Product'}
                </button>
              )}
            </div>
          </div>

          {showProductForm && (userRole === 'admin' || userRole === 'employee') && currentView === 'products' && (
            <ProductForm onSuccess={() => setShowProductForm(false)} onCancel={() => setShowProductForm(false)} />
          )}

          {currentView === 'products' && <ProductList />}
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/cart" element={<Cart />} />  {/* Cart Route */}
            <Route path="/order-confirmation" element={<OrderConfirmation />} />  {/* Order Confirmation Route */}
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
