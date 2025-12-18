const express = require('express');
const router = express.Router();
const { Permission, Role, RolePermission, User, UserRole } = require('../models');
const { authenticate, requireTerminalAdmin, requirePermission } = require('../middleware/auth');
const { Op } = require('sequelize');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: 角色管理
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: 获取所有角色列表
 *     description: 获取系统中所有角色的列表
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取角色列表成功
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
/**
 * 获取角色列表 - 需要role.view权限
 * @description 获取系统中所有角色的列表，包括每个角色关联的权限信息
 * @requiresPermission role.view
 * @returns {Object} 返回包含角色列表的对象
 * @returns {Array} returns.data 角色列表，每个角色包含_id、_rname、_rcode、_rdesc、_create_time、_update_time和关联的permissions数组
 */
// 获取角色列表
router.get('/', authenticate, requirePermission('role.view'), async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['_pid', '_pname', '_pcode', '_pmodule'],
          through: { attributes: [] }
        }
      ],
      order: [['_create_time', 'ASC']]
    });

    res.json({
      success: true,
      message: '获取角色列表成功',
      data: roles
    });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: 创建新角色
 *     description: 创建一个新的角色，需要终端管理员权限
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *     responses:
 *       200:
 *         description: 角色创建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               duplicateRole:
 *                 summary: 角色代码已存在
 *                 value:
 *                   success: false
 *                   errorCode: "DUPLICATE_ROLE"
 *                   message: "角色代码已存在"
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
/**
 * 创建角色 - 需要role.create权限
 * @description 创建一个新的角色，需要终端管理员权限
 * @requiresPermission role.create
 * @param {Object} requestBody - 请求体
 * @param {string} requestBody._rname - 角色名称
 * @param {string} requestBody._rcode - 角色代码
 * @param {string} requestBody._rdesc - 角色描述
 * @param {Array<number>} requestBody.permissionIds - 权限ID数组
 * @returns {Object} 返回包含创建结果的对象
 * @returns {Object} returns.data 创建的角色对象，包含关联的权限信息
 */
