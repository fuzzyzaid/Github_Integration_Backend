const crypto = require('crypto');
const ALGO = 'aes-256-ctr';
const KEY = crypto.createHash('sha256').update(String(process.env.SESSION_SECRET || 'secret')).digest();

function encryptToken(token) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${enc.toString('hex')}`;
}

function decryptToken(encToken) {
  const [ivHex, dataHex] = encToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = { encryptToken, decryptToken };