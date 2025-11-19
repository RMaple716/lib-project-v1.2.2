const express = require('express');
const router = express.Router();
const { Book } = require('../models');
const { authenticate } = require('../middleware/auth');

// 获取图书列表（需要认证）
router.get('/', authenticate, async (req, res) => {
  try {
    const { query, category } = req.query;
    
    console.log('查询图书:', { query, category, user: req.user });
    
    let whereCondition = {};
    
    // 搜索条件
    if (query) {
      whereCondition = {
        [Op.or]: [
          { _book_name: { [Op.like]: `%${query}%` } },
          { _author: { [Op.like]: `%${query}%` } },
          { _press: { [Op.like]: `%${query}%` } }
        ]
      };
    }
    
    // 分类筛选
    if (category) {
      whereCondition._tid = category;
    }

    const books = await Book.findAll({
      where: whereCondition,
      limit: 50
    });

    res.json({
      success: true,
      message: '获取图书列表成功',
      data: {
        booklist: books
      }
    });

  } catch (error) {
    console.error('获取图书列表错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

// 新增图书（管理员功能）
router.post('/', authenticate, async (req, res) => {
  try {
    // 检查用户权限
    if (!req.user._utype.includes('admin')) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

    const { _book_name, _isbn, _num, _author, _press, _tid, _cover_url} = req.body;
    
    // 输入验证
    if (!_book_name || !_isbn || !_num || !_author || !_press || !_tid) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供完整的图书信息'
      });
    }

    const book = await Book.create({
      _book_name,
      _isbn,
      _num,
      _author,
      _press,
      _tid,
      _cover_url
    });

    res.json({
      success: true,
      message: '图书添加成功',
      data: book
    });

  } catch (error) {
    console.error('添加图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;