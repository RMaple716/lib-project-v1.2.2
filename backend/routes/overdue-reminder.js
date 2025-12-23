const express = require('express');
const router = express.Router();
const { BorrowRecord, User, Book, Message } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { Op } = require('sequelize');
const { checkAndSendOverdueReminders } = require('../scripts/overdueReminder');

/**
 * @swagger
 * tags:
 *   name: OverdueReminder
 *   description: 逾期提醒管理
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OverdueRecord:
 *       type: object
 *       properties:
 *         _hid:
 *           type: integer
 *           description: 借阅记录ID
 *         _bid:
 *           type: integer
 *           description: 图书ID
 *         _uid:
 *           type: integer
 *           description: 用户ID
 *         _begin_time:
 *           type: string
 *           format: date
 *           description: 借阅开始日期
 *         _end_date:
 *           type: string
 *           format: date
 *           description: 应还日期
 *         _status:
 *           type: integer
 *           description: “借阅状态 ：0代表借出, 1代表已归还”
 *         overdueDays:
 *           type: integer
 *           description: 逾期天数
 *         user:
 *           $ref: '#/components/schemas/UserInfo'
 *         book:
 *           $ref: '#/components/schemas/BookInfo'
 *     UserInfo:
 *       type: object
 *       properties:
 *         _uid:
 *           type: integer
 *           description: 用户ID
 *         _name:
 *           type: string
 *           description: 用户姓名
 *         _account:
 *           type: string
 *           description: 用户账号
 *     BookInfo:
 *       type: object
 *       properties:
 *         _bid:
 *           type: integer
 *           description: 图书ID
 *         _book_name:
 *           type: string
 *           description: 图书名称
 *         _author:
 *           type: string
 *           description: 作者
 *         _isbn:
 *           type: string
 *           description: ISBN号
 *   examples:
 *     OverdueRecordsSuccess:
 *       summary: 成功获取逾期记录列表
 *       value:
 *         success: true
 *         message: "获取逾期记录成功"
 *         data:
 *           records:
 *             - _hid: 1
 *               _bid: 101
 *               _uid: 1001
 *               _begin_time: "2023-10-01"
 *               _end_date: "2023-10-15"
 *               _status: 0
 *               overdueDays: 5
 *               user:
 *                 _uid: 1001
 *                 _name: "张三"
 *                 _account: "zhangsan"
 *               book:
 *                 _bid: 101
 *                 _book_name: "JavaScript高级程序设计"
 *                 _author: "Nicholas C. Zakas"
 *                 _isbn: "978-7-115-27579-0"
 *             - _hid: 2
 *               _bid: 102
 *               _uid: 1002
 *               _begin_time: "2023-09-20"
 *               _end_date: "2023-10-05"
 *               _status: 0
 *               overdueDays: 15
 *               user:
 *                 _uid: 1002
 *                 _name: "李四"
 *                 _account: "lisi"
 *               book:
 *                 _bid: 102
 *                 _book_name: "深入理解计算机系统"
 *                 _author: "Randal E. Bryant"
 *                 _isbn: "978-7-111-32133-0"
 *           total: 2
 *     SendReminderSuccess:
 *       summary: 成功发送逾期提醒
 *       value:
 *         success: true
 *         message: "逾期提醒发送成功"
 *     RecordNotFound:
 *       summary: 借阅记录不存在
 *       value:
 *         success: false
 *         errorCode: "RECORD_NOT_FOUND"
 *         message: "借阅记录不存在"
 *     NotOverdue:
 *       summary: 借阅记录未逾期或已归还
 *       value:
 *         success: false
 *         errorCode: "NOT_OVERDUE"
 *         message: "该借阅记录未逾期或已归还"
 *     PermissionDenied:
 *       summary: 权限不足
 *       value:
 *         success: false
 *         errorCode: "PERMISSION_DENIED"
 *         message: "权限不足"
 *     Unauthorized:
 *       summary: 未授权访问
 *       value:
 *         success: false
 *         errorCode: "UNAUTHORIZED"
 *         message: "未授权访问"
 *     ServerError:
 *       summary: 服务器内部错误
 *       value:
 *         success: false
 *         errorCode: "SERVER_ERROR"
 *         message: "服务器内部错误"
 */

