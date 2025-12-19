const express = require('express');
const router = express.Router();
const recommendation = require('../utils/recommendation');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: 图书推荐系统
 */

/**
 * @swagger
 * /api/recommendations/personal:
 *   get:
 *     summary: 获取个性化推荐书籍
 *     description: |
 *       结合基于用户的协同过滤和基于分类的推荐，为用户提供个性化书籍推荐。
 *       
 *       **推荐算法说明：**
 *       - 基于用户的协同过滤：找到与当前用户借阅历史相似的用户，推荐他们借阅过但当前用户未借阅的书籍
 *       - 基于分类的推荐：分析用户最常借阅的书籍分类，推荐这些分类下的热门书籍
 *       - 综合推荐：结合以上两种推荐结果，按推荐分数排序
 *       
 *       **推荐分数计算：**
 *       - 协同过滤分数：相似用户的相似度累加
 *       - 分类推荐分数：用户借阅该分类的次数
 *       - 热门书籍分数：书籍的借阅次数
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: 返回的推荐书籍数量
 *     responses:
 *       200:
 *         description: 获取个性化推荐成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BookRecommendation'
 *             example:
 *               success: true
 *               message: "获取个性化推荐成功"
 *               data:
 *                 - _bid: 1010
 *                   _book_name: "人工智能导论"
 *                   _author: "张三"
 *                   _press: "科学出版社"
 *                   _tid: 1
 *                   _times: 50
 *                   category:
 *                     _tid: 1
 *                     _type_name: "计算机科学"
 *                   recommendationScore: 2.75
 *                 - _bid: 1015
 *                   _book_name: "机器学习实战"
 *                   _author: "李四"
 *                   _press: "电子工业出版社"
 *                   _tid: 1
 *                   _times: 38
 *                   category:
 *                     _tid: 1
 *                     _type_name: "计算机科学"
 *                   recommendationScore: 2.5
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/UnauthorizedError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               serverError:
 *                 $ref: '#/components/examples/ServerError'
 */
