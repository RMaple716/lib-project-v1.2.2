const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  _tid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_tid'
  },
  _type_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: '_type_name'
  }
}, {
  tableName: 't_type',
  timestamps: false
});

// 添加关联方法
Category.associate = function(models) {
  Category.hasMany(models.Book, {
    foreignKey: '_tid',
    as: 'books'
  });
};

module.exports = Category;