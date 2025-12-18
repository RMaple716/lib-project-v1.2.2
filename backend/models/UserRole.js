const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 用户-角色关联模型
 * @typedef {Object} UserRoleAttributes
 * @property {number} _uid - 用户ID
 * @property {number} _rid - 角色ID
 * @property {Date} _create_time - 创建时间
 */

const UserRole = sequelize.define('UserRole', {
  _uid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    field: '_uid',
    references: {
      model: 't_user',
      key: '_uid'
    }
  },
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
  _create_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: '_create_time',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 't_user_role',
  timestamps: true,
  createdAt: '_create_time',
  updatedAt: false
});

module.exports = UserRole;
