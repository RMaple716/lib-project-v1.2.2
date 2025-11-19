const { sequelize } = require('../config/database');
const User = require('./User');
const Book = require('./Book');

// 同步数据库表
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false, alter: false });
    console.log('数据库表同步成功 =>');
    
    // 创建默认管理员账户（如果不存在）
    await createDefaultAdmin();
  } catch (error) {
    console.error('数据库表同步失败 =< :', error);
  }
};

// 创建默认管理员
const createDefaultAdmin = async () => {
  try {
    const User = require('./User');
    const existingAdmin = await User.findOne({ 
      where: { _account: 'admin_b' } 
    });
    
    if (!existingAdmin) {
      await User.create({
        _utype: 'admin_b',
        _account: 'admin_b',
        _name: '图书管理员',
        _password: 'admin123',
        _email: 'admin@library.com',
        _max_num: 100,
        lend_num: 0
      });
      console.log(' 默认管理员账户创建成功 (账号: admin_b, 密码: admin123)');
    }
  } catch (error) {
    console.error(' 创建默认管理员失败:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Book,
  syncDatabase
};