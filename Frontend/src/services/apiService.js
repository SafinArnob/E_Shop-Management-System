const API_BASE = 'http://localhost:5000/api';

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new Error('Unable to connect to server. Please check if the backend is running.');
  }
  throw error;
};

class ApiService {
  // Auth endpoints
  static async login(email, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return response.json();
    } catch (error) {
      handleApiError(error);
    }
  }

  static async register(userData) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }

  // Product endpoints
  static async getAllProducts() {
    try {
      const response = await fetch(`${API_BASE}/products`);
      return response.json();
    } catch (error) {
      handleApiError(error);
    }
  }

  static async getProductById(id) {
    const response = await fetch(`${API_BASE}/products/${id}`);
    return response.json();
  }

  static async createProduct(productData, token) {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    return response.json();
  }

  static async updateProduct(id, productData, token) {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    return response.json();
  }

  static async deleteProduct(id, token) {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  // Cart endpoints
  static async addToCart(productId, quantity, token) {
    const response = await fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId, quantity })
    });
    return response.json();
  }

  static async getCart(token) {
    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    } catch (error) {
      handleApiError(error);
    }
  }

  static async updateCartItem(productId, quantity, token) {
    const response = await fetch(`${API_BASE}/cart/item/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity })
    });
    return response.json();
  }

  static async removeFromCart(productId, token) {
    const response = await fetch(`${API_BASE}/cart/item/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  static async clearCart(token) {
    const response = await fetch(`${API_BASE}/cart/clear`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  static async getCartItemCount(token) {
    const response = await fetch(`${API_BASE}/cart/count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  static async validateCart(token) {
    const response = await fetch(`${API_BASE}/cart/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  // Order endpoints
  static async createOrder(orderData, token) {
    const response = await fetch(`${API_BASE}/orders/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    return response.json();
  }

  static async getOrderById(orderId, token) {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  static async getCustomerOrders(token) {
    const response = await fetch(`${API_BASE}/orders/my-orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  static async cancelOrder(orderId, token) {
    const response = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  // Admin/Employee order management endpoints
  static async getAllOrders(token, limit = 50, offset = 0) {
    const response = await fetch(`${API_BASE}/orders/admin/all?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  static async updateOrderStatus(orderId, status, token) {
    const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    return response.json();
  }

  static async updatePaymentStatus(orderId, paymentStatus, token) {
    const response = await fetch(`${API_BASE}/orders/${orderId}/payment`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentStatus })
    });
    return response.json();
  }

  static async getOrderStats(token) {
    const response = await fetch(`${API_BASE}/orders/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
}

export default ApiService;
