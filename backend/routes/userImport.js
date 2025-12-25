const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { User, Role } = require('../models');
const { authenticate } = require('../middleware/auth');
const { optimizedBatchImportStudents } = require('../utils/optimizeduserimport');
const { 
  parseUserFile, 
  validateStudents, 
  validateTeachers, 
  validateTempWorkers,
  generateStudentTemplate,
  generateTeacherTemplate,
  generateTempWorkerTemplate,
  findOrCreateDepartment,
  findOrCreateWorkDepartment,
  getOrCreateClassWithHierarchy,
  cleanupTempFile
} = require('../utils/userFileParser');

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // 允许CSV和XLSX文件类型
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.csv' || ext === '.xlsx') {
    cb(null, true);
  } else {
    cb(new Error('只支持CSV和XLSX文件'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * @swagger
 * tags:
 *   name: UserImport
 *   description: 用户批量导入
 */

/**
 * @swagger
 * /api/user-import/students/template:
 *   get:
 *     summary: 下载学生导入模板
 *     description: 下载学生批量导入的Excel模板文件
 *     tags: [UserImport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 模板文件下载成功
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 未授权访问
 */
router.get('/students/template', authenticate, (req, res) => {
  try {
    const templateContent = generateStudentTemplate();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    // 使用URL编码处理中文文件名
    const encodedFilename = encodeURIComponent('学生导入模板.csv');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.send('﻿' + templateContent); // 添加BOM以支持中文
  } catch (error) {
    console.error('生成学生导入模板失败:', error);
    res.status(500).json({
      success: false,
      message: '生成学生导入模板失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/user-import/teachers/template:
 *   get:
 *     summary: 下载教师导入模板
 *     description: 下载教师批量导入的Excel模板文件
 *     tags: [UserImport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 模板文件下载成功
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 未授权访问
 */
router.get('/teachers/template', authenticate, (req, res) => {
  try {
    const templateContent = generateTeacherTemplate();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    // 使用URL编码处理中文文件名
    const encodedFilename = encodeURIComponent('教师导入模板.csv');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.send('﻿' + templateContent); // 添加BOM以支持中文
  } catch (error) {
    console.error('生成教师导入模板失败:', error);
    res.status(500).json({
      success: false,
      message: '生成教师导入模板失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/user-import/tempworkers/template:
 *   get:
 *     summary: 下载临时工导入模板
 *     description: 下载临时工批量导入的Excel模板文件
 *     tags: [UserImport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 模板文件下载成功
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 未授权访问
 */
router.get('/tempworkers/template', authenticate, (req, res) => {
  try {
    const templateContent = generateTempWorkerTemplate();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    // 使用URL编码处理中文文件名
    const encodedFilename = encodeURIComponent('临时工导入模板.csv');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.send('﻿' + templateContent); // 添加BOM以支持中文
  } catch (error) {
    console.error('生成临时工导入模板失败:', error);
    res.status(500).json({
      success: false,
      message: '生成临时工导入模板失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/user-import/students:
 *   post:
 *     summary: 批量导入学生
 *     description: 通过上传Excel文件批量导入学生信息
 *     tags: [UserImport]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 包含学生信息的CSV或XLSX文件
 *     responses:
 *       200:
 *         description: 导入成功
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
 *                     imported:
 *                       type: number
 *                       description: 成功导入的学生数量
 *                     skipped:
 *                       type: number
 *                       description: 跳过的学生数量（已存在）
 *                     errors:
 *                       type: array
 *                       description: 导入错误列表
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
router.post('/students', authenticate, upload.single('file'), async (req, res) => {
  const filePath = req.file ? req.file.path : null;

  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: '请上传文件'
    });
  }

  try {
    // 解析文件
    const studentsData = await parseUserFile(filePath);

    // 验证数据
    const validation = validateStudents(studentsData);

    if (!validation.valid && validation.errors.length > 0) {
      // 清理临时文件
      cleanupTempFile(filePath);

      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validation.errors
      });
    }

    const validStudents = validation.validStudents;
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // 处理每个学生
    for (const student of validStudents) {
      try {
        // 检查账号是否已存在
        const existingUser = await User.findOne({
          where: { _account: student._account }
        });

        if (existingUser) {
          skippedCount++;
          continue;
        }

        // 查找或创建班级及其关联的专业和院系
        const classRecord = await getOrCreateClassWithHierarchy(student._cname);

        // 创建学生用户
        const newUser = await User.create({
          _utype: 'student',
          _account: student._account,
          _name: student._name,
          _password: student._password,
          _email: student._email,
          _cid: classRecord._cid,
          _mid: classRecord._mid,
          _max_num: 10, // 学生默认最大借书数量
          lend_num: 0,
          _access: 1
        });
        
        // 为学生分配读者角色
        const readerRole = await Role.findOne({ where: { _rcode: 'reader' } });
        if (readerRole) {
          await newUser.addRole(readerRole);
        }

        importedCount++;
      } catch (error) {
        console.error('导入学生失败:', error);
        errors.push({
          account: student._account,
          error: error.message
        });
      }
    }

    // 清理临时文件
    cleanupTempFile(filePath);

    res.json({
      success: true,
      message: `学生导入完成，成功导入 ${importedCount} 个，跳过 ${skippedCount} 个`,
      data: {
        imported: importedCount,
        skipped: skippedCount,
        errors: errors
      }
    });
  } catch (error) {
    console.error('导入学生失败:', error);

    // 清理临时文件
    cleanupTempFile(filePath);

    res.status(500).json({
      success: false,
      message: '导入学生失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/user-import/students/optimized:
 *   post:
 *     summary: 优化版批量导入学生
 *     description: 通过上传Excel文件批量导入学生信息，使用优化算法提高导入速度
 *     tags: [UserImport]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 包含学生信息的CSV或XLSX文件
 *               batchSize:
 *                 type: integer
 *                 description: 每批处理的学生数量（默认50）
 *               parallelBatches:
 *                 type: integer
 *                 description: 并行处理的批次数量（默认3）
 *     responses:
 *       200:
 *         description: 导入成功
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
 *                     imported:
 *                       type: number
 *                       description: 成功导入的学生数量
 *                     skipped:
 *                       type: number
 *                       description: 跳过的学生数量（已存在）
 *                     errors:
 *                       type: array
 *                       description: 导入错误列表
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
router.post('/students/optimized', authenticate, upload.single('file'), async (req, res) => {
  const filePath = req.file ? req.file.path : null;
  console.log("开始优化版导入学生数据");
  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: '请上传文件'
    });
  }

  try {
    // 解析文件
    const studentsData = await parseUserFile(filePath);

    // 验证数据
    const validation = validateStudents(studentsData);

    if (!validation.valid && validation.errors.length > 0) {
      // 清理临时文件
      cleanupTempFile(filePath);

      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validation.errors
      });
    }

    const validStudents = validation.validStudents;
    //console.log("我瞧瞧学生数据:", validStudents);
    // 获取导入选项
    const options = {
      batchSize: parseInt(req.body.batchSize) || 50,
      parallelBatches: parseInt(req.body.parallelBatches) || 3,
      skipExisting: true,
      logProgress: true
    };

    // 使用优化函数批量导入学生
    const result = await optimizedBatchImportStudents(validStudents, options);
    //console.log('优化导入学生结果:', result);
    // 清理临时文件
    cleanupTempFile(filePath);

    res.json(result);
  } catch (error) {
    console.error('优化导入学生失败:', error);

    // 清理临时文件
    cleanupTempFile(filePath);

    res.status(500).json({
      success: false,
      message: '优化导入学生失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/user-import/teachers:
 *   post:
 *     summary: 批量导入教师
 *     description: 通过上传Excel文件批量导入教师信息
 *     tags: [UserImport]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 包含教师信息的CSV或XLSX文件
 *     responses:
 *       200:
 *         description: 导入成功
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
 *                     imported:
 *                       type: number
 *                       description: 成功导入的教师数量
 *                     skipped:
 *                       type: number
 *                       description: 跳过的教师数量（已存在）
 *                     errors:
 *                       type: array
 *                       description: 导入错误列表
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
router.post('/teachers', authenticate, upload.single('file'), async (req, res) => {
  const filePath = req.file ? req.file.path : null;
  console.log("开始导入教师数据");
  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: '请上传文件'
    });
  }

  try {
    // 解析文件
    const teachersData = await parseUserFile(filePath);

    // 验证数据
    const validation = validateTeachers(teachersData);

    if (!validation.valid && validation.errors.length > 0) {
      // 清理临时文件
      cleanupTempFile(filePath);

      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validation.errors
      });
    }

    const validTeachers = validation.validTeachers;
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // 处理每个教师
    for (const teacher of validTeachers) {
      try {
        // 检查账号是否已存在
        const existingUser = await User.findOne({
          where: { _account: teacher.account }
        });

        if (existingUser) {
          skippedCount++;
          continue;
        }

        // 查找或创建院系
        const department = await findOrCreateDepartment(teacher.departmentName);

        // 创建教师用户
        const newUser = await User.create({
          _utype: 'teacher',
          _account: teacher.account,
          _name: teacher.name,
          _password: teacher.password,
          _email: teacher.email,
          _did: department._did,
          _max_num: 20, // 教师默认最大借书数量
          lend_num: 0,
          _access: 1
        });
        
        // 为教师分配读者角色
        const readerRole = await Role.findOne({ where: { _rcode: 'reader' } });
        if (readerRole) {
          await newUser.addRole(readerRole);
        }

        importedCount++;
      } catch (error) {
        console.error('导入教师失败:', error);
        errors.push({
          account: teacher.account,
          error: error.message
        });
      }
    }

    // 清理临时文件
    cleanupTempFile(filePath);

    res.json({
      success: true,
      message: `教师导入完成，成功导入 ${importedCount} 个，跳过 ${skippedCount} 个`,
      data: {
        imported: importedCount,
        skipped: skippedCount,
        errors: errors
      }
    });
  } catch (error) {
    console.error('导入教师失败:', error);

    // 清理临时文件
    cleanupTempFile(filePath);

    res.status(500).json({
      success: false,
      message: '导入教师失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/user-import/tempworkers:
 *   post:
 *     summary: 批量导入临时工
 *     description: 通过上传Excel文件批量导入临时工信息
 *     tags: [UserImport]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 包含临时工信息的CSV或XLSX文件
 *     responses:
 *       200:
 *         description: 导入成功
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
 *                     imported:
 *                       type: number
 *                       description: 成功导入的临时工数量
 *                     skipped:
 *                       type: number
 *                       description: 跳过的临时工数量（已存在）
 *                     errors:
 *                       type: array
 *                       description: 导入错误列表
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
router.post('/tempworkers', authenticate, upload.single('file'), async (req, res) => {
  const filePath = req.file ? req.file.path : null;
  console.log("开始导入临时工数据");
  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: '请上传文件'
    });
  }

  try {
    // 解析文件
    const tempWorkersData = await parseUserFile(filePath);

    // 验证数据
    const validation = validateTempWorkers(tempWorkersData);

    if (!validation.valid && validation.errors.length > 0) {
      // 清理临时文件
      cleanupTempFile(filePath);

      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validation.errors
      });
    }

    const validTempWorkers = validation.validTempWorkers;
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // 处理每个临时工
    for (const tempWorker of validTempWorkers) {
      try {
        // 检查账号是否已存在
        const existingUser = await User.findOne({
          where: { _account: tempWorker.account }
        });

        if (existingUser) {
          skippedCount++;
          continue;
        }

        // 查找或创建工作部门
        const workDepartment = await findOrCreateWorkDepartment(tempWorker.workDepartmentName);

        // 创建临时工用户
        const newUser = await User.create({
          _utype: 'tempworker',
          _account: tempWorker.account,
          _name: tempWorker.name,
          _password: tempWorker.password,
          _email: tempWorker.email,
          _wdid: workDepartment._wdid,
          _max_num: 5, // 临时工默认最大借书数量
          lend_num: 0,
          _access: 1
        });
        
        // 为临时工分配读者角色
        const readerRole = await Role.findOne({ where: { _rcode: 'reader' } });
        if (readerRole) {
          await newUser.addRole(readerRole);
        }

        importedCount++;
      } catch (error) {
        console.error('导入临时工失败:', error);
        errors.push({
          account: tempWorker.account,
          error: error.message
        });
      }
    }

    // 清理临时文件
    cleanupTempFile(filePath);

    res.json({
      success: true,
      message: `临时工导入完成，成功导入 ${importedCount} 个，跳过 ${skippedCount} 个`,
      data: {
        imported: importedCount,
        skipped: skippedCount,
        errors: errors
      }
    });
  } catch (error) {
    console.error('导入临时工失败:', error);

    // 清理临时文件
    cleanupTempFile(filePath);

    res.status(500).json({
      success: false,
      message: '导入临时工失败',
      error: error.message
    });
  }
});

module.exports = router;
