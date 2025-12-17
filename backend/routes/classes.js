const express = require('express');
const { Department, Major, Class } = require('../models');
const { authenticate, requirePermission } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: 班级管理
 */

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: 获取所有班级列表
 *     description: 获取系统中所有班级的信息
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取班级列表成功
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
 *                         description: 班级ID
 *                       name:
 *                         type: string
 *                         description: 班级名称
 *                       major_id:
 *                         type: integer
 *                         description: 所属专业ID
 *                       major:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               description: 专业ID
 *                             name:
 *                               type: string
 *                               description: 专业名称
 *                             department:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   description: 院系ID
 *                                 name:
 *                                   type: string
 *                                   description: 院系名称
 *       401:
 *         description: 未授权访问
 */
/**
 * 获取班级列表 - 需要class.view权限
 * @description 获取系统中所有班级的信息
 * @requiresPermission class.view
 */
router.get('/', authenticate, requirePermission('class.view'), async (req, res) => {
  try {
    const classes = await Class.findAll({
      include: [
        {
          model: Major,
          as: 'major',
          include: [
            {
              model: Department,
              as: 'department'
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('获取班级列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取班级列表失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: 创建新班级
 *     description: 创建一个新的班级
 *     tags: [Classes]
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
 *                 description: 班级名称
 *               major_id:
 *                 type: integer
 *                 description: 所属专业ID
 *     responses:
 *       200:
 *         description: 创建班级成功
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
 *                       description: 班级ID
 *                     name:
 *                       type: string
 *                       description: 班级名称
 *                     major_id:
 *                       type: integer
 *                       description: 所属专业ID
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 创建班级 - 需要class.create权限
 * @description 创建一个新的班级，需要管理员权限
 * @requiresPermission class.create
 */
router.post('/', authenticate, requirePermission('class.create'), async (req, res) => {
  try {
    const { _cname, _mid } = req.body;

    if (!_cname) {
      return res.status(400).json({
        success: false,
        message: '班级名称不能为空'
      });
    }

    if (!_mid) {
      return res.status(400).json({
        success: false,
        message: '所属专业不能为空'
      });
    }

    // 检查专业是否存在
    const major = await Major.findByPk(major_id);
    if (!major) {
      return res.status(400).json({
        success: false,
        message: '专业不存在'
      });
    }

    // 检查班级是否已存在
    const existingClass = await Class.findOne({
      where: { _cname }
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: '班级已存在'
      });
    }

    // 创建班级
    const newClass = await Class.create({
      _cname,
      _mid
    });

    res.status(201).json({
      success: true,
      message: '班级创建成功',
      data: newClass
    });
  } catch (error) {
    console.error('创建班级失败:', error);
    res.status(500).json({
      success: false,
      message: '创建班级失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: 更新班级信息
 *     description: 更新指定班级的信息
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 班级ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 班级名称
 *               major_id:
 *                 type: integer
 *                 description: 所属专业ID
 *     responses:
 *       200:
 *         description: 更新班级成功
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
 *                       description: 班级ID
 *                     name:
 *                       type: string
 *                       description: 班级名称
 *                     major_id:
 *                       type: integer
 *                       description: 所属专业ID
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       404:
 *         description: 班级不存在
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 更新班级 - 需要class.edit权限
 * @description 更新指定班级的信息，需要管理员权限
 * @requiresPermission class.edit
 */
router.put('/:id', authenticate, requirePermission('class.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { _cname, _mid } = req.body;

    if (!_cname) {
      return res.status(400).json({
        success: false,
        message: '班级名称不能为空'
      });
    }

    if (!_mid) {
      return res.status(400).json({
        success: false,
        message: '所属专业不能为空'
      });
    }

    // 查找班级
    const classRecord = await Class.findByPk(id);

    if (!classRecord) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 检查专业是否存在
    const major = await Major.findByPk(major_id);
    if (!major) {
      return res.status(400).json({
        success: false,
        message: '专业不存在'
      });
    }

    // 检查班级名称是否已被其他班级使用
    const existingClass = await Class.findOne({
      where: { 
        name,
        id: { [require('sequelize').Op.ne]: id }
      }
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: '班级名称已存在'
      });
    }

    // 更新班级
    await classRecord.update({ name, major_id });

    res.json({
      success: true,
      message: '班级更新成功',
      data: classRecord
    });
  } catch (error) {
    console.error('更新班级失败:', error);
    res.status(500).json({
      success: false,
      message: '更新班级失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: 删除班级
 *     description: 删除指定的班级
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 班级ID
 *     responses:
 *       200:
 *         description: 删除班级成功
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
 *         description: 班级不存在
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 删除班级 - 需要class.delete权限
 * @description 删除指定的班级，需要管理员权限
 * @requiresPermission class.delete
 */
router.delete('/:id', authenticate, requirePermission('class.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // 查找班级
    const classRecord = await Class.findByPk(id);

    if (!classRecord) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 检查班级下是否有学生
    const studentCount = await require('../models').User.count({
      where: { 
        class_id: id,
        _utype: 'student'
      }
    });

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该班级下还有学生，无法删除'
      });
    }

    // 删除班级
    await classRecord.destroy();

    res.json({
      success: true,
      message: '班级删除成功'
    });
  } catch (error) {
    console.error('删除班级失败:', error);
    res.status(500).json({
      success: false,
      message: '删除班级失败',
      error: error.message
    });
  }
});

module.exports = router;
