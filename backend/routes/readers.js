const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { User, BorrowRecord, Book } = require('../models');
const { authenticate } = require('../middleware/auth');

// 获取读者列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { query } = req.query;

    console.log('查询读者:', { query, user: req.user });

    let whereCondition = {
      // 只显示普通读者，不显示管理员
      _utype: {
        [Op.notIn]: []
      }
    };

    if (query) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { _uid: { [Op.like]: `%${query}%` } },
          { _account: { [Op.like]: `%${query}%` } },
          { _name: { [Op.like]: `%${query}%` } }
        ]
      };
    }

    const readers = await User.findAll({
      where: whereCondition,
      attributes: { exclude: ['_password'] },
      limit: 50,
    });

    res.json({
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

// 新增读者
router.post('/', authenticate, async (req, res) => {
  try {
    // 检查用户权限（只有管理员可以新增读者）
    if (!req.user._utype.includes('admin')) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

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
    if (!['student', 'teacher'].includes(_utype)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_USER_TYPE',
        message: '用户类型只能是student或teacher'
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

// 获取读者详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const reader = await User.findByPk(id, {
      attributes: { exclude: ['_password'] }
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

// 更新读者信息
router.put('/:id', authenticate, async (req, res) => {
  try {
    // 检查用户权限（只有管理员可以更新读者信息）
    if (!req.user._utype.includes('admin')) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

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

// 删除读者
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // 检查用户权限（只有管理员可以删除读者）
    if (!req.user._utype.includes('admin')) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

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