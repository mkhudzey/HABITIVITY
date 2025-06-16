function verifyAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
    }
    next();
  }
  
  module.exports = verifyAdmin;