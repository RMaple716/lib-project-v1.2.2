const { verifyToken } = require('../utils/jwt');

/**
 * JWT Token 认证中间件
 * @module middleware/auth
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象  
 * @param {Function} next - Express 下一个中间件函数
 * @returns {void}
 * @throws {401} UNAUTHORIZED - 当未提供Token或Token格式错误时
 * @throws {401} TOKEN_INVALID - 当Token无效或已过期时
 * 
 * @example
 * // 在路由中使用认证中间件
 * app.get('/api/protected', authenticate, (req, res) => {
 *   res.json({ message: '访问成功', user: req.user });
 * });
 * 
 * @example <caption>401 UNAUTHORIZED 响应示例</caption>
 * // 当请求头缺少Authorization或不是Bearer格式时
 * // HTTP 状态码: 401
 * {
 *   "success": false,
 *   "errorCode": "UNAUTHORIZED", 
 *   "message": "请提供有效的Token"
 * }
 * 
 * @example <caption>401 TOKEN_INVALID 响应示例</caption> 
 * // 当Token验证失败或过期时
 * // HTTP 状态码: 401
 * {
 *   "success": false,
 *   "errorCode": "TOKEN_INVALID",
 *   "message": "Token无效或已过期"
 * }
 * 
 * @example <caption>成功认证后的请求头示例</caption>
 * // 客户端需要在请求头中携带有效的Token
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        message: '请提供有效的Token'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      errorCode: 'TOKEN_INVALID',
      message: 'Token无效或已过期'
    });
  }
}

module.exports = {
  authenticate
};