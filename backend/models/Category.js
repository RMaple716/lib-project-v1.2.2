const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 分类数据模型
 * @typedef {Object} CategoryAttributes
 * @property {number} _tid - 分类ID
 * @property {string} _type_name - 分类名称
 */

/**
 * 分类模型定义
 * @class Category
 * @extends Model
 */
const Category = sequelize.define('Category', {
  _tid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_tid'
  },
  _type_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: '_type_name'
  }
}, {
  tableName: 't_type',
  timestamps: false
});
/**
 * 模型关联方法
 * @param {Object} models - 所有模型对象
 */
// 添加关联方法
Category.associate = function(models) {
   /**
   * 一个分类可以有多本书
   */
  Category.hasMany(models.Book, {
    foreignKey: '_tid',
    as: 'books'
  });
};

module.exports = Category;