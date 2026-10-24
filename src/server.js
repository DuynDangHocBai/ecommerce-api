const app = require('./app');
const prisma = require('./config/prisma');
const { env } = require('./config/env');

async function start() {
  await prisma.$connect();
  const server = app.listen(env.PORT, () => {
    console.log(`ecommerce-api chạy tại http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Không khởi động được:', err.message);
  process.exit(1);
});