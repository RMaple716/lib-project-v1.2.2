const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define('Announcement', {
  _aid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: '_aid'
  },
  _title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: '_title'
  },
  _content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: '_content'
  },
  _publisher: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: '_publisher'
  },
  _date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: '_adate'
  }
}, {
  tableName: 't_announcements',
  timestamps: false
});

module.exports = Announcement;