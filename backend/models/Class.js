const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 班级数据模型
 * @typedef {Object} ClassAttributes
 * @property {number} _cid - 班级ID
 * @property {string} _cname - 班级名称
 * @property {number} _mid - 所属专业ID
 */
const Class = sequelize.define('Class', {
  _cid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_cid'
  },
  _cname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: '_cname'
  },
  _mid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_mid'
  }
}, {
  tableName: 't_class',
  timestamps: false
});

// 添加关联方法
Class.associate = function(models) {
  // 班级属于一个专业
  Class.belongsTo(models.Major, {
    foreignKey: '_mid',
    as: 'major'
  });

  // 班级有多个学生
  Class.hasMany(models.User, {
    foreignKey: '_cid',
    as: 'students'
  });
};

module.exports = Class;