router.get('/personal', authenticate, async (req, res) => {
  try {
    // 从请求中获取用户ID (对应t_user._uid)
    const userId = req.user._uid;
    // 获取请求参数中的推荐数量，默认为10
    const limit = parseInt(req.query.limit) || 10;

    // 获取个性化推荐
    const recommendations = await recommendation.getRecommendations(userId, limit);

    // 返回推荐结果
    res.json({
      success: true,
      message: '获取个性化推荐成功',
      data: recommendations
    });
  } catch (error) {
    console.error('获取个性化推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/recommendations/popular:
 *   get:
 *     summary: 获取热门书籍推荐
 *     description: |
 *       基于借阅次数(_times)排序，获取最受欢迎的书籍。
 *       
 *       **排序规则：**
 *       - 按书籍借阅次数降序排序
 *       - 借阅次数相同的书籍按创建时间降序排序
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: 返回的热门书籍数量
 *     responses:
 *       200:
 *         description: 获取热门书籍成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BookRecommendation'
 *             example:
 *               success: true
 *               message: "获取热门书籍成功"
 *               data:
 *                 - _bid: 1010
 *                   _book_name: "人工智能导论"
 *                   _author: "张三"
 *                   _press: "科学出版社"
 *                   _tid: 1
 *                   _times: 50
 *                   category:
 *                     _tid: 1
 *                     _type_name: "计算机科学"
 *                   recommendationScore: 50
 *                 - _bid: 1015
 *                   _book_name: "机器学习实战"
 *                   _author: "李四"
 *                   _press: "电子工业出版社"
 *                   _tid: 1
 *                   _times: 38
 *                   category:
 *                     _tid: 1
 *                     _type_name: "计算机科学"
 *                   recommendationScore: 38
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               serverError:
 *                 $ref: '#/components/examples/ServerError'
 */
router.get('/popular', async (req, res) => {
  try {
    // 获取请求参数中的推荐数量，默认为10
    const limit = parseInt(req.query.limit) || 10;

    // 获取热门书籍
    const popularBooks = await recommendation.getPopularBooks(limit);

    // 返回热门书籍结果
    res.json({
      success: true,
      message: '获取热门书籍成功',
      data: popularBooks
    });
  } catch (error) {
    console.error('获取热门书籍失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/recommendations/category:
 *   get:
 *     summary: 获取基于分类的推荐书籍
 *     description: |
 *       基于用户借阅历史的分类偏好，推荐用户可能感兴趣的书籍。
 *       
 *       **推荐算法说明：**
 *       - 分析用户借阅过的书籍分类
 *       - 统计每个分类的借阅频率
 *       - 按分类频率降序排序
 *       - 为每个分类推荐用户未借阅的热门书籍
 *       
 *       **推荐分数计算：**
 *       - 推荐分数等于用户借阅该分类的次数
 *       - 同一分类内按借阅次数降序排序
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: 返回的推荐书籍数量
 *     responses:
 *       200:
 *         description: 获取基于分类的推荐成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BookRecommendation'
 *             example:
 *               success: true
 *               message: "获取基于分类的推荐成功"
 *               data:
 *                 - _bid: 1010
 *                   _book_name: "人工智能导论"
 *                   _author: "张三"
 *                   _press: "科学出版社"
 *                   _tid: 1
 *                   _times: 50
 *                   category:
 *                     _tid: 1
 *                     _type_name: "计算机科学"
 *                   recommendationScore: 5
 *                 - _bid: 1015
 *                   _book_name: "机器学习实战"
 *                   _author: "李四"
 *                   _press: "电子工业出版社"
 *                   _tid: 1
 *                   _times: 38
 *                   category:
 *                     _tid: 1
 *                     _type_name: "计算机科学"
 *                   recommendationScore: 5
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/UnauthorizedError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               serverError:
 *                 $ref: '#/components/examples/ServerError'
 */
router.get('/category', authenticate, async (req, res) => {
  try {
    // 从请求中获取用户ID (对应t_user._uid)
    const userId = req.user._uid;
    // 获取请求参数中的推荐数量，默认为10
    const limit = parseInt(req.query.limit) || 10;

    // 获取基于分类的推荐
    const recommendations = await recommendation.getCategoryBasedRecommendations(userId, limit);

    // 返回推荐结果
    res.json({
      success: true,
      message: '获取基于分类的推荐成功',
      data: recommendations
    });
  } catch (error) {
    console.error('获取基于分类的推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/recommendations/collaborative:
 *   get:
 *     summary: 获取基于用户的协同过滤推荐
 *     description: |
 *       基于用户之间的相似度（共同借阅的书籍），推荐相似用户借阅过但当前用户未借阅的书籍。
 *       
 *       **推荐算法说明：**
 *       - 计算用户之间的Jaccard相似系数：J(A,B) = |A∩B| / |A∪B|
 *       - 找出与当前用户最相似的N个用户
 *       - 收集这些相似用户借阅过但当前用户未借阅的书籍
 *       - 按相似度累加值降序排序
 *       
 *       **推荐分数计算：**
 *       - 推荐分数等于所有相似用户的相似度累加值
 *       - 相似度越高，推荐分数越高
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: 返回的推荐书籍数量
 *     responses:
 *       200:
 *         description: 获取协同过滤推荐成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BookRecommendation'
 *             example:
 *               success: true
 *               message: "获取协同过滤推荐成功"
 *               data:
 *                 - _bid: 1010
 *                   _book_name: "人工智能导论"
 *                   _author: "张三"
 *                   _press: "科学出版社"
 *                   _tid: 1
 *                   _times: 50
 *                   category:
 *                     _tid: 1
 *                     _type_name: "计算机科学"
 *                   recommendationScore: 1.25
 *                 - _bid: 1015
 *                   _book_name: "机器学习实战"
 *                   _author: "李四"
 *                   _press: "电子工业出版社"
 *                   _tid: 1
 *                   _times: 38
 *                   category:
 *                     _tid: 1
 *                     _type_name: "计算机科学"
 *                   recommendationScore: 1.0
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/UnauthorizedError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               serverError:
 *                 $ref: '#/components/examples/ServerError'
 */
router.get('/collaborative', authenticate, async (req, res) => {
  try {
    // 从请求中获取用户ID (对应t_user._uid)
    const userId = req.user._uid;
    // 获取请求参数中的推荐数量，默认为10
    const limit = parseInt(req.query.limit) || 10;

    // 获取相似用户，最多5个
    const similarUsers = await recommendation.getSimilarUsers(userId, 5);

    // 如果没有相似用户，返回空结果
    if (similarUsers.length === 0) {
      return res.json({
        success: true,
        message: '没有找到相似用户',
        data: []
      });
    }

    // 获取基于协同过滤的推荐
    const recommendations = await recommendation.getRecommendedBooks(userId, similarUsers);

    // 限制返回数量
    const limitedRecommendations = recommendations.slice(0, limit);

    // 返回推荐结果
    res.json({
      success: true,
      message: '获取协同过滤推荐成功',
      data: limitedRecommendations
    });
  } catch (error) {
    console.error('获取协同过滤推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;
