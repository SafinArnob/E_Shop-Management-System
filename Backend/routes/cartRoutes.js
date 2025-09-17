import express from 'express';
import { 
  addToCart, 
  getCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart, 
  getCartItemCount, 
  validateCart,
  applyDiscountToCart,
  validateCartWithDiscount,
  getCartWithDiscount
} from '../controllers/cartController.js';
import authenticateToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticateToken);

// Existing cart management routes
router.post('/add', addToCart);                    // POST /api/cart/add
router.get('/', getCart);                          // GET /api/cart
router.put('/item/:productId', updateCartItem);    // PUT /api/cart/item/:productId
router.delete('/item/:productId', removeFromCart); // DELETE /api/cart/item/:productId
router.delete('/clear', clearCart);                // DELETE /api/cart/clear
router.get('/count', getCartItemCount);            // GET /api/cart/count
router.get('/validate', validateCart);             // GET /api/cart/validate

// Discount-related routes
router.post('/apply-discount', applyDiscountToCart);           // POST /api/cart/apply-discount
router.get('/validate-discount', validateCartWithDiscount);   // GET /api/cart/validate-discount?discount_code=CODE
router.get('/preview-discount', getCartWithDiscount);         // GET /api/cart/preview-discount?discount_code=CODE

export default router;