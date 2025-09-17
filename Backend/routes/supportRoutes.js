import express from 'express';
import {
  createTicket,
  getTicketById,
  getTicketByNumber,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
  assignTicket,
  updateTicketPriority,
  addMessage,
  getTicketMessages,
  getCategories,
  getTicketStats,
  getMyAssignedTickets
} from '../controllers/supportController.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import authorizeRoles from '../middlewares/roleMiddleware.js'; 


const router = express.Router();

// Public route for categories (no auth needed for this one)
router.get('/categories', getCategories);

// Apply authentication to all other routes
router.use(authenticateToken);

// Customer routes - accessible by all authenticated users
router.post('/tickets', createTicket);
router.get('/my-tickets', getMyTickets);
router.get('/tickets/:ticketId', getTicketById);
router.get('/tickets/number/:ticketNumber', getTicketByNumber);
router.post('/tickets/:ticketId/messages', addMessage);
router.get('/tickets/:ticketId/messages', getTicketMessages);

// Admin/Employee routes - apply role middleware to each route individually
router.get('/admin/tickets', authorizeRoles('admin', 'employee'), getAllTickets);
router.put('/admin/tickets/:ticketId/status', authorizeRoles('admin', 'employee'), updateTicketStatus);
router.put('/admin/tickets/:ticketId/priority', authorizeRoles('admin', 'employee'), updateTicketPriority);
router.get('/admin/stats', authorizeRoles('admin', 'employee'), getTicketStats);
router.get('/admin/my-assigned', authorizeRoles('admin', 'employee'), getMyAssignedTickets);

// Admin only routes
router.put('/admin/tickets/:ticketId/assign', authorizeRoles('admin'), assignTicket);

export default router;