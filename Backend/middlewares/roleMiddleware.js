// Middleware to check if the user has the required role (Salesman or Admin)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. You do not have the required role.' });
    }
    next(); 
  };
};

export default authorizeRoles;
