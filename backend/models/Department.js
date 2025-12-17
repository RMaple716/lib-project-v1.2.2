const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 院系数据模型
 * @typedef {Object} DepartmentAttributes
 * @property {number} _did - 院系ID
 * @property {string} _dname - 院系名称
 */
const Department = sequelize.define('Department', {
  _did: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_did'
  },
  _dname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: '_dname'
  }
}, {
  tableName: 't_department',
  timestamps: false
});

module.exports = Department;
