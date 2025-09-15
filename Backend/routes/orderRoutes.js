import express from 'express';
import { 
  createOrder, 
  getOrderById, 
  getCustomerOrders, 
  getAllOrders,
  updateOrderStatus, 
  updatePaymentStatus, 
  cancelOrder,
  getOrderStats 
} from '../controllers/orderController.js';
import authenticateToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

// Customer order routes
router.post('/create', createOrder);                    // POST /api/orders/create
router.get('/my-orders', getCustomerOrders);            // GET /api/orders/my-orders
router.get('/:id', getOrderById);                       // GET /api/orders/:id
router.put('/:id/cancel', cancelOrder);                 // PUT /api/orders/:id/cancel

// Admin/Employee order management routes
router.get('/admin/all', getAllOrders);                 // GET /api/orders/admin/all
router.get('/admin/stats', getOrderStats);              // GET /api/orders/admin/stats
router.put('/:id/status', updateOrderStatus);           // PUT /api/orders/:id/status
router.put('/:id/payment', updatePaymentStatus);        // PUT /api/orders/:id/payment

export default router;

