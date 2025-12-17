const express = require('express');
const { Department, Major, Class } = require('../models');
const { authenticate, requirePermission } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Majors
 *   description: 专业管理
 */

/**
 * @swagger
 * /api/majors:
 *   get:
 *     summary: 获取所有专业列表
 *     description: 获取系统中所有专业的信息
 *     tags: [Majors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取专业列表成功
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
 *                         description: 专业ID
 *                       name:
 *                         type: string
 *                         description: 专业名称
 *                       department_id:
 *                         type: integer
 *                         description: 所属院系ID
 *                       department:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               description: 院系ID
 *                             name:
 *                               type: string
 *                               description: 院系名称
 *       401:
 *         description: 未授权访问
 */
/**
 * 获取专业列表 - 需要major.view权限
 * @description 获取系统中所有专业的信息
 * @requiresPermission major.view
 */
router.get('/', authenticate, requirePermission('major.view'), async (req, res) => {
  try {
    const majors = await Major.findAll({
      include: [
        {
          model: Department,
          as: 'department'
        },
        {
          model: Class,
          as: 'classes'
        }
      ]
    });

    res.json({
      success: true,
      data: majors
    });
  } catch (error) {
    console.error('获取专业列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取专业列表失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/majors:
 *   post:
 *     summary: 创建新专业
 *     description: 创建一个新的专业
 *     tags: [Majors]
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
 *                 description: 专业名称
 *               department_id:
 *                 type: integer
 *                 description: 所属院系ID
 *     responses:
 *       200:
 *         description: 创建专业成功
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
 *                       description: 专业ID
 *                     name:
 *                       type: string
 *                       description: 专业名称
 *                     department_id:
 *                       type: integer
 *                       description: 所属院系ID
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 创建专业 - 需要major.create权限
 * @description 创建一个新的专业，需要管理员权限
 * @requiresPermission major.create
 */
router.post('/', authenticate, requirePermission('major.create'), async (req, res) => {
  try {
    const { name, _did } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '专业名称不能为空'
      });
    }

    if (!_did) {
      return res.status(400).json({
        success: false,
        message: '所属院系不能为空'
      });
    }

    // 检查院系是否存在
    const department = await Department.findByPk(_did);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: '院系不存在'
      });
    }

    // 检查专业是否已存在
    const existingMajor = await Major.findOne({
      where: { _mname: name }
    });

    if (existingMajor) {
      return res.status(400).json({
        success: false,
        message: '专业已存在'
      });
    }

    // 创建专业
    const major = await Major.create({
      name,
      _did
    });

    res.status(201).json({
      success: true,
      message: '专业创建成功',
      data: major
    });
  } catch (error) {
    console.error('创建专业失败:', error);
    res.status(500).json({
      success: false,
      message: '创建专业失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/majors/{id}:
 *   put:
 *     summary: 更新专业信息
 *     description: 更新指定专业的信息
 *     tags: [Majors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 专业ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 专业名称
 *               department_id:
 *                 type: integer
 *                 description: 所属院系ID
 *     responses:
 *       200:
 *         description: 更新专业成功
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
 *                       description: 专业ID
 *                     name:
 *                       type: string
 *                       description: 专业名称
 *                     department_id:
 *                       type: integer
 *                       description: 所属院系ID
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       404:
 *         description: 专业不存在
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 更新专业 - 需要major.edit权限
 * @description 更新指定专业的信息，需要管理员权限
 * @requiresPermission major.edit
 */
router.put('/:id', authenticate, requirePermission('major.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, _did } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '专业名称不能为空'
      });
    }

    if (!_did) {
      return res.status(400).json({
        success: false,
        message: '所属院系不能为空'
      });
    }

    // 查找专业
    const major = await Major.findByPk(id);

    if (!major) {
      return res.status(404).json({
        success: false,
        message: '专业不存在'
      });
    }

    // 检查院系是否存在
    const department = await Department.findByPk(_did);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: '院系不存在'
      });
    }

    // 检查专业名称是否已被其他专业使用
    const existingMajor = await Major.findOne({
      where: { 
        _mname: name,
        _mid: { [require('sequelize').Op.ne]: id }
      }
    });

    if (existingMajor) {
      return res.status(400).json({
        success: false,
        message: '专业名称已存在'
      });
    }

    // 更新专业
    await major.update({ _mname: name, _mid });

    res.json({
      success: true,
      message: '专业更新成功',
      data: major
    });
  } catch (error) {
    console.error('更新专业失败:', error);
    res.status(500).json({
      success: false,
      message: '更新专业失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/majors/{id}:
 *   delete:
 *     summary: 删除专业
 *     description: 删除指定的专业
 *     tags: [Majors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 专业ID
 *     responses:
 *       200:
 *         description: 删除专业成功
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
 *         description: 专业不存在
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 删除专业 - 需要major.delete权限
 * @description 删除指定的专业，需要管理员权限
 * @requiresPermission major.delete
 */
router.delete('/:id', authenticate, requirePermission('major.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // 查找专业
    const major = await Major.findByPk(id);

    if (!major) {
      return res.status(404).json({
        success: false,
        message: '专业不存在'
      });
    }

    // 检查专业下是否有班级
    const classCount = await Class.count({
      where: { _mid: id }
    });

    if (classCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该专业下还有班级，无法删除'
      });
    }

    // 删除专业
    await major.destroy();

    res.json({
      success: true,
      message: '专业删除成功'
    });
  } catch (error) {
    console.error('删除专业失败:', error);
    res.status(500).json({
      success: false,
      message: '删除专业失败',
      error: error.message
    });
  }
});

module.exports = router;
