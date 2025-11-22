const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');



router.get('/', authenticate, async (req,res) => {
  try {
    const{query,category} = req.query;

    console.log('查询读者:', { query, category, user: req.user });

    let whereCondition = {};

    if (query) {
      whereCondition = {
        [Op.or]: [
          { _uid: { [Op.like]: `%${query}%` } },
          { _utype: { [Op.like]: `%${query}%` } },
          { _account: { [Op.like]: `%${query}%` } },
          { _name: { [Op.like]: `%${query}%` } }
        ]
      }
    }
    const readers = await User.findAll({
      where: whereCondition,
      limit: 50,
    });
    res.json({
      success: true,
      message: '获取读者列表成功',
      data: {
        readerlist: readers
      }
    });
   
  } catch (error) {
    console.error(error);
    res.status(500).json({
       success: false,
       errorCode:'SERVER_ERROR',
       message: '服务器内部错误'
      });
  }
})

module.exports = router;