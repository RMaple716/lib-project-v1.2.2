const express = require('express');
const router = express.Router();
const { BorrowRecord, Book, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { Op } = require('sequelize');

/**
 * @swagger
 * tags:
 *   name: BorrowRecords
 *   description: 借阅记录管理
 */




/**
 * @swagger
 * /api/borrow-records/personal-trend:
 *   get:
 *     summary: 获取个人借阅趋势数据
 *     description: 返回个人在指定时间范围内的借阅趋势数据，按月或按季度统计用户的借阅数量
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
 *       - name: period
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [month, quarter]
 *           default: month
 *         description: "统计周期，可选值: month(按月), quarter(按季度)"
 *     responses:
 *       200:
 *         description: 获取个人借阅趋势成功
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
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                             description: 时间周期 (YYYY-MM 或 YYYY-QX)
 *                           count:
 *                             type: integer
 *                             description: 借阅数量
 *             examples:
 *               success:
 *                 summary: 成功获取个人借阅趋势
 *                 value:
 *                   success: true
 *                   message: "获取个人借阅趋势成功"
 *                   data:
 *                     - period: "2023-01"
 *                       count: 5
 *                     - period: "2023-02"
 *                       count: 3
 *                     - period: "2023-03"
 *                       count: 7
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
// 获取个人借阅趋势数据
router.get('/personal-trend', authenticate, requirePermission('borrowRecord.view'), async (req, res) => {
  try {
    // 支持前端发送的参数格式
    const { year, unit, userId: frontendUserId, start, end, period = 'month' } = req.query;
    const userId = frontendUserId || req.user._uid;

    // 如果前端发送了年份和单位参数，转换为开始和结束日期
    let startDate, endDate;
    if (year && unit) {
      startDate = new Date(year, 0, 1); // 年初
      
      if (unit === 'semester') {
        // 按学期查看，全年分为两个学期
        endDate = new Date(parseInt(year) + 1, 0, 1); // 下一年年初
      } else {
        // 按月查看
        endDate = new Date(parseInt(year) + 1, 0, 1); // 下一年年初
      }
    } else {
      // 使用原始的start和end参数
      if (!start || !end) {
        return res.status(400).json({
          success: false,
          errorCode: 'INVALID_PARAMETERS',
          message: '缺少必需的参数: start 和 end 或者 year 和 unit'
        });
      }
      
      startDate = new Date(start);
      endDate = new Date(end);
      
      // 验证日期格式
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
    }

    // 验证period参数
    if (!['month', 'quarter'].includes(period)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_PERIOD',
        message: 'period参数必须是month或quarter'
      });
    }

    // 查询指定日期范围内的用户借阅记录
    const borrowRecords = await BorrowRecord.findAll({
      where: {
        _uid: userId,
        _begin_time: {
          [Op.between]: [start, end]
        }
      },
      attributes: ['_begin_time'],
      order: [['_begin_time', 'ASC']]
    });

    // 按月或按季度分组统计
    const stats = {};
    borrowRecords.forEach(record => {
      const date = new Date(record._begin_time);
      let key;
      
      if (period === 'month') {
        // 按月统计: YYYY-MM
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // 按季度统计: YYYY-QX
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      }
      
      if (!stats[key]) {
        stats[key] = 0;
      }
      stats[key]++;
    });

    // 转换为数组格式并按时间排序
    const result = Object.keys(stats)
      .sort()
      .map(period => ({
        period: period,
        myBorrowCount: stats[period], // 前端期望的字段名
        avgBorrowCount: Math.round(stats[period] * 0.8) // 模拟全馆平均数据，实际应用中应从数据库计算
      }));

    res.json({
      success: true,
      message: '获取个人借阅趋势成功',
      data: result
    });
  } catch (error) {
    console.error('获取个人借阅趋势错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/borrow-records/category-evolution:
 *   get:
 *     summary: 获取用户借阅类别演变数据
 *     description: 统计用户在不同时间段借阅的图书类别分布，按季度统计用户借阅的不同类别图书数量
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
 *         description: 获取用户借阅类别演变成功
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
 *                         type: object
 *                         properties:
 *                           quarter:
 *                             type: string
 *                             description: 季度 (YYYY-QX)
 *                           categories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 categoryId:
 *                                   type: integer
 *                                   description: 类别ID
 *                                 categoryName:
 *                                   type: string
 *                                   description: 类别名称
 *                                 count:
 *                                   type: integer
 *                                   description: 借阅数量
 *             examples:
 *               success:
 *                 summary: 成功获取用户借阅类别演变
 *                 value:
 *                   success: true
 *                   message: "获取用户借阅类别演变成功"
 *                   data:
 *                     - quarter: "2023-Q1"
 *                       categories:
 *                         - categoryId: 1
 *                           categoryName: "文学"
 *                           count: 5
 *                         - categoryId: 2
 *                           categoryName: "科技"
 *                           count: 3
 *                     - quarter: "2023-Q2"
 *                       categories:
 *                         - categoryId: 1
 *                           categoryName: "文学"
 *                           count: 2
 *                         - categoryId: 3
 *                           categoryName: "历史"
 *                           count: 4
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
// 获取用户借阅类别演变数据
router.get('/category-evolution', authenticate, requirePermission('borrowRecord.view'), async (req, res) => {
  try {
    const { start, end } = req.query;
    const userId = req.user._uid;

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

    // 查询指定日期范围内的用户借阅记录，包含图书类别信息
    const borrowRecords = await BorrowRecord.findAll({
      where: {
        _uid: userId,
        _begin_time: {
          [Op.between]: [start, end]
        }
      },
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['_tid'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['_tid', '_type_name']
            }
          ]
        }
      ],
      order: [['_begin_time', 'ASC']]
    });

    // 按季度和类别分组统计
    const stats = {};
    borrowRecords.forEach(record => {
      if (!record.book || !record.book.category) return;
      
      const date = new Date(record._begin_time);
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const quarterKey = `${date.getFullYear()}-Q${quarter}`;
      
      const categoryId = record.book.category._tid;
      const categoryName = record.book.category._type_name;
      
      if (!stats[quarterKey]) {
        stats[quarterKey] = {};
      }
      
      if (!stats[quarterKey][categoryId]) {
        stats[quarterKey][categoryId] = {
          categoryId: categoryId,
          categoryName: categoryName,
          count: 0
        };
      }
      
      stats[quarterKey][categoryId].count++;
    });

    // 转换为数组格式并按时间排序
    const result = Object.keys(stats)
      .sort()
      .map(quarter => ({
        quarter: quarter,
        categories: Object.values(stats[quarter])
      }));

    res.json({
      success: true,
      message: '获取用户借阅类别演变成功',
      data: result
    });
  } catch (error) {
    console.error('获取用户借阅类别演变错误:', error);
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
router.get('/stats', authenticate, requirePermission('borrow.stats'), async (req, res) => {
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
/**
 * 获取借阅记录列表 - 需要borrowRecord.view权限
 * @description 获取所有借阅记录，包含用户和图书信息，需要管理员权限
 * @requiresPermission borrowRecord.view
 */
// 获取借阅记录列表（管理员）
router.get('/', authenticate, requirePermission('borrowRecord.view'), async (req, res) => {
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
          attributes: ['_bid','_book_name','_author','_isbn']
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
/**
 * 获取我的借阅记录 - 需要borrowRecord.view权限
 * @description 获取当前登录用户的借阅记录，包含图书详细信息
 * @requiresPermission borrowRecord.view
 */
// 获取我的借阅记录
router.get('/my', authenticate, requirePermission('borrowRecord.view'), async (req, res) => {
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
 * /api/borrow-records/reading-calendar:
 *   get:
 *     summary: 获取用户阅读日历数据
 *     description: 返回用户在指定年份的阅读习惯日历数据，以热力图形式展示
 *     tags: [BorrowRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: year
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *         description: 年份
 *       - name: userId
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *         description: 用户ID (可选，默认为当前登录用户)
 *     responses:
 *       200:
 *         description: 获取阅读日历成功
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
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             description: 日期 (YYYY-MM-DD)
 *                           intensity:
 *                             type: integer
 *                             minimum: 0
 *                             maximum: 4
 *                             description: 阅读强度 (0-4)
 *             examples:
 *               success:
 *                 summary: 成功获取阅读日历
 *                 value:
 *                   success: true
 *                   message: "获取阅读日历成功"
 *                   data:
 *                     - date: "2023-01-15"
 *                       intensity: 2
 *                     - date: "2023-02-20"
 *                       intensity: 4
 *                     - date: "2023-03-05"
 *                       intensity: 1
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingYear:
 *                 summary: 缺少年份参数
 *                 value:
 *                   success: false
 *                   errorCode: "MISSING_YEAR"
 *                   message: "缺少必需的参数: year"
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
// 获取用户阅读日历数据
router.get('/reading-calendar', authenticate, requirePermission('borrowRecord.view'), async (req, res) => {
  try {
    const { year, userId: frontendUserId } = req.query;
    const userId = frontendUserId || req.user._uid;

    // 验证年份参数
    if (!year || isNaN(parseInt(year))) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_YEAR',
        message: '缺少必需的参数: year'
      });
    }

    const yearInt = parseInt(year);
    const startDate = new Date(yearInt, 0, 1); // 年初
    const endDate = new Date(yearInt + 1, 0, 1); // 下一年年初

    // 查询指定年份的用户借阅记录
    const borrowRecords = await BorrowRecord.findAll({
      where: {
        _uid: userId,
        _begin_time: {
          [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        }
      },
      attributes: ['_begin_time'],
      order: [['_begin_time', 'ASC']]
    });

    // 构建日期到阅读强度的映射
    const dateIntensityMap = {};
    borrowRecords.forEach(record => {
      const date = new Date(record._begin_time).toISOString().split('T')[0]; // YYYY-MM-DD
      
      // 根据借阅数量设置阅读强度
      if (!dateIntensityMap[date]) {
        dateIntensityMap[date] = 0;
      }
      dateIntensityMap[date] = Math.min(dateIntensityMap[date] + 1, 4); // 最大强度为4
    });

    // 转换为数组格式
    const result = Object.keys(dateIntensityMap).map(date => ({
      date: date,
      intensity: dateIntensityMap[date]
    }));

    res.json({
      success: true,
      message: '获取阅读日历成功',
      data: result
    });
  } catch (error) {
    console.error('获取阅读日历错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;