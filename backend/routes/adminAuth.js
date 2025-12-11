const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticate, requireTerminalAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: AdminAuth
 *   description: 管理员授权管理
 */

/**
 * @swagger
 * /api/admin-auth/grant:
 *   post:
 *     summary: 授权普通管理员
 *     description: 终端管理员授权普通管理员权限，不能对同级管理员进行授权
 *     tags: [AdminAuth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: 要授权的用户ID
 *                 example: 1001
 *     responses:
 *       200:
 *         description: 授权成功
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               invalidUserType:
 *                 summary: 用户类型不是普通用户
 *                 value:
 *                   success: false
 *                   errorCode: "INVALID_USER_TYPE"
 *                   message: "只能授权普通用户为管理员"
 *               sameLevelAdmin:
 *                 summary: 尝试对同级管理员进行授权
 *                 value:
 *                   success: false
 *                   errorCode: "SAME_LEVEL_ADMIN"
 *                   message: "不能对同级管理员进行授权"
 *               userNotFound:
 *                 summary: 用户不存在
 *                 value:
 *                   success: false
 *                   errorCode: "USER_NOT_FOUND"
 *                   message: "用户不存在"
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/UnauthorizedError'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 授权普通管理员
router.post('/grant', authenticate, requireTerminalAdmin, async (req, res) => {
  try {
    // 检查当前用户是否为终端管理员
    if (req.user._utype !== 'admin_t') {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '只有终端管理员可以授权普通管理员'
      });
    }

    const { userId } = req.body;

    // 验证参数
    if (!userId) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_PARAMETER',
        message: '缺少必需的参数: userId'
      });
    }

    // 查找要授权的用户
    const targetUser = await User.findByPk(userId);

    if (!targetUser) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    }

    // 检查目标用户是否已经是管理员
    if (targetUser._utype.includes('admin')) {
      return res.status(400).json({
        success: false,
        errorCode: 'SAME_LEVEL_ADMIN',
        message: '不能对同级管理员进行授权'
      });
    }

    // 检查目标用户是否是普通用户
    if (!['student', 'teacher', 'tempworker'].includes(targetUser._utype)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_USER_TYPE',
        message: '只能授权普通用户为管理员'
      });
    }

    // 授权为普通管理员
    await targetUser.update({
      _utype: 'admin_n'
    });

    res.json({
      success: true,
      message: '授权成功',
      data: {
        user: targetUser
      }
    });
  } catch (error) {
    console.error('授权管理员错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/admin-auth/revoke:
 *   post:
 *     summary: 解除普通管理员权限
 *     description: 终端管理员解除普通管理员权限，不能对同级管理员进行解授权
 *     tags: [AdminAuth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userType
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: 要解除权限的用户ID
 *                 example: 1001
 *               userType:
 *                 type: string
 *                 enum: ['student', 'teacher', 'tempworker']
 *                 description: 解除权限后用户的新类型
 *                 example: 'teacher'
 *     responses:
 *       200:
 *         description: 解除权限成功
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               invalidUserType:
 *                 summary: 目标用户不是普通管理员
 *                 value:
 *                   success: false
 *                   errorCode: "INVALID_USER_TYPE"
 *                   message: "只能解除普通管理员权限"
 *               sameLevelAdmin:
 *                 summary: 尝试对同级管理员进行解授权
 *                 value:
 *                   success: false
 *                   errorCode: "SAME_LEVEL_ADMIN"
 *                   message: "不能对同级管理员进行解授权"
 *               userNotFound:
 *                 summary: 用户不存在
 *                 value:
 *                   success: false
 *                   errorCode: "USER_NOT_FOUND"
 *                   message: "用户不存在"
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 $ref: '#/components/examples/UnauthorizedError'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 解除普通管理员权限
router.post('/revoke', authenticate, requireTerminalAdmin, async (req, res) => {
  try {
    // 检查当前用户是否为终端管理员
    if (req.user._utype !== 'admin_terminal') {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '只有终端管理员可以解除普通管理员权限'
      });
    }

    const { userId, userType } = req.body;

    // 验证参数
    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_PARAMETER',
        message: '缺少必需的参数: userId, userType'
      });
    }

    // 验证用户类型
    if (!['student', 'teacher', 'tempworker'].includes(userType)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_USER_TYPE',
        message: '用户类型必须是: student, teacher, tempworker'
      });
    }

    // 查找要解除权限的用户
    const targetUser = await User.findByPk(userId);

    if (!targetUser) {
      return res.status(400).json({
        success: false,
        errorCode: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    }

    // 检查目标用户是否是普通管理员
    if (targetUser._utype !== 'admin_general') {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_USER_TYPE',
        message: '只能解除普通管理员权限'
      });
    }

    // 解除管理员权限，改为普通用户
    await targetUser.update({
      _utype: userType
    });

    res.json({
      success: true,
      message: '解除权限成功',
      data: {
        user: targetUser
      }
    });
  } catch (error) {
    console.error('解除管理员权限错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
