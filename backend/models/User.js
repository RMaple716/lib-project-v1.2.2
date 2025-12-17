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
 * @property {number} [_cid] - 班级ID（学生使用）
 * @property {number} [_did] - 院系ID（教师使用）
 * @property {number} [_wdid] - 工作部门ID（临时工使用）
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
  _cid: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: '_cid'
  },
  // 教师相关字段
  _did: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: '_did'
  },
  // 临时工相关字段
  _wdid: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: '_wdid'
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
    },

    afterCreate: async(user) => {
  // 只对非管理员用户分配角色
  if (!user._utype.includes('admin')) {
    const Role = require('./Role');
    const UserRole = require('./UserRole');
    
    try {
      // 查找读者角色
      const role = await Role.findOne({ 
        where: { _rcode: 'reader' }
      });

      // 如果是新创建的角色，为其分配预设权限
     if (role) {
        await UserRole.findOrCreate({
          where: {
            _uid: user._uid,
            _rid: role._rid
          }
        });
        console.log(`已为用户 ${user._uid} 分配读者角色`);
      } else {
        console.warn('未找到读者角色，请确保系统已初始化');
      }
    } catch (error) {
      console.error('分配角色时出错:', error);
    }
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
    foreignKey: '_cid',
    as: 'class'
  });

  // 教师与院系的关联
  User.belongsTo(models.Department, {
    foreignKey: '_did',
    as: 'department'
  });

  // 临时工与工作部门的关联
  User.belongsTo(models.WorkDepartment, {
    foreignKey: '_wdid',
    as: 'workDepartment'
  });
  
  // 用户与借阅记录的关联
  User.hasMany(models.BorrowRecord, {
    foreignKey: '_uid',
    as: 'borrowRecords'
  });
  
  // 用户与角色的关联（RBAC权限系统）
  User.belongsToMany(models.Role, {
    through: models.UserRole,
    foreignKey: '_uid',
    otherKey: '_rid',
    as: 'roles'
  });
};

module.exports = User;