/**
 * @swagger
 * /api/overdue-reminder/records:
 *   get:
 *     summary: 获取逾期借阅记录列表
 *     description: 获取所有逾期未还的借阅记录，需要管理员权限
 *     tags: [OverdueReminder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取逾期记录成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         records:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/OverdueRecord'
 *                         total:
 *                           type: integer
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/OverdueRecordsSuccess'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/Unauthorized'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDenied'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 获取逾期借阅记录列表
router.get('/records', authenticate, requirePermission('overdueReminder.view'), async (req, res) => {
  try {
    const today = new Date();
    const overdueRecords = await BorrowRecord.findAll({
      where: {
        _end_date: {
          [Op.lt]: today
        },
        _status: 0 // 假设0表示借出状态，1表示已归还
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['_uid', '_name', '_account']
        },
        {
          model: Book,
          as: 'book',
          attributes: ['_bid', '_book_name', '_author', '_isbn']
        }
      ],
      order: [['_end_date', 'ASC']]
    });

    // 计算逾期天数
    const recordsWithOverdueDays = overdueRecords.map(record => {
      const overdueDays = Math.floor((today - new Date(record._end_date)) / (1000 * 60 * 60 * 24));
      return {
        ...record.toJSON(),
        overdueDays
      };
    });

    res.json({
      success: true,
      message: '获取逾期记录成功',
      data: {
        records: recordsWithOverdueDays,
        total: recordsWithOverdueDays.length
      }
    });
  } catch (error) {
    console.error('获取逾期记录错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/overdue-reminder/send:
 *   post:
 *     summary: 手动发送逾期提醒
 *     description: 手动触发逾期提醒检查并发送提醒消息，需要管理员权限
 *     tags: [OverdueReminder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 发送提醒成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/SendReminderSuccess'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/Unauthorized'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDenied'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 手动发送逾期提醒
router.post('/send', authenticate, requirePermission('overdueReminder.send'), async (req, res) => {
  try {
    await checkAndSendOverdueReminders();
    
    res.json({
      success: true,
      message: '逾期提醒发送成功'
    });
  } catch (error) {
    console.error('发送逾期提醒错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/overdue-reminder/send/{recordId}:
 *   post:
 *     summary: 为特定借阅记录发送提醒
 *     description: 为指定的借阅记录发送逾期提醒消息，需要管理员权限
 *     tags: [OverdueReminder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: recordId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 借阅记录ID
 *     responses:
 *       200:
 *         description: 发送提醒成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/SendReminderSuccess'
 *       400:
 *         description: 借阅记录未逾期或已归还
 *         content:
 *           application/json:
 *             examples:
 *               notOverdue:
 *                 $ref: '#/components/examples/NotOverdue'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/Unauthorized'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDenied'
 *       404:
 *         description: 借阅记录不存在
 *         content:
 *           application/json:
 *             examples:
 *               recordNotFound:
 *                 $ref: '#/components/examples/RecordNotFound'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 为特定借阅记录发送提醒
router.post('/send/:recordId', authenticate, requirePermission('overdueReminder.send'), async (req, res) => {
  try {
    const recordId = req.params.recordId;
    
    // 查找借阅记录
    const record = await BorrowRecord.findByPk(recordId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['_uid', '_name', '_account']
        },
        {
          model: Book,
          as: 'book',
          attributes: ['_bid', '_book_name', '_author', '_isbn']
        }
      ]
    });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        errorCode: 'RECORD_NOT_FOUND',
        message: '借阅记录不存在'
      });
    }
    
    // 检查是否逾期
    const today = new Date();
    if (new Date(record._end_date) >= today || record._status !== 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'NOT_OVERDUE',
        message: '该借阅记录未逾期或已归还'
      });
    }
    
    // 获取或创建逾期提醒消息类型
    const { getOrCreateOverdueMessageType, sendOverdueReminder } = require('../scripts/overdueReminder');
    const overdueMessageType = await getOrCreateOverdueMessageType();
    
    // 发送提醒
    await sendOverdueReminder(record, overdueMessageType);
    
    res.json({
      success: true,
      message: '逾期提醒发送成功'
    });
  } catch (error) {
    console.error('发送特定记录逾期提醒错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
