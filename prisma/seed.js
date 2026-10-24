const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');
const { env } = require('../src/config/env');

async function main() {
  for (const rolename of ['admin', 'normal']) {
    await prisma.role.upsert({ where: { rolename }, update: {}, create: { rolename } });
  }

  const tiers = [
    { mname: 'basic', score: 10 },
    { mname: 'silver', score: 100 },
    { mname: 'gold', score: 500 },
  ];
  for (const t of tiers) {
    await prisma.memberShip.upsert({ where: { mname: t.mname }, update: { score: t.score }, create: t });
  }

  const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (ADMIN_USERNAME && ADMIN_PASSWORD) {
    const adminRole = await prisma.role.findUnique({ where: { rolename: 'admin' } });
    const basic = await prisma.memberShip.findUnique({ where: { mname: 'basic' } });
    const hash = await bcrypt.hash(ADMIN_PASSWORD, env.BCRYPT_SALT_ROUNDS);
    await prisma.user.upsert({
      where: { username: ADMIN_USERNAME },
      update: {},
      create: { username: ADMIN_USERNAME, fullname: 'Administrator', password: hash, roleid: adminRole.roleid, mid: basic.mid },
    });
  }
  console.log('Seed xong: Role, MemberShip, admin');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());