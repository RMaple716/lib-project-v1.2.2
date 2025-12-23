const express = require('express');
const router = express.Router();
const BookOrderService = require('../utils/BookOrderService');
const { authenticate, requirePermission } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: BookOrder
 *   description: 图书预约管理相关接口
 *
 * /api/book-order/order:
 *   post:
 *     summary: 用户预约图书
 *     description: 用户可以预约当前不可借的图书，当图书可借时系统会自动通知
 *     tags: [BookOrder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *             properties:
 *               bookId:
 *                 type: integer
 *                 description: 图书ID
 *                 example: 1
 *     responses:
 *       201:
 *         description: 预约成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "预约成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _oid:
 *                       type: integer
 *                       description: 预约ID
 *                       example: 1
 *                     _bid:
 *                       type: integer
 *                       description: 图书ID
 *                       example: 1
 *                     _uid:
 *                       type: integer
 *                       description: 用户ID
 *                       example: 2
 *                     _otime:
 *                       type: string
 *                       format: date-time
 *                       description: 预约时间
 *                       example: "2023-06-15T10:30:00.000Z"
 *                     _ostatus:
 *                       type: string
 *                       description: 预约状态
 *                       example: "pending"
 *       400:
 *         description: 预约失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "图书当前可借，无需预约"
 *             examples:
 *               bookAvailable:
 *                 summary: 图书可借
 *                 value:
 *                   success: false
 *                   message: "图书当前可借，无需预约"
 *               alreadyOrdered:
 *                 summary: 已预约过此书
 *                 value:
 *                   success: false
 *                   message: "您已经预约过此书，请勿重复预约"
 *               overdueBooks:
 *                 summary: 有超期图书
 *                 value:
 *                   success: false
 *                   message: "您有图书超期未还，请先归还后再进行预约"
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "未授权访问"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "服务器内部错误"
 */

// 预约图书
router.post('/order', authenticate, requirePermission('book.order'), async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user._uid;
  // 参数验证
  if (!bookId || !Number.isInteger(Number(bookId)) || Number(bookId) < 1) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_PARAMETER',
      message: '图书ID必须是正整数'
    });
  }
    
    
    
    
    const order = await BookOrderService.orderBook(bookId, userId);
    
    res.status(201).json({
      success: true,
      message: '预约成功',
      data: order
    });
  } catch (error) {
    console.log("错误信息", error);
    res.status(400).json({
      success: false,
      message: error.message || '预约失败'
    });
  }
});


/**
 * @swagger
 * tags:
 *   name: BookOrder
 *   description: 图书预约管理相关接口
 * /api/book-order/cancel/{orderId}:
 *   put:
 *     summary: 取消预约
 *     description: 用户可以取消自己的预约，取消后预约队列中的下一位用户将获得预约资格
 *     tags: [BookOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 预约ID
 *         example: 1
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 取消原因
 *                 example: "不再需要此书"
 *     responses:
 *       200:
 *         description: 取消预约成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "取消预约成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _oid:
 *                       type: integer
 *                       description: 预约ID
 *                       example: 1
 *                     _ostatus:
 *                       type: string
 *                       description: 更新后的预约状态
 *                       example: "cancelled"
 *       400:
 *         description: 取消预约失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               notFound:
 *                 summary: 预约记录不存在
 *                 value:
 *                   success: false
 *                   message: "预约记录不存在"
 *               noPermission:
 *                 summary: 无权操作此预约
 *                 value:
 *                   success: false
 *                   message: "无权操作此预约记录"
 *               cannotCancel:
 *                 summary: 预约已无法取消
 *                 value:
 *                   success: false
 *                   message: "该预约已无法取消"
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "未授权访问"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "服务器内部错误"
 */


// 取消预约
router.put('/cancel/:orderId', authenticate, requirePermission('book.order'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user._uid;
    const order = await BookOrderService.cancelOrder(orderId, userId, reason);
    if (!orderId || !Number.isInteger(Number(orderId)) || Number(orderId) < 1) {
        return res.status(400).json({
        success: false,
        errorCode: 'INVALID_PARAMETER',
        message: '预约ID必须是正整数'
        });
    }
    res.json({
      success: true,
      message: '取消预约成功',
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '取消预约失败'
    });
  }
});


/**
 * @swagger
 * tags:
 *   name: BookOrder
 *   description: 图书预约管理相关接口
 * /api/book-order/convert/{orderId}:
 *   post:
 *     summary: 将预约转换为借阅
 *     description: 当用户的预约状态为ready时，可以通过此接口将预约转换为借阅记录
 *     tags: [BookOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 预约ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 借阅成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "借阅成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _hid:
 *                       type: integer
 *                       description: 借阅记录ID
 *                       example: 1
 *                     _bid:
 *                       type: integer
 *                       description: 图书ID
 *                       example: 1
 *                     _uid:
 *                       type: integer
 *                       description: 用户ID
 *                       example: 2
 *                     _begin_time:
 *                       type: string
 *                       format: date
 *                       description: 借阅开始日期
 *                       example: "2023-06-15"
 *                     _end_date:
 *                       type: string
 *                       format: date
 *                       description: 应还日期
 *                       example: "2023-07-15"
 *                     _status:
 *                       type: integer
 *                       description: 借阅状态
 *                       example: 0
 *       400:
 *         description: 借阅失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               notFound:
 *                 summary: 预约记录不存在
 *                 value:
 *                   success: false
 *                   message: "预约记录不存在"
 *               noPermission:
 *                 summary: 无权操作此预约
 *                 value:
 *                   success: false
 *                   message: "无权操作此预约记录"
 *               notReady:
 *                 summary: 预约状态不满足
 *                 value:
 *                   success: false
 *                   message: "该预约状态不满足借阅条件"
 *               bookUnavailable:
 *                 summary: 图书不可借
 *                 value:
 *                   success: false
 *                   message: "图书当前不可借"
 *               maxLimit:
 *                 summary: 达到最大借阅数量
 *                 value:
 *                   success: false
 *                   message: "已达到最大借阅数量"
 *               alreadyBorrowed:
 *                 summary: 同一本书借阅次数超限
 *                 value:
 *                   success: false
 *                   message: "同一本书籍只能连续借阅两次"
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "未授权访问"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "服务器内部错误"
 */



