import supportService from '../services/supportService.js';

// Create a new support ticket
export const createTicket = async (req, res) => {
  try {
    const { category_id, subject, description, priority, order_id } = req.body;
    
    // Try different possible field names from JWT payload - adjust based on your JWT structure
    const customer_id = req.user.userId || req.user.id || req.user.user_id || req.user.customerId;

    // Debug: Log user data
    console.log('req.user:', req.user);
    console.log('customer_id:', customer_id);

    // Check if customer_id exists
    if (!customer_id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication failed - customer ID not found',
        debug: req.user // Include this temporarily to see what fields are available
      });
    }

    // Validate required fields
    if (!category_id || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category, subject, and description are required'
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be: low, medium, high, or urgent'
      });
    }

    const ticketData = {
      category_id,
      subject: subject.trim(),
      description: description.trim(),
      priority: priority || 'medium',
      order_id: order_id || null
    };

    const ticket = await supportService.createTicket(customer_id, ticketData);

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const customer_id = req.user.userId || req.user.id || req.user.user_id || req.user.customerId;
    const user_role = req.user.role;

    const ticket = await supportService.getTicketById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check ownership for customers
    if (user_role === 'customer' && ticket.customer_id !== customer_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own tickets.'
      });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get ticket by ticket number
export const getTicketByNumber = async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const customer_id = req.user.userId || req.user.id || req.user.user_id || req.user.customerId;
    const user_role = req.user.role;

    const ticket = await supportService.getTicketByNumber(ticketNumber);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check ownership for customers
    if (user_role === 'customer' && ticket.customer_id !== customer_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Error fetching ticket by number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get customer's tickets
export const getMyTickets = async (req, res) => {
  try {
    const customer_id = req.user.userId || req.user.id || req.user.user_id || req.user.customerId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Cap at 50
    
    const offset = (page - 1) * limit;
    const result = await supportService.getCustomerTickets(customer_id, limit, offset);

    res.json({
      success: true,
      data: result.tickets,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all tickets (admin/employee only)
export const getAllTickets = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      category_id, 
      assigned_to, 
      page = 1, 
      limit = 20 
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category_id) filters.category_id = parseInt(category_id);
    if (assigned_to) filters.assigned_to = assigned_to;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); 
    const offset = (pageNum - 1) * limitNum;

    filters.limit = limitNum;
    filters.offset = offset;

    const result = await supportService.getAllTickets(filters);

    res.json({
      success: true,
      data: result.tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update ticket status (admin/employee only)
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    const updatedBy = req.user.userId || req.user.id || req.user.user_id || req.user.customerId;
    const updatedByType = req.user.role === 'admin' ? 'owner' : 'salesman';

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['open', 'in_progress', 'pending_customer', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const success = await supportService.updateTicketStatus(
      ticketId, 
      status, 
      updatedBy, 
      updatedByType
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      message: `Ticket status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Assign ticket to support agent (admin only)
export const assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { assigned_to, assigned_type } = req.body;

    if (!assigned_to || !assigned_type) {
      return res.status(400).json({
        success: false,
        message: 'assigned_to and assigned_type are required'
      });
    }

    const validTypes = ['owner', 'salesman'];
    if (!validTypes.includes(assigned_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assigned_type. Must be owner or salesman'
      });
    }

    const success = await supportService.assignTicket(
      ticketId, 
      assigned_to, 
      assigned_type
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      message: 'Ticket assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update ticket priority (admin/employee only)
export const updateTicketPriority = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { priority } = req.body;

    if (!priority) {
      return res.status(400).json({
        success: false,
        message: 'Priority is required'
      });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority'
      });
    }

    const success = await supportService.updateTicketPriority(ticketId, priority);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      message: `Ticket priority updated to ${priority}`
    });

  } catch (error) {
    console.error('Error updating ticket priority:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket priority',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Add message to ticket
export const addMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, is_internal = false } = req.body;
    const sender_id = req.user.userId || req.user.id || req.user.user_id || req.user.customerId;
    const user_role = req.user.role;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Customers cannot send internal messages
    if (user_role === 'customer' && is_internal) {
      return res.status(403).json({
        success: false,
        message: 'Customers cannot send internal messages'
      });
    }

    // Verify ticket ownership for customers
    if (user_role === 'customer') {
      const hasAccess = await supportService.verifyTicketOwnership(ticketId, sender_id);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const sender_type = user_role === 'admin' ? 'owner' : 
                       user_role === 'employee' ? 'salesman' : 'customer';

    const messageData = await supportService.addMessage(
      ticketId,
      { sender_id, sender_type },
      message.trim(),
      is_internal
    );

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: messageData
    });

  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get ticket messages
export const getTicketMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const user_role = req.user.role;
    const customer_id = req.user.userId || req.user.id || req.user.user_id || req.user.customerId;

    // Verify access for customers
    if (user_role === 'customer') {
      const hasAccess = await supportService.verifyTicketOwnership(ticketId, customer_id);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Only admin/employees can see internal messages
    const includeInternal = user_role !== 'customer';
    const messages = await supportService.getTicketMessages(ticketId, includeInternal);

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all support categories
export const getCategories = async (req, res) => {
  try {
    const categories = await supportService.getAllCategories();

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get ticket statistics (admin/employee only)
export const getTicketStats = async (req, res) => {
  try {
    const stats = await supportService.getTicketStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get tickets assigned to current user (admin/employee only)
export const getMyAssignedTickets = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user.user_id || req.user.customerId;
    const userRole = req.user.role;
    const assignedType = userRole === 'admin' ? 'owner' : 'salesman';
    
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const filters = {
      assigned_to: userId,
      limit,
      offset
    };

    const result = await supportService.getAllTickets(filters);

    res.json({
      success: true,
      data: result.tickets,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching assigned tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};