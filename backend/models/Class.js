const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 班级数据模型
 */
const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'name'
  },
  major_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'major_id'
  }
}, {
  tableName: 't_class',
  timestamps: false
});

module.exports = Class;
