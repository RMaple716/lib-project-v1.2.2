
/**
 * 权限检查工具模块
 * @module utils/permissions
 */

const { User, Role, Permission } = require('../models');

/**
 * 检查用户是否具有特定权限
 * @param {number} userId - 用户ID
 * @param {string} permissionCode - 权限代码
 * @returns {Promise<boolean>} 是否具有权限
 */
async function checkUserPermission(userId, permissionCode) {
  try {
    // 查询用户及其角色和权限
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          include: [
            {
              model: Permission,
              as: 'permissions',
              where: {
                _pcode: permissionCode
              }
            }
          ]
        }
      ]
    });

    // 如果用户不存在，返回false
    if (!user) {
      return false;
    }

    // 终端管理员拥有所有权限
    if (user._utype === 'admin_t') {
      return true;
    }

    // 检查用户是否有该权限
    for (const role of user.roles) {
      if (role.permissions && role.permissions.length > 0) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('检查用户权限错误:', error);
    return false;
  }
}

/**
 * 获取用户的所有权限
 * @param {number} userId - 用户ID
 * @returns {Promise<Array>} 权限代码数组
 */
async function getUserPermissions(userId) {
  try {
    // 查询用户及其角色和权限
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          include: [
            {
              model: Permission,
              as: 'permissions'
            }
          ]
        }
      ]
    });

    // 如果用户不存在，返回空数组
    if (!user) {
      return [];
    }

    // 终端管理员拥有所有权限
    if (user._utype === 'admin_t') {
      // 获取所有权限代码
      const allPermissions = await Permission.findAll({
        attributes: ['_pcode']
      });
      return allPermissions.map(p => p._pcode);
    }

    // 收集所有权限代码
    const permissions = new Set();
    for (const role of user.roles) {
      if (role.permissions) {
        for (const permission of role.permissions) {
          permissions.add(permission._pcode);
        }
      }
    }

    return Array.from(permissions);
  } catch (error) {
    console.error('获取用户权限错误:', error);
    return [];
  }
}

/**
 * 检查用户是否有任一权限
 * @param {number} userId - 用户ID
 * @param {Array<string>} permissionCodes - 权限代码数组
 * @returns {Promise<boolean>} 是否具有任一权限
 */
async function checkUserAnyPermission(userId, permissionCodes) {
  try {
    // 如果权限代码数组为空，返回false
    if (!permissionCodes || permissionCodes.length === 0) {
      return false;
    }

    // 查询用户及其角色和权限
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          include: [
            {
              model: Permission,
              as: 'permissions',
              where: {
                _pcode: permissionCodes
              }
            }
          ]
        }
      ]
    });

    // 如果用户不存在，返回false
    if (!user) {
      return false;
    }

    // 终端管理员拥有所有权限
    if (user._utype === 'admin_t') {
      return true;
    }

    // 检查用户是否有任一权限
    for (const role of user.roles) {
      if (role.permissions && role.permissions.length > 0) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('检查用户权限错误:', error);
    return false;
  }
}

module.exports = {
  checkUserPermission,
  getUserPermissions,
  checkUserAnyPermission
};
