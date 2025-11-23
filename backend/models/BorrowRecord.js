const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BorrowRecord = sequelize.define('BorrowRecord', {
  _hid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_hid'
  },
  _bid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_bid'
  },
  _uid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_uid'
  },
  _begin_time: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: '_begin_time',
    defaultValue: DataTypes.NOW
  },
  _end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: '_end_date'
  },
  _status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_status'
  }
}, {
  tableName: 't_history',
  timestamps: false
});

// 添加关联方法
BorrowRecord.associate = function(models) {
  BorrowRecord.belongsTo(models.Book, {
    foreignKey: '_bid',
    as: 'book'
  });
  BorrowRecord.belongsTo(models.User, {
    foreignKey: '_uid',
    as: 'user'
  });
};

module.exports = BorrowRecord;