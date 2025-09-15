import express from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } from '../controllers/productController.js';
import authenticateToken from '../middlewares/authMiddleware.js';  // Import authentication middleware
import authorizeRoles from '../middlewares/roleMiddleware.js';  // Import authorization middleware


const router = express.Router();


router.post('/', authenticateToken, authorizeRoles('employee', 'admin'), createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', authenticateToken, authorizeRoles('employee', 'admin'), updateProduct);
router.delete('/:id', authenticateToken, authorizeRoles('employee', 'admin'), deleteProduct);

export default router;
