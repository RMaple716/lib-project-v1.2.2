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

/**
 * 检查是否为终端管理员
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express 下一个中间件函数
 * @returns {void}
 */
function requireTerminalAdmin(req, res, next) {
  if (!req.user || !req.user._utype.includes('admin_t')) {
    return res.status(403).json({
      success: false,
      errorCode: 'PERMISSION_DENIED',
      message: '需要终端管理员权限'
    });
  }
  next();
}

/**
 * 检查是否为管理员（终端管理员或普通管理员）
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express 下一个中间件函数
 * @returns {void}
 */
function requireAdmin(req, res, next) {
  if (!req.user || (!req.user._utype.includes('admin_t') && !req.user._utype.includes('admin_n'))) {
    return res.status(403).json({
      success: false,
      errorCode: 'PERMISSION_DENIED',
      message: '需要管理员权限'
    });
  }
  next();
}

module.exports = {
  authenticate,
  requireTerminalAdmin,
  requireAdmin
};