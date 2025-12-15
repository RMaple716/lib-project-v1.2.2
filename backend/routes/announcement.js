const express = require('express');
const router = express.Router();
const { Announcement } = require('../models');
const { authenticate, requirePermission } = require('../middleware/auth');




/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: 公告管理
 */

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     summary: 获取公告列表
 *     description: 获取公告列表，按发布日期倒序排列
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取公告列表成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AnnouncementListResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/AnnouncementListSuccess'
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
 * 获取公告列表 - 需要announcement.view权限
 * @description 获取公告列表，按发布日期倒序排列
 * @requiresPermission announcement.view
 */
// 获取公告列表
router.get('/', requirePermission('announcement.view'), async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      attributes: ['_aid', '_title', '_content', '_publisher', '_date','_status'],
      order: [['_date', 'DESC']],
      limit: 50,
    });
    res.json({
      success: true,
      message: '获取公告列表成功',
      data: {
        annlist:announcements
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
 * /api/announcements:
 *   post:
 *     summary: 新增公告
 *     description: 创建新公告，需要认证
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAnnouncementRequest'
 *           examples:
 *             normalAnnouncement:
 *               summary: 普通公告
 *               value:
 *                 _title: "系统维护通知"
 *                 _content: "系统将于本周六进行维护"
 *                 _status: 1
 *             importantAnnouncement:
 *               summary: 重要公告
 *               value:
 *                 _title: "重要通知"
 *                 _content: "请各位用户注意系统使用规范"
 *                 _status: 1
 *     responses:
 *       200:
 *         description: 添加公告成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/CreateAnnouncementSuccess'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 $ref: '#/components/examples/MissingFieldsError'
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
 * 创建公告 - 需要announcement.create权限
 * @description 创建新公告，需要认证
 * @requiresPermission announcement.create
 */
// 新增公告
router.post('/', authenticate, requirePermission('announcement.create'), async (req, res) => {
  try {
    const { _title, _content,_status} = req.body;
    
    const newAnnouncement = await Announcement.create({
      _title: _title,
      _content: _content,
      _publisher: req.user.name || '终端管理员',
      _status:_status
    });

    res.json({
      success: true,
      message: '添加公告成功',
      data: {
        res_insert: newAnnouncement
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
 * /api/announcements/{id}:
 *   get:
 *     summary: 获取公告详情
 *     description: 根据公告ID获取公告的详细信息
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 公告ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 成功获取公告详情
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/AnnouncementDetailSuccess'
 *       404:
 *         description: 公告不存在
 *         content:
 *           application/json:
 *             examples:
 *               announcementNotFound:
 *                 $ref: '#/components/examples/AnnouncementNotFoundError'
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
 * 获取公告详情 - 需要announcement.view权限
 * @description 根据公告ID获取公告详情
 * @requiresPermission announcement.view
 */
// 获取公告详情
router.get('/:id', authenticate, requirePermission('announcement.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        errorCode: 'ANNOUNCEMENT_NOT_FOUND',
        message: '公告不存在'
      });
    }

    res.json({
      success: true,
      message: '成功获取公告详情',
      data: announcement
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
 * /api/announcements/{id}:
 *   put:
 *     summary: 更新公告
 *     description: 根据公告ID更新公告信息
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 公告ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAnnouncementRequest'
 *           examples:
 *             updateExample:
 *               summary: 更新公告信息
 *               value:
 *                 _title: "更新后的公告标题"
 *                 _content: "更新后的公告内容"
 *                 _status: 1
 *     responses:
 *       200:
 *         description: 公告更新成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/UpdateAnnouncementSuccess'
 *       404:
 *         description: 公告不存在
 *         content:
 *           application/json:
 *             examples:
 *               announcementNotFound:
 *                 $ref: '#/components/examples/AnnouncementNotFoundError'
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
 * 更新公告 - 需要announcement.edit权限
 * @description 根据公告ID更新公告信息
 * @requiresPermission announcement.edit
 */
// 更新公告
router.put('/:id', authenticate, requirePermission('announcement.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { _title, _content , _status} = req.body;
    console.log("哇，开始改公告了吗？这么强？")
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        errorCode: 'ANNOUNCEMENT_NOT_FOUND',
        message: '公告不存在'
      });
    }

    await announcement.update({
      _title: _title,
      _content: _content,
      _status: _status
    });

    res.json({
      success: true,
      message: '公告更新成功',
      data: announcement
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
 * /api/announcements/{id}:
 *   delete:
 *     summary: 删除公告
 *     description: 根据公告ID删除公告
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 公告ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 公告删除成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/DeleteAnnouncementSuccess'
 *       404:
 *         description: 公告不存在
 *         content:
 *           application/json:
 *             examples:
 *               announcementNotFound:
 *                 $ref: '#/components/examples/AnnouncementNotFoundError'
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
 * 删除公告 - 需要announcement.delete权限
 * @description 根据公告ID删除公告
 * @requiresPermission announcement.delete
 */
// 删除公告
router.delete('/:id', authenticate, requirePermission('announcement.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        errorCode: 'ANNOUNCEMENT_NOT_FOUND',
        message: '公告不存在'
      });
    }

    await announcement.destroy();

    res.json({
      success: true,
      message: '公告删除成功',
      data: announcement
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