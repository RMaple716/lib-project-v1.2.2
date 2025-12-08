const express = require('express');
const router = express.Router();
const { BorrowRecord, Book, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

/**
 * @swagger
 * tags:
 *   name: BorrowRecords
 *   description: 借阅记录管理
 */

/**
 * @swagger
 * /api/borrow-records:
 *   get:
 *     summary: 获取借阅记录列表（管理员）
 *     description: 获取所有借阅记录，包含用户和图书信息，需要管理员权限
 *     tags: [BorrowRecords]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取借阅记录成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/BorrowRecordListResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/BorrowRecordListSuccess'
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
// 获取借阅记录列表（管理员）
router.get('/', authenticate, async (req, res) => {
  try {
    const borrowRecords = await BorrowRecord.findAll({
      include: [
        {
          model: User,
          as: 'user',  // 使用与模型定义中相同的别名
          attributes: ['_uid', '_name', '_account']
        },
        {
          model: Book,
          as: 'book',
          attributes: ['_bid','_book_name','_author']
        }
      ],
      order: [['_begin_time', 'DESC']],
      limit: 50,
    });

    res.json({
      success: true,
      message: '获取借阅记录成功',
      data: {
        historylist: borrowRecords
      }
    });
  } catch (error) {
    console.error('获取借阅记录列表错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/borrow-records/my:
 *   get:
 *     summary: 获取我的借阅记录
 *     description: 获取当前登录用户的借阅记录，包含图书详细信息
 *     tags: [BorrowRecords]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取借阅记录成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MyBorrowRecordListResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/MyBorrowRecordListSuccess'
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
// 获取我的借阅记录
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user._uid;

    const myBorrowRecords = await BorrowRecord.findAll({
      where: { _uid: userId },
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['_book_name', '_isbn', '_author', '_cover_url']
        }
      ],
      order: [['_begin_time', 'DESC']],
      limit: 50,
    });

    res.json({
      success: true,
      message: '获取借阅记录成功',
      data: {
        ownlist: myBorrowRecords
      }
    });
  } catch (error) {
    console.error('获取我的借阅记录错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/borrow-records/stats:
 *   get:
 *     summary: 获取借阅统计信息
 *     description: 根据日期范围获取借阅统计信息
 *     tags: [BorrowRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: start
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期 (YYYY-MM-DD)
 *       - name: end
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 获取统计信息成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - $ref: '#/components/schemas/BorrowStatsListResponse'
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             examples:
 *               invalidDateRange:
 *                 summary: 开始日期晚于或等于结束日期
 *                 value:
 *                   success: false
 *                   errorCode: "INVALID_DATE_RANGE"
 *                   message: "开始日期必须早于结束日期"
 *               invalidDateFormat:
 *                 summary: 日期格式无效
 *                 value:
 *                   success: false
 *                   errorCode: "INVALID_DATE_FORMAT"
 *                   message: "日期格式无效"
 *               missingParameters:
 *                 summary: 缺少必需参数
 *                 value:
 *                   success: false
 *                   errorCode: "INVALID_PARAMETERS"
 *                   message: "缺少必需的参数: start 和 end"
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
// 获取借阅统计信息
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { start, end } = req.query;

    // 验证参数
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_PARAMETERS',
        message: '缺少必需的参数: start 和 end'
      });
    }

    // 验证日期格式
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_DATE_FORMAT',
        message: '日期格式无效'
      });
    }
    
    // 验证日期范围
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_DATE_RANGE',
        message: '开始日期必须早于结束日期'
      });
    }

    // 查询指定日期范围内的借阅记录
    const borrowRecords = await BorrowRecord.findAll({
      where: {
        _begin_time: {
          [Op.between]: [start, end]
        }
      },
      attributes: [
        '_begin_time'
      ],
      order: [['_begin_time', 'ASC']]
    });

    // 按日期分组统计
    const stats = {};
    borrowRecords.forEach(record => {
      const date = record._begin_time; // DATEONLY 类型已经是字符串格式 YYYY-MM-DD
      if (!stats[date]) {
        stats[date] = 0;
      }
      stats[date]++;
    });

    // 转换为数组格式
    const result = Object.keys(stats).map(date => ({
      date: date,
      count: stats[date]
    }));

    res.json({
      success: true,
      message: '获取统计信息成功',
      data: result
    });
  } catch (error) {
    console.error('获取借阅统计信息错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;