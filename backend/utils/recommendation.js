const { sequelize } = require('../config/database');
const { Book, BorrowRecord, User, Category } = require('../models');

/**
 * 基于用户的协同过滤推荐系统
 * 
 * 数据库字段说明：
 * - 用户表(t_user): _uid(用户ID), _name(姓名), _account(账号), _utype(用户类型)
 * - 书籍表(t_book): _bid(书籍ID), _book_name(书名), _author(作者), _press(出版社), _tid(分类ID), _times(借阅次数)
 * - 分类表(t_type): _tid(分类ID), _type_name(分类名称)
 * - 借阅记录表(t_history): _hid(记录ID), _uid(用户ID), _bid(书籍ID), _begin_time(借阅开始时间), _end_date(应还时间), _status(状态)
 */
class RecommendationSystem {
  /**
   * 获取用户借阅历史
   * 
   * @param {number} userId - 用户ID (对应t_user._uid)
   * @returns {Promise<Array>} 用户借阅的书籍ID数组 (对应t_book._bid)
   * 
   * 示例:
   * const borrowedBooks = await getUserBorrowHistory(1001);
   * // 返回: [1001, 1005, 1008, ...]
   */
  async getUserBorrowHistory(userId) {
    try {
      // 查询用户的借阅记录，获取书籍ID
      const records = await BorrowRecord.findAll({
        where: { _uid: userId },
        attributes: ['_bid']
      });

      return records.map(record => record._bid);
    } catch (error) {
      console.error('获取用户借阅历史失败:', error);
      return [];
    }
  }

  /**
   * 计算两个用户之间的相似度（基于共同借阅的书籍）
   * 
   * @param {Array} userABooks - 用户A借阅的书籍ID数组 (对应t_book._bid)
   * @param {Array} userBBooks - 用户B借阅的书籍ID数组 (对应t_book._bid)
   * @returns {number} 相似度分数 (0-1)，使用Jaccard相似系数计算
   * 
   * 示例:
   * const similarity = calculateSimilarity([1001, 1005, 1008], [1001, 1002, 1005]);
   * // 返回: 0.5 (共同借阅2本书，总共借阅4本不同的书)
   */
  calculateSimilarity(userABooks, userBBooks) {
    // 如果任一用户没有借阅记录，相似度为0
    if (!userABooks.length || !userBBooks.length) {
      return 0;
    }

    // 计算交集大小
    const intersection = userABooks.filter(bookId => userBBooks.includes(bookId));
    const intersectionSize = intersection.length;

    // 计算并集大小
    const union = new Set([...userABooks, ...userBBooks]);
    const unionSize = union.size;

    // 使用Jaccard相似系数: J(A,B) = |A∩B| / |A∪B|
    return intersectionSize / unionSize;
  }

  /**
   * 获取相似用户
   * 
   * @param {number} userId - 目标用户ID (对应t_user._uid)
   * @param {number} limit - 返回的相似用户数量，默认为10
   * @returns {Promise<Array>} 相似用户列表，包含用户ID和相似度分数
   * 
   * 示例:
   * const similarUsers = await getSimilarUsers(1001, 5);
   * // 返回: [
   * //   { userId: 1005, similarity: 0.75 },
   * //   { userId: 1008, similarity: 0.5 },
   * //   ...
   * // ]
   */
  async getSimilarUsers(userId, limit = 10) {
    try {
      // 获取目标用户的借阅历史
      const userBooks = await this.getUserBorrowHistory(userId);

      // 如果用户没有借阅记录，返回空数组
      if (!userBooks.length) {
        return [];
      }

      // 获取所有其他用户的借阅历史
      const users = await User.findAll({
        where: { _uid: { [sequelize.Op.ne]: userId } },
        attributes: ['_uid']
      });

      const similarities = [];

      // 计算与每个用户的相似度
      for (const user of users) {
        const otherUserId = user._uid;
        const otherUserBooks = await this.getUserBorrowHistory(otherUserId);

        const similarity = this.calculateSimilarity(userBooks, otherUserBooks);

        // 只保留有相似度的用户
        if (similarity > 0) {
          similarities.push({
            userId: otherUserId,
            similarity
          });
        }
      }

      // 按相似度降序排序
      similarities.sort((a, b) => b.similarity - a.similarity);

      // 返回前N个最相似的用户
      return similarities.slice(0, limit);
    } catch (error) {
      console.error('获取相似用户失败:', error);
      return [];
    }
  }

