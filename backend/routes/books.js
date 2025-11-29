const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { Book, BorrowRecord, User, Category } = require('../models');
const { authenticate } = require('../middleware/auth');

// 图书借阅排名
router.get('/rank', authenticate, async (req, res) => {
  try {
    const topBooks = await Book.findAll({
      order: [['_times', 'DESC']],
      limit: 10,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['_type_name']
      }]
    });

    res.json({
      success: true,
      message: '获取图书排名成功',
      data: {
        res_rank: topBooks
      }
    });

  } catch (error) {
    console.error('获取图书排名错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

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
      include: [{
        model: Category,
        as: 'category',
        attributes: ['_type_name']
      }],
      limit: 50
    });
    
    const formattedBooks = books.map(book => {
    const bookData = book.toJSON();
      return {
        ...bookData,
        _type_name: bookData.category ? bookData.category._type_name : null,
        category: undefined // 删除category对象
      };
    });


    res.json({
      success: true,
      message: '获取图书列表成功',
      data: {
        booklist: formattedBooks
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
      console.log('没有权限添加图书', req.user._utype);
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

    const { _book_name, _isbn, _num, _author, _press, _tid, _cover_url } = req.body;
    
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

// 获取图书详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findByPk(id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['_type_name']
      }]
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        errorCode: 'BOOK_NOT_FOUND',
        message: '图书不存在'
      });
    }

    res.json({
      success: true,
      message: '成功获取图书详情',
      data: book
    });

  } catch (error) {
    console.error('获取图书详情错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

// 更新图书信息
router.put('/:id', authenticate, async (req, res) => {
  try {
    // 检查用户权限
    if (!req.user._utype.includes('admin')) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

    const { id } = req.params;
    const { _book_name, _isbn, _num, _author, _press, _tid, _cover_url } = req.body;
    
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        errorCode: 'BOOK_NOT_FOUND',
        message: '图书不存在'
      });
    }

    // 输入验证
    if (!_book_name || !_isbn || !_num || !_author || !_press || !_tid) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供完整的图书信息'
      });
    }

    await book.update({
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
      message: '图书信息更新成功',
      data: book
    });

  } catch (error) {
    console.error('更新图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

// 删除图书
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // 检查用户权限
    if (!req.user._utype.includes('admin')) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

    const { id } = req.params;
    
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        errorCode: 'BOOK_NOT_FOUND',
        message: '图书不存在'
      });
    }

    // 检查是否有借阅记录
    const borrowRecords = await BorrowRecord.count({
      where: { 
        _bid: id,
        _status: 1 // 借出状态
      }
    });

    if (borrowRecords > 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'BOOK_HAS_BORROW_RECORDS',
        message: '该书有未归还的借阅记录，无法删除'
      });
    }

    await book.destroy();

    res.json({
      success: true,
      message: '图书删除成功',
      data: book
    });

  } catch (error) {
    console.error('删除图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

// 借阅图书
router.post('/:id/borrow', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._uid;
    
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        errorCode: 'BOOK_NOT_FOUND',
        message: '图书不存在'
      });
    }

    // 检查图书库存
    if (book._num <= 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'BOOK_OUT_OF_STOCK',
        message: '该书暂无库存'
      });
    }

    // 检查用户是否已达到最大借阅数量
    const user = await User.findByPk(userId);
    const currentBorrowCount = await BorrowRecord.count({
      where: { 
        _uid: userId,
        _status: 1 // 借出状态
      }
    });

    if (currentBorrowCount >= user._max_num) {
      return res.status(400).json({
        success: false,
        errorCode: 'MAX_BORROW_LIMIT',
        message: '已达到最大借阅数量'
      });
    }

    // 检查是否已经借阅过同一本书且未归还
    const existingBorrow = await BorrowRecord.findAll({
      where: { 
        _bid: id,
        _uid: userId,
        _status: 0
      }
    });

    if (existingBorrow.length >=2) {
      return res.status(400).json({
        success: false,
        errorCode: 'ALREADY_BORROWED_TWICE',
        message: '同一本书籍只能连续借阅两次'
      });
    }

    // 计算应还日期（借阅30天）
    const beginDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // 创建借阅记录
    const borrowRecord = await BorrowRecord.create({
      _bid: id,
      _uid: userId,
      _begin_date: beginDate,
      _end_date: endDate,
      _status: 0 // 借出状态
    });

    // 更新图书库存和借阅次数
    await book.update({
      _num: book._num - 1,
      _times: book._times + 1
    });

    // 更新用户当前借阅数量
    await user.update({
      lend_num: currentBorrowCount + 1
    });

    res.json({
      success: true,
      message: '借书成功',
      data: {
        borrow_history: borrowRecord
      }
    });

  } catch (error) {
    console.error('借阅图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

// 归还图书
router.put('/:hid/return', authenticate, async (req, res) => {
  try {
    const { hid } = req.params;
    const userId = req.user._uid;
    
    // 查找借阅记录
    const borrowRecord = await BorrowRecord.findOne({
      where: { 
        _hid: hid,
        _uid: userId,
        _status: 0 // 借出状态
      },
      include: [{  // 关联查询图书信息
        model: Book,
        as: 'book'  // 根据你的实际关联别名调整
      }]
    });

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        errorCode: 'BORROW_RECORD_NOT_FOUND',
        message: '借阅记录不存在'
      });
    }
    const book = borrowRecord.book;
    // 更新借阅记录状态为已归还
    await borrowRecord.update({
      _status: 1 ,// 已归还状态
      _end_date: new Date() // 实际归还日期
    });

    // 更新图书库存
    await book.update({
      _num: book._num + 1
    });

    // 更新用户当前借阅数量
    const user = await User.findByPk(userId);
    
    
    await user.update({
      lend_num: Math.max(0, user.lend_num - 1)
    });

    res.json({
      success: true,
      message: '还书成功',
      data: {
        suc_return: borrowRecord
      }
    });

  } catch (error) {
    console.error('归还图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

// 续借图书
router.put('/:hid/renew', authenticate, async (req, res) => {
  try {
    const { hid } = req.params;
    const userId = req.user._uid;
    
    // 查找借阅记录
    const borrowRecord = await BorrowRecord.findOne({
      where: { 
        _hid: hid,
        _uid: userId,
        _status: 0 // 借出状态
      },
      include: [{  // 关联查询图书信息
        model: Book,
        as: 'book'  // 根据你的实际关联别名调整
      }]
    });

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        errorCode: 'BORROW_RECORD_NOT_FOUND',
        message: '借阅记录不存在或不可续借'
      });
    }


    // 计算新的应还日期（在原应还日期基础上续借30天）
    const newEndDate = new Date(borrowRecord._end_date);
    newEndDate.setDate(newEndDate.getDate() + 30);

    // 更新借阅记录
    await borrowRecord.update({
      _end_date: newEndDate
    });

    res.json({
      success: true,
      message: '续借成功',
      data: {
        res_delay: borrowRecord
      }
    });

  } catch (error) {
    console.error('续借图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});



module.exports = router;