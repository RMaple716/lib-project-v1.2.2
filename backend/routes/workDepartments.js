const express = require('express');
const { WorkDepartment } = require('../models');
const { authenticate, requirePermission } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WorkDepartments
 *   description: 工作部门管理
 */

/**
 * @swagger
 * /api/work-departments:
 *   get:
 *     summary: 获取所有工作部门列表
 *     description: 获取系统中所有工作部门的信息
 *     tags: [WorkDepartments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取工作部门列表成功
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
 *                         description: 工作部门ID
 *                       name:
 *                         type: string
 *                         description: 工作部门名称
 *       401:
 *         description: 未授权访问
 */
/**
 * 获取工作部门列表 - 需要workDepartment.view权限
 * @description 获取系统中所有工作部门的信息
 * @requiresPermission workDepartment.view
 */
router.get('/', authenticate, requirePermission('workDepartment.view'), async (req, res) => {
  try {
    const workDepartments = await WorkDepartment.findAll();

    res.json({
      success: true,
      data: workDepartments
    });
  } catch (error) {
    console.error('获取工作部门列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取工作部门列表失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/work-departments:
 *   post:
 *     summary: 创建新工作部门
 *     description: 创建一个新的工作部门
 *     tags: [WorkDepartments]
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
 *                 description: 工作部门名称
 *     responses:
 *       200:
 *         description: 创建工作部门成功
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
 *                       description: 工作部门ID
 *                     name:
 *                       type: string
 *                       description: 工作部门名称
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 创建工作部门 - 需要workDepartment.create权限
 * @description 创建新的工作部门，需要管理员权限
 * @requiresPermission workDepartment.create
 */
router.post('/', authenticate, requirePermission('workDepartment.create'), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '工作部门名称不能为空'
      });
    }

    // 检查工作部门是否已存在
    const existingWorkDepartment = await WorkDepartment.findOne({
      where: { name }
    });

    if (existingWorkDepartment) {
      return res.status(400).json({
        success: false,
        message: '工作部门已存在'
      });
    }

    // 创建工作部门
    const workDepartment = await WorkDepartment.create({
      name
    });

    res.status(201).json({
      success: true,
      message: '工作部门创建成功',
      data: workDepartment
    });
  } catch (error) {
    console.error('创建工作部门失败:', error);
    res.status(500).json({
      success: false,
      message: '创建工作部门失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/work-departments/{id}:
 *   put:
 *     summary: 更新工作部门信息
 *     description: 更新指定工作部门的信息
 *     tags: [WorkDepartments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 工作部门ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 工作部门名称
 *     responses:
 *       200:
 *         description: 更新工作部门成功
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
 *                       description: 工作部门ID
 *                     name:
 *                       type: string
 *                       description: 工作部门名称
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       404:
 *         description: 工作部门不存在
 *       500:
 *         description: 服务器内部错误
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '工作部门名称不能为空'
      });
    }

    // 查找工作部门
    const workDepartment = await WorkDepartment.findByPk(id);

    if (!workDepartment) {
      return res.status(404).json({
        success: false,
        message: '工作部门不存在'
      });
    }

    // 检查工作部门名称是否已被其他工作部门使用
    const existingWorkDepartment = await WorkDepartment.findOne({
      where: { 
        name,
        id: { [require('sequelize').Op.ne]: id }
      }
    });

    if (existingWorkDepartment) {
      return res.status(400).json({
        success: false,
        message: '工作部门名称已存在'
      });
    }

    // 更新工作部门
    await workDepartment.update({ name });

    res.json({
      success: true,
      message: '工作部门更新成功',
      data: workDepartment
    });
  } catch (error) {
    console.error('更新工作部门失败:', error);
    res.status(500).json({
      success: false,
      message: '更新工作部门失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/work-departments/{id}:
 *   delete:
 *     summary: 删除工作部门
 *     description: 删除指定的工作部门
 *     tags: [WorkDepartments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 工作部门ID
 *     responses:
 *       200:
 *         description: 删除工作部门成功
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
 *         description: 工作部门不存在
 *       500:
 *         description: 服务器内部错误
 */
/**
 * 删除工作部门 - 需要workDepartment.delete权限
 * @description 删除指定的工作部门，需要管理员权限
 * @requiresPermission workDepartment.delete
 */
router.delete('/:id', authenticate, requirePermission('workDepartment.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // 查找工作部门
    const workDepartment = await WorkDepartment.findByPk(id);

    if (!workDepartment) {
      return res.status(404).json({
        success: false,
        message: '工作部门不存在'
      });
    }

    // 检查工作部门下是否有临时工
    const tempWorkerCount = await require('../models').User.count({
      where: { 
        work_department_id: id,
        _utype: 'tempworker'
      }
    });

    if (tempWorkerCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该工作部门下还有临时工，无法删除'
      });
    }

    // 删除工作部门
    await workDepartment.destroy();

    res.json({
      success: true,
      message: '工作部门删除成功'
    });
  } catch (error) {
    console.error('删除工作部门失败:', error);
    res.status(500).json({
      success: false,
      message: '删除工作部门失败',
      error: error.message
    });
  }
});

module.exports = router;
