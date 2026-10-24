const prisma = require('../config/prisma');
const { HttpError } = require('../utils/http');

const ORDER_INCLUDE = {
  details: { include: { product: { select: { pid: true, pname: true } } }, orderBy: { pid: 'asc' } },
  shipments: true,
};

// Kiểm tra dữ liệu, gộp pid trùng, sắp theo pid để tránh deadlock khi nhiều đơn chạy song song
function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'items phải là mảng không rỗng');
  const merged = new Map();
  for (const item of items) {
    const { pid, qty } = item || {};
    if (!Number.isInteger(pid) || pid <= 0 || !Number.isInteger(qty) || qty <= 0) {
      throw new HttpError(400, 'Mỗi item cần pid và qty là số nguyên dương');
    }
    merged.set(pid, (merged.get(pid) || 0) + qty);
  }
  return [...merged].map(([pid, qty]) => ({ pid, qty })).sort((a, b) => a.pid - b.pid);
}

async function createOrder(uid, rawItems) {
  const items = normalizeItems(rawItems);

  return prisma.$transaction(async (tx) => {
    const details = [];
    for (const { pid, qty } of items) {
      const product = await tx.product.findUnique({ where: { pid } });
      if (!product) throw new HttpError(404, `Không tìm thấy sản phẩm pid=${pid}`);

      // Chỉ trừ khi còn đủ hàng: điều kiện và phép trừ nằm trong cùng một câu UPDATE
      const result = await tx.product.updateMany({
        where: { pid, quantity: { gte: qty } },
        data: { quantity: { decrement: qty } },
      });
      if (result.count === 0) {
        throw new HttpError(409, `Sản phẩm "${product.pname}" không đủ hàng (còn ${product.quantity}, cần ${qty})`);
      }
      details.push({ pid, qty, unit_price: product.price }); // Giá lấy từ database, không tin client
    }

    return tx.order.create({
      data: {
        uid, // Người mua lấy từ JWT
        details: { create: details },
        shipments: { create: { status: 'pending' } },
      },
      include: ORDER_INCLUDE,
    });
  });
}

async function getOrder(oid, user) {
  const order = await prisma.order.findUnique({ where: { oid }, include: ORDER_INCLUDE });
  if (!order || (user.role !== 'admin' && order.uid !== user.uid)) {
    throw new HttpError(404, 'Không tìm thấy đơn hàng');
  }
  return order;
}

function listOrders(user) {
  return prisma.order.findMany({
    where: user.role === 'admin' ? {} : { uid: user.uid },
    include: ORDER_INCLUDE,
    orderBy: { oid: 'desc' },
  });
}

module.exports = { createOrder, getOrder, listOrders };