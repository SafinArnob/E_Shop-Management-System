import discountService from '../services/discountService.js';
import { validateDiscountData } from '../utils/validationHelpers.js';
import { asyncHandler, rateLimitDiscountAttempts } from '../middlewares/errorHandling.js';


// Create discount (Admin/Employee only)
export const createDiscount = asyncHandler(async (req, res) => {
  const userRole = req.user.role;

  // Check if user is admin or employee
  if (userRole !== 'admin' && userRole !== 'employee') {
    return res.status(403).json({ 
      message: 'Access denied. Only admin and employees can create discounts.' 
    });
  }

  const discountData = req.body;
  const { product_ids } = req.body;

  // Validate discount data
  const validation = validateDiscountData(discountData);
  if (!validation.isValid) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  discountData.created_by = req.user.userId;

  const result = await discountService.createDiscount(discountData, product_ids);
  res.status(201).json(result);
});

// Get all discounts (Admin/Employee only)
export const getAllDiscounts = asyncHandler(async (req, res) => {
  const userRole = req.user.role;

  if (userRole !== 'admin' && userRole !== 'employee') {
    return res.status(403).json({ 
      message: 'Access denied. Only admin and employees can view discounts.' 
    });
  }

  const discounts = await discountService.getAllDiscounts();
  res.json(discounts);
});

// Get discount by ID (Admin/Employee only)
export const getDiscountById = asyncHandler(async (req, res) => {
  const userRole = req.user.role;

  if (userRole !== 'admin' && userRole !== 'employee') {
    return res.status(403).json({ 
      message: 'Access denied. Only admin and employees can view discount details.' 
    });
  }

  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: 'Discount ID is required'
    });
  }

  const discount = await discountService.getDiscountById(id);
  res.json(discount);
});

// Update discount (Admin/Employee only)
export const updateDiscount = asyncHandler(async (req, res) => {
  const userRole = req.user.role;

  if (userRole !== 'admin' && userRole !== 'employee') {
    return res.status(403).json({ 
      message: 'Access denied. Only admin and employees can update discounts.' 
    });
  }

  const { id } = req.params;
  const discountData = req.body;
  const { product_ids } = req.body;

  if (!id) {
    return res.status(400).json({
      message: 'Discount ID is required'
    });
  }

  // Validate discount data
  const validation = validateDiscountData(discountData);
  if (!validation.isValid) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  const result = await discountService.updateDiscount(id, discountData, product_ids);
  res.json(result);
});

// Delete discount (Admin/Employee only)
export const deleteDiscount = asyncHandler(async (req, res) => {
  const userRole = req.user.role;

  if (userRole !== 'admin' && userRole !== 'employee') {
    return res.status(403).json({ 
      message: 'Access denied. Only admin and employees can delete discounts.' 
    });
  }

  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: 'Discount ID is required'
    });
  }

  const result = await discountService.deleteDiscount(id);
  res.json(result);
});

// Apply discount code to cart (Customer with rate limiting)
export const applyDiscountCode = [
  rateLimitDiscountAttempts,
  asyncHandler(async (req, res) => {
    const { discount_code, cart_items } = req.body;

    if (!discount_code || !cart_items) {
      return res.status(400).json({ 
        message: 'Discount code and cart items are required' 
      });
    }

    if (!Array.isArray(cart_items) || cart_items.length === 0) {
      return res.status(400).json({
        message: 'Cart items must be a non-empty array'
      });
    }

    const result = await discountService.applyDiscountCode(discount_code, cart_items);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  })
];

// Validate discount code (Customer)
export const validateDiscountCode = asyncHandler(async (req, res) => {
  const { discount_code } = req.params;

  if (!discount_code) {
    return res.status(400).json({
      message: 'Discount code is required'
    });
  }

  try {
    // Import discountModel to check if code exists
    const discountModel = await import('../models/discountModel.js');
    const discount = await discountModel.default.getDiscountByCode(discount_code);

    if (!discount) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid or expired discount code'
      });
    }

    res.json({
      valid: true,
      discount: {
        code: discount.discount_code,
        name: discount.name,
        description: discount.description,
        discount_type: discount.discount_type,
        calculation_type: discount.calculation_type,
        discount_value: discount.discount_value,
        minimum_order_amount: discount.minimum_order_amount,
        minimum_quantity: discount.minimum_quantity
      }
    });
  } catch (error) {
    res.status(500).json({
      valid: false,
      message: 'Error validating discount code',
      error: error.message
    });
  }
});

// Get discount statistics (Admin/Employee only)
export const getDiscountStats = asyncHandler(async (req, res) => {
  const userRole = req.user.role;

  if (userRole !== 'admin' && userRole !== 'employee') {
    return res.status(403).json({ 
      message: 'Access denied. Only admin and employees can view discount statistics.' 
    });
  }

  // This would require additional database queries for statistics
  // You can implement based on your needs
  res.json({
    message: 'Discount statistics endpoint - implement based on requirements'
  });
});