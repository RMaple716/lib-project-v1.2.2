const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 院系数据模型
 */
const Department = sequelize.define('Department', {
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
  }
}, {
  tableName: 't_department',
  timestamps: false
});

module.exports = Department;
