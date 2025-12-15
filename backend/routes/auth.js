const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken, verifyToken } = require('../utils/jwt');
const svgCaptcha = require('svg-captcha');
const emailService = require('../utils/email');

// 存储验证码的临时存储（生产环境建议使用Redis）
const captchaStore = new Map();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 用户登录系统，获取访问令牌
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             adminExample:
 *               summary: 管理员登录
 *               value:
 *                 account: "admin_t"
 *                 password: "admin123"
 *                 usertype: "admin_t"
 *             studentExample:
 *               summary: 学生登录
 *               value:
 *                 account: "student001"
 *                 password: "Student123!"
 *                 usertype: "student"
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                         usertype:
 *                           type: string
 *                         userInfo:
 *                           $ref: '#/components/schemas/User'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/LoginSuccess'
 *       400:
 *         description: 请求参数错误或用户不存在
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 $ref: '#/components/examples/MissingFieldsError'
 *               userNotFound:
 *                 $ref: '#/components/examples/UserNotFoundError'
 *               passwordError:
 *                 $ref: '#/components/examples/PasswordError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */

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

    console.log(`登陆成功：用户：`, user._name, '，类型：', user._utype);

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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     description: 注册新用户账号
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             studentExample:
 *               summary: 学生注册
 *               value:
 *                 account: "student001"
 *                 name: "张三"
 *                 email: "zhangsan@example.com"
 *                 usertype: "student"
 *                 password: "Student123!"
 *             teacherExample:
 *               summary: 教师注册
 *               value:
 *                 account: "teacher001"
 *                 name: "李老师"
 *                 email: "lilaoshi@example.com"
 *                 usertype: "teacher"
 *                 password: "Teacher123!"
 *     responses:
 *       200:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/RegisterSuccess'
 *       400:
 *         description: 请求参数错误或用户已存在
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 $ref: '#/components/examples/MissingFieldsError'
 *               userExists:
 *                 $ref: '#/components/examples/UserExistsError'
 *               passwordSimple:
 *                 $ref: '#/components/examples/PasswordSimpleError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */

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

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: 重置密码
 *     description: 通过验证码重置用户密码
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _uid
 *               - _password
 *               - _captcha
 *             properties:
 *               _uid:
 *                 type: integer
 *                 description: 用户ID
 *                 example: 1
 *               _password:
 *                 type: string
 *                 description: 新密码
 *                 example: "NewPassword123!"
 *               _captcha:
 *                 type: string
 *                 description: 验证码
 *                 example: "ABCD"
 *               _usertype:
 *                 type: string
 *                 description: 用户类型（可选）
 *                 example: "student"
 *           examples:
 *             resetExample:
 *               summary: 重置密码请求
 *               value:
 *                 _uid: 1
 *                 _password: "NewPassword123!"
 *                 _captcha: "ABCD"
 *                 _usertype: "student"
 *     responses:
 *       200:
 *         description: 密码重置成功
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "重置密码成功"
 *               data:
 *                 _uid: 1
 *                 _utype: "student"
 *                 _account: "student001"
 *                 _name: "张三"
 *                 _email: "zhangsan@example.com"
 *       400:
 *         description: 请求参数错误或验证码错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 summary: 缺少必填字段
 *                 value:
 *                   success: false
 *                   errorCode: "MISSING_FIELDS"
 *                   message: "请提供用户ID、新密码和验证码"
 *               captchaError:
 *                 summary: 验证码错误
 *                 value:
 *                   success: false
 *                   errorCode: "CAPTCHA_INCORRECT"
 *                   message: "验证码错误"
 *               passwordSimple:
 *                 $ref: '#/components/examples/PasswordSimpleError'
 *               userNotFound:
 *                 summary: 用户不存在
 *                 value:
 *                   success: false
 *                   errorCode: "USER_NOT_EXIST"
 *                   message: "用户不存在"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */

