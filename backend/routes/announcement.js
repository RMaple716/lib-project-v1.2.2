const express = require('express');
const router = express.Router();
const { Announcement } = require('../models');
const { authenticate } = require('../middleware/auth');





// 获取最新公告
/*router.get('/latest', authenticate, async (req, res) => {
  try {
    const latestAnnouncement = await Announcement.findOne({
      order: [['_date', 'DESC']]
    });

    if (!latestAnnouncement) {
      return res.status(404).json({
        success: false,
        errorCode: 'NO_ANNOUNCEMENTS',
        message: '暂无公告'
      });
    }

    res.json({
      success: true,
      message: '成功获取最新公告',
      data: {
        res_find: latestAnnouncement
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
});*/


// 获取公告列表
router.get('/', authenticate, async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      attributes: ['_aid', '_title', '_content', '_publisher', '_date'],
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

// 新增公告
router.post('/', authenticate, async (req, res) => {
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

// 获取公告详情
router.get('/:id', authenticate, async (req, res) => {
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

// 更新公告
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { _title, _content } = req.body;

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
      _content: _content
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

// 删除公告
router.delete('/:id', authenticate, async (req, res) => {
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