const express = require('express');
const router = express.Router();
const { BorrowRecord, Book, User } = require('../models');
const { authenticate } = require('../middleware/auth');

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

module.exports = router;