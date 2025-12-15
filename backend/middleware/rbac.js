const { User, Role, Permission, UserRole, RolePermission } = require('../models');

/**
 * RBAC权限验证中间件
 * @module middleware/rbac
 */

/**
 * 检查用户是否有指定权限
 * @param {string} permissionCode - 权限代码
 * @returns {Function} Express中间件函数
 */
function requirePermission(permissionCode) {
  return async (req, res, next) => {
    try {
      // 如果用户是终端管理员，直接通过
      if (req.user && req.user._utype === 'admin_t') {
        return next();
      }

      // 检查用户是否已登录
      if (!req.user) {
        return res.status(401).json({
          success: false,
          errorCode: 'UNAUTHORIZED',
          message: '请先登录'
        });
      }

      // 获取用户的角色和权限
      const userWithRoles = await User.findByPk(req.user._uid, {
        include: [
          {
            model: Role,
            as: 'roles',
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] }
              }
            ],
            through: { attributes: [] }
          }
        ]
      });

      // 提取用户所有权限
      const userPermissions = [];
      userWithRoles.roles.forEach(role => {
        role.permissions.forEach(permission => {
          userPermissions.push(permission._pcode);
        });
      });

      // 检查用户是否有指定权限
      if (!userPermissions.includes(permissionCode)) {
        return res.status(403).json({
          success: false,
          errorCode: 'PERMISSION_DENIED',
          message: '权限不足'
        });
      }

      // 将用户权限添加到请求对象中，以便后续使用
      req.userPermissions = userPermissions;

      next();
    } catch (error) {
      console.error('权限验证错误:', error);
      res.status(500).json({
        success: false,
        errorCode: 'SERVER_ERROR',
        message: '服务器内部错误'
      });
    }
  };
}

/**
 * 公开接口白名单 - 这些接口不需要权限验证
 */
const publicEndpoints = [
  // 图书相关公开接口
  '/api/books',
  '/api/books/search',
  '/api/books/categories',
  '/api/books/category',
  '/api/books/hot',
  '/api/books/new',
  '/api/books/recommend',
  '/api/books/detail',

  // 图书大厅相关公开接口
  '/api/books/hall',

  // 分类相关公开接口
  '/api/categories',

  // 公告相关公开接口
  '/api/announcements/public',

  // 认证相关接口
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh'
];

/**
 * 检查是否为公开接口
 * @param {string} path - 请求路径
 * @returns {boolean} 是否为公开接口
 */
function isPublicEndpoint(path) {
  // 检查是否在白名单中
  if (publicEndpoints.some(endpoint => path.startsWith(endpoint))) {
    return true;
  }

  // 检查是否为图书借阅相关接口（这些接口需要特殊处理）
  if (path.startsWith('/api/borrow')) {
    return false;
  }

  return false;
}

module.exports = {
  requirePermission,
  isPublicEndpoint
};
