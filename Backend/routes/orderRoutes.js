import express from 'express';
import { 
  createOrder,
  getOrderById,
  getCustomerOrders,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getOrderStats,
  previewOrderWithDiscount
} from '../controllers/orderController.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import authorizeRoles from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Customer routes
router.post('/', authenticateToken, createOrder);                           // POST /api/orders
router.get('/my-orders', authenticateToken, getCustomerOrders);            // GET /api/orders/my-orders
router.get('/preview', authenticateToken, previewOrderWithDiscount);       // GET /api/orders/preview?discount_code=CODE
router.get('/:id', authenticateToken, getOrderById);                       // GET /api/orders/:id
router.put('/:id/cancel', authenticateToken, cancelOrder);                 // PUT /api/orders/:id/cancel

// Admin/Employee routes
router.get('/', authenticateToken, authorizeRoles('admin', 'employee'), getAllOrders);           // GET /api/orders
router.put('/:id/status', authenticateToken, authorizeRoles('admin', 'employee'), updateOrderStatus);    // PUT /api/orders/:id/status
router.put('/:id/payment', authenticateToken, authorizeRoles('admin', 'employee'), updatePaymentStatus); // PUT /api/orders/:id/payment
router.get('/stats/summary', authenticateToken, authorizeRoles('admin', 'employee'), getOrderStats);     // GET /api/orders/stats/summary

export default router;