const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 专业数据模型
 * @typedef {Object} MajorAttributes
 * @property {number} _mid - 专业ID
 * @property {string} _mname - 专业名称
 * @property {number} _did - 所属院系ID
 */
const Major = sequelize.define('Major', {
  _mid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_mid'
  },
  _mname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: '_mname'
  },
  _did: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_did'
  }
}, {
  tableName: 't_major',
  timestamps: false
});

module.exports = Major;
