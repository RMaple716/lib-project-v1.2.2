const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 专业数据模型
 */
const Major = sequelize.define('Major', {
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
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'department_id'
  }
}, {
  tableName: 't_major',
  timestamps: false
});

module.exports = Major;