// 重置密码
router.put('/password', async (req, res) => {
  try {
    const { _uid, _password, _captcha, _usertype } = req.body;
    
    console.log('重置密码请求:', { _uid, _usertype, _password, _captcha });
    
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

/**
 * @swagger
 * /api/auth/captcha:
 *   get:
 *     summary: 获取验证码
 *     description: 获取图形验证码，返回包含SVG数据的JSON响应
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 验证码生成成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: string
 *                       description: SVG格式的验证码图像数据
 *             examples:
 *               success:
 *                 summary: 验证码生成成功
 *                 value:
 *                   success: true
 *                   message: "验证码生成成功"
 *                   data: "<svg width='150' height='50' viewBox='0 0 150 50' xmlns='http://www.w3.org/2000/svg'><!-- SVG内容 --></svg>"
 *       400:
 *         description: 缺少用户ID参数
 *         content:
 *           application/json:
 *             examples:
 *               missingUserId:
 *                 summary: 缺少用户ID
 *                 value:
 *                   success: false
 *                   errorCode: "MISSING_USER_ID"
 *                   message: "请提供用户ID"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */

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

/**
 * @swagger
 * /api/auth/current-user:
 *   get:
 *     summary: 获取当前用户信息
 *     description: 通过JWT令牌获取当前登录用户信息
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取用户信息成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *             examples:
 *               adminUser:
 *                 summary: 管理员用户信息
 *                 value:
 *                   success: true
 *                   message: "获取用户信息成功"
 *                   data:
 *                     _uid: 1
 *                     _utype: "admin_t"
 *                     _account: "admin_t"
 *                     _name: "系统管理员"
 *                     _email: "admin@library.com"
 *                     _max_num: 50
 *                     lend_num: 0
 *                     _access: 1
 *                     _create_time: "2024-01-01T00:00:00.000Z"
 *               studentUser:
 *                 summary: 学生用户信息
 *                 value:
 *                   success: true
 *                   message: "获取用户信息成功"
 *                   data:
 *                     _uid: 1001
 *                     _utype: "student"
 *                     _account: "student001"
 *                     _name: "张三"
 *                     _email: "zhangsan@example.com"
 *                     _max_num: 10
 *                     lend_num: 2
 *                     _access: 1
 *                     _create_time: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: 未授权或Token无效
 *         content:
 *           application/json:
 *             examples:
 *               notLoggedIn:
 *                 summary: 用户未登录
 *                 value:
 *                   success: false
 *                   errorCode: "NOT_LOGGED_IN"
 *                   message: "用户未登录"
 *               invalidToken:
 *                 summary: Token无效
 *                 value:
 *                   success: false
 *                   errorCode: "INVALID_TOKEN"
 *                   message: "Token无效"
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               errorCode: "USER_NOT_FOUND"
 *               message: "用户不存在"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 *             
 */

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

    console.log(`获取当前用户信息成功：用户：`, user._name, '，类型：', user._utype);
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

/**
 * @swagger
 * /api/auth/password:
 *   post:
 *     summary: 忘记密码
 *     description: 用户忘记密码时，通过账号和邮箱验证后发送重置密码指引
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account
 *               - email
 *             properties:
 *               account:
 *                 type: string
 *                 description: 用户账号
 *                 example: "student001"
 *               email:
 *                 type: string
 *                 description: 用户邮箱
 *                 example: "user@example.com"
 *           examples:
 *             forgotPasswordExample:
 *               summary: 忘记密码请求
 *               value:
 *                 account: "student001"
 *                 email: "user@example.com"
 *     responses:
 *       200:
 *         description: 请求成功
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               _uid: 2
 *               _utype: "student"
 *               message: "验证信息已发送至您的邮箱"
 *       400:
 *         description: 请求参数错误或用户不存在
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 summary: 缺少必填字段
 *                 value:
 *                   success: false
 *                   errorCode: "MISSING_FIELDS"
 *                   message: "请提供账号和邮箱"
 *               userNotFound:
 *                 summary: 用户不存在
 *                 value:
 *                   success: false
 *                   errorCode: "USER_NOT_EXISTS"
 *                   message: "用户不存在或邮箱不匹配"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 忘记密码
router.post('/password', async (req, res) => {
  try {
    const { account, email } = req.body;

    console.log('忘记密码请求:', { account, email });

    // 输入验证
    if (!account || !email) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供账号和邮箱'
      });
    }
    
    // 查找用户
    const user = await User.findOne({
      where: { 
        _account: account,
        _email: email
      }
    });
    const uid = user._uid;
    const utype = user._utype;
    if (!user) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_NOT_EXISTS',
        message: '用户不存在或邮箱不匹配'
      });
    }
    
    // 生成重置密码的验证码
    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 存储验证码（10分钟有效期）
    captchaStore.set(user._uid.toString(), resetCode);
    setTimeout(() => {
      captchaStore.delete(user._uid.toString());
    }, 10 * 60 * 1000);
    
    // 发送邮件
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">图书管理系统 - 密码重置</h2>
        <p>尊敬的 ${user._name}，</p>
        <p>您请求重置密码。您的验证码是：</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
          ${resetCode}
        </div>
        <p>验证码有效期为10分钟。如果您没有请求重置密码，请忽略此邮件。</p>
        <p style="margin-top: 30px; font-size: 12px; color: #888;">图书管理系统</p>
      </div>
    `;
    
    try {
      const result = await emailService.sendEmail(
        user._email,
        '图书管理系统 - 密码重置',
        emailContent
      );
      
      if (result.success) {
        console.log(`已向用户 ${user._name} (${user._email}) 发送密码重置邮件`);
      } else {
        console.error(`邮件发送失败: ${result.error}`);
      }
    } catch (emailError) {
      console.error('发送邮件过程中发生错误:', emailError);
      // 即使邮件发送失败，也返回成功，避免暴露系统信息
      // 在生产环境中，可能需要添加重试机制或记录日志
    }

    res.status(200).json({
      success: true,
      _uid: uid,
      _utype: utype,
      message: '验证信息已发送至您的邮箱'
    });
  } catch (error) {
    console.error('忘记密码错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;