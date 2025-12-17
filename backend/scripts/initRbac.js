const { Permission, Role, RolePermission } = require('../models');

/**
 * 初始化RBAC系统
 * 创建基本的权限和角色
 */
async function initRbac() {
  try {
    console.log('开始初始化RBAC系统...');

    // 创建基本权限
    const permissions = [
      // 用户管理权限
      { _pname: '查看用户列表', _pcode: 'user.view', _pmodule: 'user', _pdesc: '查看用户列表和详情' },
      { _pname: '添加用户', _pcode: 'user.add', _pmodule: 'user', _pdesc: '添加新用户' },
      { _pname: '编辑用户信息', _pcode: 'user.edit', _pmodule: 'user', _pdesc: '编辑用户信息' },
      { _pname: '删除用户', _pcode: 'user.delete', _pmodule: 'user', _pdesc: '删除用户' },

      // 图书管理权限
      { _pname: '查看图书列表', _pcode: 'book.view', _pmodule: 'book', _pdesc: '查看图书列表和详情' },
      { _pname: '添加图书', _pcode: 'book.add', _pmodule: 'book', _pdesc: '添加新图书' },
      { _pname: '编辑图书信息', _pcode: 'book.edit', _pmodule: 'book', _pdesc: '编辑图书信息' },
      { _pname: '删除图书', _pcode: 'book.delete', _pmodule: 'book', _pdesc: '删除图书' },
      { _pname: '批量导入图书', _pcode: 'book.bulk_upload', _pmodule: 'book', _pdesc: '批量导入图书' },
      { _pname: '下载导入模板', _pcode: 'book.template_download', _pmodule: 'book', _pdesc: '下载导入模板' },
      { _pname: '借出图书', _pcode: 'book.borrow', _pmodule: 'book', _pdesc: '借出图书' },
      { _pname: '归还图书', _pcode: 'book.return', _pmodule: 'book', _pdesc: '归还图书' },
      { _pname: '续借图书', _pcode: 'book.renew', _pmodule: 'book', _pdesc: '续借图书' },

      // 借阅记录管理权限
      { _pname: '查看借阅记录', _pcode: 'borrowRecord.view', _pmodule: 'borrowRecord', _pdesc: '查看借阅记录' },
      { _pname: '创建借阅记录', _pcode: 'borrowRecord.create', _pmodule: 'borrowRecord', _pdesc: '创建借阅记录' },
      { _pname: '编辑借阅记录', _pcode: 'borrowRecord.edit', _pmodule: 'borrowRecord', _pdesc: '编辑借阅记录' },
      { _pname: '删除借阅记录', _pcode: 'borrowRecord.delete', _pmodule: 'borrowRecord', _pdesc: '删除借阅记录' },
      { _pname: '查看借阅统计', _pcode: 'borrowRecord.stats', _pmodule: 'borrowRecord', _pdesc: '查看借阅统计信息' },

      // 公告管理权限
      { _pname: '查看公告列表', _pcode: 'announcement.view', _pmodule: 'announcement', _pdesc: '查看公告列表' },
      { _pname: '发布公告', _pcode: 'announcement.create', _pmodule: 'announcement', _pdesc: '发布公告' },
      { _pname: '编辑公告', _pcode: 'announcement.edit', _pmodule: 'announcement', _pdesc: '编辑公告' },
      { _pname: '删除公告', _pcode: 'announcement.delete', _pmodule: 'announcement', _pdesc: '删除公告' },

      // 权限管理权限
      { _pname: '查看权限列表', _pcode: 'permission.view', _pmodule: 'permission', _pdesc: '查看权限列表' },
      { _pname: '创建权限', _pcode: 'permission.create', _pmodule: 'permission', _pdesc: '创建新权限' },
      { _pname: '编辑权限', _pcode: 'permission.edit', _pmodule: 'permission', _pdesc: '编辑权限' },
      { _pname: '删除权限', _pcode: 'permission.delete', _pmodule: 'permission', _pdesc: '删除权限' },

      // 角色管理权限
      { _pname: '查看角色列表', _pcode: 'role.view', _pmodule: 'role', _pdesc: '查看角色列表' },
      { _pname: '创建角色', _pcode: 'role.create', _pmodule: 'role', _pdesc: '创建新角色' },
      { _pname: '编辑角色', _pcode: 'role.edit', _pmodule: 'role', _pdesc: '编辑角色' },
      { _pname: '删除角色', _pcode: 'role.delete', _pmodule: 'role', _pdesc: '删除角色' },
      { _pname: '分配角色权限', _pcode: 'role.assign', _pmodule: 'role', _pdesc: '为角色分配权限' },

      // 分类管理权限
      { _pname: '查看分类列表', _pcode: 'category.view', _pmodule: 'category', _pdesc: '查看分类列表' },
      { _pname: '创建分类', _pcode: 'category.create', _pmodule: 'category', _pdesc: '创建分类' },
      { _pname: '编辑分类', _pcode: 'category.edit', _pmodule: 'category', _pdesc: '编辑分类' },
      { _pname: '删除分类', _pcode: 'category.delete', _pmodule: 'category', _pdesc: '删除分类' },

      // 院系管理权限
      { _pname: '查看院系列表', _pcode: 'department.view', _pmodule: 'department', _pdesc: '查看院系列表' },
      { _pname: '创建院系', _pcode: 'department.create', _pmodule: 'department', _pdesc: '创建院系' },
      { _pname: '编辑院系', _pcode: 'department.edit', _pmodule: 'department', _pdesc: '编辑院系' },
      { _pname: '删除院系', _pcode: 'department.delete', _pmodule: 'department', _pdesc: '删除院系' },

      // 专业管理权限
      { _pname: '查看专业列表', _pcode: 'major.view', _pmodule: 'major', _pdesc: '查看专业列表' },
      { _pname: '创建专业', _pcode: 'major.create', _pmodule: 'major', _pdesc: '创建专业' },
      { _pname: '编辑专业', _pcode: 'major.edit', _pmodule: 'major', _pdesc: '编辑专业' },
      { _pname: '删除专业', _pcode: 'major.delete', _pmodule: 'major', _pdesc: '删除专业' },

      // 班级管理权限
      { _pname: '查看班级列表', _pcode: 'class.view', _pmodule: 'class', _pdesc: '查看班级列表' },
      { _pname: '创建班级', _pcode: 'class.create', _pmodule: 'class', _pdesc: '创建班级' },
      { _pname: '编辑班级', _pcode: 'class.edit', _pmodule: 'class', _pdesc: '编辑班级' },
      { _pname: '删除班级', _pcode: 'class.delete', _pmodule: 'class', _pdesc: '删除班级' },

      // 工作部门管理权限
      { _pname: '查看工作部门列表', _pcode: 'workDepartment.view', _pmodule: 'workDepartment', _pdesc: '查看工作部门列表' },
      { _pname: '创建工作部门', _pcode: 'workDepartment.create', _pmodule: 'workDepartment', _pdesc: '创建工作部门' },
      { _pname: '编辑工作部门', _pcode: 'workDepartment.edit', _pmodule: 'workDepartment', _pdesc: '编辑工作部门' },
      { _pname: '删除工作部门', _pcode: 'workDepartment.delete', _pmodule: 'workDepartment', _pdesc: '删除工作部门' },

      // 消息管理权限
      { _pname: '查看消息列表', _pcode: 'message.view', _pmodule: 'message', _pdesc: '查看消息列表' },
      { _pname: '创建消息', _pcode: 'message.create', _pmodule: 'message', _pdesc: '创建消息' },
      { _pname: '编辑消息', _pcode: 'message.edit', _pmodule: 'message', _pdesc: '编辑消息' },

      // 管理员授权权限
      { _pname: '授权管理员', _pcode: 'adminAuth.grant', _pmodule: 'adminAuth', _pdesc: '授权普通管理员' },
      { _pname: '解除管理员权限', _pcode: 'adminAuth.revoke', _pmodule: 'adminAuth', _pdesc: '解除普通管理员权限' },

      // 管理员管理权限
      { _pname: '查看管理员列表', _pcode: 'admin.view', _pmodule: 'admin', _pdesc: '查看管理员列表和详情' },
      { _pname: '添加管理员', _pcode: 'admin.add', _pmodule: 'admin', _pdesc: '添加新管理员' },
      { _pname: '编辑管理员信息', _pcode: 'admin.edit', _pmodule: 'admin', _pdesc: '编辑管理员信息' },
      { _pname: '删除管理员', _pcode: 'admin.delete', _pmodule: 'admin', _pdesc: '删除管理员' }
    ];

    console.log('创建权限...');
    const createdPermissions = await Permission.bulkCreate(permissions, { 
      ignoreDuplicates: true 
    });
    console.log(`创建了 ${createdPermissions.length} 个权限`);

    // 创建基本角色
    console.log('创建角色...');

    // 终端管理员角色 - 拥有所有权限
    const terminalAdminRole = await Role.findOrCreate({
      where: { _rcode: 'terminal_admin' },
      defaults: {
        _rname: '终端管理员',
        _rcode: 'terminal_admin',
        _rdesc: '拥有系统所有权限的管理员'
      }
    });

    // 读者管理员角色 - 只能管理读者相关功能
    const readerAdminRole = await Role.findOrCreate({
      where: { _rcode: 'reader_admin' },
      defaults: {
        _rname: '读者管理员',
        _rcode: 'reader_admin',
        _rdesc: '负责读者管理的管理员'
      }
    });

    // 图书管理员角色 - 只能管理图书相关功能
    const bookAdminRole = await Role.findOrCreate({
      where: { _rcode: 'book_admin' },
      defaults: {
        _rname: '图书管理员',
        _rcode: 'book_admin',
        _rdesc: '负责图书管理的管理员'
      }
    });

    // 借阅管理员角色 - 只能管理借阅相关功能
    const borrowAdminRole = await Role.findOrCreate({
      where: { _rcode: 'borrow_admin' },
      defaults: {
        _rname: '借阅管理员',
        _rcode: 'borrow_admin',
        _rdesc: '负责借阅管理的管理员'
      }
    });

    // 公告管理员角色 - 只能管理公告相关功能
    const announcementAdminRole = await Role.findOrCreate({
      where: { _rcode: 'announcement_admin' },
      defaults: {
        _rname: '公告管理员',
        _rcode: 'announcement_admin',
        _rdesc: '负责公告管理的管理员'
      }
    });

    const userRole = await Role.findOrCreate({
      where: { _rcode: 'reader' },
      defaults: {
        _rname: '读者',
        _rcode: 'reader',
        _rdesc: '系统的读者'
      }
    });

    console.log('为角色分配权限...');

    // 获取所有权限
    const allPermissions = await Permission.findAll();

    // 为终端管理员分配所有权限
    await terminalAdminRole[0].setPermissions(allPermissions);

    

    // 为读者管理员分配读者相关权限
    const readerPermissions = allPermissions.filter(p => 
      p._pmodule === 'user' || p._pcode === 'borrowRecord.view'
    );
    await readerAdminRole[0].setPermissions(readerPermissions);

    // 为图书管理员分配图书相关权限
    const bookPermissions = allPermissions.filter(p => 
      p._pmodule === 'book' || p._pcode === 'category.view'
    );
    await bookAdminRole[0].setPermissions(bookPermissions);

    // 为借阅管理员分配借阅相关权限
    const borrowPermissions = allPermissions.filter(p => 
      p._pmodule === 'borrowRecord' || p._pcode === 'book.view' || p._pcode === 'user.view'
    );
    await borrowAdminRole[0].setPermissions(borrowPermissions);

    // 为公告管理员分配公告相关权限
    const announcementPermissions = allPermissions.filter(p => 
      p._pmodule === 'announcement'
    );
    await announcementAdminRole[0].setPermissions(announcementPermissions);


    // 为普通用户分配基本权限
    const userPermissions = allPermissions.filter(p => 
      p._pcode === 'book.view' ||     // 查看图书列表
      p._pcode === 'book.borrow' ||   // 借出图书
      p._pcode === 'book.return' ||   // 归还图书
      p._pcode === 'book.renew' ||    // 续借图书
      p._pcode === 'borrowRecord.view' || // 查看借阅记录
      p._pcode === 'announcement.view' || // 查看公告
      p._pcode === 'message.view'     // 查看消息
    );
    await userRole[0].setPermissions(userPermissions);

    console.log('RBAC系统初始化完成');
  } catch (error) {
    console.error('初始化RBAC系统失败:', error);
  }
}

module.exports = { initRbac };
