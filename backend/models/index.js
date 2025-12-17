const { sequelize } = require('../config/database');
const User = require('./User');
const Book = require('./Book');
// 添加新增的模型
const Category = require('./Category');
const BorrowRecord = require('./BorrowRecord');
const Announcement = require('./Announcement');
const Message = require('./Message');
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

// 定义模型关联
const defineAssociations = () => {
  try {
    // Book 关联
    Book.belongsTo(Category, {
      foreignKey: {
        name: '_tid',
        allowNull: false
      },
      as: 'category',
      constraints: true
    });
    
    Book.hasMany(BorrowRecord, {
      foreignKey: {
        name: '_bid',
        allowNull: false
      },
      as: 'borrowRecords',
      constraints: true,
      onDelete: 'RESTRICT'
    });

    // Category 关联
    Category.hasMany(Book, {
      foreignKey: {
        name: '_tid',
        allowNull: false
      },
      as: 'books',
      constraints: true,
      onDelete: 'RESTRICT'
    });

    // BorrowRecord 关联
    BorrowRecord.belongsTo(Book, {
      foreignKey: {
        name: '_bid',
        allowNull: false
      },
      as: 'book',
      constraints: true
    });
    
    BorrowRecord.belongsTo(User, {
      foreignKey: {
        name: '_uid',
        allowNull: false
      },
      as: 'user',
      constraints: true
    });

    // User 关联
    User.hasMany(BorrowRecord, {
      foreignKey: {
        name: '_uid',
        allowNull: false
      },
      as: 'borrowRecords',
      constraints: true,
      onDelete: 'RESTRICT'
    });
    
    // User 与 Department 的关联
    User.belongsTo(Department, {
      foreignKey: {
        name: '_did',
        allowNull: true
      },
      as: 'department',
      constraints: true
    });
    
    // User 与 Major 的关联
    User.belongsTo(Major, {
      foreignKey: {
        name: '_mid',
        allowNull: true
      },
      as: 'major',
      constraints: true
    });
    
    // User 与 Class 的关联
    User.belongsTo(Class, {
      foreignKey: {
        name: '_cid',
        allowNull: true
      },
      as: 'class',
      constraints: true
    });
    
    // User 与 WorkDepartment 的关联
    User.belongsTo(WorkDepartment, {
      foreignKey: {
        name: '_wdid',
        allowNull: true
      },
      as: 'workDepartment',
      constraints: true
    });

    // 院系关联
    Department.hasMany(Major, {
      foreignKey: {
        name: '_did',
        allowNull: false
      },
      as: 'majors',
      constraints: true,
      onDelete: 'RESTRICT'
    });

    Department.hasMany(User, {
      foreignKey: {
        name: '_did',
        allowNull: true
      },
      as: 'teachers',
      constraints: true,
      onDelete: 'RESTRICT'
    });

    // 专业关联
    Major.belongsTo(Department, {
      foreignKey: {
        name: '_did',
        allowNull: false
      },
      as: 'department',
      constraints: true
    });

    Major.hasMany(Class, {
      foreignKey: {
        name: '_cid',
        allowNull: false
      },
      as: 'classes',
      constraints: true,
      onDelete: 'RESTRICT'
    });

    // 班级关联
    Class.belongsTo(Major, {
      foreignKey: {
        name: '_mid',
        allowNull: false
      },
      as: 'major',
      constraints: true
    });

    Class.hasMany(User, {
      foreignKey: {
        name: '_cid',
        allowNull: true
      },
      as: 'students',
      constraints: true,
      onDelete: 'RESTRICT'
    });

    // 工作部门关联
    WorkDepartment.hasMany(User, {
      foreignKey: {
        name: '_wdid',
        allowNull: true
      },
      as: 'tempWorkers',
      constraints: true,
      onDelete: 'RESTRICT'
    });

    // RBAC 模型关联
    // 角色-权限关联
    Role.belongsToMany(Permission, {
      through: RolePermission,
      foreignKey: '_rid',
      otherKey: '_pid',
      as: 'permissions'
    });

    Permission.belongsToMany(Role, {
      through: RolePermission,
      foreignKey: '_pid',
      otherKey: '_rid',
      as: 'roles'
    });

    // 用户-角色关联
    User.belongsToMany(Role, {
      through: UserRole,
      foreignKey: '_uid',
      otherKey: '_rid',
      as: 'roles'
    });

    Role.belongsToMany(User, {
      through: UserRole,
      foreignKey: '_rid',
      otherKey: '_uid',
      as: 'users'
    });
    
    // 消息模型关联
    // 用户作为发送者
    User.hasMany(Message, {
      foreignKey: '_sender_id',
      as: 'sentMessages'
    });
    
    // 用户作为接收者
    User.hasMany(Message, {
      foreignKey: '_receiver_id',
      as: 'receivedMessages'
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
          table: 't_category',
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

      console.log('所有外键约束创建成功');
    } catch (error) {
      console.log('外键约束可能已存在或创建失败:', error.message);
    }
    console.log('数据库表同步成功 =>');
    
    // 创建默认管理员账户（如果不存在）
    await createDefaultAdmin();
    
    // 初始化RBAC系统
    const { initRbac } = require('../scripts/initRbac');
    await initRbac();
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
        _create_time: new Date(),
        _wdid: 1
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
  Permission,
  Role,
  RolePermission,
  UserRole,
  syncDatabase
};