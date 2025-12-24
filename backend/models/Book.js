const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 图书数据模型
 * @typedef {Object} BookAttributes
 * @property {number} _bid - 图书ID
 * @property {string} _book_name - 图书名称
 * @property {string} _isbn - ISBN号
 * @property {number} _num - 库存数量
 * @property {string} _author - 作者
 * @property {string} _press - 出版社
 * @property {string} _cover_url - 封面图片URL
 * @property {number} _tid - 分类ID
 * @property {number} _times - 借阅次数
 * @property {Date} _create_time - 创建时间
 */

/**
 * 图书模型定义
 * @class Book
 * @extends Model
 */

const Book = sequelize.define('Book', {
  _bid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_bid'
  },
  _book_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: '_book_name'
  },
  _isbn: {
    type: DataTypes.STRING(20),
    allowNull: false, 
    field: '_isbn'
  },
  _total_copies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_total_copies'
  },
  _available_copies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_available_copies'
  },
  _author: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: '_author'
  },
  _press: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: '_press'
  },
  _cover_url: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: '_cover_url'
  },
  _tid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_tid'
  },
  _times: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: '_times'
  },
  _create_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: '_create_time',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 't_book',
  timestamps: false
});

/**
 * 模型关联方法
 * @param {Object} models - 所有模型对象
 */

// 添加关联方法
Book.associate = function(models) {
   /**
   * 图书属于一个分类
   */
  Book.belongsTo(models.Category, {
    foreignKey: '_tid',
    as: 'category'
  });
  /**
   * 一本书可以有多个借阅记录
   */
  Book.hasMany(models.BorrowRecord, {
    foreignKey: '_bid',
    as: 'bookBorrowRecords'
  });
};

module.exports = Book;