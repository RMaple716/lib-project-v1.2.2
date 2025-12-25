const express = require('express');
const router = express.Router();
const { Message, User, Mtype, Book } = require('../models');
const { authenticate, requirePermission } = require('../middleware/auth');
const { Op } = require('sequelize');
//需要实现的功能（其他函数）：图书预约消息提醒、借阅到期提醒消息等。
//以及：
/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: 读者端消息管理
 */

/**
 * @swagger
 * /api/messages/types:
 *   get:
 *     summary: 获取消息类型列表
 *     description: 获取系统中所有可用的消息类型
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取消息类型成功
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
 *                           _mtid:
 *                             type: integer
 *                             description: 消息类型ID
 *                           _mname:
 *                             type: string
 *                             description: 消息类型名称
 *                           _mdesc:
 *                             type: string
 *                             description: 消息类型描述
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
// 获取消息类型列表
router.get('/types', authenticate, async (req, res) => {
  try {
    console.log("获取消息类型接口被调用")
    // 返回系统中所有可用的消息类型
    const messageTypes = await Mtype.findAll();
    res.json({
      success: true,
      message: '获取消息类型成功',
      data: messageTypes
    });
  } catch (error) {
    console.error('获取消息类型错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});


/**
 * @swagger
 * /api/messages/all:
 *   get:
 *     summary: 获取消息列表
 *     description: 获取筛选后的消息列表，按创建时间倒序排列
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: "消息状态筛选 (0: 未读, 1: 已读)"
 *       - in: query
 *         name: type
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4]
 *         description: "消息类型筛选 (1: 系统通知, 2: 借阅提醒, 3: 预约通知, 4: 其他)"
 *     responses:
 *       200:
 *         description: 获取消息列表成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MessageListResponse'
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
router.get('/all', authenticate, requirePermission('message.view'), async(req, res) => {
   try {
    const { page = 1, limit = 10, status, type, receiver , sender} = req.query;
    const offset = (page - 1) * limit;
    // 确保whereClause变量在任何情况下都被定义
    let whereClause = {};

    if(receiver !== undefined){
      whereClause._receiver = receiver;
    }
    if(sender !== undefined){
        whereClause._sender = sender;
      }
    // 如果指定了状态，添加状态条件
    if (status !== undefined) {
      whereClause._status = status;
    }

    // 如果指定了类型，添加类型条件
    if (type !== undefined) {
      whereClause._mtid = type;
    }

    // 查询消息列表
    const { count, rows: messages } = await Message.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['_uid', '_name', '_account']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['_uid', '_name', '_account']
        }

      ],
      attributes: ['_mid', '_title', '_content', '_mtid', '_status', '_create_time', '_read_time'],
      order: [['_create_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 计算总页数
    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: '获取消息列表成功',
      data: {
        messages,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
  
});




/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: 获取当前用户的消息列表
 *     description: 获取当前登录用户的消息列表，按创建时间倒序排列
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: "消息状态筛选 (0: 未读, 1: 已读)"
 *       - in: query
 *         name: type
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4]
 *         description: "消息类型筛选 (1: 系统通知, 2: 借阅提醒, 3: 预约通知, 4: 其他)"
 *     responses:
 *       200:
 *         description: 获取消息列表成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MessageListResponse'
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
 * 获取消息列表 - 需要message.view权限
 * @description 获取当前登录用户的消息列表，按创建时间倒序排列
 * @requiresPermission message.view
 */