  /**
   * 获取用户未借阅但相似用户借阅过的书籍
   * 
   * @param {number} userId - 目标用户ID (对应t_user._uid)
   * @param {Array} similarUsers - 相似用户列表，包含用户ID和相似度分数
   * @returns {Promise<Array>} 推荐书籍列表，包含书籍详细信息和推荐分数
   * 
   * 示例:
   * const recommendations = await getRecommendedBooks(1001, [
   *   { userId: 1005, similarity: 0.75 },
   *   { userId: 1008, similarity: 0.5 }
   * ]);
   * // 返回: [
   * //   {
   * //     _bid: 1010,
   * //     _book_name: "人工智能导论",
   * //     _author: "张三",
   * //     _press: "科学出版社",
   * //     _tid: 1,
   * //     category: { _tid: 1, _type_name: "计算机科学" },
   * //     recommendationScore: 1.25
   * //   },
   * //   ...
   * // ]
   */
  async getRecommendedBooks(userId, similarUsers) {
    try {
      // 获取目标用户已借阅的书籍
      const userBooks = await this.getUserBorrowHistory(userId);
      const userBooksSet = new Set(userBooks);

      // 收集相似用户借阅过的书籍
      const bookScores = new Map();

      for (const { userId: similarUserId, similarity } of similarUsers) {
        const similarUserBooks = await this.getUserBorrowHistory(similarUserId);

        for (const bookId of similarUserBooks) {
          // 跳过用户已借阅的书籍
          if (userBooksSet.has(bookId)) {
            continue;
          }

          // 累加相似度作为推荐分数
          if (!bookScores.has(bookId)) {
            bookScores.set(bookId, 0);
          }
          bookScores.set(bookId, bookScores.get(bookId) + similarity);
        }
      }

      // 按推荐分数降序排序
      const sortedBooks = Array.from(bookScores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([bookId, score]) => ({ bookId, score }));

      // 获取书籍详细信息
      const bookIds = sortedBooks.map(item => item.bookId);
      const books = await Book.findAll({
        where: { _bid: bookIds },
        include: [{ model: Category, as: 'category' }]
      });

      // 合并书籍信息和推荐分数
      const recommendations = books.map(book => {
        const scoreItem = sortedBooks.find(item => item.bookId === book._bid);
        return {
          ...book.toJSON(),
          recommendationScore: scoreItem ? scoreItem.score : 0
        };
      });

      // 按推荐分数降序排序
      recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);

      return recommendations;
    } catch (error) {
      console.error('获取推荐书籍失败:', error);
      return [];
    }
  }

  /**
   * 获取热门书籍（基于借阅次数）
   * 
   * @param {number} limit - 返回的热门书籍数量，默认为10
   * @returns {Promise<Array>} 热门书籍列表，包含书籍详细信息和推荐分数
   * 
   * 示例:
   * const popularBooks = await getPopularBooks(5);
   * // 返回: [
   * //   {
   * //     _bid: 1010,
   * //     _book_name: "人工智能导论",
   * //     _author: "张三",
   * //     _press: "科学出版社",
   * //     _tid: 1,
   * //     _times: 50,
   * //     category: { _tid: 1, _type_name: "计算机科学" },
   * //     recommendationScore: 50
   * //   },
   * //   ...
   * // ]
   */
  async getPopularBooks(limit = 10) {
    try {
      // 按借阅次数(_times)降序查询书籍
      const books = await Book.findAll({
        order: [['_times', 'DESC']],
        limit,
        include: [{ model: Category, as: 'category' }]
      });

      // 将借阅次数作为推荐分数
      return books.map(book => ({
        ...book.toJSON(),
        recommendationScore: book._times
      }));
    } catch (error) {
      console.error('获取热门书籍失败:', error);
      return [];
    }
  }

  /**
   * 获取基于分类的推荐书籍
   * 
   * @param {number} userId - 目标用户ID (对应t_user._uid)
   * @param {number} limit - 返回的推荐书籍数量，默认为10
   * @returns {Promise<Array>} 推荐书籍列表，包含书籍详细信息和推荐分数
   * 
   * 示例:
   * const categoryRecommendations = await getCategoryBasedRecommendations(1001, 5);
   * // 返回: [
   * //   {
   * //     _bid: 1010,
   * //     _book_name: "人工智能导论",
   * //     _author: "张三",
   * //     _press: "科学出版社",
   * //     _tid: 1,
   * //     category: { _tid: 1, _type_name: "计算机科学" },
   * //     recommendationScore: 5  // 用户借阅该分类的次数
   * //   },
   * //   ...
   * // ]
   */
  async getCategoryBasedRecommendations(userId, limit = 10) {
    try {
      // 获取用户借阅历史
      const userBooks = await this.getUserBorrowHistory(userId);

      // 如果用户没有借阅记录，返回热门书籍
      if (!userBooks.length) {
        return await this.getPopularBooks(limit);
      }

      // 获取用户借阅过的书籍及其分类
      const userBooksDetails = await Book.findAll({
        where: { _bid: userBooks },
        include: [{ model: Category, as: 'category' }],
        attributes: ['_tid']
      });

      // 统计用户借阅的分类频率
      const categoryFrequency = {};
      userBooksDetails.forEach(book => {
        const categoryId = book._tid;
        if (!categoryFrequency[categoryId]) {
          categoryFrequency[categoryId] = 0;
        }
        categoryFrequency[categoryId]++;
      });

      // 找出用户最常借阅的分类
      const sortedCategories = Object.entries(categoryFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([categoryId, count]) => parseInt(categoryId));

      // 获取用户已借阅的书籍ID集合
      const userBooksSet = new Set(userBooks);

      // 为每个热门分类获取推荐书籍
      const recommendations = [];
      const booksPerCategory = Math.ceil(limit / sortedCategories.length);

      for (const categoryId of sortedCategories) {
        // 获取该分类下用户未借阅的书籍，按借阅次数降序排序
        const categoryBooks = await Book.findAll({
          where: {
            _tid: categoryId,
            _bid: { [sequelize.Op.notIn]: Array.from(userBooksSet) }
          },
          order: [['_times', 'DESC']],
          limit: booksPerCategory,
          include: [{ model: Category, as: 'category' }]
        });

        // 添加推荐分数（基于分类频率）
        const categoryRecommendations = categoryBooks.map(book => ({
          ...book.toJSON(),
          recommendationScore: categoryFrequency[categoryId]
        }));

        recommendations.push(...categoryRecommendations);
      }

      // 按推荐分数降序排序，并限制返回数量
      recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('获取基于分类的推荐书籍失败:', error);
      return [];
    }
  }

  /**
   * 获取综合推荐书籍
   * 
   * 结合基于用户的协同过滤和基于分类的推荐，提供综合推荐结果
   * 
   * @param {number} userId - 目标用户ID (对应t_user._uid)
   * @param {number} limit - 返回的推荐书籍数量，默认为10
   * @returns {Promise<Array>} 推荐书籍列表，包含书籍详细信息和推荐分数
   * 
   * 示例:
   * const recommendations = await getRecommendations(1001, 5);
   * // 返回: [
   * //   {
   * //     _bid: 1010,
   * //     _book_name: "人工智能导论",
   * //     _author: "张三",
   * //     _press: "科学出版社",
   * //     _tid: 1,
   * //     category: { _tid: 1, _type_name: "计算机科学" },
   * //     recommendationScore: 2.75  // 综合推荐分数
   * //   },
   * //   ...
   * // ]
   */
  async getRecommendations(userId, limit = 10) {
    try {
      // 获取基于用户的协同过滤推荐
      const similarUsers = await this.getSimilarUsers(userId, 5);
      const userBasedRecommendations = similarUsers.length > 0 
        ? await this.getRecommendedBooks(userId, similarUsers)
        : [];

      // 获取基于分类的推荐
      const categoryBasedRecommendations = await this.getCategoryBasedRecommendations(userId, limit);

      // 合并推荐结果
      const allRecommendations = [...userBasedRecommendations, ...categoryBasedRecommendations];

      // 去重（基于书籍ID）
      const uniqueRecommendations = [];
      const seenBookIds = new Set();

      for (const recommendation of allRecommendations) {
        if (!seenBookIds.has(recommendation._bid)) {
          seenBookIds.add(recommendation._bid);
          uniqueRecommendations.push(recommendation);
        }
      }

      // 如果推荐数量不足，补充热门书籍
      if (uniqueRecommendations.length < limit) {
        const popularBooks = await this.getPopularBooks(limit - uniqueRecommendations.length);

        // 过滤掉已推荐的书籍
        const additionalBooks = popularBooks.filter(book => 
          !seenBookIds.has(book._bid)
        );

        uniqueRecommendations.push(...additionalBooks);
      }

      // 按推荐分数降序排序，并限制返回数量
      uniqueRecommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      console.error('获取综合推荐书籍失败:', error);
      // 出错时返回热门书籍作为备选
      return await this.getPopularBooks(limit);
    }
  }
}

module.exports = new RecommendationSystem();
