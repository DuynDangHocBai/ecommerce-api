const express = require('express');

const app = express();
app.use(express.json());

app.use('/health', require('./routes/health.routes'));
// ROUTES_PLACEHOLDER: các bước sau sẽ thêm route vào ngay dưới dòng này

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));

app.use((req, res) => res.status(404).json({ message: 'Không tìm thấy endpoint' }));

app.use((err, req, res, next) => {
  if (err.code === 'P2002') return res.status(409).json({ message: 'Dữ liệu bị trùng' });
  if (err.code === 'P2025') return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
  if (err.code === 'P2003') return res.status(409).json({ message: 'Dữ liệu đang được tham chiếu, không thể thực hiện' });

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Lỗi máy chủ nội bộ' : err.message });
});

module.exports = app;