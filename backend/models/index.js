const { sequelize } = require('../config/database');
const User = require('./User');
const Book = require('./Book');
// 添加新增的模型
const Category = require('./Category');
const BorrowRecord = require('./BorrowRecord');
const Announcement = require('./Announcement');
const Message = require('./Message');
// 添加消息类型模型
const Mtype = require('./Mtype');
// 添加院系、专业、班级和工作部门模型
const Department = require('./Department');
const Major = require('./Major');
const Class = require('./Class');
const WorkDepartment = require('./WorkDepartment');
// 添加RBAC模型
const Permission = require('./Permission');
const Role = require('./Role');
const RolePermission = require('./RolePermission');
const UserRole = require('./UserRole');

//添加图书预约模型
const BookOrder = require('./BookOrder');

// 定义模型关联
const defineAssociations = () => {
  try {
    // 确保所有模型的associate方法都被调用
    if (typeof Book.associate === 'function') Book.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission, UserRole });
    if (typeof Category.associate === 'function') Category.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission, UserRole });
    if (typeof Department.associate === 'function') Department.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission, UserRole });
    if (typeof BorrowRecord.associate === 'function') BorrowRecord.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission, UserRole });
    if (typeof Major.associate === 'function') Major.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission, UserRole });
    if (typeof Class.associate === 'function') Class.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission, UserRole });
    if (typeof User.associate === 'function') User.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission, UserRole });
    if (typeof Mtype.associate === 'function') Mtype.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission, UserRole });
    if (typeof Role.associate === 'function') Role.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, RolePermission, UserRole });
    if (typeof Permission.associate === 'function') Permission.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Role, RolePermission, UserRole });
    if (typeof RolePermission.associate === 'function') RolePermission.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, UserRole });
    if (typeof UserRole.associate === 'function') UserRole.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission });
    if (typeof Message.associate === 'function') Message.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission, UserRole });
    if (typeof BookOrder.associate === 'function') BookOrder.associate({ sequelize, User, Book, Category, BorrowRecord, Announcement, Message, Mtype, Department, Major, Class, WorkDepartment, Permission, Role, RolePermission, UserRole });
    // Book与Category的关联已在Book模型文件中定义
    
    // Book与BorrowRecord的关联已在Book模型文件中定义

    // Category与Book的关联已在Category模型文件中定义

    // BorrowRecord与Book的关联已在BorrowRecord模型文件中定义
    
    // BorrowRecord与User的关联已在BorrowRecord模型文件中定义

    // User与BorrowRecord的关联已在User模型文件中定义
    
    // User与Department的关联已在User模型文件中定义
    
    // User与Major的关联已在User模型文件中定义
    
    // User与WorkDepartment的关联已在User模型文件中定义

    // Department与Major的关联已在Department模型文件中定义

    // Department与User的关联已在Department模型文件中定义

    // Major与Department的关联已在Major模型文件中定义

    // Major与Class的关联已在Major模型文件中定义

    // Class与Major的关联已在Class模型文件中定义

    // Class与User的关联已在Class模型文件中定义

    // WorkDepartment与User的关联已在WorkDepartment模型文件中定义

    // Role与Permission的关联已在Role和Permission模型文件中定义

    // Role与User的关联已在Role和User模型文件中定义
    
    // 消息模型关联
    // User作为发送者与Message的关联已在User模型文件中定义
    
    // User作为接收者与Message的关联已在User模型文件中定义
    
    // Message与Mtype的关联已在Message模型文件中定义
    
    // Mtype与Message的关联已在Mtype模型文件中定义

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
    
    // 然后同步数据库，强制创建外键约束
    await sequelize.sync({ force: false, alter: true });
    
    // 手动创建外键约束，确保约束被正确应用
    try {
      // 为User表的_did字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_user', {
        fields: ['_did'],
        type: 'foreign key',
        name: 'user_did_fkey',
        references: {
          table: 't_department',
          field: '_did'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // 为User表的_mid字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_user', {
        fields: ['_mid'],
        type: 'foreign key',
        name: 'user_mid_fkey',
        references: {
          table: 't_major',
          field: '_mid'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // 为User表的_cid字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_user', {
        fields: ['_cid'],
        type: 'foreign key',
        name: 'user_cid_fkey',
        references: {
          table: 't_class',
          field: '_cid'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // 为User表的_wdid字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_user', {
        fields: ['_wdid'],
        type: 'foreign key',
        name: 'user_wdid_fkey',
        references: {
          table: 't_work_department',
          field: '_wdid'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // 为Major表的_did字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_major', {
        fields: ['_did'],
        type: 'foreign key',
        name: 'major_did_fkey',
        references: {
          table: 't_department',
          field: '_did'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // 为Class表的_mid字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_class', {
        fields: ['_mid'],
        type: 'foreign key',
        name: 'class_mid_fkey',
        references: {
          table: 't_major',
          field: '_mid'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // 为Book表的_tid字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_book', {
        fields: ['_tid'],
        type: 'foreign key',
        name: 'book_category_tid_fkey',
        references: {
          table: 't_type',
          field: '_tid'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // 为BorrowRecord表的_bid字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_borrow_record', {
        fields: ['_bid'],
        type: 'foreign key',
        name: 'borrow_record_book_bid_fkey',
        references: {
          table: 't_book',
          field: '_bid'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // 为BorrowRecord表的_uid字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_borrow_record', {
        fields: ['_uid'],
        type: 'foreign key',
        name: 'borrow_record_user_uid_fkey',
        references: {
          table: 't_user',
          field: '_uid'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // 为Message表的_sender_id字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_messages', {
        fields: ['_sender_id'],
        type: 'foreign key',
        name: 'message_sender_id_fkey',
        references: {
          table: 't_user',
          field: '_uid'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // 为Message表的_receiver_id字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_messages', {
        fields: ['_receiver_id'],
        type: 'foreign key',
        name: 'message_receiver_id_fkey',
        references: {
          table: 't_user',
          field: '_uid'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      // 为Message表的_mtid字段创建外键约束
      await sequelize.getQueryInterface().addConstraint('t_messages', {
        fields: ['_mtid'],
        type: 'foreign key',
        name: 'message_mtid_fkey',
        references: {
          table: 't_mtypes',
          field: '_mtid'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // Mtype表的唯一约束已在模型定义中通过indexes选项设置

      console.log('所有外键约束创建成功');
    } catch (error) {
      console.log('外键约束可能已存在或创建失败:', error.message);
    }
    console.log('数据库表同步成功 =>');
    // 所有模型关联已在前面定义，无需重复调用
    console.log('所有模型关联已建立');
    
     // 初始化RBAC系统
    const { initRbac } = require('../scripts/initRbac');
    await initRbac();

    await createDefaultWorkDepartment();
    // 创建默认管理员账户（如果不存在）
    await createDefaultAdmin();
    
    await createDefaultMessageTypes();
   
  } catch (error) {
    console.error('数据库表同步失败 =< :', error);
  }
};


const createDefaultMessageTypes = async () => {
  const defaultTypes = [
    { _mtname: '系统通知', _mtcomment: '系统相关通知'},
    { _mtname: '意见建议', _mtcomment: '用户反馈的意见和建议' },
    { _mtname: '意见回馈', _mtcomment: '对用户反馈的回复和处理结果' },
    { _mtname: '读者荐购', _mtcomment: '关于读者推荐图书的请求消息' }
  ];

  try {
    for (const type of defaultTypes) {
      await Mtype.findOrCreate({
        where: { _mtname: type._mtname },
        defaults: { _mtcomment: type._mtcomment }
      });
    }
} catch (error) {
    console.error('默认消息类型创建失败:', error);
  }
};
const createDefaultWorkDepartment = async () => {
   const department = await WorkDepartment.findOrCreate({ 
      where: { _wdname: '校图书馆' } 
    });
    const wdid = department[0]._wdid;
    console.log(' 默认工作部门确保存在: 校图书馆 (ID:', wdid + ')');
}
// 创建默认管理员
const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ 
      where: { _account: 'admin_t' } 
    });
    const wd = await WorkDepartment.findOne({ where: { _wdname: '校图书馆' } });
    
    if (!existingAdmin) {
      const admint = await User.create({
        _utype: 'admin_t',
        _account: 'admin_t',
        _name: '终端管理员',
        _password: 'admin123',
        _email: 'admin@library.com',
        _max_num: 100,
        lend_num: 0,
        access: 1,
        _create_time: new Date(),
        _wdid: wd._wdid
      });
      const role = await Role.findOne({ where: { _rname: '终端管理员' } });
      await UserRole.findOrCreate({
        where: { _uid: admint._uid, _rid: role._rid }
      });
      console.log(' 默认管理员账户创建成功 (账号: admin_t, 密码: admin123)');
    }
  } catch (error) {
    console.error(' 创建默认管理员失败:', error);
  }
};

Category.hasMany(BorrowRecord, { 
  foreignKey: '_tid',
  sourceKey: '_tid'
});
BorrowRecord.belongsTo(Category, {
  foreignKey: '_tid',
  targetKey: '_tid'
});

module.exports = {
  sequelize,
  User,
  Book,
  Category,
  Department,
  Major,
  Class,
  WorkDepartment,
  BorrowRecord,
  Announcement,
  Message,
  Mtype,
  Permission,
  Role,
  RolePermission,
  UserRole,
  syncDatabase
};