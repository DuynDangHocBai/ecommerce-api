const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập (thiếu Bearer token)' });
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { uid: payload.uid, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ quản trị viên được thực hiện' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };