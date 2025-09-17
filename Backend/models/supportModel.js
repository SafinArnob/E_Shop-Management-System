import db from '../config/config.js';
import { randomUUID } from 'crypto';

// Create a new support ticket
const createTicket = (customerData, ticketData) => {
  return new Promise((resolve, reject) => {
    const ticketId = randomUUID();
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const query = `
      INSERT INTO support_tickets (
        id, ticket_number, customer_id, category_id, subject, 
        description, priority, status, order_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)
    `;
    
    const params = [
      ticketId,
      ticketNumber,
      customerData.customer_id,
      ticketData.category_id,
      ticketData.subject,
      ticketData.description,
      ticketData.priority || 'medium',
      ticketData.order_id || null
    ];

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve({
        id: ticketId,
        ticket_number: ticketNumber,
        customer_id: customerData.customer_id,
        category_id: ticketData.category_id,
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority || 'medium',
        status: 'open',
        order_id: ticketData.order_id || null
      });
    });
  });
};

// Get ticket by ID with JOIN for related data - Enhanced with subquery
const getTicketById = (ticketId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        st.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        sc.name as category_name,
        sc.description as category_description,
        o.order_number,
        ow.username as owner_name,
        s.name as salesman_name,
        (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.id) as message_count,
        (SELECT COUNT(*) FROM support_tickets WHERE customer_id = st.customer_id) as customer_total_tickets
      FROM support_tickets st
      JOIN customer c ON st.customer_id = c.id
      JOIN support_categories sc ON st.category_id = sc.id
      LEFT JOIN \`order\` o ON st.order_id = o.id
      LEFT JOIN owner ow ON st.assigned_to = ow.id AND st.assigned_type = 'owner'
      LEFT JOIN salesman s ON st.assigned_to = s.id AND st.assigned_type = 'salesman'
      WHERE st.id = ?
    `;

    db.query(query, [ticketId], (err, results) => {
      if (err) return reject(err);
      resolve(results && results[0] ? results[0] : null);
    });
  });
};

// Get ticket by ticket number - Enhanced with subquery
const getTicketByNumber = (ticketNumber) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        st.*,
        c.name as customer_name,
        c.email as customer_email,
        sc.name as category_name,
        o.order_number,
        (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.id AND is_internal = FALSE) as public_message_count
      FROM support_tickets st
      JOIN customer c ON st.customer_id = c.id
      JOIN support_categories sc ON st.category_id = sc.id
      LEFT JOIN \`order\` o ON st.order_id = o.id
      WHERE st.ticket_number = ?
    `;

    db.query(query, [ticketNumber], (err, results) => {
      if (err) return reject(err);
      resolve(results && results[0] ? results[0] : null);
    });
  });
};

// Get all tickets for a customer with pagination - Enhanced with subquery
const getCustomerTickets = (customerId, limit = 50, offset = 0) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        st.id,
        st.ticket_number,
        st.subject,
        st.priority,
        st.status,
        st.created_at,
        st.updated_at,
        sc.name as category_name,
        o.order_number,
        (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.id) as message_count,
        (SELECT created_at FROM support_messages WHERE ticket_id = st.id ORDER BY created_at DESC LIMIT 1) as last_message_date
      FROM support_tickets st
      JOIN support_categories sc ON st.category_id = sc.id
      LEFT JOIN \`order\` o ON st.order_id = o.id
      WHERE st.customer_id = ?
      ORDER BY st.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(query, [customerId, limit, offset], (err, results) => {
      if (err) return reject(err);
      resolve(results || []);
    });
  });
};

// Get all tickets with filters (for admin/employee) - Enhanced with subqueries
const getAllTickets = (filters = {}) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        st.id,
        st.ticket_number,
        st.subject,
        st.priority,
        st.status,
        st.created_at,
        st.updated_at,
        c.name as customer_name,
        c.email as customer_email,
        sc.name as category_name,
        o.order_number,
        ow.username as owner_name,
        s.name as salesman_name,
        (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.id) as message_count,
        (SELECT COUNT(*) FROM support_tickets WHERE customer_id = st.customer_id AND status = 'open') as customer_open_tickets,
        (SELECT created_at FROM support_messages WHERE ticket_id = st.id AND sender_type != 'customer' ORDER BY created_at ASC LIMIT 1) as first_response_date
      FROM support_tickets st
      JOIN customer c ON st.customer_id = c.id
      JOIN support_categories sc ON st.category_id = sc.id
      LEFT JOIN \`order\` o ON st.order_id = o.id
      LEFT JOIN owner ow ON st.assigned_to = ow.id AND st.assigned_type = 'owner'
      LEFT JOIN salesman s ON st.assigned_to = s.id AND st.assigned_type = 'salesman'
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.status) {
      query += ' AND st.status = ?';
      params.push(filters.status);
    }
    
    if (filters.priority) {
      query += ' AND st.priority = ?';
      params.push(filters.priority);
    }
    
    if (filters.category_id) {
      query += ' AND st.category_id = ?';
      params.push(filters.category_id);
    }
    
    if (filters.assigned_to) {
      query += ' AND st.assigned_to = ?';
      params.push(filters.assigned_to);
    }

    query += ' ORDER BY st.created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
      
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results || []);
    });
  });
};

// Update ticket status
const updateTicketStatus = (ticketId, status, updatedBy = null, updatedByType = null) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE support_tickets SET status = ?';
    let params = [status];

    if (status === 'resolved') {
      query += ', resolved_at = NOW()';
    } else if (status === 'closed') {
      query += ', closed_at = NOW()';
    }

    if (updatedBy && updatedByType) {
      query += ', last_updated_by = ?, last_updated_by_type = ?';
      params.push(updatedBy, updatedByType);
    }

    query += ' WHERE id = ?';
    params.push(ticketId);

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results.affectedRows > 0);
    });
  });
};

// Assign ticket to support agent
const assignTicket = (ticketId, assignedTo, assignedType) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE support_tickets 
      SET assigned_to = ?, assigned_type = ?, assigned_at = NOW()
      WHERE id = ?
    `;

    db.query(query, [assignedTo, assignedType, ticketId], (err, results) => {
      if (err) return reject(err);
      resolve(results.affectedRows > 0);
    });
  });
};

