import orderService from '../services/orderService.js';

// Create order from cart
export const createOrder = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const orderData = req.body;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can create orders.' 
      });
    }

    const result = await orderService.createOrderFromCart(customerId, orderData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating order', 
      error: error.message 
    });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.userId;
    const userRole = req.user.role;

    let order;
    
    if (userRole === 'customer') {
      // Customers can only view their own orders
      order = await orderService.getOrderById(id, customerId);
    } else if (userRole === 'admin' || userRole === 'employee') {
      // Admin/Employee can view any order
      order = await orderService.getOrderById(id);
    } else {
      return res.status(403).json({ 
        message: 'Access denied. Invalid user role.' 
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching order', 
      error: error.message 
    });
  }
};

// Get customer's orders
export const getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.userId;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can view their orders.' 
      });
    }

    const orders = await orderService.getCustomerOrders(customerId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching customer orders', 
      error: error.message 
    });
  }
};

// Get all orders (admin/employee only)
export const getAllOrders = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Check if user is admin or employee
    if (userRole !== 'admin' && userRole !== 'employee') {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and employees can view all orders.' 
      });
    }

    const { limit = 50, offset = 0 } = req.query;
    const orders = await orderService.getAllOrders(parseInt(limit), parseInt(offset));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching orders', 
      error: error.message 
    });
  }
};

// Update order status (admin/employee only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    // Check if user is admin or employee
    if (userRole !== 'admin' && userRole !== 'employee') {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and employees can update order status.' 
      });
    }

    const result = await orderService.updateOrderStatus(id, status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating order status', 
      error: error.message 
    });
  }
};

// Update payment status (admin/employee only)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const userRole = req.user.role;

    // Check if user is admin or employee
    if (userRole !== 'admin' && userRole !== 'employee') {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and employees can update payment status.' 
      });
    }

    const result = await orderService.updatePaymentStatus(id, paymentStatus);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating payment status', 
      error: error.message 
    });
  }
};

// Cancel order (customer only)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.userId;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can cancel their orders.' 
      });
    }

    const result = await orderService.cancelOrder(id, customerId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error cancelling order', 
      error: error.message 
    });
  }
};

// Get order statistics (admin/employee only)
export const getOrderStats = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Check if user is admin or employee
    if (userRole !== 'admin' && userRole !== 'employee') {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and employees can view order statistics.' 
      });
    }

    const stats = await orderService.getOrderStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching order statistics', 
      error: error.message 
    });
  }
};

