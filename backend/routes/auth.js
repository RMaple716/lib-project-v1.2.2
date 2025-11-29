const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken, verifyToken } = require('../utils/jwt');
const svgCaptcha = require('svg-captcha');

// 存储验证码的临时存储（生产环境建议使用Redis）
const captchaStore = new Map();

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

    res.status(200).json({
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

    // 密码强度验证
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        errorCode: 'PASSWORD_TOO_SIMPLE',
        message: '密码过于简单，需包含字母、数字和特殊字符，且长度不少于8位'
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
      _password: password,
      _create_time: new Date()
    });

    res.status(200).json({
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

// 重置密码
router.put('/password', async (req, res) => {
  try {
    const { _uid, _password, _captcha, _usertype } = req.body;
    
    console.log('重置密码请求:', { _uid, _usertype });
    
    // 输入验证
    if (!_uid || !_password || !_captcha) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供用户ID、新密码和验证码'
      });
    }

    // 验证验证码
    const storedCaptcha = captchaStore.get(_uid);
    if (!storedCaptcha || storedCaptcha !== _captcha.toUpperCase()) {
      return res.status(400).json({
        success: false,
        errorCode: 'CAPTCHA_INCORRECT',
        message: '验证码错误'
      });
    }

    // 密码强度验证
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(_password)) {
      return res.status(400).json({
        success: false,
        errorCode: 'PASSWORD_TOO_SIMPLE',
        message: '密码过于简单，需包含字母、数字和特殊字符，且长度不少于8位'
      });
    }

    // 查找用户
    const whereCondition = { _uid };
    if (_usertype) {
      whereCondition._utype = _usertype;
    }

    const user = await User.findOne({ where: whereCondition });

    if (!user) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_NOT_EXIST',
        message: '用户不存在'
      });
    }

    // 更新密码
    await user.update({ _password: _password });

    // 清除已使用的验证码
    captchaStore.delete(_uid);

    res.status(200).json({
      success: true,
      message: '重置密码成功',
      data: {
        _uid: user._uid,
        _utype: user._utype,
        _account: user._account,
        _name: user._name,
        _email: user._email
      }
    });

  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

// 获取验证码
router.get('/captcha', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_USER_ID',
        message: '请提供用户ID'
      });
    }

    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1i',
      noise: 2,
      color: true,
      background: '#f0f0f0'
    });

    // 存储验证码（5分钟有效期）
    captchaStore.set(userId, captcha.text.toUpperCase());
    setTimeout(() => {
      captchaStore.delete(userId);
    }, 5 * 60 * 1000);

    res.type('svg');
    res.status(200).json({
      success: true,
      message: '验证码生成成功',
      data: captcha.data
    });

  } catch (error) {
    console.error('生成验证码错误:', error);
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
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        errorCode: 'NOT_LOGGED_IN',
        message: '用户未登录'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        errorCode: 'INVALID_TOKEN',
        message: 'Token无效'
      });
    }

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

    res.status(200).json({
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