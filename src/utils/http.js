class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseId(value, name = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `${name} không hợp lệ`);
  return n;
}

module.exports = { HttpError, parseId };