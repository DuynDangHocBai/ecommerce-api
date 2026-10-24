const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { HttpError, parseId } = require('../utils/http');
const orderService = require('../services/order.service');

const SHIPMENT_STATUSES = ['pending', 'shipping', 'delivered', 'cancelled'];

router.use(authenticate); // Mọi endpoint đơn hàng đều cần đăng nhập

router.post('/', async (req, res) => {
  const order = await orderService.createOrder(req.user.uid, req.body?.items);
  res.status(201).json(order);
});

router.get('/', async (req, res) => {
  res.json(await orderService.listOrders(req.user));
});

router.get('/:oid', async (req, res) => {
  res.json(await orderService.getOrder(parseId(req.params.oid, 'oid'), req.user));
});

router.get('/:oid/shipments', async (req, res) => {
  const order = await orderService.getOrder(parseId(req.params.oid, 'oid'), req.user);
  res.json(order.shipments);
});

router.patch('/:oid/shipments/:shipid', requireAdmin, async (req, res) => {
  const oid = parseId(req.params.oid, 'oid');
  const shipid = parseId(req.params.shipid, 'shipid');
  const { status } = req.body || {};
  if (!SHIPMENT_STATUSES.includes(status)) {
    throw new HttpError(400, `status phải là: ${SHIPMENT_STATUSES.join(', ')}`);
  }
  const result = await prisma.shipment.updateMany({ where: { shipid, oid }, data: { status } });
  if (result.count === 0) throw new HttpError(404, 'Không tìm thấy shipment');
  res.json({ shipid, oid, status });
});

module.exports = router;