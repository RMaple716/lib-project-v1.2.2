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

// 添加关联方法
Department.associate = function(models) {
  // 院系有多个专业
  Department.hasMany(models.Major, {
    foreignKey: '_did',
    as: 'majors'
  });
};

module.exports = Department;
