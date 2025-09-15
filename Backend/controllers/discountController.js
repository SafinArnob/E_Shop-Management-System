import discountModel from '../models/discountModel.js';

// Create Discount
export const createDiscount = async (req, res) => {
  try {
    const { discountCode, discountType, discountValue, startDate, endDate } = req.body;
    const result = await discountModel.createDiscount(discountCode, discountType, discountValue, startDate, endDate);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error creating discount', error: error.message });
  }
};

// Update Discount
export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountCode, discountType, discountValue, startDate, endDate } = req.body;
    const result = await discountModel.updateDiscount(id, discountCode, discountType, discountValue, startDate, endDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error updating discount', error: error.message });
  }
};

// Get All Discounts
export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await discountModel.getAllDiscounts();
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching discounts', error: error.message });
  }
};

// Apply Discount to Product
export const applyDiscountToProduct = async (req, res) => {
  try {
    const { productId, discountId } = req.body;
    const result = await discountModel.linkDiscountToProduct(productId, discountId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error applying discount to product', error: error.message });
  }
};

// Apply Discount to Order
export const applyDiscountToOrder = async (req, res) => {
  try {
    const { orderId, discountId } = req.body;
    const result = await discountModel.linkDiscountToOrder(orderId, discountId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error applying discount to order', error: error.message });
  }
};
