const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { HttpError, parseId } = require('../utils/http');

function validateProduct(body, partial = false) {
  const { pname, price, quantity } = body || {};
  const data = {};
  if (pname !== undefined || !partial) {
    if (typeof pname !== 'string' || !pname.trim() || pname.length > 100) throw new HttpError(400, 'pname là chuỗi 1–100 ký tự');
    data.pname = pname.trim();
  }
  if (price !== undefined || !partial) {
    if (typeof price !== 'number' || !(price > 0) || price >= 1e8) throw new HttpError(400, 'price phải là số dương nhỏ hơn 100.000.000');
    data.price = price;
  }
  if (quantity !== undefined || !partial) {
    if (!Number.isInteger(quantity) || quantity < 0) throw new HttpError(400, 'quantity phải là số nguyên ≥ 0');
    data.quantity = quantity;
  }
  if (Object.keys(data).length === 0) throw new HttpError(400, 'Không có trường nào để cập nhật');
  return data;
}

router.get('/', async (req, res) => {
  res.json(await prisma.product.findMany({ orderBy: { pid: 'asc' } }));
});

router.get('/:pid', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { pid: parseId(req.params.pid, 'pid') } });
  if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  res.json(product);
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  res.status(201).json(await prisma.product.create({ data: validateProduct(req.body) }));
});

router.put('/:pid', authenticate, requireAdmin, async (req, res) => {
  const pid = parseId(req.params.pid, 'pid');
  res.json(await prisma.product.update({ where: { pid }, data: validateProduct(req.body, true) }));
});

router.delete('/:pid', authenticate, requireAdmin, async (req, res) => {
  await prisma.product.delete({ where: { pid: parseId(req.params.pid, 'pid') } });
  res.json({ message: 'Đã xóa sản phẩm' });
});

module.exports = router;