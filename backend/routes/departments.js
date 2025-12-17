const express = require('express');
const { Department, Major, Class, WorkDepartment } = require('../models');
const { authenticate, requirePermission } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: 院系管理
 */

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: 获取所有院系列表
 *     description: 获取系统中所有院系的信息
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取院系列表成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 操作是否成功
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: 院系ID
 *                       name:
 *                         type: string
 *                         description: 院系名称
 *       401:
 *         description: 未授权访问
 */
/**
 * 获取院系列表 - 需要department.view权限
 * @description 获取系统中所有院系的信息
 * @requiresPermission department.view
 */
router.get('/', authenticate, requirePermission('department.view'), async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: Major,
          as: 'majors',
          include: [
            {
              model: Class,
              as: 'classes'
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('获取院系列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取院系列表失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: 创建新院系
 *     description: 创建一个新的院系
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 院系名称
 *     responses:
 *       200:
 *         description: 创建院系成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 操作是否成功
 *                 message:
 *                   type: string
 *                   description: 响应消息
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 院系ID
 *                     name:
 *                       type: string
 *                       description: 院系名称
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 创建院系 - 需要department.create权限
 * @description 创建新的院系，需要管理员权限
 * @requiresPermission department.create
 */
router.post('/', authenticate, requirePermission('department.create'), async (req, res) => {
  try {
    const { _dname } = req.body;

    if (!_dname) {
      return res.status(400).json({
        success: false,
        message: '院系名称不能为空'
      });
    }

    // 检查院系是否已存在
    const existingDepartment = await Department.findOne({
      where: { _dname }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: '院系已存在'
      });
    }

    // 创建院系
    const department = await Department.create({
      _dname
    });

    res.status(201).json({
      success: true,
      message: '院系创建成功',
      data: department
    });
  } catch (error) {
    console.error('创建院系失败:', error);
    res.status(500).json({
      success: false,
      message: '创建院系失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: 更新院系信息
 *     description: 更新指定院系的信息
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 院系ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 院系名称
 *     responses:
 *       200:
 *         description: 更新院系成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 操作是否成功
 *                 message:
 *                   type: string
 *                   description: 响应消息
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 院系ID
 *                     name:
 *                       type: string
 *                       description: 院系名称
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       404:
 *         description: 院系不存在
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 更新院系 - 需要department.edit权限
 * @description 更新指定的院系信息，需要管理员权限
 * @requiresPermission department.edit
 */
router.put('/:id', authenticate, requirePermission('department.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { _dname } = req.body;

    if (!_dname) {
      return res.status(400).json({
        success: false,
        message: '院系名称不能为空'
      });
    }

    // 查找院系
    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: '院系不存在'
      });
    }

    // 检查院系名称是否已被其他院系使用
    const existingDepartment = await Department.findOne({
      where: { 
        _dname,
        _did: { [require('sequelize').Op.ne]: id }
      }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: '院系名称已存在'
      });
    }

    // 更新院系
    await department.update({ _dname });

    res.json({
      success: true,
      message: '院系更新成功',
      data: department
    });
  } catch (error) {
    console.error('更新院系失败:', error);
    res.status(500).json({
      success: false,
      message: '更新院系失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: 删除院系
 *     description: 删除指定的院系
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 院系ID
 *     responses:
 *       200:
 *         description: 删除院系成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 操作是否成功
 *                 message:
 *                   type: string
 *                   description: 响应消息
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       404:
 *         description: 院系不存在
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 删除院系 - 需要department.delete权限
 * @description 删除指定的院系，需要管理员权限
 * @requiresPermission department.delete
 */
router.delete('/:id', authenticate, requirePermission('department.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // 查找院系
    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: '院系不存在'
      });
    }

    // 检查院系下是否有专业
    const majorCount = await Major.count({
      where: { _did: id }
    });

    if (majorCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该院系下还有专业，无法删除'
      });
    }

    // 检查院系下是否有教师
    const teacherCount = await require('../models').User.count({
      where: { 
        _did: id,
        _utype: 'teacher'
      }
    });

    if (teacherCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该院系下还有教师，无法删除'
      });
    }

    // 删除院系
    await department.destroy();

    res.json({
      success: true,
      message: '院系删除成功'
    });
  } catch (error) {
    console.error('删除院系失败:', error);
    res.status(500).json({
      success: false,
      message: '删除院系失败',
      error: error.message
    });
  }
});

module.exports = router;
