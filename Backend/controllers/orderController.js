import orderService from '../services/orderService.js';

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

    // Validate required order data
    const requiredFields = ['totalAmount', 'totalItems', 'shippingAddress', 'paymentMethod'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Additional validation for discount code if provided
    if (orderData.discount_code && typeof orderData.discount_code !== 'string') {
      return res.status(400).json({
        message: 'Discount code must be a string'
      });
    }

    const result = await orderService.createOrderFromCart(customerId, orderData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      // Handle specific error cases
      if (result.message.includes('Cart is empty')) {
        res.status(400).json(result);
      } else if (result.message.includes('Cart items have changed')) {
        res.status(409).json(result); // Conflict status for cart changes
      } else if (result.message.includes('Discount')) {
        res.status(400).json(result); // Bad request for discount issues
      } else {
        res.status(400).json(result);
      }
    }
  } catch (error) {
    console.error('Error creating order:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ 
        message: 'Order already exists', 
        error: 'Duplicate order detected' 
      });
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      res.status(400).json({ 
        message: 'Invalid reference data', 
        error: 'Customer or product reference not found' 
      });
    } else {
      res.status(500).json({ 
        message: 'Error creating order', 
        error: error.message 
      });
    }
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

// controller function for order preview with discount:
export const previewOrderWithDiscount = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { discount_code } = req.query;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can preview orders.' 
      });
    }

    // Get cart first
    const cartService = await import('../services/cartService.js');
    const cart = await cartService.default.getCart(customerId);
    
    if (!cart || !cart.items.length) {
      return res.status(400).json({
        message: 'Cart is empty. Cannot preview order.'
      });
    }

    let orderPreview = {
      cart,
      order_summary: {
        subtotal: cart.total_amount,
        discount_amount: 0,
        final_total: cart.total_amount,
        total_items: cart.total_items
      }
    };

    // Apply discount if provided
    if (discount_code) {
      const discountService = await import('../services/discountService.js');
      const discountResult = await discountService.default.applyDiscountCode(discount_code, cart.items);
      
      if (discountResult.success) {
        orderPreview.order_summary = {
          subtotal: discountResult.cart_summary.original_total,
          discount_amount: discountResult.cart_summary.total_discount,
          final_total: discountResult.cart_summary.final_total,
          total_items: cart.total_items,
          savings_percentage: discountResult.savings_percentage
        };
        orderPreview.discount_applied = discountResult.discount_info;
      } else {
        orderPreview.discount_error = discountResult.message;
      }
    }

    res.json(orderPreview);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error previewing order', 
      error: error.message 
    });
  }
};