// 将预约转换为借阅
router.post('/convert/:orderId', authenticate, requirePermission('book.borrow'), async (req, res) => {
  try {
    const { orderId } = req.params;
    // 参数验证
    if (!orderId || !Number.isInteger(Number(orderId)) || Number(orderId) < 1) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_PARAMETER',
        message: '预约ID必须是正整数'
      });
    }
    const userId = req.user._uid;
    
    const borrowRecord = await BookOrderService.convertToBorrow(orderId, userId);
    
    res.json({
      success: true,
      message: '借阅成功',
      data: borrowRecord
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '借阅失败'
    });
  }
});


/**
 * @swagger
 * tags:
 *   name: BookOrder
 *   description: 图书预约管理相关接口
 * /api/book-order/my-orders:
 *   get:
 *     summary: 获取用户的预约列表
 *     description: 获取当前用户的预约记录列表，支持按状态筛选和分页
 *     tags: [BookOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, ready, expired, cancelled, completed]
 *         description: 预约状态筛选
 *         example: "pending"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页数量
 *         example: 10
 *     responses:
 *       200:
 *         description: 获取预约列表成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "获取预约列表成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: 总记录数
 *                       example: 5
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _oid:
 *                             type: integer
 *                             description: 预约ID
 *                             example: 1
 *                           _bid:
 *                             type: integer
 *                             description: 图书ID
 *                             example: 1
 *                           _uid:
 *                             type: integer
 *                             description: 用户ID
 *                             example: 2
 *                           _otime:
 *                             type: string
 *                             format: date-time
 *                             description: 预约时间
 *                             example: "2023-06-15T10:30:00.000Z"
 *                           _ostatus:
 *                             type: string
 *                             description: 预约状态
 *                             example: "pending"
 *                           book:
 *                             type: object
 *                             properties:
 *                               _bid:
 *                                 type: integer
 *                                 description: 图书ID
 *                                 example: 1
 *                               _book_name:
 *                                 type: string
 *                                 description: 图书名称
 *                                 example: "JavaScript高级程序设计"
 *                               _author:
 *                                 type: string
 *                                 description: 作者
 *                                 example: "Nicholas C. Zakas"
 *                               _isbn:
 *                                 type: string
 *                                 description: ISBN号
 *                                 example: "9787115275790"
 *                               _cover_url:
 *                                 type: string
 *                                 description: 封面图片URL
 *                                 example: "https://example.com/cover.jpg"
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "未授权访问"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "服务器内部错误"
 */


// 获取用户的预约列表
router.get('/my-orders', authenticate, requirePermission('book.order.view'), async (req, res) => {
  try {
    const userId = req.user._uid;
    const { status, page = 1, limit = 10 } = req.query;
    
    const orders = await BookOrderService.getUserOrders(userId, {
      status,
      page,
      limit
    });
    
    res.json({
      success: true,
      message: '获取预约列表成功',
      data: orders
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '获取预约列表失败'
    });
  }
});



/**
 * @swagger
 * tags:
 *   name: BookOrder
 *   description: 图书预约管理相关接口
 * /api/book-order/queue/{bookId}:
 *   get:
 *     summary: 获取图书的预约队列
 *     description: 获取指定图书的预约队列，按预约时间排序
 *     tags: [BookOrder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 图书ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 获取预约队列成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "获取预约队列成功"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _oid:
 *                         type: integer
 *                         description: 预约ID
 *                         example: 1
 *                       _bid:
 *                         type: integer
 *                         description: 图书ID
 *                         example: 1
 *                       _uid:
 *                         type: integer
 *                         description: 用户ID
 *                         example: 2
 *                       _otime:
 *                         type: string
 *                         format: date-time
 *                         description: 预约时间
 *                         example: "2023-06-15T10:30:00.000Z"
 *                       _ostatus:
 *                         type: string
 *                         description: 预约状态
 *                         example: "pending"
 *                       user:
 *                         type: object
 *                         properties:
 *                           _uid:
 *                             type: integer
 *                             description: 用户ID
 *                             example: 2
 *                           _account:
 *                             type: string
 *                             description: 用户账号
 *                             example: "student001"
 *                           _name:
 *                             type: string
 *                             description: 用户姓名
 *                             example: "张三"
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "未授权访问"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "服务器内部错误"
 */

// 获取图书的预约队列
router.get('/queue/:bookId', authenticate, requirePermission('book.order.view'),async (req, res) => {
  try {
    const { bookId } = req.params;
    
    const orders = await BookOrderService.getBookOrderQueue(bookId);
    
    res.json({
      success: true,
      message: '获取预约队列成功',
      data: orders
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '获取预约队列失败'
    });
  }
});

module.exports = router;
