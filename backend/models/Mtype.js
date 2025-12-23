
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 消息类型数据模型
 * @typedef {Object} MtypeAttributes
 * @property {number} _mtid - 消息类型ID
 * @property {string} _mtname - 消息类型名称
 * @property {string} _mtcomment - 消息类型描述
 */

const Mtype = sequelize.define('Mtype', {
  _mtid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_mtid',
    comment: '消息类型ID，主键'
  },
  _mtname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: '_mtname',
    comment: '消息类型名称，唯一'
  },
  _mtcomment: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: '_mtcomment',
    comment: '消息类型描述'
  }
}, {
  tableName: 't_mtypes',
  timestamps: false,
  indexes: [
    {
      unique: true,
      name: 'mtname_unique_index',
      fields: ['_mtname']
    }
  ]
});

// 添加关联方法
Mtype.associate = function(models) {
  // 消息类型与消息的关联
  Mtype.hasMany(models.Message, {
    foreignKey: '_mtid',
    as: 'messages',
    constraints: true,
    onDelete: 'RESTRICT'
  });
};


/**
 * 获取所有消息类型
 * @returns {Promise<Array<Mtype>>} 消息类型数组
 */
Mtype.getAllMtypes = async function() {
  return await this.findAll();
};

/**
 * 根据ID获取消息类型
 * @param {number} id - 消息类型ID
 * @returns {Promise<Mtype|null>} 消息类型实例或null
 */
Mtype.getMtypeById = async function(id) {
  return await this.findByPk(id);
};

/**
 * 根据名称获取消息类型
 * @param {string} name - 消息类型名称
 * @returns {Promise<Mtype|null>} 消息类型实例或null
 */
Mtype.getMtypeByName = async function(name) {
  return await this.findOne({
    where: { _mtname: name }
  });
};

module.exports = Mtype;
