const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 角色-权限关联模型
 * @typedef {Object} RolePermissionAttributes
 * @property {number} role_id - 角色ID
 * @property {number} permission_id - 权限ID
 * @property {Date} created_at - 创建时间
 */

const RolePermission = sequelize.define('RolePermission', {
  _rid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    field: '_rid',
    references: {
      model: 't_role',
      key: '_rid'
    }
  },
  _pid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    field: '_pid',
    references: {
      model: 't_permission',
      key: '_pid'
    }
  },
  _create_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: '_create_time',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 't_role_permission',
  timestamps: true,
  createdAt: '_create_time',
  updatedAt: false
});

module.exports = RolePermission;