// 创建角色
router.post('/', authenticate, requirePermission('role.create'), async (req, res) => {
  try {
    const { _rname, _rcode, _rdesc, permissionIds } = req.body;

    // 验证必填字段
    if (!_rname || !_rcode) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '缺少必填字段: _rname, _rcode'
      });
    }

    // 检查角色代码是否已存在
    const existingRole = await Role.findOne({
      where: { _rcode }
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        errorCode: 'DUPLICATE_ROLE',
        message: '角色代码已存在'
      });
    }

    // 创建新角色
    const newRole = await Role.create({
      _rname,
      _rcode,
      _rdesc
    });

    // 如果提供了权限ID列表，则关联权限
    if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
      // 验证权限ID是否存在
      const permissions = await Permission.findAll({
        where: { _pid: { [Op.in]: permissionIds } }
      });

      if (permissions.length !== permissionIds.length) {
        return res.status(400).json({
          success: false,
          errorCode: 'INVALID_PERMISSIONS',
          message: '部分权限ID不存在'
        });
      }

      // 关联权限
      await newRole.setPermissions(permissions);
    }

    // 获取包含权限的角色信息
    const roleWithPermissions = await Role.findByPk(newRole.id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['_pid', '_pname', '_pcode', '_pmodule'],
          through: { attributes: [] }
        }
      ]
    });
    console.log("角色信息", roleWithPermissions);
    res.json({
      success: true,
      message: '角色创建成功',
      data: roleWithPermissions
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: 更新角色
 *     description: 更新角色信息，需要终端管理员权限
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 角色ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleRequest'
 *     responses:
 *       200:
 *         description: 角色更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               duplicateRole:
 *                 summary: 角色代码已存在
 *                 value:
 *                   success: false
 *                   errorCode: "DUPLICATE_ROLE"
 *                   message: "角色代码已存在"
 *               roleNotFound:
 *                 summary: 角色不存在
 *                 value:
 *                   success: false
 *                   errorCode: "ROLE_NOT_FOUND"
 *                   message: "角色不存在"
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
/**
 * 更新角色 - 需要role.edit权限
 * @description 更新角色信息，包括基本信息和权限关联
 * @requiresPermission role.edit
 * @param {string} req.params.id - 角色ID
 * @param {Object} requestBody - 请求体
 * @param {string} requestBody._rname - 角色名称
 * @param {string} requestBody._rcode - 角色代码
 * @param {string} requestBody._rdesc - 角色描述
 * @param {Array<number>} requestBody.permissionIds - 权限ID数组
 * @returns {Object} 返回包含更新结果的对象
 * @returns {Object} returns.data 更新后的角色对象，包含关联的权限信息
 */
// 更新角色
router.put('/:id', authenticate, requirePermission('role.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { _rname, _rcode, _rdesc, permissionIds } = req.body;

    // 查找角色
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(400).json({
        success: false,
        errorCode: 'ROLE_NOT_FOUND',
        message: '角色不存在'
      });
    }

    // 如果更新了代码，检查是否与其他角色重复
    if (_rcode && _rcode !== role._rcode) {
      const existingRole = await Role.findOne({
        where: { 
          _rcode,
          _rid: { [Op.ne]: id }
        }
      });

      if (existingRole) {
        return res.status(400).json({
          success: false,
          errorCode: 'DUPLICATE_ROLE',
          message: '角色代码已存在'
        });
      }
    }

    // 更新角色基本信息
    await role.update({
      _rname: _rname || role._rname,
      _rcode: _rcode || role._rcode,
      _rdesc: _rdesc || role._rdesc
    });

    // 如果提供了权限ID列表，则更新权限关联
    if (permissionIds !== undefined) {
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({
          success: false,
          errorCode: 'INVALID_PERMISSIONS',
          message: '权限ID必须是数组'
        });
      }

      if (permissionIds.length > 0) {
        // 验证权限ID是否存在
        const permissions = await Permission.findAll({
          where: { _pid: { [Op.in]: permissionIds } }
        });

        if (permissions.length !== permissionIds.length) {
          return res.status(400).json({
            success: false,
            errorCode: 'INVALID_PERMISSIONS',
            message: '部分权限ID不存在'
          });
        }
      }

      // 更新权限关联
      await role.setPermissions(permissions);
    }

    // 获取更新后的角色信息
    const updatedRole = await Role.findByPk(id, {
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
      message: '角色更新成功',
      data: updatedRole
    });
  } catch (error) {
    console.error('更新角色错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: 删除角色
 *     description: 删除角色，需要终端管理员权限
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 角色删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               roleNotFound:
 *                 summary: 角色不存在
 *                 value:
 *                   success: false
 *                   errorCode: "ROLE_NOT_FOUND"
 *                   message: "角色不存在"
 *               roleInUse:
 *                 summary: 角色正在被使用
 *                 value:
 *                   success: false
 *                   errorCode: "ROLE_IN_USE"
 *                   message: "角色正在被用户使用，无法删除"
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
/**
 * 删除角色 - 需要role.delete权限
 * @description 删除角色及其所有权限关联，需要终端管理员权限
 * @requiresPermission role.delete
 * @param {string} req.params.id - 角色ID
 * @returns {Object} 返回包含删除结果的对象
 */
// 删除角色
router.delete('/:id', authenticate, requirePermission('role.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // 查找角色
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(400).json({
        success: false,
        errorCode: 'ROLE_NOT_FOUND',
        message: '角色不存在'
      });
    }

    // 检查角色是否正在被用户使用
    const userRoleCount = await UserRole.count({
      where: { _rid: id }
    });

    if (userRoleCount > 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'ROLE_IN_USE',
        message: '角色正在被用户使用，无法删除'
      });
    }

    // 删除角色（会自动删除相关的权限关联）
    await role.destroy();

    res.json({
      success: true,
      message: '角色删除成功'
    });
  } catch (error) {
    console.error('删除角色错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
