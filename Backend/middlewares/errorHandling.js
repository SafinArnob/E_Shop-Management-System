// Create a new file: middlewares/errorHandling.js

// Global error handler middleware
export const globalErrorHandler = (err, req, res, next) => {
  console.error('Global error:', err);

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      message: 'Database connection failed',
      error: 'Service temporarily unavailable'
    });
  }

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      message: 'Duplicate entry',
      error: 'Resource already exists'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      message: 'Invalid reference',
      error: 'Referenced resource does not exist'
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      message: 'Cannot delete resource',
      error: 'Resource is being used by other records'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      error: 'Authentication failed'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      error: 'Please login again'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      error: err.message
    });
  }

  // Default server error
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request validation middleware
export const validateRequest = (validationFn) => {
  return asyncHandler(async (req, res, next) => {
    const validation = validationFn(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    next();
  });
};

// Rate limiting for discount applications
let discountAttempts = new Map();

export const rateLimitDiscountAttempts = (req, res, next) => {
  const clientId = req.ip + (req.user?.userId || '');
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 10;

  if (!discountAttempts.has(clientId)) {
    discountAttempts.set(clientId, { count: 0, resetTime: now + windowMs });
  }

  const attempts = discountAttempts.get(clientId);

  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + windowMs;
  }

  if (attempts.count >= maxAttempts) {
    return res.status(429).json({
      message: 'Too many discount attempts',
      error: 'Please try again later'
    });
  }

  attempts.count++;
  next();
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of discountAttempts.entries()) {
    if (now > value.resetTime) {
      discountAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000); // Clean up every 10 minutes