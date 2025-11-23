const express = require('express');
const router = express.Router();
const { BorrowRecord, Book, User } = require('../models');
const { authenticate } = require('../middleware/auth');

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