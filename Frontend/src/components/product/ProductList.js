import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/apiService';
import ProductCard from './ProductCard';
import './ProductList.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  console.log('ProductList render:', { products, loading, error });

  useEffect(() => {
    console.log('ProductList useEffect - fetching products');
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ApiService.getAllProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('ProductList fetchProducts error:', error);
      setError('Error fetching products: ' + error.message);
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await ApiService.deleteProduct(id, token);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      alert('Delete error: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchProducts}>Retry</button>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h2>Products</h2>
        <button onClick={fetchProducts} className="refresh-btn">
          Refresh
        </button>
      </div>
      
      <div className="products-grid">
        {products.length === 0 ? (
          <div className="no-products">No products found</div>
        ) : (
          products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={handleDeleteProduct}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ProductList;


