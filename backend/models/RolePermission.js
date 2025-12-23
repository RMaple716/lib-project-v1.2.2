const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 角色-权限关联模型
 * @typedef {Object} RolePermissionAttributes
 * @property {number} _rid - 角色ID
 * @property {number} _pid - 权限ID
 * @property {Date} _create_time - 创建时间
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

/**
 * 添加关联方法
 */
RolePermission.associate = function(models) {
  // 角色权限关联表与角色的关联
  RolePermission.belongsTo(models.Role, {
    foreignKey: '_rid',
    as: 'role'
  });

  // 角色权限关联表与权限的关联
  RolePermission.belongsTo(models.Permission, {
    foreignKey: '_pid',
    as: 'permission'
  });
};

module.exports = RolePermission;
