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
      // 读者管理权限
      { _pname: '查看读者列表', _pcode: 'readers.view', _pmodule: 'readers', _pdesc: '查看读者列表和详情' },
      { _pname: '添加读者', _pcode: 'readers.create', _pmodule: 'readers', _pdesc: '添加新读者' },
      { _pname: '编辑读者信息', _pcode: 'readers.update', _pmodule: 'readers', _pdesc: '编辑读者信息' },
      { _pname: '删除读者', _pcode: 'readers.delete', _pmodule: 'readers', _pdesc: '删除读者' },

      // 图书管理权限
      { _pname: '查看图书列表', _pcode: 'books.view', _pmodule: 'books', _pdesc: '查看图书列表和详情' },
      { _pname: '添加图书', _pcode: 'books.create', _pmodule: 'books', _pdesc: '添加新图书' },
      { _pname: '编辑图书信息', _pcode: 'books.update', _pmodule: 'books', _pdesc: '编辑图书信息' },
      { _pname: '删除图书', _pcode: 'books.delete', _pmodule: 'books', _pdesc: '删除图书' },
      { _pname: '批量导入图书', _pcode: 'books.import', _pmodule: 'books', _pdesc: '批量导入图书' },

      // 借阅管理权限
      { _pname: '查看借阅记录', _pcode: 'borrow.view', _pmodule: 'borrow', _pdesc: '查看借阅记录' },
      { _pname: '借出图书', _pcode: 'borrow.create', _pmodule: 'borrow', _pdesc: '借出图书' },
      { _pname: '归还图书', _pcode: 'borrow.update', _pmodule: 'borrow', _pdesc: '归还图书' },
      { _pname: '续借图书', _pcode: 'borrow.renew', _pmodule: 'borrow', _pdesc: '续借图书' },
      { _pname: '查看借阅统计', _pcode: 'borrow.stats', _pmodule: 'borrow', _pdesc: '查看借阅统计信息' },

      // 公告管理权限
      { _pname: '查看公告列表', _pcode: 'announcements.view', _pmodule: 'announcements', _pdesc: '查看公告列表' },
      { _pname: '发布公告', _pcode: 'announcements.create', _pmodule: 'announcements', _pdesc: '发布公告' },
      { _pname: '编辑公告', _pcode: 'announcements.update', _pmodule: 'announcements', _pdesc: '编辑公告' },
      { _pname: '删除公告', _pcode: 'announcements.delete', _pmodule: 'announcements', _pdesc: '删除公告' },

      // 权限管理权限
      { _pname: '查看权限列表', _pcode: 'permissions.view', _pmodule: 'permissions', _pdesc: '查看权限列表' },
      { _pname: '创建权限', _pcode: 'permissions.create', _pmodule: 'permissions', _pdesc: '创建新权限' },
      { _pname: '编辑权限', _pcode: 'permissions.update', _pmodule: 'permissions', _pdesc: '编辑权限' },
      { _pname: '删除权限', _pcode: 'permissions.delete', _pmodule: 'permissions', _pdesc: '删除权限' },

      // 角色管理权限
      { _pname: '查看角色列表', _pcode: 'roles.view', _pmodule: 'roles', _pdesc: '查看角色列表' },
      { _pname: '创建角色', _pcode: 'roles.create', _pmodule: 'roles', _pdesc: '创建新角色' },
      { _pname: '编辑角色', _pcode: 'roles.update', _pmodule: 'roles', _pdesc: '编辑角色' },
      { _pname: '删除角色', _pcode: 'roles.delete', _pmodule: 'roles', _pdesc: '删除角色' },

      // 用户角色管理权限
      { _pname: '查看用户角色', _pcode: 'userRoles.view', _pmodule: 'userRoles', _pdesc: '查看用户角色' },
      { _pname: '分配角色', _pcode: 'userRoles.assign', _pmodule: 'userRoles', _pdesc: '为用户分配角色' },
      { _pname: '移除角色', _pcode: 'userRoles.remove', _pmodule: 'userRoles', _pdesc: '移除用户角色' },

      // 管理员授权权限
      { _pname: '授权管理员', _pcode: 'adminAuth.grant', _pmodule: 'adminAuth', _pdesc: '授权普通管理员' },
      { _pname: '解除管理员权限', _pcode: 'adminAuth.revoke', _pmodule: 'adminAuth', _pdesc: '解除普通管理员权限' }
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

    console.log('为角色分配权限...');

    // 获取所有权限
    const allPermissions = await Permission.findAll();

    // 为终端管理员分配所有权限
    await terminalAdminRole[0].setPermissions(allPermissions);

    // 为读者管理员分配读者相关权限
    const readerPermissions = allPermissions.filter(p => 
      p.module === 'readers' || p.code === 'borrow.view'
    );
    await readerAdminRole[0].setPermissions(readerPermissions);

    // 为图书管理员分配图书相关权限
    const bookPermissions = allPermissions.filter(p => 
      p.module === 'books' || p.code === 'categories.view'
    );
    await bookAdminRole[0].setPermissions(bookPermissions);

    // 为借阅管理员分配借阅相关权限
    const borrowPermissions = allPermissions.filter(p => 
      p.module === 'borrow' || p.code === 'books.view' || p.code === 'readers.view'
    );
    await borrowAdminRole[0].setPermissions(borrowPermissions);

    // 为公告管理员分配公告相关权限
    const announcementPermissions = allPermissions.filter(p => 
      p.module === 'announcements'
    );
    await announcementAdminRole[0].setPermissions(announcementPermissions);

    console.log('RBAC系统初始化完成');
  } catch (error) {
    console.error('初始化RBAC系统失败:', error);
  }
}

module.exports = { initRbac };
