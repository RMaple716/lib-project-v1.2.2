const { Op } = require('sequelize');
const BookOrder = require('../models/BookOrder');
const Book = require('../models/Book');
const BorrowRecord = require('../models/BorrowRecord');
const User = require('../models/User');
const sequelize = require('../config/database');

class BookOrderService {
  /**
   * 用户预约图书
   * @param {number} bookId - 图书ID
   * @param {number} userId - 用户ID
   * @returns {Promise<BookOrder>} 预约记录
   */
  static async orderBook(bookId, userId) {
    // 检查图书是否存在
    const book = await Book.findByPk(bookId);
    if (!book) {
      throw new Error('图书不存在');
    }
    
    // 检查图书是否可预约
    if (book._num > 0) {
      throw new Error('图书当前可借，无需预约');
    }
    
    // 检查用户是否已经预约过该书
    const existingOrder = await BookOrder.findOne({
      where: {
        _bid: bookId,
        _uid: userId,
        _ostatus: {
          [Op.in]: ['pending', 'ready']
        }
      }
    });
    
    if (existingOrder) {
      throw new Error('您已经预约过此书，请勿重复预约');
    }
    
    // 检查用户是否有超期未还的图书
    const overdueRecords = await BorrowRecord.findAll({
      where: {
        _uid: userId,
        _status: 0, // 借出状态
        _end_date: {
          [Op.lt]: new Date()
        }
      }
    });
    
    if (overdueRecords.length > 0) {
      throw new Error('您有图书超期未还，请先归还后再进行预约');
    }
    
    // 创建预约记录
    const order = await BookOrder.create({
      _bid: bookId,
      _uid: userId,
      _otime: new Date(),
      _ostatus: 'pending'
    });
    
    // 查询预约队列，看是否需要更新状态
    await this.updateOrderQueue(bookId);
    
    return order;
  }
  
  /**
   * 更新预约队列状态
   * @param {number} bookId - 图书ID
   */
  static async updateOrderQueue(bookId) {
    // 获取图书信息
    const book = await Book.findByPk(bookId);
    if (!book) return;
    
    // 如果图书可借数量大于0，更新第一个等待中预约的状态为ready
    if (book._num > 0) {
      const order = await BookOrder.findOne({
        where: {
          _bid: bookId,
          _ostatus: 'pending'
        },
        order: [
          ['_otime', 'ASC'] // 按预约时间升序排列，先预约的先获得资格
        ]
      });
      
      if (order) {
        await order.update({
          _ostatus: 'ready'
        });
        
        // 这里可以添加通知功能，但由于现有系统没有通知服务，暂时省略
        // 可以考虑使用现有的Message模型发送通知
      }
    }
  }
  
  /**
   * 取消预约
   * @param {number} orderId - 预约ID
   * @param {number} userId - 用户ID
   * @param {string} reason - 取消原因
   * @returns {Promise<BookOrder>} 更新后的预约记录
   */
  static async cancelOrder(orderId, userId, reason) {
    const order = await BookOrder.findByPk(orderId);
    
    if (!order) {
      throw new Error('预约记录不存在');
    }
    
    if (order._uid !== userId) {
      throw new Error('无权操作此预约记录');
    }
    
    if (order._ostatus === 'cancelled' || order._ostatus === 'completed') {
      throw new Error('该预约已无法取消');
    }
    
    await order.update({
      _ostatus: 'cancelled'
    });
    
    // 更新预约队列
    await this.updateOrderQueue(order._bid);
    
    return order;
  }
  
  /**
   * 将预约转换为借阅记录
   * @param {number} orderId - 预约ID
   * @param {number} userId - 操作用户ID
   * @returns {Promise<BorrowRecord>} 创建的借阅记录
   */
  static async convertToBorrow(orderId, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const order = await BookOrder.findByPk(orderId, { transaction });
      
      if (!order) {
        throw new Error('预约记录不存在');
      }
      
      if (order._uid !== userId) {
        throw new Error('无权操作此预约记录');
      }
      
      if (order._ostatus !== 'ready') {
        throw new Error('该预约状态不满足借阅条件');
      }
      
      // 获取图书信息
      const book = await Book.findByPk(order._bid, { transaction });
      
      if (!book || book._num <= 0) {
        throw new Error('图书当前不可借');
      }
      
      // 获取用户信息
      const user = await User.findByPk(userId, { transaction });
      
      // 检查用户是否已达到最大借阅数量
      const currentBorrowCount = await BorrowRecord.count({
        where: {
          _uid: userId,
          _status: 0 // 借出状态
        }
      });
      
      if (currentBorrowCount >= user._max_num) {
        throw new Error('已达到最大借阅数量');
      }
      
      // 检查是否已经借阅过同一本书且未归还
      const existingBorrow = await BorrowRecord.findAll({
        where: {
          _bid: order._bid,
          _uid: userId,
          _status: 0
        }
      });
      
      if (existingBorrow.length >= 2) {
        throw new Error('同一本书籍只能连续借阅两次');
      }
      
      // 计算应还日期（借阅30天）
      const beginDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      // 创建借阅记录
      const borrowRecord = await BorrowRecord.create({
        _bid: order._bid,
        _uid: order._uid,
        _begin_time: beginDate,
        _end_date: endDate,
        _status: 0 // 借出状态
      }, { transaction });
      
      // 更新图书借阅次数
      await book.update({
        _times: book._times + 1
      }, { transaction });
      
      // 更新用户当前借阅数量
      await user.update({
        lend_num: currentBorrowCount + 1
      }, { transaction });
      
      // 更新预约状态
      await order.update({
        _ostatus: 'completed'
      }, { transaction });
      
      // 更新预约队列
      await this.updateOrderQueue(order._bid);
      
      await transaction.commit();
      
      return borrowRecord;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  /**
   * 获取用户的预约列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<BookOrder>>} 预约列表
   */
  static async getUserOrders(userId, options = {}) {
    const { status, page = 1, limit = 10 } = options;
    
    const whereCondition = { _uid: userId };
    
    if (status) {
      whereCondition._ostatus = status;
    }
    
    const orders = await BookOrder.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['_bid', '_book_name', '_author', '_isbn', '_cover_url']
        }
      ],
      order: [['_otime', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    return orders;
  }
  
  /**
   * 获取图书的预约队列
   * @param {number} bookId - 图书ID
   * @returns {Promise<Array<BookOrder>>} 预约队列
   */
  static async getBookOrderQueue(bookId) {
    const orders = await BookOrder.findAll({
      where: {
        _bid: bookId,
        _ostatus: {
          [Op.in]: ['pending', 'ready']
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['_uid', '_account', '_name']
        }
      ],
      order: [
        ['_ostatus', 'ASC'], // pending在前，ready在后
        ['_otime', 'ASC'] // 预约时间早的在前
      ]
    });
    
    return orders;
  }
  
  /**
   * 检查并更新过期预约
   * 定时任务调用，检查所有过期但未更新的预约
   */
  static async checkAndUpdateExpiredOrders() {
    // 假设ready状态的预约在7天后过期
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() - 7);
    
    // 查找所有ready状态且超过7天的预约
    const expiredOrders = await BookOrder.findAll({
      where: {
        _ostatus: 'ready',
        _otime: {
          [Op.lt]: expireDate
        }
      }
    });
    
    // 更新这些预约的状态为expired
    for (const order of expiredOrders) {
      await order.update({
        _ostatus: 'expired'
      });
      
      // 更新预约队列
      await this.updateOrderQueue(order._bid);
    }
    
    return expiredOrders.length;
  }
}

module.exports = BookOrderService;
