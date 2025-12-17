const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 工作部门数据模型（用于临时工）
 * @typedef {Object} WorkDepartmentAttributes
 * @property {number} _wdid - 工作部门ID
 * @property {string} _wdname - 工作部门名称
 */
const WorkDepartment = sequelize.define('WorkDepartment', {
  _wdid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_wdid'
  },
  _wdname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: '_wdname'
  }
}, {
  tableName: 't_work_department',
  timestamps: false
});

module.exports = WorkDepartment;
