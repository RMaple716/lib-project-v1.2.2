const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * 用户数据模型
 * @typedef {Object} UserAttributes
 * @property {number} _uid - 用户ID
 * @property {string} _utype - 用户类型
 * @property {string} _account - 账号
 * @property {string} _name - 姓名
 * @property {string} _password - 密码哈希
 * @property {string} _email - 邮箱
 * @property {number} _max_num - 最大借书数量
 * @property {number} lend_num - 当前借书数量
 * @property {number} _access - 访问权限
 * @property {Date} _create_time - 创建时间
 */

const User = sequelize.define('User', {
  _uid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_uid'
  },
  _utype: {
    type: DataTypes.ENUM('student', 'teacher', 'tempworker', 'admin_t', 'admin_n'),
    allowNull: false,
    field: '_utype'
  },
  _account: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: '_account'
  },
  _name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: '_name'
  },
  _password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: '_password'
  },
  _email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: '_email'
  },
  _max_num: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    field: '_max_num'
  },
  lend_num: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'lend_num'
  },
  _access: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: '_access'
  },
  _create_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: '_create_time',
    defaultValue: DataTypes.NOW
  },
  // 学生相关字段
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'class_id'
  },
  // 教师相关字段
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'department_id'
  },
  // 临时工相关字段
  work_department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'work_department_id'
  }
}, {
  tableName: 't_user',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user._password) {
        user._password = await bcrypt.hash(user._password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('_password')) {
        user._password = await bcrypt.hash(user._password, 12);
      }
    }
  }
});

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @returns {Promise<boolean>} 密码是否匹配
 */

// 实例方法：验证密码
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this._password);
};

// 添加关联方法
User.associate = function(models) {
  // 学生与班级的关联
  User.belongsTo(models.Class, {
    foreignKey: 'class_id',
    as: 'class'
  });

  // 教师与院系的关联
  User.belongsTo(models.Department, {
    foreignKey: 'department_id',
    as: 'department'
  });

  // 临时工与工作部门的关联
  User.belongsTo(models.WorkDepartment, {
    foreignKey: 'work_department_id',
    as: 'workDepartment'
  });
  User.hasMany(models.BorrowRecord, {
    foreignKey: '_uid',
    as: 'borrowRecords'
  });
};

module.exports = User;
