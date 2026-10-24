const router = require('express').Router();
const prisma = require('../config/prisma');

router.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'healthy', service: 'ecommerce-api', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', service: 'ecommerce-api', database: 'disconnected' });
  }
});

module.exports = router;