import express from 'express';
import { createDiscount, updateDiscount, getAllDiscounts, applyDiscountToProduct, applyDiscountToOrder } from '../controllers/discountController.js';

const router = express.Router();

// Routes for Discount Management
router.post('/', createDiscount);
router.put('/:id', updateDiscount);
router.get('/', getAllDiscounts);
router.post('/product', applyDiscountToProduct);
router.post('/order', applyDiscountToOrder);

export default router;
