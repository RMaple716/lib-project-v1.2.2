const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { authenticate } = require('../middleware/auth');

// 获取分类列表
router.get('/', authenticate, async (req, res) => {
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

// 新增分类
router.post('/', authenticate, async (req, res) => {
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

// 获取分类详情
router.get('/:id', authenticate, async (req, res) => {
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

// 更新分类
router.put('/:id', authenticate, async (req, res) => {
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

// 删除分类
router.delete('/:id', authenticate, async (req, res) => {
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

module.exports = router;