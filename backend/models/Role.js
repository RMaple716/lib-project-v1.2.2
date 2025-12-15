const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 角色数据模型
 * @typedef {Object} RoleAttributes
 * @property {number} id - 角色ID
 * @property {string} name - 角色名称
 * @property {string} code - 角色代码
 * @property {string} description - 角色描述
 * @property {Date} created_at - 创建时间
 * @property {Date} updated_at - 更新时间
 */

const Role = sequelize.define('Role', {
  _rid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_rid'
  },
  _rname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: '_rname',
    comment: '角色名称'
  },
  _rcode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: '_rcode',
    comment: '角色代码'
  },
  _rdesc: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: '_rdesc',
    comment: '角色描述'
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
  tableName: 't_role',
  timestamps: true,
  createdAt: '_create_time',
  updatedAt: '_update_time',
  indexes: [
    {
      unique: true,
      fields: ['_rcode']
    }
  ]
});

/**
 * 添加关联方法
 */
Role.associate = function(models) {
  // 角色与权限的关联
  Role.belongsToMany(models.Permission, {
    through: models.RolePermission,
    foreignKey: '_rid',
    otherKey: '_pid',
    as: 'permissions'
  });
  
  // 角色与用户的关联
  Role.belongsToMany(models.User, {
    through: models.UserRole,
    foreignKey: '_rid',
    otherKey: '_uid',
    as: 'users'
  });
};

module.exports = Role;
