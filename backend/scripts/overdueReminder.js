// 确保所有模型关联已正确建立
const models = require('../models');
const { BorrowRecord, User, Book, Message, Mtype, BookOrder } = models;
const { syncDatabase } = models;
const { Op } = require('sequelize');
const winston = require('winston');
require('dotenv').config();

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * 图书借阅逾期提醒服务
 * 该服务每天检查逾期未还的图书，并向用户发送提醒消息
 */

/**
 * 获取逾期未还的借阅记录
 * @returns {Promise<Array>} 逾期借阅记录列表
 */
async function getOverdueRecords() {
  const today = new Date();
  return await BorrowRecord.findAll({
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
    ]
  });
}

/**
 * 获取或创建逾期提醒消息类型
 * @returns {Promise<Mtype>} 逾期提醒消息类型
 */
async function getOrCreateOverdueMessageType() {
  let mtype = await Mtype.getMtypeByName('逾期提醒');
  
  if (!mtype) {
    mtype = await Mtype.create({
      _mtname: '逾期提醒',
      _mtcomment: '图书借阅逾期提醒消息'
    });
  }
  
  return mtype;
}

/**
 * 发送逾期提醒消息
 * @param {Object} record - 逾期借阅记录
 * @param {Mtype} mtype - 消息类型
 * @returns {Promise<Message>} 创建的消息
 */
async function sendOverdueReminder(record, mtype) {
  const overdueDays = Math.floor((new Date() - new Date(record._end_date)) / (1000 * 60 * 60 * 24));
  const title = '图书借阅逾期提醒';
  const content = `您借阅的图书《${record.book._book_name}》已于${record._end_date}到期，现已逾期${overdueDays}天，请尽快归还。如有疑问，请联系图书馆管理员。`;

  return await Message.create({
    _sender_id: 1, // 假设1是系统管理员ID
    _receiver_id: record.user._uid,
    _title: title,
    _content: content,
    _mtid: mtype._mtid,
    _status: 0 // 未读
  });
}

/**
 * 检查并发送所有逾期提醒
 */
async function checkAndSendOverdueReminders() {
  try {
    logger.info('开始执行逾期提醒检查任务');
    
    // 获取逾期记录
    const overdueRecords = await getOverdueRecords();
    
    if (overdueRecords.length === 0) {
      logger.info('没有发现逾期记录');
      return;
    }
    
    // 获取或创建逾期提醒消息类型
    const overdueMessageType = await getOrCreateOverdueMessageType();
    
    // 为每条逾期记录发送提醒
    let reminderCount = 0;
    for (const record of overdueRecords) {
      try {
        // 检查是否已经发送过提醒（避免重复发送）
        const existingReminder = await Message.findOne({
          where: {
            _receiver_id: record.user._uid,
            _mtid: overdueMessageType._mtid,
            _content: {
              [Op.like]: `%《${record.book._book_name}》%`
            }
          }
        });
        
        if (!existingReminder) {
          await sendOverdueReminder(record, overdueMessageType);
          reminderCount++;
          logger.info(`已向用户 ${record.user._name} 发送逾期提醒，图书：《${record.book._book_name}》`);
        }
      } catch (error) {
        logger.error(`发送逾期提醒失败: ${error.message}`);
      }
    }
    
    logger.info(`逾期提醒检查任务完成，共发送 ${reminderCount} 条提醒`);
  } catch (error) {
    logger.error(`执行逾期提醒检查任务失败: ${error.message}`);
  }
}


/**
 * 获取或创建预约过期消息类型
 * @returns {Promise<Mtype>} 预约过期消息类型
 */
async function getOrCreateExpiredOrderMessageType() {
  let mtype = await Mtype.getMtypeByName('预约过期提醒');

  if (!mtype) {
    mtype = await Mtype.create({
      _mtname: '预约过期提醒',
      _mtcomment: '图书预约过期提醒消息'
    });
  }

  return mtype;
}

/**
 * 发送预约过期提醒消息
 * @param {Object} order - 过期预约记录
 * @param {Mtype} mtype - 消息类型
 * @returns {Promise<Message>} 创建的消息
 */
async function sendExpiredOrderReminder(order, mtype) {
  const title = '图书预约过期提醒';
  const content = `您预约的图书《${order.book._book_name}》已超过预约有效期，预约已自动取消。如仍需借阅此书，请重新预约。`;

  return await Message.create({
    _sender_id: 1, // 假设1是系统管理员ID
    _receiver_id: order.user._uid,
    _title: title,
    _content: content,
    _mtid: mtype._mtid,
    _status: 0 // 未读
  });
}

/**
 * 检查并更新过期预约
 */
async function checkAndUpdateExpiredOrders() {
  try {
    logger.info('开始执行预约过期检查任务');
    
    // 确保模型关联已建立
    await syncDatabase();

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
      ]
    });

    if (expiredOrders.length === 0) {
      logger.info('没有发现过期预约');
      return 0;
    }

    expiredOrderMessageType = await getOrCreateExpiredOrderMessageType();

    // 更新这些预约的状态为expired并发送通知
    let processedCount = 0;
    for (const order of expiredOrders) {
      try {
        // 更新预约状态
        await order.update({
          _ostatus: 'expired'
        });

        // 发送过期提醒
        await sendExpiredOrderReminder(order, expiredOrderMessageType);
        
        processedCount++;
        logger.info(`已处理过期预约，用户：${order.user._name}，图书：《${order.book._book_name}》`);
        
        // 更新预约队列，将下一个等待中的预约更新为ready状态
        await updateOrderQueue(order._bid);
      } catch (error) {
        logger.error(`处理过期预约失败: ${error.message}`);
      }
    }

    logger.info(`预约过期检查任务完成，共处理 ${processedCount} 个过期预约`);
    return processedCount;
  } catch (error) {
    logger.error(`执行预约过期检查任务失败: ${error.message}`);
    throw error;
  }
}

/**
 * 更新预约队列状态
 * @param {number} bookId - 图书ID
 */
async function updateOrderQueue(bookId) {
  try {
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
        
        logger.info(`已将用户 ${order._uid} 的预约更新为ready状态，图书ID: ${bookId}`);
      }
    }
  } catch (error) {
    logger.error(`更新预约队列失败: ${error.message}`);
  }
}


/**
 * 设置定时任务，每天早上8点执行逾期提醒检查
 */
function setupOverdueReminderSchedule() {
  // 使用node-cron库设置定时任务
  // 注意：需要先安装node-cron依赖：npm install node-cron
  const cron = require('node-cron');
  
  // 每天早上8点执行一次
  cron.schedule('0 8 * * *', async () => {
    await checkAndSendOverdueReminders();
  });
  
  // 每天凌晨2点执行一次预约过期检查
  cron.schedule('0 2 * * *', async () => {
    await checkAndUpdateExpiredOrders();
  });
  logger.info('逾期提醒定时任务已设置，每天凌晨2点执行预约过期检查');
}

// 导出函数
module.exports = {
  getOverdueRecords,
  getOrCreateOverdueMessageType,
  sendOverdueReminder,
  checkAndSendOverdueReminders,
  getOrCreateExpiredOrderMessageType,
  sendExpiredOrderReminder,
  checkAndUpdateExpiredOrders,
  updateOrderQueue,
  setupOverdueReminderSchedule
};

// 如果直接运行此脚本，则执行一次检查
if (require.main === module) {
  Promise.all([
    checkAndSendOverdueReminders(), 
    checkAndUpdateExpiredOrders()
  ])
    .then(() => {
      console.log('所有检查任务完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('执行检查任务失败:', error);
      process.exit(1);
    });
}