// 获取当前用户的消息列表
router.get('/', authenticate, requirePermission('message.view'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const whereClause = {
      _receiver_id: req.user._uid
    };

    // 如果指定了状态，添加状态条件
    if (status !== undefined) {
      whereClause._status = status;
    }

    // 如果指定了类型，添加类型条件
    if (type !== undefined) {
      whereClause._mtid = type;
    }

    // 查询消息列表
    const { count, rows: messages } = await Message.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['_uid', '_name', '_account']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['_uid', '_name', '_account']
        }

      ],
      attributes: ['_mid', '_title', '_content', '_mtid', '_status', '_create_time', '_read_time'],
      order: [['_create_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 计算总页数
    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: '获取消息列表成功',
      data: {
        messages,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/messages/unread/count:
 *   get:
 *     summary: 获取当前用户未读消息数量
 *     description: 获取当前登录用户的未读消息数量
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取未读消息数量成功
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
 *                         unreadCount:
 *                           type: integer
 *                           description: 未读消息数量
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
// 获取当前用户未读消息数量
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const unreadCount = await Message.count({
      where: {
        _receiver_id: req.user._uid,
        _status: 0 // 0 表示未读
      }
    });

    res.json({
      success: true,
      message: '获取未读消息数量成功',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: 获取消息详情
 *     description: 根据消息ID获取消息的详细信息
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 消息ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 成功获取消息详情
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MessageDetail'
 *       404:
 *         description: 消息不存在
 *         content:
 *           application/json:
 *             examples:
 *               messageNotFound:
 *                 $ref: '#/components/examples/MessageNotFoundError'
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
 * 获取消息详情 - 需要message.view权限
 * @description 根据消息ID获取消息的详细信息
 * @requiresPermission message.view
 */
// 获取消息详情
router.get('/:id', authenticate, requirePermission('message.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findOne({
      where: {
        _mid: id,
        _receiver_id: req.user._uid
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['_uid', '_name', '_account']
        }
      ]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        errorCode: 'MESSAGE_NOT_FOUND',
        message: '消息不存在'
      });
    }

    res.json({
      success: true,
      message: '成功获取消息详情',
      data: message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/messages/{id}/read:
 *   put:
 *     summary: 标记消息为已读
 *     description: 将指定消息标记为已读状态
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 消息ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 消息标记为已读成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MessageDetail'
 *       404:
 *         description: 消息不存在
 *         content:
 *           application/json:
 *             examples:
 *               messageNotFound:
 *                 $ref: '#/components/examples/MessageNotFoundError'
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
 * 标记消息为已读 - 需要message.edit权限
 * @description 将指定消息标记为已读状态
 * @requiresPermission message.edit
 */
// 标记消息为已读
router.put('/:id/read', authenticate, requirePermission('message.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findOne({
      where: {
        _mid: id,
        _receiver_id: req.user._uid
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        errorCode: 'MESSAGE_NOT_FOUND',
        message: '消息不存在'
      });
    }

    // 如果消息已经是已读状态，直接返回
    if (message._status === 1) {
      return res.json({
        success: true,
        message: '消息已经是已读状态',
        data: message
      });
    }

    // 标记为已读
    await message.markAsRead();

    res.json({
      success: true,
      message: '消息已标记为已读',
      data: message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/messages/read-all:
 *   put:
 *     summary: 标记所有消息为已读
 *     description: 将当前用户的所有未读消息标记为已读状态
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 所有消息标记为已读成功
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
 *                         updatedCount:
 *                           type: integer
 *                           description: 更新的消息数量
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
 * 标记所有消息为已读 - 需要message.edit权限
 * @description 将当前用户的所有未读消息标记为已读状态
 * @requiresPermission message.edit
 */
// 标记所有消息为已读
router.put('/read-all', authenticate, requirePermission('message.edit'), async (req, res) => {
  try {
    const [updatedCount] = await Message.update(
      {
        _status: 1,
        _read_time: new Date()
      },
      {
        where: {
          _receiver_id: req.user._uid,
          _status: 0 // 只更新未读消息
        }
      }
    );

    res.json({
      success: true,
      message: '所有消息已标记为已读',
      data: {
        updatedCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: 发送消息
 *     description: 向指定用户发送消息
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMessageRequest'
 *           examples:
 *             systemNotification:
 *               summary: 系统通知
 *               value:
 *                 _receiver_id: 5
 *                 _title: "系统维护通知"
 *                 _content: "系统将于本周六进行维护，请提前做好准备"
 *                 _mtid: 1
 *             borrowingReminder:
 *               summary: 借阅提醒
 *               value:
 *                 _receiver_id: 10
 *                 _title: "图书即将到期提醒"
 *                 _content: "您借阅的《JavaScript高级程序设计》将于3天后到期，请及时归还或续借"
 *                 _mtid: 2
 *     responses:
 *       200:
 *         description: 消息发送成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MessageDetail'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 $ref: '#/components/examples/MissingFieldsError'
 *               receiverNotFound:
 *                 $ref: '#/components/examples/ReceiverNotFoundError'
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
 * 发送消息 - 需要message.create权限
 * @description 向指定用户发送消息
 * @requiresPermission message.create
 */
// 发送消息
router.post('/', authenticate, requirePermission('message.create'), async (req, res) => {
  try {
    const { _receiver_id, _title, _content, _mtid } = req.body;

    // 验证必填字段
    if (!_receiver_id || !_title || !_content) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_REQUIRED_FIELDS',
        message: '缺少必填字段'
      });
    }

    // 验证接收者是否存在
    const receiver = await User.findByPk(_receiver_id);
    if (!receiver) {
      return res.status(400).json({
        success: false,
        errorCode: 'RECEIVER_NOT_FOUND',
        message: '接收者不存在'
      });
    }

    // 创建消息
    const newMessage = await Message.createWithDefaultMtid({
      _sender_id: req.user._uid,
      _receiver_id,
      _title,
      _content,
      _mtid,
      _status: 0, // 默认为未读
      _create_time: new Date()
    });

    // 查询完整消息信息（包含发送者信息）
    const messageWithSender = await Message.findByPk(newMessage._mid, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['_uid', '_name', '_account']
        }
      ]
    });

    res.json({
      success: true,
      message: '消息发送成功',
      data: messageWithSender
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});


/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: 删除消息
 *     description: 根据消息ID删除消息
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 消息ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 消息删除成功
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
 *                         _mid:
 *                           type: integer
 *                           description: 被删除的消息ID
 *       404:
 *         description: 消息不存在
 *         content:
 *           application/json:
 *             examples:
 *               messageNotFound:
 *                 $ref: '#/components/examples/MessageNotFoundError'
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
// 删除消息
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findOne({
      where: {
        _mid: id,
        _receiver_id: req.user._uid
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        errorCode: 'MESSAGE_NOT_FOUND',
        message: '消息不存在'
      });
    }

    await message.destroy();

    res.json({
      success: true,
      message: '消息删除成功',
      data: {
        _mid: parseInt(id)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});



module.exports = router;
