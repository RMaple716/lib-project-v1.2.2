const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Book = sequelize.define('Book', {
  _bid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_bid'
  },
  _book_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: '_book_name'
  },
  _isbn: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: '_isbn'
  },
  _num: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_num'
  },
  _author: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: '_author'
  },
  _press: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: '_press'
  },
  _cover_url: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: '_cover_url'
  },
  _tid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: '_tid'
  },
  _times: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: '_times'
  }
}, {
  tableName: 't_book',
  timestamps: false
});

// 添加关联方法
Book.associate = function(models) {
  Book.belongsTo(models.Category, {
    foreignKey: '_tid',
    as: 'category'
  });
  Book.hasMany(models.BorrowRecord, {
    foreignKey: '_bid',
    as: 'borrowRecords'
  });
};

module.exports = Book;