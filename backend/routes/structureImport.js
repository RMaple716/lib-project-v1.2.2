const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { Department, Major, Class } = require('../models');
const { authenticate } = require('../middleware/auth');
const { parseUserFile, cleanupTempFile } = require('../utils/userFileParser');
const { 
  generateDepartmentTemplate, 
  generateMajorTemplate, 
  generateClassTemplate 
} = require('../utils/structureTemplate');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // 生成随机文件名，但保留原始文件的扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    cb(null, randomName + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx') {
      cb(null, true);
    } else {
      cb(new Error('只支持CSV和XLSX文件格式'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

/**
 * @swagger
 * /api/structure/departments/template:
 *   get:
 *     summary: 下载院系导入模板
 *     tags: [结构导入]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回院系导入模板
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
router.get('/departments/template', authenticate, async (req, res) => {
  try {
    const templateContent = generateDepartmentTemplate();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    // 使用URL编码处理中文文件名
    const encodedFilename = encodeURIComponent('院系导入模板.csv');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.send('\uFEFF' + templateContent); // 添加BOM以支持中文
  } catch (error) {
    console.error('生成院系导入模板失败:', error);
    res.status(500).json({
      success: false,
      message: '生成模板失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/structure/majors/template:
 *   get:
 *     summary: 下载专业导入模板
 *     tags: [结构导入]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回专业导入模板
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
router.get('/majors/template', authenticate, async (req, res) => {
  try {
    const templateContent = generateMajorTemplate();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    // 使用URL编码处理中文文件名
    const encodedFilename = encodeURIComponent('专业导入模板.csv');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.send('\uFEFF' + templateContent); // 添加BOM以支持中文
  } catch (error) {
    console.error('生成专业导入模板失败:', error);
    res.status(500).json({
      success: false,
      message: '生成模板失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/structure/classes/template:
 *   get:
 *     summary: 下载班级导入模板
 *     tags: [结构导入]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回班级导入模板
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
router.get('/classes/template', authenticate, async (req, res) => {
  try {
    const templateContent = generateClassTemplate();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    // 使用URL编码处理中文文件名
    const encodedFilename = encodeURIComponent('班级导入模板.csv');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.send('\uFEFF' + templateContent); // 添加BOM以支持中文
  } catch (error) {
    console.error('生成班级导入模板失败:', error);
    res.status(500).json({
      success: false,
      message: '生成模板失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/structure/departments:
 *   post:
 *     summary: 导入院系数据
 *     tags: [结构导入]
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
 *                 description: 包含院系信息的CSV或XLSX文件
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
 *                       description: 成功导入的院系数量
 *                     skipped:
 *                       type: number
 *                       description: 跳过的院系数量（已存在）
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
router.post('/departments', authenticate, upload.single('file'), async (req, res) => {
  const filePath = req.file ? req.file.path : null;

  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: '请上传文件'
    });
  }

  try {
    // 解析文件
    const departmentsData = await parseUserFile(filePath);

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // 处理每个院系
    for (const deptData of departmentsData) {
      try {
        // 检查院系名称是否存在
        const deptName = deptData['院系名称'] || deptData.name || '';

        if (!deptName) {
          errors.push({
            row: departmentsData.indexOf(deptData) + 1,
            message: '院系名称不能为空'
          });
          continue;
        }

        const existingDept = await Department.findOne({
          where: { name: deptName }
        });

        if (existingDept) {
          skippedCount++;
          continue;
        }

        // 创建院系
        await Department.create({
          name: deptName
        });

        importedCount++;
      } catch (error) {
        console.error('导入院系失败:', error);
        errors.push({
          row: departmentsData.indexOf(deptData) + 1,
          message: error.message
        });
      }
    }

    // 清理临时文件
    cleanupTempFile(filePath);

    res.json({
      success: true,
      message: `院系导入完成，成功导入 ${importedCount} 个，跳过 ${skippedCount} 个`,
      data: {
        imported: importedCount,
        skipped: skippedCount,
        errors
      }
    });
  } catch (error) {
    // 清理临时文件
    cleanupTempFile(filePath);

    console.error('导入院系失败:', error);
    res.status(500).json({
      success: false,
      message: '导入失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/structure/majors:
 *   post:
 *     summary: 导入专业数据
 *     tags: [结构导入]
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
 *                 description: 包含专业信息的CSV或XLSX文件
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
 *                       description: 成功导入的专业数量
 *                     skipped:
 *                       type: number
 *                       description: 跳过的专业数量（已存在）
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
router.post('/majors', authenticate, upload.single('file'), async (req, res) => {
  const filePath = req.file ? req.file.path : null;

  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: '请上传文件'
    });
  }

  try {
    // 解析文件
    const majorsData = await parseUserFile(filePath);

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // 处理每个专业
    for (const majorData of majorsData) {
      try {
        // 检查专业名称和所属院系是否存在
        const majorName = majorData['专业名称'] || majorData.name || '';
        const deptName = majorData['所属院系'] || majorData.department || '';

        if (!majorName) {
          errors.push({
            row: majorsData.indexOf(majorData) + 1,
            message: '专业名称不能为空'
          });
          continue;
        }

        if (!deptName) {
          errors.push({
            row: majorsData.indexOf(majorData) + 1,
            message: '所属院系不能为空'
          });
          continue;
        }

        // 查找院系
        const department = await Department.findOne({
          where: { name: deptName }
        });

        if (!department) {
          errors.push({
            row: majorsData.indexOf(majorData) + 1,
            message: `院系 "${deptName}" 不存在，请先导入院系`
          });
          continue;
        }

        // 检查专业是否已存在
        const existingMajor = await Major.findOne({
          where: { name: majorName }
        });

        if (existingMajor) {
          skippedCount++;
          continue;
        }

        // 创建专业
        await Major.create({
          name: majorName,
          department_id: department.id
        });

        importedCount++;
      } catch (error) {
        console.error('导入专业失败:', error);
        errors.push({
          row: majorsData.indexOf(majorData) + 1,
          message: error.message
        });
      }
    }

    // 清理临时文件
    cleanupTempFile(filePath);

    res.json({
      success: true,
      message: `专业导入完成，成功导入 ${importedCount} 个，跳过 ${skippedCount} 个`,
      data: {
        imported: importedCount,
        skipped: skippedCount,
        errors
      }
    });
  } catch (error) {
    // 清理临时文件
    cleanupTempFile(filePath);

    console.error('导入专业失败:', error);
    res.status(500).json({
      success: false,
      message: '导入失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/structure/classes:
 *   post:
 *     summary: 导入班级数据
 *     tags: [结构导入]
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
 *                 description: 包含班级信息的CSV或XLSX文件
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
 *                       description: 成功导入的班级数量
 *                     skipped:
 *                       type: number
 *                       description: 跳过的班级数量（已存在）
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
router.post('/classes', authenticate, upload.single('file'), async (req, res) => {
  const filePath = req.file ? req.file.path : null;

  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: '请上传文件'
    });
  }

  try {
    // 解析文件
    const classesData = await parseUserFile(filePath);

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // 处理每个班级
    for (const classData of classesData) {
      try {
        // 检查班级名称和所属专业是否存在
        const className = classData['班级名称'] || classData.name || '';
        const majorName = classData['所属专业'] || classData.major || '';

        if (!className) {
          errors.push({
            row: classesData.indexOf(classData) + 1,
            message: '班级名称不能为空'
          });
          continue;
        }

        if (!majorName) {
          errors.push({
            row: classesData.indexOf(classData) + 1,
            message: '所属专业不能为空'
          });
          continue;
        }

        // 查找专业
        const major = await Major.findOne({
          where: { name: majorName }
        });

        if (!major) {
          errors.push({
            row: classesData.indexOf(classData) + 1,
            message: `专业 "${majorName}" 不存在，请先导入专业`
          });
          continue;
        }

        // 检查班级是否已存在
        const existingClass = await Class.findOne({
          where: { name: className }
        });

        if (existingClass) {
          skippedCount++;
          continue;
        }

        // 创建班级
        await Class.create({
          name: className,
          major_id: major.id
        });

        importedCount++;
      } catch (error) {
        console.error('导入班级失败:', error);
        errors.push({
          row: classesData.indexOf(classData) + 1,
          message: error.message
        });
      }
    }

    // 清理临时文件
    cleanupTempFile(filePath);

    res.json({
      success: true,
      message: `班级导入完成，成功导入 ${importedCount} 个，跳过 ${skippedCount} 个`,
      data: {
        imported: importedCount,
        skipped: skippedCount,
        errors
      }
    });
  } catch (error) {
    // 清理临时文件
    cleanupTempFile(filePath);

    console.error('导入班级失败:', error);
    res.status(500).json({
      success: false,
      message: '导入失败',
      error: error.message
    });
  }
});

module.exports = router;
