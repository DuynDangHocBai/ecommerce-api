const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { env } = require('../config/env');
const { HttpError } = require('../utils/http');

const toPublicUser = (u) => ({
  uid: u.uid,
  username: u.username,
  fullname: u.fullname,
  role: u.role.rolename,
  membership: { mname: u.membership.mname, score: u.membership.score },
});

router.post('/register', async (req, res) => {
  const { username, fullname, password } = req.body || {};
  if (typeof username !== 'string' || typeof fullname !== 'string' || typeof password !== 'string'
      || !username.trim() || !fullname.trim()) {
    throw new HttpError(400, 'username, fullname, password là bắt buộc');
  }
  if (username.length > 50 || fullname.length > 100) throw new HttpError(400, 'username tối đa 50, fullname tối đa 100 ký tự');
  if (password.length < 6) throw new HttpError(400, 'Mật khẩu tối thiểu 6 ký tự');

  const existed = await prisma.user.findUnique({ where: { username } });
  if (existed) throw new HttpError(409, 'Username đã tồn tại');

  // Không nhận roleid, mid, score từ client: hệ thống tự gán
  const [role, membership] = await Promise.all([
    prisma.role.findUnique({ where: { rolename: 'normal' } }),
    prisma.memberShip.findUnique({ where: { mname: 'basic' } }),
  ]);
  if (!role || !membership) throw new Error('Chưa seed Role/MemberShip');

  const hash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { username: username.trim(), fullname: fullname.trim(), password: hash, roleid: role.roleid, mid: membership.mid },
    include: { role: true, membership: true },
  });

  res.status(201).json({ message: 'Đăng ký thành công', user: toPublicUser(user) });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'username và password là bắt buộc');
  }

  const user = await prisma.user.findUnique({ where: { username }, include: { role: true, membership: true } });
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw new HttpError(401, 'Sai username hoặc password');

  const token = jwt.sign({ uid: user.uid, role: user.role.rolename }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  res.json({ message: 'Đăng nhập thành công', token, user: toPublicUser(user) });
});

module.exports = router;