const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 读者端消息数据模型
 * @typedef {Object} MessageAttributes
 * @property {number} _mid - 消息ID
 * @property {number} _sender_id - 发送者ID
 * @property {number} _receiver_id - 接收者ID
 * @property {string} _title - 消息标题
 * @property {string} _content - 消息内容
 * @property {number} _type - 消息类型 (1: 系统通知, 2: 借阅提醒, 3: 预约通知, 4: 其他)
 * @property {number} _status - 消息状态 (0: 未读, 1: 已读)
 * @property {Date} _create_time - 创建时间
 * @property {Date|null} _read_time - 阅读时间
 */

const Message = sequelize.define('Message', {
  _mid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_mid'
  },
  _sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_sender_id',
    comment: '发送者ID，通常为系统管理员或图书管理员'
  },
  _receiver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_receiver_id',
    comment: '接收者ID，通常为读者用户'
  },
  _title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: '_title',
    comment: '消息标题'
  },
  _content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: '_content',
    comment: '消息内容'
  },
  _type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: '_type',
    comment: '消息类型: 1-系统通知, 2-借阅提醒, 3-预约通知, 4-其他'
  },
  _status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: '_status',
    comment: '消息状态: 0-未读, 1-已读'
  },
  _create_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: '_create_time',
    defaultValue: DataTypes.NOW,
    comment: '消息创建时间'
  },
  _read_time: {
    type: DataTypes.DATE,
    allowNull: true,
    field: '_read_time',
    comment: '消息阅读时间'
  }
}, {
  tableName: 't_messages',
  timestamps: false
});

// 添加关联方法
Message.associate = function(models) {
  // 消息与发送者的关联
  Message.belongsTo(models.User, {
    foreignKey: '_sender_id',
    as: 'sender'
  });

  // 消息与接收者的关联
  Message.belongsTo(models.User, {
    foreignKey: '_receiver_id',
    as: 'receiver'
  });
};

/**
 * 标记消息为已读
 * @returns {Promise<Message>} 更新后的消息实例
 */
Message.prototype.markAsRead = async function() {
  this._status = 1;
  this._read_time = new Date();
  return await this.save();
};

/**
 * 检查消息是否已读
 * @returns {boolean} 消息是否已读
 */
Message.prototype.isRead = function() {
  return this._status === 1;
};

module.exports = Message;
