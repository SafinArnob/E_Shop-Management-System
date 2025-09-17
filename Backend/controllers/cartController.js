import cartService from '../services/cartService.js';

// Add product to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const customerId = req.user.userId;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can add items to cart.' 
      });
    }

    const result = await cartService.addToCart(customerId, productId, quantity);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error adding item to cart', 
      error: error.message 
    });
  }
};

// Get customer's cart
export const getCart = async (req, res) => {
  try {
    const customerId = req.user.userId;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can view cart.' 
      });
    }

    const cart = await cartService.getCart(customerId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching cart', 
      error: error.message 
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const customerId = req.user.userId;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can update cart items.' 
      });
    }

    const result = await cartService.updateCartItem(customerId, productId, quantity);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating cart item', 
      error: error.message 
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const customerId = req.user.userId;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can remove cart items.' 
      });
    }

    const result = await cartService.removeFromCart(customerId, productId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error removing item from cart', 
      error: error.message 
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const customerId = req.user.userId;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can clear cart.' 
      });
    }

    const result = await cartService.clearCart(customerId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error clearing cart', 
      error: error.message 
    });
  }
};

// Get cart item count
export const getCartItemCount = async (req, res) => {
  try {
    const customerId = req.user.userId;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can view cart count.' 
      });
    }

    const result = await cartService.getCartItemCount(customerId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error getting cart item count', 
      error: error.message 
    });
  }
};

// Validate cart (check for price changes, product availability)
export const validateCart = async (req, res) => {
  try {
    const customerId = req.user.userId;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can validate cart.' 
      });
    }

    const result = await cartService.validateCart(customerId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error validating cart', 
      error: error.message 
    });
  }
};

// Apply discount to cart
export const applyDiscountToCart = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { discount_code } = req.body;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can apply discounts to cart.' 
      });
    }

    if (!discount_code) {
      return res.status(400).json({
        message: 'Discount code is required'
      });
    }

    const result = await cartService.applyDiscountToCart(customerId, discount_code);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ 
      message: 'Error applying discount to cart', 
      error: error.message 
    });
  }
};

// Validate cart with discount
export const validateCartWithDiscount = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { discount_code } = req.query;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can validate cart.' 
      });
    }

    const result = await cartService.validateCartWithDiscount(customerId, discount_code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error validating cart with discount', 
      error: error.message 
    });
  }
};

// Get cart with discount preview
export const getCartWithDiscount = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { discount_code } = req.query;

    // Check if user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        message: 'Access denied. Only customers can view cart.' 
      });
    }

    const cart = await cartService.getCart(customerId);
    
    if (discount_code && cart && cart.items.length > 0) {
      // Import discountService
      const discountService = await import('../services/discountService.js');
      const discountResult = await discountService.default.applyDiscountCode(discount_code, cart.items);
      
      return res.json({
        cart,
        discount_preview: discountResult
      });
    }
    
    res.json({ cart, discount_preview: null });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching cart with discount', 
      error: error.message 
    });
  }
};

