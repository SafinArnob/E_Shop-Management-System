// Complete discountRoutes.js file with all endpoints:

import express from 'express';
import {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  applyDiscountCode,
  validateDiscountCode,
  getDiscountStats
} from '../controllers/discountController.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import authorizeRoles from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Admin/Employee routes - discount management
router.post('/', authenticateToken, authorizeRoles('employee', 'admin'), createDiscount);
router.get('/', authenticateToken, authorizeRoles('employee', 'admin'), getAllDiscounts);
router.get('/stats', authenticateToken, authorizeRoles('employee', 'admin'), getDiscountStats);
router.get('/:id', authenticateToken, authorizeRoles('employee', 'admin'), getDiscountById);
router.put('/:id', authenticateToken, authorizeRoles('employee', 'admin'), updateDiscount);
router.delete('/:id', authenticateToken, authorizeRoles('employee', 'admin'), deleteDiscount);

// Public routes - discount validation and application
router.post('/apply-code', applyDiscountCode);                    // POST /api/discounts/apply-code
router.get('/validate/:discount_code', validateDiscountCode);     // GET /api/discounts/validate/CODE123

export default router;