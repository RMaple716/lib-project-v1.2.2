const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  _uid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_uid'
  },
  _utype: {
    type: DataTypes.ENUM('student', 'teacher', 'admin_t', 'admin_b', 'admin_l'),
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
  }
  }, {
  tableName: 't_user',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user._password) {
        user._password = await bcrypt.hash(user._password, 12);
      }
    }
  }
});

// 实例方法：验证密码
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this._password);
};

// 添加关联方法
User.associate = function(models) {
  User.hasMany(models.BorrowRecord, {
    foreignKey: '_uid',
    as: 'borrowRecords'
  });
};

module.exports = User;