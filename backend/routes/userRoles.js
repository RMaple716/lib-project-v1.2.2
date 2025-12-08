const express = require('express');
const router = express.Router();
const { Permission, Role, RolePermission, User, UserRole } = require('../models');
const { authenticate, requireTerminalAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

/**
 * @swagger
 * tags:
 *   name: UserRoles
 *   description: 用户角色管理
 */

/**
 * @swagger
 * /api/user-roles/{userId}:
 *   get:
 *     summary: 获取用户的角色
 *     description: 获取指定用户的角色列表
 *     tags: [UserRoles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 获取用户角色成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Role'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               userNotFound:
 *                 summary: 用户不存在
 *                 value:
 *                   success: false
 *                   errorCode: "USER_NOT_FOUND"
 *                   message: "用户不存在"
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/UnauthorizedError'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 获取用户的角色
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // 查找用户
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    }

    // 获取用户的角色
    const roles = await user.getRoles({
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['_pid', '_pname', '_pcode', '_pmodule'],
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      message: '获取用户角色成功',
      data: roles
    });
  } catch (error) {
    console.error('获取用户角色错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/user-roles/{userId}:
 *   post:
 *     summary: 为用户分配角色
 *     description: 为用户分配角色，需要终端管理员权限
 *     tags: [UserRoles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRoleRequest'
 *     responses:
 *       200:
 *         description: 角色分配成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Role'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               userNotFound:
 *                 summary: 用户不存在
 *                 value:
 *                   success: false
 *                   errorCode: "USER_NOT_FOUND"
 *                   message: "用户不存在"
 *               roleNotFound:
 *                 summary: 角色不存在
 *                 value:
 *                   success: false
 *                   errorCode: "ROLE_NOT_FOUND"
 *                   message: "角色不存在"
 *               adminRoleAssignment:
 *                 summary: 不能给管理员分配角色
 *                 value:
 *                   success: false
 *                   errorCode: "ADMIN_ROLE_ASSIGNMENT"
 *                   message: "不能给管理员分配角色"
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/UnauthorizedError'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 为用户分配角色
router.post('/:userId', authenticate, requireTerminalAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleIds } = req.body;

    // 验证参数
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_ROLE_IDS',
        message: '角色ID必须是非空数组'
      });
    }

    // 查找用户
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    }

    // 检查用户是否是管理员
    if (user._utype.includes('admin')) {
      return res.status(400).json({
        success: false,
        errorCode: 'ADMIN_ROLE_ASSIGNMENT',
        message: '不能给管理员分配角色'
      });
    }

    // 验证角色ID是否存在
    const roles = await Role.findAll({
      where: { id: { [Op.in]: roleIds } }
    });

    if (roles.length !== roleIds.length) {
      return res.status(400).json({
        success: false,
        errorCode: 'ROLE_NOT_FOUND',
        message: '部分角色ID不存在'
      });
    }

    // 为用户分配角色
    await user.setRoles(roles);

    // 获取更新后的用户角色
    const userRoles = await user.getRoles({
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['_pid', '_pname', '_pcode', '_pmodule'],
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      message: '角色分配成功',
      data: userRoles
    });
  } catch (error) {
    console.error('为用户分配角色错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/user-roles/{userId}:
 *   delete:
 *     summary: 移除用户的角色
 *     description: 移除用户的角色，需要终端管理员权限
 *     tags: [UserRoles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *       - in: query
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 角色移除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               userNotFound:
 *                 summary: 用户不存在
 *                 value:
 *                   success: false
 *                   errorCode: "USER_NOT_FOUND"
 *                   message: "用户不存在"
 *               roleNotFound:
 *                 summary: 角色不存在
 *                 value:
 *                   success: false
 *                   errorCode: "ROLE_NOT_FOUND"
 *                   message: "角色不存在"
 *               userNotAssignedRole:
 *                 summary: 用户未被分配该角色
 *                 value:
 *                   success: false
 *                   errorCode: "USER_NOT_ASSIGNED_ROLE"
 *                   message: "用户未被分配该角色"
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/UnauthorizedError'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 移除用户的角色
router.delete('/:userId', authenticate, requireTerminalAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.query;

    // 验证参数
    if (!roleId) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_ROLE_ID',
        message: '缺少角色ID参数'
      });
    }

    // 查找用户
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    }

    // 查找角色
    const role = await Role.findByPk(roleId);

    if (!role) {
      return res.status(400).json({
        success: false,
        errorCode: 'ROLE_NOT_FOUND',
        message: '角色不存在'
      });
    }

    // 检查用户是否被分配了该角色
    const userRole = await UserRole.findOne({
      where: { user_id: userId, role_id: roleId }
    });

    if (!userRole) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_NOT_ASSIGNED_ROLE',
        message: '用户未被分配该角色'
      });
    }

    // 移除用户的角色
    await userRole.destroy();

    res.json({
      success: true,
      message: '角色移除成功'
    });
  } catch (error) {
    console.error('移除用户角色错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
