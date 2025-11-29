const { sequelize } = require('../config/database');
const User = require('./User');
const Book = require('./Book');
// 添加新增的模型
const Category = require('./Category');
const BorrowRecord = require('./BorrowRecord');
const Announcement = require('./Announcement');

// 定义模型关联
const defineAssociations = () => {
  try {
    // Book 关联
    Book.belongsTo(Category, {
      foreignKey: '_tid',
      as: 'category'
    });
    
    Book.hasMany(BorrowRecord, {
      foreignKey: '_bid',
      as: 'borrowRecords'
    });

    // Category 关联
    Category.hasMany(Book, {
      foreignKey: '_tid',
      as: 'books'
    });

    // BorrowRecord 关联
    BorrowRecord.belongsTo(Book, {
      foreignKey: '_bid',
      as: 'book'
    });
    
    BorrowRecord.belongsTo(User, {
      foreignKey: '_uid',
      as: 'user'
    });

    // User 关联
    User.hasMany(BorrowRecord, {
      foreignKey: '_uid',
      as: 'borrowRecords'
    });

    console.log('模型关联定义成功');
  } catch (error) {
    console.error('模型关联定义失败:', error);
  }
};

// 同步数据库表
const syncDatabase = async () => {
  try {
    // 先定义模型关联
    defineAssociations();
    
    // 然后同步数据库
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
    const existingAdmin = await User.findOne({ 
      where: { _account: 'admin_t' } 
    });
    
    if (!existingAdmin) {
      await User.create({
        _utype: 'admin_t',
        _account: 'admin_t',
        _name: '终端管理员',
        _password: 'admin123',
        _email: 'admin@library.com',
        _max_num: 100,
        lend_num: 0,
        access: 1,
        _create_time: new Date()
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
  Category,
  BorrowRecord,
  Announcement,
  syncDatabase
};