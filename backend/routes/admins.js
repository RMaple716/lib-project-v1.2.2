const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { User, Role, UserRole } = require('../models');
const { authenticate, requireTerminalAdmin, requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Admins
 *   description: 管理员管理
 */

/**
 * @swagger
 * /api/admins:
 *   get:
 *     summary: 获取管理员列表
 *     description: 获取所有终端管理员和普通管理员列表，支持按关键词搜索
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: 搜索关键词（管理员ID、账号、姓名）
 *         example: "张三"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [admin_t, admin_n, all]
 *           default: all
 *         description: 管理员类型筛选
 *         example: "admin_n"
 *     responses:
 *       200:
 *         description: 获取管理员列表成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AdminListResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/AdminListSuccess'
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
 * 获取管理员列表 - 需要admin.view权限
 * @description 获取所有终端管理员和普通管理员列表，支持按关键词搜索
 * @requiresPermission admin.view
 */
// 获取管理员列表
router.get('/', authenticate, requirePermission('admin.view'), async (req, res) => {
  try {
    const { query, type = 'all' } = req.query;

    console.log('查询管理员:', { query, type, user: req.user });

    let whereCondition = {
      _utype: {
        [Op.in]: ['admin_t', 'admin_n']
      }
    };

    // 根据类型筛选
    if (type !== 'all') {
      whereCondition._utype = {
        [Op.eq]: type
      };
    }

    if (query) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { _uid: { [Op.eq]: !isNaN(query) ? parseInt(query) : null } },
          { _account: { [Op.like]: `%${query}%` } },
          { _name: { [Op.like]: `%${query}%` } }
        ]
      };
    }

    const admins = await User.findAll({
      where: whereCondition,
      attributes: { exclude: ['_password'] },
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['_rid', '_rname', '_rcode', '_rdesc'],
          through: { attributes: [] },
          required: false
        }
      ],
      order: [['_utype', 'ASC'], ['_create_time', 'DESC']],
      limit: 50,
    });

    res.status(200).json({
      success: true,
      message: '获取管理员列表成功',
      data: {
        adminlist: admins
      }
    });

  } catch (error) {
    console.error('获取管理员列表错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/admins:
 *   post:
 *     summary: 创建管理员
 *     description: 创建新管理员，需要终端管理员权限
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required: ["_account", "_name", "_password", "_email", "_utype"]
 *             properties:
 *               _account:
 *                 type: "string"
 *                 description: "管理员账号"
 *                 example: "admin_n_001"
 *               _name:
 *                 type: "string"
 *                 description: "管理员姓名"
 *                 example: "新普通管理员"
 *               _password:
 *                 type: "string"
 *                 description: "管理员密码"
 *                 example: "Admin123!"
 *               _email:
 *                 type: "string"
 *                 description: "管理员邮箱"
 *                 example: "admin_n_001@example.com"
 *               _utype:
 *                 type: "string"
 *                 enum: ["admin_t", "admin_n"]
 *                 description: "管理员类型"
 *                 example: "admin_n"
 *           examples:
 *             terminalAdminExample:
 *               summary: 创建终端管理员
 *               value:
 *                 _account: "admin_t_001"
 *                 _name: "新终端管理员"
 *                 _password: "Admin123!"
 *                 _email: "admin_t_001@example.com"
 *                 _utype: "admin_t"
 *             normalAdminExample:
 *               summary: 创建普通管理员
 *               value:
 *                 _account: "admin_n_001"
 *                 _name: "新普通管理员"
 *                 _password: "Admin123!"
 *                 _email: "admin_n_001@example.com"
 *                 _utype: "admin_n"
 *     responses:
 *       200:
 *         description: 管理员创建成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/CreateAdminSuccess'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 $ref: '#/components/examples/MissingFieldsError'
 *               accountExists:
 *                 $ref: '#/components/examples/AccountAlreadyExistsError'
 *               invalidUserType:
 *                 summary: 无效的用户类型
 *                 value:
 *                   success: false
 *                   errorCode: "INVALID_USER_TYPE"
 *                   message: "用户类型只能是admin_t或admin_n"
 *               passwordSimple:
 *                 $ref: '#/components/examples/PasswordSimpleError'
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
 * 创建管理员 - 需要admin.add权限
 * @description 创建新管理员，需要终端管理员权限
 * @requiresPermission admin.add
 */
// 创建管理员
router.post('/', authenticate, requirePermission('admin.add'), async (req, res) => {
  try {
    // 权限检查已在中间件中完成

    const { _account, _name, _password, _email, _utype } = req.body;

    // 输入验证
    if (!_account || !_name || !_password || !_email || !_utype) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供完整的管理员信息'
      });
    }

    // 验证用户类型只能是终端管理员或普通管理员
    if (!['admin_t', 'admin_n'].includes(_utype)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_USER_TYPE',
        message: '用户类型只能是admin_t或admin_n'
      });
    }

    // 检查账号是否已存在
    const existingUser = await User.findOne({
      where: { _account }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_ALREADY_EXISTS',
        message: '用户账号已存在'
      });
    }

    // 密码强度验证
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(_password)) {
      return res.status(400).json({
        success: false,
        errorCode: 'PASSWORD_TOO_SIMPLE',
        message: '密码过于简单，需包含字母、数字和特殊字符，且长度不少于8位'
      });
    }

    // 设置默认的最大借书数量
    const maxNum = _utype === 'admin_t' ? 100 : 50;

    // 创建管理员
    const admin = await User.create({
      _account,
      _name,
      _password,
      _email,
      _utype,
      _max_num: maxNum,
      lend_num: 0,
      _access: 1,
      _total: 0
    });

    res.json({
      success: true,
      message: '管理员创建成功',
      data: {
        r_add: admin
      }
    });

  } catch (error) {
    console.error('创建管理员错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/admins/{id}:
 *   get:
 *     summary: 获取管理员详情
 *     description: 根据管理员ID获取管理员的详细信息
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 管理员ID
 *         example: 1001
 *     responses:
 *       200:
 *         description: 成功获取管理员详情
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/AdminDetailSuccess'
 *       404:
 *         description: 管理员不存在
 *         content:
 *           application/json:
 *             examples:
 *               adminNotFound:
 *                 $ref: '#/components/examples/AdminNotFoundError'
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
 * 获取管理员详情 - 需要admin.view权限
 * @description 根据管理员ID获取管理员的详细信息
 * @requiresPermission admin.view
 */
// 获取管理员详情
router.get('/:id', authenticate, requirePermission('admin.view'), async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findByPk(id, {
      attributes: { exclude: ['_password'] },
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['_rid', '_rname', '_rcode', '_rdesc'],
          through: { attributes: [] },
          required: false,
          include: [
            {
              model: require('../models').Permission,
              as: 'permissions',
              attributes: ['_pid', '_pname', '_pcode', '_pdesc', '_pmodule'],
              through: { attributes: [] },
              required: false
            }
          ]
        }
      ]
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        errorCode: 'ADMIN_NOT_FOUND',
        message: '管理员不存在'
      });
    }

    // 检查是否为管理员类型
    if (!['admin_t', 'admin_n'].includes(admin._utype)) {
      return res.status(404).json({
        success: false,
        errorCode: 'ADMIN_NOT_FOUND',
        message: '管理员不存在'
      });
    }

    res.json({
      success: true,
      message: '成功获取管理员详情',
      data: admin
    });

  } catch (error) {
    console.error('获取管理员详情错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/admins/{id}:
 *   put:
 *     summary: 更新管理员信息
 *     description: 根据管理员ID更新管理员信息，需要终端管理员权限
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 管理员ID
 *         example: 1001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required: ["_account", "_name", "_email"]
 *             properties:
 *               _account:
 *                 type: "string"
 *                 description: "管理员账号"
 *                 example: "admin_n_001"
 *               _name:
 *                 type: "string"
 *                 description: "管理员姓名"
 *                 example: "普通管理员（已更新）"
 *               _email:
 *                 type: "string"
 *                 description: "管理员邮箱"
 *                 example: "admin_n_updated@example.com"
 *           examples:
 *             updateExample:
 *               summary: 更新管理员信息
 *               value:
 *                 _account: "admin001"
 *                 _name: "张管理员（已更新）"
 *                 _email: "admin_updated@example.com"
 *     responses:
 *       200:
 *         description: 管理员信息更新成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/UpdateAdminSuccess'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 $ref: '#/components/examples/MissingFieldsError'
 *               accountExists:
 *                 $ref: '#/components/examples/AccountAlreadyExistsError'
 *               cannotUpdateSameLevel:
 *                 summary: 不能更新同级管理员
 *                 value:
 *                   success: false
 *                   errorCode: "CANNOT_UPDATE_SAME_LEVEL"
 *                   message: "不能更新同级管理员信息"
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       404:
 *         description: 管理员不存在
 *         content:
 *           application/json:
 *             examples:
 *               adminNotFound:
 *                 $ref: '#/components/examples/AdminNotFoundError'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/UnauthorizedError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
/**
 * 更新管理员信息 - 需要admin.edit权限
 * @description 根据管理员ID更新管理员信息，需要终端管理员权限
 * @requiresPermission admin.edit
 */
// 更新管理员信息
router.put('/:id', authenticate, requirePermission('admin.edit'), async (req, res) => {
  try {
    // 权限检查已在中间件中完成

    const { id } = req.params;
    const { _account, _name, _email } = req.body;

    const admin = await User.findByPk(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        errorCode: 'ADMIN_NOT_FOUND',
        message: '管理员不存在'
      });
    }

    // 检查是否为管理员类型
    if (!['admin_t', 'admin_n'].includes(admin._utype)) {
      return res.status(404).json({
        success: false,
        errorCode: 'ADMIN_NOT_FOUND',
        message: '管理员不存在'
      });
    }

    // 终端管理员不能更新同级终端管理员
    if (req.user._utype === 'admin_t' && admin._utype === 'admin_t' && req.user._uid !== admin._uid) {
      return res.status(400).json({
        success: false,
        errorCode: 'CANNOT_UPDATE_SAME_LEVEL',
        message: '不能更新同级管理员信息'
      });
    }

    // 普通管理员不能更新其他管理员信息
    if (req.user._utype === 'admin_n' && req.user._uid !== admin._uid) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '权限不足'
      });
    }

    // 输入验证
    if (!_account || !_name || !_email) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供完整的管理员信息'
      });
    }

    // 检查账号是否已被其他用户使用
    const existingUser = await User.findOne({
      where: {
        _account,
        _uid: { [Op.ne]: id } // 排除当前用户
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        errorCode: 'ACCOUNT_ALREADY_EXISTS',
        message: '账号已被其他用户使用'
      });
    }

    await admin.update({
      _account,
      _name,
      _email
    });

    res.json({
      success: true,
      message: '管理员信息更新成功',
      data: admin
    });

  } catch (error) {
    console.error('更新管理员信息错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/admins/{id}:
 *   delete:
 *     summary: 删除管理员
 *     description: 根据管理员ID删除管理员，需要终端管理员权限。不能删除同级终端管理员。
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 管理员ID
 *         example: 1001
 *     responses:
 *       200:
 *         description: 管理员删除成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/DeleteAdminSuccess'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *               cannotDeleteSameLevel:
 *                 summary: 不能删除同级管理员
 *                 value:
 *                   success: false
 *                   errorCode: "CANNOT_DELETE_SAME_LEVEL"
 *                   message: "不能删除同级管理员"
 *       404:
 *         description: 管理员不存在
 *         content:
 *           application/json:
 *             examples:
 *               adminNotFound:
 *                 $ref: '#/components/examples/AdminNotFoundError'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/UnauthorizedError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
/**
 * 删除管理员 - 需要admin.delete权限
 * @description 根据管理员ID删除管理员，需要终端管理员权限。不能删除同级终端管理员。
 * @requiresPermission admin.delete
 */
// 删除管理员
router.delete('/:id', authenticate, requirePermission('admin.delete'), async (req, res) => {
  try {
    // 权限检查已在中间件中完成

    const { id } = req.params;

    const admin = await User.findByPk(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        errorCode: 'ADMIN_NOT_FOUND',
        message: '管理员不存在'
      });
    }

    // 检查是否为管理员类型
    if (!['admin_t', 'admin_n'].includes(admin._utype)) {
      return res.status(404).json({
        success: false,
        errorCode: 'ADMIN_NOT_FOUND',
        message: '管理员不存在'
      });
    }

    // 终端管理员不能删除同级终端管理员
    if (req.user._utype === 'admin_t' && admin._utype === 'admin_t' && req.user._uid !== admin._uid) {
      return res.status(400).json({
        success: false,
        errorCode: 'CANNOT_DELETE_SAME_LEVEL',
        message: '不能删除同级管理员'
      });
    }

    // 普通管理员不能删除其他管理员
    if (req.user._utype === 'admin_n' && req.user._uid !== admin._uid) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '权限不足'
      });
    }

    await admin.destroy();

    res.json({
      success: true,
      message: '管理员删除成功',
      data: admin
    });

  } catch (error) {
    console.error('删除管理员错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
