const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { account, password, usertype } = req.body;
    
    console.log('登录请求:', { account, usertype });
    
    // 输入验证
    if (!account || !password || !usertype) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供账号、密码和用户类型'
      });
    }

    // 查找用户
    const user = await User.findOne({
      where: { 
        _account: account,
        _utype: usertype
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_NOT_EXISTS',
        message: '用户不存在'
      });
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        errorCode: 'PASSWORD_INCORRECT',
        message: '密码错误'
      });
    }

    // 生成JWT token
    const token = generateToken({
      _uid: user._uid,
      _utype: user._utype,
      _account: user._account
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        usertype: user._utype,
        userInfo: {
          _uid: user._uid,
          _name: user._name,
          _account: user._account,
          _email: user._email
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { account, name, email, usertype, password } = req.body;
    
    console.log('注册请求:', { account, name, usertype });
    
    // 输入验证
    if (!account || !name || !email || !usertype || !password) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供完整的注册信息'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: { _account: account }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_ALREADY_EXISTS',
        message: '用户已存在'
      });
    }

    // 创建用户
    const user = await User.create({
      _account: account,
      _name: name,
      _email: email,
      _utype: usertype,
      _password: password
    });

    res.json({
      success: true,
      message: '注册成功',
      data: {
        _uid: user._uid,
        _utype: user._utype,
        _account: user._account,
        _name: user._name
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

// 获取当前用户信息
router.get('/current-user', async (req, res) => {
  try {
    // 这里简化处理，实际应该从token中获取用户ID
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        errorCode: 'NOT_LOGGED_IN',
        message: '用户未登录'
      });
    }

    const token = authHeader.substring(7);
    const decoded = require('../utils/jwt').verifyToken(token);
    
    const user = await User.findByPk(decoded._uid, {
      attributes: { exclude: ['_password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        errorCode: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '获取用户信息成功',
      data: user
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;