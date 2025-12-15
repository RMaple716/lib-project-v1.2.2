const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 权限数据模型
 * @typedef {Object} PermissionAttributes
 * @property {number} id - 权限ID
 * @property {string} name - 权限名称
 * @property {string} code - 权限代码
 * @property {string} description - 权限描述
 * @property {string} module - 所属模块
 * @property {Date} created_at - 创建时间
 * @property {Date} updated_at - 更新时间
 */

const Permission = sequelize.define('Permission', {
  _pid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_pid'
  },
  _pname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: '_pname',
    comment: '权限名称'
  },
  _pcode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: '_pcode',
    comment: '权限代码'
  },
  _pdesc: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: '_pdesc',
    comment: '权限描述'
  },
  _pmodule: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: '_pmodule',
    comment: '所属模块'
  },
  _create_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: '_create_time',
    defaultValue: DataTypes.NOW
  },
  _update_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: '_update_time',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 't_permission',
  timestamps: true,
  createdAt: '_create_time',
  updatedAt: '_update_time',
  indexes: [
    {
      unique: true,
      fields: ['_pcode']
    }
  ]
});

/**
 * 添加关联方法
 */
Permission.associate = function(models) {
  // 权限与角色的关联
  Permission.belongsToMany(models.Role, {
    through: models.RolePermission,
    foreignKey: '_pid',
    otherKey: '_rid',
    as: 'roles'
  });
};

module.exports = Permission;
