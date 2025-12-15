const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { User, BorrowRecord, Book } = require('../models');
const { authenticate, requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Readers
 *   description: 读者管理
 */

/**
 * @swagger
 * /api/readers:
 *   get:
 *     summary: 获取读者列表
 *     description: 获取读者列表，支持按关键词搜索
 *     tags: [Readers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: 搜索关键词（读者ID、账号、姓名）
 *         example: "张三"
 *     responses:
 *       200:
 *         description: 获取读者列表成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ReaderListResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/ReaderListSuccess'
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
 * 获取读者列表 - 需要user.view权限
 * @description 获取读者列表，支持按关键词搜索
 * @requiresPermission user.view
 */
// 获取读者列表
router.get('/', authenticate, requirePermission('user.view'), async (req, res) => {
  try {
    const { query } = req.query;

    console.log('查询读者:', { query, user: req.user });

    let whereCondition = {
      _utype: {
        [Op.notIn]: ['admin_t', 'admin_n']
      }
    };

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

    const readers = await User.findAll({
      where: whereCondition,
      attributes: { exclude: ['_password'] },
      include: [
        {
          model: require('../models').Department,
          as: 'department',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: require('../models').Major,
          as: 'major',
          attributes: ['id', 'name'],
          required: false,
          include: [
            {
              model: require('../models').Department,
              as: 'department',
              attributes: ['id', 'name'],
              required: false
            }
          ]
        },
        {
          model: require('../models').Class,
          as: 'class',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: require('../models').WorkDepartment,
          as: 'workDepartment',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      limit: 50,
    });

    res.status(200).json({
      success: true,
      message: '获取读者列表成功',
      data: {
        readerlist: readers
      }
    });

  } catch (error) {
    console.error('获取读者列表错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/readers:
 *   post:
 *     summary: 新增读者
 *     description: 创建新读者，需要管理员权限
 *     tags: [Readers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReaderRequest'
 *           examples:
 *             studentReader:
 *               summary: 学生读者
 *               value:
 *                 _account: "student001"
 *                 _name: "张三"
 *                 _password: "Student123!"
 *                 _utype: "student"
 *                 _email: "zhangsan@example.com"
 *             teacherReader:
 *               summary: 教师读者
 *               value:
 *                 _account: "teacher001"
 *                 _name: "李老师"
 *                 _password: "Teacher123!"
 *                 _utype: "teacher"
 *                 _email: "li@example.com"
 *     responses:
 *       200:
 *         description: 读者添加成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/CreateReaderSuccess'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 $ref: '#/components/examples/MissingFieldsError'
 *               invalidUserType:
 *                 $ref: '#/components/examples/InvalidUserTypeError'
 *               userExists:
 *                 $ref: '#/components/examples/UserExistsError'
 *               passwordSimple:
 *                 $ref: '#/components/examples/PasswordSimpleError'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
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
 * 新增读者 - 需要user.add权限
 * @description 创建新读者，需要管理员权限
 * @requiresPermission user.add
 */
// 新增读者
router.post('/', authenticate, requirePermission('user.add'), async (req, res) => {
  try {
    // 权限检查已在中间件中完成

    const { _account, _name, _password, _utype, _email } = req.body;

    // 输入验证
    if (!_account || !_name || !_password || !_utype || !_email) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供完整的读者信息'
      });
    }

    // 验证用户类型只能是学生或教师
    if (!['student', 'teacher','tempworker'].includes(_utype)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_USER_TYPE',
        message: '用户类型只能是student、teacher或tempworker'
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
    const maxNum = _utype === 'student' ? 10 : 20;

    // 创建读者
    const reader = await User.create({
      _account,
      _name,
      _password,
      _utype,
      _email,
      _max_num: maxNum,
      lend_num: 0,
      _access: 1,
      _total: 0
    });

    res.json({
      success: true,
      message: '读者添加成功',
      data: {
        r_add: reader
      }
    });

  } catch (error) {
    console.error('新增读者错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/readers/{id}:
 *   get:
 *     summary: 获取读者详情
 *     description: 根据读者ID获取读者的详细信息
 *     tags: [Readers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 读者ID
 *         example: 1001
 *     responses:
 *       200:
 *         description: 成功获取读者详情
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/ReaderDetailSuccess'
 *       404:
 *         description: 读者不存在
 *         content:
 *           application/json:
 *             examples:
 *               readerNotFound:
 *                 $ref: '#/components/examples/ReaderNotFoundError'
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
 * 获取读者详情 - 需要user.view权限
 * @description 根据读者ID获取读者的详细信息
 * @requiresPermission user.view
 */
// 获取读者详情
router.get('/:id', authenticate, requirePermission('user.view'), async (req, res) => {
  try {
    const { id } = req.params;

    const reader = await User.findByPk(id, {
      attributes: { exclude: ['_password'] },
      include: [
        {
          model: require('../models').Department,
          as: 'department',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: require('../models').Major,
          as: 'major',
          attributes: ['id', 'name'],
          required: false,
          include: [
            {
              model: require('../models').Department,
              as: 'department',
              attributes: ['id', 'name'],
              required: false
            }
          ]
        },
        {
          model: require('../models').Class,
          as: 'class',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: require('../models').WorkDepartment,
          as: 'workDepartment',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    if (!reader) {
      return res.status(404).json({
        success: false,
        errorCode: 'READER_NOT_FOUND',
        message: '读者不存在'
      });
    }

    // 检查是否为管理员类型（不应该通过读者接口访问管理员）
    if (reader._utype.includes('admin')) {
      return res.status(404).json({
        success: false,
        errorCode: 'READER_NOT_FOUND',
        message: '读者不存在'
      });
    }

    res.json({
      success: true,
      message: '成功获取读者详情',
      data: reader
    });

  } catch (error) {
    console.error('获取读者详情错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/readers/{id}:
 *   put:
 *     summary: 更新读者信息
 *     description: 根据读者ID更新读者信息，需要管理员权限
 *     tags: [Readers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 读者ID
 *         example: 1001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReaderRequest'
 *           examples:
 *             updateExample:
 *               summary: 更新读者信息
 *               value:
 *                 _account: "student001"
 *                 _name: "张三（已更新）"
 *                 _email: "zhangsan_updated@example.com"
 *     responses:
 *       200:
 *         description: 读者信息更新成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/UpdateReaderSuccess'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 $ref: '#/components/examples/MissingFieldsError'
 *               accountExists:
 *                 $ref: '#/components/examples/AccountAlreadyExistsError'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       404:
 *         description: 读者不存在
 *         content:
 *           application/json:
 *             examples:
 *               readerNotFound:
 *                 $ref: '#/components/examples/ReaderNotFoundError'
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
 * 更新读者信息 - 需要user.edit权限
 * @description 根据读者ID更新读者信息，需要管理员权限
 * @requiresPermission user.edit
 */
// 更新读者信息
router.put('/:id', authenticate, requirePermission('user.edit'), async (req, res) => {
  try {
    // 权限检查已在中间件中完成

    const { id } = req.params;
    const { _account, _name, _email } = req.body;

    const reader = await User.findByPk(id);

    if (!reader) {
      return res.status(404).json({
        success: false,
        errorCode: 'READER_NOT_FOUND',
        message: '读者不存在'
      });
    }

    // 检查是否为管理员类型
    if (reader._utype.includes('admin')) {
      return res.status(404).json({
        success: false,
        errorCode: 'READER_NOT_FOUND',
        message: '读者不存在'
      });
    }

    // 输入验证
    if (!_account || !_name || !_email) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供完整的读者信息'
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

    await reader.update({
      _account,
      _name,
      _email
    });

    res.json({
      success: true,
      message: '读者信息更新成功',
      data: reader
    });

  } catch (error) {
    console.error('更新读者信息错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/readers/{id}:
 *   delete:
 *     summary: 删除读者
 *     description: 根据读者ID删除读者，需要管理员权限。如果读者有未归还的图书，则无法删除。
 *     tags: [Readers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 读者ID
 *         example: 1001
 *     responses:
 *       200:
 *         description: 读者删除成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/DeleteReaderSuccess'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       404:
 *         description: 读者不存在
 *         content:
 *           application/json:
 *             examples:
 *               readerNotFound:
 *                 $ref: '#/components/examples/ReaderNotFoundError'
 *       400:
 *         description: 读者有未归还的图书
 *         content:
 *           application/json:
 *             examples:
 *               readerHasActiveBorrows:
 *                 $ref: '#/components/examples/ReaderHasActiveBorrowsError'
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
 * 删除读者 - 需要user.delete权限
 * @description 根据读者ID删除读者，需要管理员权限。如果读者有未归还的图书，则无法删除。
 * @requiresPermission user.delete
 */
// 删除读者
router.delete('/:id', authenticate, requirePermission('user.delete'), async (req, res) => {
  try {
    // 权限检查已在中间件中完成

    const { id } = req.params;

    const reader = await User.findByPk(id);

    if (!reader) {
      return res.status(404).json({
        success: false,
        errorCode: 'READER_NOT_FOUND',
        message: '读者不存在'
      });
    }

    // 检查是否为管理员类型
    if (reader._utype.includes('admin')) {
      return res.status(404).json({
        success: false,
        errorCode: 'READER_NOT_FOUND',
        message: '读者不存在'
      });
    }

    // 检查读者是否有未归还的图书
    const activeBorrowRecords = await BorrowRecord.count({
      where: {
        _uid: id,
        _status: 1 // 借出状态
      }
    });

    if (activeBorrowRecords > 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'READER_HAS_ACTIVE_BORROWS',
        message: '该读者有未归还的图书，无法删除'
      });
    }

    await reader.destroy();

    res.json({
      success: true,
      message: '读者删除成功',
      data: reader
    });

  } catch (error) {
    console.error('删除读者错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/readers/{id}/borrow-count:
 *   get:
 *     summary: 查询读者借阅数量
 *     description: 查询指定读者的当前借阅数量
 *     tags: [Readers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 读者ID
 *         example: 1001
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ReaderBorrowCountResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/ReaderBorrowCountSuccess'
 *       404:
 *         description: 读者不存在
 *         content:
 *           application/json:
 *             examples:
 *               readerNotFound:
 *                 $ref: '#/components/examples/ReaderNotFoundError'
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
// 查询读者借阅数量
router.get('/:id/borrow-count', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const reader = await User.findByPk(id, {
      attributes: ['_uid', '_name', 'lend_num','_utype']
    });

    if (!reader) {
      return res.status(404).json({
        success: false,
        errorCode: 'READER_NOT_FOUND',
        message: '读者不存在'
      });
    }

    // 检查是否为管理员类型
    if (reader._utype.includes('admim')) {
      return res.status(404).json({
        success: false,
        errorCode: 'READER_NOT_FOUND',
        message: '读者不存在'
      });
    }

    res.json({
      success: true,
      message: '查询成功',
      data: {
        _name: reader._name,
        _lend_num: reader.lend_num
      }
    });

  } catch (error) {
    console.error('查询读者借阅数量错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/readers/rank:
 *   get:
 *     summary: 读者借阅排名
 *     description: 获取借阅数量最多的前10名读者
 *     tags: [Readers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取读者排名成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ReaderRankResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/ReaderRankSuccess'
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
// 读者借阅排名
router.get('/rank', authenticate, async (req, res) => {
  try {
    // 获取借阅数量最多的前10名读者
    const topReaders = await User.findAll({
      where: {
        _utype: {
          [Op.notLike]: 'admin%'
        }
      },
      order: [
        ['lend_num', 'DESC'],
        ['_total', 'DESC'] // 借阅数量相同时按总阅读时间排序
      ],
      attributes: { exclude: ['_password'] },
      include: [
        {
          model: require('../models').Department,
          as: 'department',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: require('../models').Major,
          as: 'major',
          attributes: ['id', 'name'],
          required: false,
          include: [
            {
              model: require('../models').Department,
              as: 'department',
              attributes: ['id', 'name'],
              required: false
            }
          ]
        },
        {
          model: require('../models').Class,
          as: 'class',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: require('../models').WorkDepartment,
          as: 'workDepartment',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      limit: 10
    });

    res.json({
      success: true,
      message: '获取读者排名成功',
      data: {
        res_rank: topReaders
      }
    });

  } catch (error) {
    console.error('获取读者排名错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;