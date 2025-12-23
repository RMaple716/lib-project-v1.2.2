const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/database');

/**
 * 预约图书数据模型
 * @typedef {Object} BookAttributes
 * @property {number} _oid - 预约ID
 * @property {string} _bid - 图书ID
 * @property {Date} _otime - 预约时间
 * @property {number} _uid - 预约用户ID
 * @property {string} _ostatus - 预约状态
 */
/**
 * 图书预约模型定义
 * @class BookOrder
 * @extends Model
 */

const BookOrder = sequelize.define('BookOrder', {
  _oid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_oid'
  },
  _bid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_bid'
  },
  _otime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  _uid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_uid'
  },
  _ostatus: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: '_ostatus'
  }
}, {
  tableName: 't_order',
  timestamps: false
});

/**
 * 模型关联方法
 * @param {Object} models - 其他数据模型
 */
BookOrder.associate = function (models) {
    /**
     * 预约记录属于一个用户
     */
    BookOrder.belongsTo(models.User, {
      foreignKey: '_uid',
      as: 'user'
    });
    /**
     * 预约记录属于一本书
     */
    BookOrder.belongsTo(models.Book, {
      foreignKey: '_bid',
      as: 'book'
    });
    /**
     * 借阅记录可能转化为借阅记录
     */
    BookOrder.hasOne(models.BorrowRecord, {
      foreignKey: '_bid',
      as: 'relatedBorrowRecord'
    });
};

module.exports = BookOrder;