// Update ticket priority
const updateTicketPriority = (ticketId, priority) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE support_tickets SET priority = ? WHERE id = ?';

    db.query(query, [priority, ticketId], (err, results) => {
      if (err) return reject(err);
      resolve(results.affectedRows > 0);
    });
  });
};

// Add message to ticket
const addMessage = (ticketId, senderData, message, isInternal = false) => {
  return new Promise((resolve, reject) => {
    const messageId = randomUUID();
    const query = `
      INSERT INTO support_messages (
        id, ticket_id, sender_id, sender_type, message, is_internal
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      messageId,
      ticketId,
      senderData.sender_id,
      senderData.sender_type,
      message,
      isInternal
    ];

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      
      // Update first_response_at if this is first response from support
      if (senderData.sender_type !== 'customer') {
        const updateQuery = `
          UPDATE support_tickets 
          SET first_response_at = COALESCE(first_response_at, NOW())
          WHERE id = ?
        `;
        
        db.query(updateQuery, [ticketId], (updateErr) => {
          if (updateErr) console.error('Error updating first_response_at:', updateErr);
        });
      }

      resolve({
        id: messageId,
        ticket_id: ticketId,
        sender_id: senderData.sender_id,
        sender_type: senderData.sender_type,
        message: message,
        is_internal: isInternal
      });
    });
  });
};

// Get messages for a ticket - Enhanced with subquery
const getTicketMessages = (ticketId, includeInternal = false) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        sm.*,
        c.name as customer_name,
        ow.username as owner_name,
        s.name as salesman_name,
        (SELECT COUNT(*) FROM support_messages WHERE ticket_id = sm.ticket_id AND created_at < sm.created_at) + 1 as message_sequence_number
      FROM support_messages sm
      LEFT JOIN customer c ON sm.sender_id = c.id AND sm.sender_type = 'customer'
      LEFT JOIN owner ow ON sm.sender_id = ow.id AND sm.sender_type = 'owner'
      LEFT JOIN salesman s ON sm.sender_id = s.id AND sm.sender_type = 'salesman'
      WHERE sm.ticket_id = ?
    `;

    if (!includeInternal) {
      query += ' AND sm.is_internal = FALSE';
    }

    query += ' ORDER BY sm.created_at ASC';

    db.query(query, [ticketId], (err, results) => {
      if (err) return reject(err);
      resolve(results || []);
    });
  });
};

// Get all support categories - Enhanced with subquery
const getAllCategories = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT *,
        (SELECT COUNT(*) FROM support_tickets WHERE category_id = sc.id) as total_tickets,
        (SELECT COUNT(*) FROM support_tickets WHERE category_id = sc.id AND status = 'open') as open_tickets
      FROM support_categories sc
      WHERE sc.is_active = TRUE 
      ORDER BY sc.name ASC
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results || []);
    });
  });
};

// Get ticket statistics - Enhanced with more complex subqueries
const getTicketStats = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tickets,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_tickets,
        (SELECT COUNT(DISTINCT customer_id) FROM support_tickets WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as unique_customers,
        (SELECT AVG(message_count) FROM (SELECT COUNT(*) as message_count FROM support_messages GROUP BY ticket_id) as ticket_messages) as avg_messages_per_ticket,
        (SELECT category_id FROM support_tickets WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY category_id ORDER BY COUNT(*) DESC LIMIT 1) as most_common_category_id
      FROM support_tickets
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results && results[0] ? results[0] : {});
    });
  });
};

// Check if customer owns ticket - Enhanced with subquery
const verifyTicketOwnership = (ticketId, customerId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id,
        (SELECT COUNT(*) FROM support_tickets WHERE customer_id = ?) as customer_total_tickets
      FROM support_tickets 
      WHERE id = ? AND customer_id = ?
    `;

    db.query(query, [customerId, ticketId, customerId], (err, results) => {
      if (err) return reject(err);
      resolve(results && results.length > 0);
    });
  });
};

export default {
  createTicket,
  getTicketById,
  getTicketByNumber,
  getCustomerTickets,
  getAllTickets,
  updateTicketStatus,
  assignTicket,
  updateTicketPriority,
  addMessage,
  getTicketMessages,
  getAllCategories,
  getTicketStats,
  verifyTicketOwnership
};