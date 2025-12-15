const express = require('express');
const router = express.Router();
const { Category, BorrowRecord } = require('../models');
const { sequelize } = require('../models');
const { authenticate, requirePermission } = require('../middleware/auth');

console.log('Category models:', Category);
console.log('BorrowRecord models:', BorrowRecord);
console.log('authenticateToken:', authenticate);

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: 图书分类管理
 */

/**
 * @swagger
 * /api/categories/stats:
 *   get:
 *     summary: 获取类别借阅统计
 *     description: 获取所有类别的借阅数量统计，按借阅数量降序排列
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取统计数据成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _type_name:
 *                         type: string
 *                         description: 类别名称
 *                         example: "小说"
 *                       count:
 *                         type: integer
 *                         description: 借阅数量
 *                         example: 15
 *             example:
 *               success: true
 *               data:
 *                 - _type_name: "小说"
 *                   count: 15
 *                 - _type_name: "科技"
 *                   count: 8
 *                 - _type_name: "历史"
 *                   count: 5
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "未提供有效的认证令牌"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "获取统计数据失败"
 */
/**
 * 获取类别借阅统计 - 需要category.view权限
 * @description 获取所有类别的借阅数量统计，按借阅数量降序排列
 * @requiresPermission category.view
 */
// 在 routes/category.js 中添加路由
router.get('/stats', authenticate, requirePermission('category.view'), async (req, res) => {
  try {
    // 查询每个类别的借阅数量
    const categoryStats = await Category.findAll({
      attributes: [
        '_type_name',
        [
          // 使用关联查询统计借阅数量
          sequelize.fn('COUNT', sequelize.col('BorrowRecords._hid')),
          'count'
        ]
      ],
      include: [{
        model: BorrowRecord,
        attributes: [], // 不需要返回借阅记录的具体字段
        required: true // INNER JOIN，只统计有借阅记录的类别
      }],
      group: ['Category._tid'], // 按类别ID分组
      order: [[sequelize.literal('count'), 'DESC']] // 按借阅数量降序排列
    });

    // 格式化返回数据
    const formattedStats = categoryStats.map(category => ({
      _type_name: category._type_name,
      count: parseInt(category.dataValues.count)
    }));

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('获取类别借阅统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});



/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: 获取分类详情
 *     description: 根据分类ID获取分类的详细信息
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 分类ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 获取分类详情成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/CategoryDetailSuccess'
 *       404:
 *         description: 分类不存在
 *         content:
 *           application/json:
 *             examples:
 *               categoryNotFound:
 *                 $ref: '#/components/examples/CategoryNotFoundError'
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
/**
 * 获取分类详情 - 需要category.view权限
 * @description 根据分类ID获取分类的详细信息
 * @requiresPermission category.view
 */
// 获取分类详情
router.get('/:id', authenticate, requirePermission('category.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        errorCode: 'CATEGORY_NOT_FOUND',
        message: '分类不存在'
      });
    }

    res.json({
      success: true,
      message: '成功获取分类详情',
      data: category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: 更新分类信息
 *     description: 根据分类ID更新分类信息，需要管理员权限
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 分类ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryRequest'
 *           examples:
 *             updateExample:
 *               summary: 更新分类名称
 *               value:
 *                 _type_name: "更新后的分类名称"
 *     responses:
 *       200:
 *         description: 更新分类成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/UpdateCategorySuccess'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 summary: 缺少必填字段
 *                 value:
 *                   success: false
 *                   errorCode: "MISSING_FIELDS"
 *                   message: "请提供分类名称"
 *       404:
 *         description: 分类不存在
 *         content:
 *           application/json:
 *             examples:
 *               categoryNotFound:
 *                 $ref: '#/components/examples/CategoryNotFoundError'
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
/**
 * 更新分类 - 需要category.edit权限
 * @description 根据分类ID更新分类信息，需要管理员权限
 * @requiresPermission category.edit
 */
// 更新分类
router.put('/:id', authenticate, requirePermission('category.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { _type_name } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        errorCode: 'CATEGORY_NOT_FOUND',
        message: '分类不存在'
      });
    }

    await category.update({
      _type_name: _type_name
    });

    res.json({
      success: true,
      message: '分类更新成功',
      data: category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: 删除分类
 *     description: 根据分类ID删除分类，需要管理员权限。如果分类下有关联的图书，则无法删除。
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 分类ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 删除分类成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/DeleteCategorySuccess'
 *       404:
 *         description: 分类不存在
 *         content:
 *           application/json:
 *             examples:
 *               notFound:
 *                 $ref: '#/components/examples/CategoryNotFoundError'
 *       409:
 *         description: 分类下有关联图书，无法删除
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               errorCode: "CATEGORY_HAS_BOOKS"
 *               message: "该分类下有关联的图书，无法删除"
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
/**
 * 删除分类 - 需要category.delete权限
 * @description 根据分类ID删除分类，需要管理员权限。如果分类下有关联的图书，则无法删除。
 * @requiresPermission category.delete
 */
// 删除分类
router.delete('/:id', authenticate, requirePermission('category.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        errorCode: 'CATEGORY_NOT_FOUND',
        message: '分类不存在'
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: '分类删除成功',
      data: category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: 获取分类列表
 *     description: 获取所有图书分类的列表，支持分页和排序
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 页码，默认为1
 *         example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 每页数量，默认为20，最大100
 *         example: 20
 *     responses:
 *       200:
 *         description: 获取分类列表成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CategoryListResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/CategoryListSuccess'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               errorCode: "UNAUTHORIZED"
 *               message: "请先登录"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
/**
 * 获取分类列表 - 需要category.view权限
 * @description 获取所有图书分类的列表，支持分页和排序
 * @requiresPermission category.view
 */
// 获取分类列表
router.get('/', requirePermission('category.view'), async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['_tid', 'ASC']],
      limit: 50,
    });

    res.json({
      success: true,
      message: '获取分类列表成功',
      data: {
        catlist: categories
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: 创建新分类
 *     description: 创建新的图书分类，需要管理员权限
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *           examples:
 *             computerScience:
 *               summary: 计算机科学分类
 *               value:
 *                 _type_name: "计算机科学"
 *             literature:
 *               summary: 文学分类
 *               value:
 *                 _type_name: "文学小说"
 *     responses:
 *       200:
 *         description: 创建分类成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/CreateCategorySuccess'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 summary: 缺少必填字段
 *                 value:
 *                   success: false
 *                   errorCode: "MISSING_FIELDS"
 *                   message: "请提供分类名称"
 *               invalidLength:
 *                 summary: 分类名称长度无效
 *                 value:
 *                   success: false
 *                   errorCode: "INVALID_LENGTH"
 *                   message: "分类名称长度必须在1-100个字符之间"
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
/**
 * 创建分类 - 需要category.create权限
 * @description 创建新的图书分类，需要管理员权限
 * @requiresPermission category.create
 */
// 新增分类
router.post('/', authenticate, requirePermission('category.create'), async (req, res) => {
  try {
    const { _type_name } = req.body;

    const newCategory = await Category.create({
      _type_name: _type_name
    });

    res.json({
      success: true,
      message: '添加分类成功',
      data: newCategory
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});


module.exports = router;