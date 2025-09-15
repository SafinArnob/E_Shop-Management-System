import express from 'express';
import { 
  addToCart, 
  getCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart, 
  getCartItemCount, 
  validateCart 
} from '../controllers/cartController.js';
import authenticateToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticateToken);

// Cart management routes
router.post('/add', addToCart);                    // POST /api/cart/add
router.get('/', getCart);                          // GET /api/cart
router.put('/item/:productId', updateCartItem);    // PUT /api/cart/item/:productId
router.delete('/item/:productId', removeFromCart); // DELETE /api/cart/item/:productId
router.delete('/clear', clearCart);                // DELETE /api/cart/clear
router.get('/count', getCartItemCount);            // GET /api/cart/count
router.get('/validate', validateCart);             // GET /api/cart/validate

export default router;

