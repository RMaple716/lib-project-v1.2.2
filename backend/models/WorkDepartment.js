const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 工作部门数据模型（用于临时工）
 */
const WorkDepartment = sequelize.define('WorkDepartment', {
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
  tableName: 't_work_department',
  timestamps: false
});

module.exports = WorkDepartment;
