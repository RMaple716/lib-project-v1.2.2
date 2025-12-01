const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

/**
 * JWT令牌载荷
 * @typedef {Object} JWTPayload
 * @property {number} _uid - 用户ID
 * @property {string} _utype - 用户类型
 * @property {string} _account - 账号
 */

/**
 * 生成JWT令牌
 * @param {JWTPayload} payload - 令牌载荷
 * @returns {string} JWT令牌
 */
// 生成JWT token
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {JWTPayload} 解码后的载荷
 * @throws {Error} 令牌验证失败
 */

// 验证JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token验证失败');
  }
}

module.exports = {
  generateToken,
  verifyToken
};