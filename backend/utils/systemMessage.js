const { Message, User } = require('../models');

/**
 * 发送系统消息给指定用户
 * @param {number} receiverId - 接收者用户ID
 * @param {string} title - 消息标题
 * @param {string} content - 消息内容
 * @param {number} senderId - 可选，发送者ID，默认为系统管理员ID(1)
 * @returns {Promise<object>} 包含成功状态和消息信息的对象
 */
const sendSystemMessage = async (receiverId, title, content, senderId = 1) => {
  try {
    // 验证接收者是否存在
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return {
        success: false,
        message: '接收者不存在',
        errorCode: 'RECEIVER_NOT_FOUND'
      };
    }

    // 创建系统消息
    const newMessage = await Message.create({
      _sender_id: senderId,
      _receiver_id: receiverId,
      _title: title,
      _content: content,
      _mtid: 1, // 1表示系统消息类型
      _status: 0, // 默认为未读
      _create_time: new Date()
    });

    return {
      success: true,
      message: '系统消息发送成功',
      data: newMessage
    };
  } catch (error) {
    console.error('发送系统消息失败:', error);
    return {
      success: false,
      message: '系统消息发送失败',
      error: error.message
    };
  }
};

/**
 * 批量发送系统消息给多个用户
 * @param {Array<number>} receiverIds - 接收者用户ID数组
 * @param {string} title - 消息标题
 * @param {string} content - 消息内容
 * @param {number} senderId - 可选，发送者ID，默认为系统管理员ID(1)
 * @returns {Promise<object>} 包含成功状态和发送结果的对象
 */
const sendSystemMessageToMany = async (receiverIds, title, content, senderId = 1) => {
  try {
    const results = [];
    let successCount = 0;
    let failCount = 0;

    // 验证所有接收者是否存在
    const receivers = await User.findAll({
      where: { _uid: { [require('sequelize').Op.in]: receiverIds } }
    });
    
    const validReceiverIds = receivers.map(r => r._uid);
    const invalidReceiverIds = receiverIds.filter(id => !validReceiverIds.includes(id));
    
    if (invalidReceiverIds.length > 0) {
      console.warn(`以下接收者ID不存在: ${invalidReceiverIds.join(', ')}`);
    }

    // 只给存在的接收者发送消息
    for (const receiverId of validReceiverIds) {
      const result = await sendSystemMessage(receiverId, title, content, senderId);
      results.push({
        receiverId,
        ...result
      });
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    return {
      success: failCount === 0,
      message: `批量发送完成，成功: ${successCount}, 失败: ${failCount}`,
      data: {
        total: validReceiverIds.length,
        success: successCount,
        failed: failCount,
        results
      }
    };
  } catch (error) {
    console.error('批量发送系统消息失败:', error);
    return {
      success: false,
      message: '批量发送系统消息失败',
      error: error.message
    };
  }
};

module.exports = {
  sendSystemMessage,
  sendSystemMessageToMany
};
