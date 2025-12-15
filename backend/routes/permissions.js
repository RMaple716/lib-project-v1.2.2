const express = require('express');
const router = express.Router();
const { Permission, Role, RolePermission, User, UserRole } = require('../models');
const { authenticate, requireTerminalAdmin, requirePermission } = require('../middleware/auth');
const { Op } = require('sequelize');

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: 权限管理
 */

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     summary: 获取所有权限列表
 *     description: 获取系统中所有权限的列表，支持按模块筛选
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: 模块名称，用于筛选特定模块的权限
 *         example: "readers"
 *     responses:
 *       200:
 *         description: 获取权限列表成功
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
 *                         $ref: '#/components/schemas/Permission'
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
 * 获取权限列表 - 需要permission.view权限
 * @description 获取系统中所有权限的列表，支持按模块筛选
 * @requiresPermission permission.view
 */
// 获取权限列表
router.get('/', authenticate, requirePermission('permission.view'), async (req, res) => {
  try {
    const { module: moduleName } = req.query;
    let whereCondition = {};

    // 如果指定了模块名称，则筛选该模块的权限
    if (moduleName) {
      whereCondition._pmodule = moduleName;
    }

    const permissions = await Permission.findAll({
      where: whereCondition,
      order: [['_pmodule', 'ASC'], ['_pname', 'ASC']]
    });

    res.json({
      success: true,
      message: '获取权限列表成功',
      data: permissions
    });
  } catch (error) {
    console.error('获取权限列表错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/permissions:
 *   post:
 *     summary: 创建新权限
 *     description: 创建一个新的权限，需要终端管理员权限
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePermissionRequest'
 *     responses:
 *       200:
 *         description: 权限创建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Permission'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               duplicatePermission:
 *                 summary: 权限代码已存在
 *                 value:
 *                   success: false
 *                   errorCode: "DUPLICATE_PERMISSION"
 *                   message: "权限代码已存在"
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
 * 创建新权限 - 需要permission.create权限
 * @description 创建一个新的权限，需要终端管理员权限
 * @requiresPermission permission.create
 */
// 创建权限
router.post('/', authenticate, requirePermission('permission.create'), async (req, res) => {
  try {
    const { _pname, _pcode, _pdesc, _pmodule } = req.body;

    // 验证必填字段
    if (!_pname || !_pcode || !_pmodule) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '缺少必填字段: _pname, _pcode, _pmodule'
      });
    }

    // 检查权限代码是否已存在
    const existingPermission = await Permission.findOne({
      where: { _pcode }
    });

    if (existingPermission) {
      return res.status(400).json({
        success: false,
        errorCode: 'DUPLICATE_PERMISSION',
        message: '权限代码已存在'
      });
    }

    // 创建新权限
    const newPermission = await Permission.create({
      _pname,
      _pcode,
      _pdesc,
      _pmodule
    });

    res.json({
      success: true,
      message: '权限创建成功',
      data: newPermission
    });
  } catch (error) {
    console.error('创建权限错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/permissions/{id}:
 *   put:
 *     summary: 更新权限
 *     description: 更新权限信息，需要终端管理员权限
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 权限ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePermissionRequest'
 *     responses:
 *       200:
 *         description: 权限更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Permission'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               duplicatePermission:
 *                 summary: 权限代码已存在
 *                 value:
 *                   success: false
 *                   errorCode: "DUPLICATE_PERMISSION"
 *                   message: "权限代码已存在"
 *               permissionNotFound:
 *                 summary: 权限不存在
 *                 value:
 *                   success: false
 *                   errorCode: "PERMISSION_NOT_FOUND"
 *                   message: "权限不存在"
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
 * 更新权限 - 需要permission.edit权限
 * @description 更新权限信息，需要终端管理员权限
 * @requiresPermission permission.edit
 */
// 更新权限
router.put('/:id', authenticate, requirePermission('permission.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { _pname, _pcode, _pdesc, _pmodule } = req.body;

    // 查找权限
    const permission = await Permission.findByPk(id);

    if (!permission) {
      return res.status(400).json({
        success: false,
        errorCode: 'PERMISSION_NOT_FOUND',
        message: '权限不存在'
      });
    }

    // 如果更新了代码，检查是否与其他权限重复
    if (_pcode && _pcode !== permission._pcode) {
      const existingPermission = await Permission.findOne({
        where: { 
          _pcode,
          _pid: { [Op.ne]: id }
        }
      });

      if (existingPermission) {
        return res.status(400).json({
          success: false,
          errorCode: 'DUPLICATE_PERMISSION',
          message: '权限代码已存在'
        });
      }
    }

    // 更新权限
    const updatedPermission = await permission.update({
      _pname: _pname || permission._pname,
      _pcode: _pcode || permission._pcode,
      _pdesc: _pdesc || permission._pdesc,
      _pmodule: _pmodule || permission._pmodule
    });

    res.json({
      success: true,
      message: '权限更新成功',
      data: updatedPermission
    });
  } catch (error) {
    console.error('更新权限错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/permissions/{id}:
 *   delete:
 *     summary: 删除权限
 *     description: 删除权限，需要终端管理员权限
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 权限ID
 *     responses:
 *       200:
 *         description: 权限删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               permissionNotFound:
 *                 summary: 权限不存在
 *                 value:
 *                   success: false
 *                   errorCode: "PERMISSION_NOT_FOUND"
 *                   message: "权限不存在"
 *               permissionInUse:
 *                 summary: 权限正在被使用
 *                 value:
 *                   success: false
 *                   errorCode: "PERMISSION_IN_USE"
 *                   message: "权限正在被角色使用，无法删除"
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
 * 删除权限 - 需要permission.delete权限
 * @description 删除权限，需要终端管理员权限
 * @requiresPermission permission.delete
 */
// 删除权限
router.delete('/:id', authenticate, requirePermission('permission.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // 查找权限
    const permission = await Permission.findByPk(id);

    if (!permission) {
      return res.status(400).json({
        success: false,
        errorCode: 'PERMISSION_NOT_FOUND',
        message: '权限不存在'
      });
    }

    // 检查权限是否正在被角色使用
    const rolePermissionCount = await RolePermission.count({
      where: { permission_id: id }
    });

    if (rolePermissionCount > 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'PERMISSION_IN_USE',
        message: '权限正在被角色使用，无法删除'
      });
    }

    // 删除权限
    await permission.destroy();

    res.json({
      success: true,
      message: '权限删除成功'
    });
  } catch (error) {
    console.error('删除权限错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
