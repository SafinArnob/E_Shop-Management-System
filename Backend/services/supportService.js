import db from '../config/config.js';
import { randomUUID } from 'crypto';

// Create a new support ticket
const createTicket = (customerId, ticketData) => {
  return new Promise((resolve, reject) => {
    const ticketId = randomUUID();
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const query = `
      INSERT INTO support_tickets (
        id, ticket_number, customer_id, category_id, subject, 
        description, priority, status, order_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, NOW(), NOW())
    `;
    
    const params = [
      ticketId,
      ticketNumber,
      customerId,
      ticketData.category_id,
      ticketData.subject,
      ticketData.description,
      ticketData.priority,
      ticketData.order_id
    ];

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve({
        id: ticketId,
        ticket_number: ticketNumber,
        customer_id: customerId,
        category_id: ticketData.category_id,
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        status: 'open',
        order_id: ticketData.order_id
      });
    });
  });
};

// Get ticket by ID with JOIN for related data
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
        CASE 
          WHEN st.assigned_type = 'owner' THEN ow.username 
          WHEN st.assigned_type = 'salesman' THEN s.name 
          ELSE NULL 
        END as assigned_name
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

// Get ticket by ticket number
const getTicketByNumber = (ticketNumber) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        st.*,
        c.name as customer_name,
        c.email as customer_email,
        sc.name as category_name,
        o.order_number,
        CASE 
          WHEN st.assigned_type = 'owner' THEN ow.username 
          WHEN st.assigned_type = 'salesman' THEN s.name 
          ELSE NULL 
        END as assigned_name
      FROM support_tickets st
      JOIN customer c ON st.customer_id = c.id
      JOIN support_categories sc ON st.category_id = sc.id
      LEFT JOIN \`order\` o ON st.order_id = o.id
      LEFT JOIN owner ow ON st.assigned_to = ow.id AND st.assigned_type = 'owner'
      LEFT JOIN salesman s ON st.assigned_to = s.id AND st.assigned_type = 'salesman'
      WHERE st.ticket_number = ?
    `;

    db.query(query, [ticketNumber], (err, results) => {
      if (err) return reject(err);
      resolve(results && results[0] ? results[0] : null);
    });
  });
};

// Get all tickets for a customer with pagination and total count
const getCustomerTickets = (customerId, limit = 10, offset = 0) => {
  return new Promise((resolve, reject) => {
    // First get the total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM support_tickets st
      WHERE st.customer_id = ?
    `;

    db.query(countQuery, [customerId], (countErr, countResults) => {
      if (countErr) return reject(countErr);

      const total = countResults[0].total;

      // Then get the tickets with pagination
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
          o.order_number
        FROM support_tickets st
        JOIN support_categories sc ON st.category_id = sc.id
        LEFT JOIN \`order\` o ON st.order_id = o.id
        WHERE st.customer_id = ?
        ORDER BY st.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.query(query, [customerId, limit, offset], (err, results) => {
        if (err) return reject(err);
        resolve({
          tickets: results || [],
          total
        });
      });
    });
  });
};

// Get all tickets with filters (for admin/employee) with total count
const getAllTickets = (filters = {}) => {
  return new Promise((resolve, reject) => {
    let baseQuery = `
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
      baseQuery += ' AND st.status = ?';
      params.push(filters.status);
    }
    
    if (filters.priority) {
      baseQuery += ' AND st.priority = ?';
      params.push(filters.priority);
    }
    
    if (filters.category_id) {
      baseQuery += ' AND st.category_id = ?';
      params.push(filters.category_id);
    }
    
    if (filters.assigned_to) {
      baseQuery += ' AND st.assigned_to = ?';
      params.push(filters.assigned_to);
    }

    // Get total count first
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    
    db.query(countQuery, params, (countErr, countResults) => {
      if (countErr) return reject(countErr);

      const total = countResults[0].total;

      // Get the actual data
      let dataQuery = `
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
          CASE 
            WHEN st.assigned_type = 'owner' THEN ow.username 
            WHEN st.assigned_type = 'salesman' THEN s.name 
            ELSE NULL 
          END as assigned_name
        ${baseQuery}
        ORDER BY st.created_at DESC
      `;
      
      if (filters.limit) {
        dataQuery += ' LIMIT ?';
        params.push(parseInt(filters.limit));
        
        if (filters.offset) {
          dataQuery += ' OFFSET ?';
          params.push(parseInt(filters.offset));
        }
      }

      db.query(dataQuery, params, (err, results) => {
        if (err) return reject(err);
        resolve({
          tickets: results || [],
          total
        });
      });
    });
  });
};

// Update ticket status
const updateTicketStatus = (ticketId, status, updatedBy = null, updatedByType = null) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE support_tickets SET status = ?, updated_at = NOW()';
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
      SET assigned_to = ?, assigned_type = ?,  updated_at = NOW()
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
    const query = 'UPDATE support_tickets SET priority = ?, updated_at = NOW() WHERE id = ?';

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
        id, ticket_id, sender_id, sender_type, message, is_internal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
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
      
      // Update ticket's updated_at timestamp
      const updateTicketQuery = 'UPDATE support_tickets SET updated_at = NOW() WHERE id = ?';
      
      db.query(updateTicketQuery, [ticketId], (updateErr) => {
        if (updateErr) console.error('Error updating ticket timestamp:', updateErr);
        
        resolve({
          id: messageId,
          ticket_id: ticketId,
          sender_id: senderData.sender_id,
          sender_type: senderData.sender_type,
          message: message,
          is_internal: isInternal,
          created_at: new Date()
        });
      });
    });
  });
};

// Get messages for a ticket
const getTicketMessages = (ticketId, includeInternal = false) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        sm.*,
        CASE 
          WHEN sm.sender_type = 'customer' THEN c.name
          WHEN sm.sender_type = 'owner' THEN ow.username
          WHEN sm.sender_type = 'salesman' THEN s.name
          ELSE 'Unknown'
        END as sender_name
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

// Get all support categories
const getAllCategories = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM support_categories 
      WHERE is_active = TRUE 
      ORDER BY name ASC
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results || []);
    });
  });
};

// Get ticket statistics
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
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_tickets
      FROM support_tickets
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results && results[0] ? results[0] : {});
    });
  });
};

// Check if customer owns ticket
const verifyTicketOwnership = (ticketId, customerId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id FROM support_tickets WHERE id = ? AND customer_id = ?';

    db.query(query, [ticketId, customerId], (err, results) => {
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