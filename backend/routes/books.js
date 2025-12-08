const { parseFile, validateBooks, generateCSVTemplate, cleanupTempFile } = require('../utils/fileParser');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const router = express.Router();
const { Book, BorrowRecord, User, Category, sequelize } = require('../models');
const { authenticate } = require('../middleware/auth');

// 配置multer（在路由定义之前添加）
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
  // 允许的文件类型
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持CSV和Excel文件'), false);
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
 *   name: Books
 *   description: 图书管理
 */

/**
 * @swagger
 * /api/books/bulk-upload:
 *   post:
 *     summary: 批量上传图书
 *     description: |
 *       通过CSV或Excel文件批量上传图书，需要管理员权限。
 *       
 *       **支持的文件格式：**
 *       - CSV文件 (.csv)
 *       - Excel文件 (.xlsx, .xls)
 *       
 *       **文件大小限制：** 10MB
 *       
 *       **模板格式：**
 *       ```
 *       图书名称,ISBN,库存数量,作者,出版社,分类ID,封面URL
 *       JavaScript高级程序设计,9787115275790,10,Nicholas C. Zakas,人民邮电出版社,1,https://example.com/cover.jpg
 *       ```
 *       
 *       **数据验证规则：**
 *       - 图书名称、ISBN、作者、出版社为必填字段
 *       - 库存数量必须为非负整数
 *       - 分类ID必须为有效正整数
 *       - ISBN不能重复
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/BulkUploadTemplateRequest'
 *           examples:
 *             csvExample:
 *               summary: CSV文件示例
 *               description: 包含正确格式的CSV文件
 *               value:
 *                 file: "@/uploads/test.csv"
 *             excelExample:
 *               summary: Excel文件示例
 *               description: 包含正确格式的Excel文件
 *               value:
 *                 file: "@/uploads/test.xlsx"
 *     responses:
 *       200:
 *         description: 批量上传成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/BulkUploadResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/BulkUploadSuccess'
 *               partialSuccess:
 *                 $ref: '#/components/examples/BulkUploadPartialSuccess'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFile:
 *                 $ref: '#/components/examples/MissingFileError'
 *               invalidFileType:
 *                 $ref: '#/components/examples/InvalidFileTypeError'
 *               validationFailed:
 *                 $ref: '#/components/examples/BulkUploadValidationFailed'
 *               emptyFile:
 *                 $ref: '#/components/examples/BulkUploadEmptyFile'
 *               duplicateISBN:
 *                 $ref: '#/components/examples/BulkUploadDuplicateISBN'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       413:
 *         description: 文件大小超过限制
 *         content:
 *           application/json:
 *             examples:
 *               fileTooLarge:
 *                 $ref: '#/components/examples/FileTooLargeError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               fileParseError:
 *                 $ref: '#/components/examples/FileParseError'
 *               databaseError:
 *                 $ref: '#/components/examples/BulkUploadDatabaseError'
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */


// 批量上传图书 - 添加在现有路由之后
router.post('/bulk-upload', authenticate, upload.single('file'), async (req, res) => {
  console.log('开始处理批量上传');
  try {
    // 检查用户权限
    if (!req.user._utype.includes('admin')) {
      console.log('没有权限批量上传图书', req.user._utype);
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FILE',
        message: '请选择上传文件'
      });
    }

        // 解析文件
    const fileExt = path.extname(req.file.originalname).toLowerCase().substring(1);
    console.log('解析文件:', req.file.path);
    const booksData = await parseFile(req.file.path, fileExt);
    console.log('解析后的数据:', booksData);

    // 验证数据
    console.log('开始验证图书数据');
    const validationResult = await validateBooks(booksData,sequelize);
    console.log('验证结果:', validationResult);
    console.log("验证属实吗？",validationResult.valid);
    if (!validationResult.valid) {
      console.log('数据验证失败:', validationResult.errors);
      cleanupTempFile(req.file.path);
      return res.status(400).json({
        success: false,
        errorCode: 'DATA_VALIDATION_FAILED',
        message: '数据验证失败',
        errors: validationResult.errors,
        validCount: validationResult.validCount,
        invalidCount: validationResult.invalidCount
      });
    }
    
    // 批量插入（保留原来的bulkInsertBooks函数）
    console.log('开始批量插入图书');
    const insertResult = await bulkInsertBooks(validationResult.validBooks);
    console.log('插入结果:', insertResult);

    cleanupTempFile(req.file.path);
    
    res.json({
      success: true,
      message: '批量上传完成',
      data: {
        total: booksData.length,
        inserted: insertResult.insertedCount,
        updated: insertResult.updatedCount,
        skipped: insertResult.skippedCount,
        errors: insertResult.errors,
        newCategories: insertResult.newCategories || []
      }
    });
  } catch (error) {
    console.error('批量上传错误:', error);
    
    // 确保删除上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/bulk-upload/template:
 *   get:
 *     summary: 下载批量上传模板
 *     description: 下载CSV格式的图书批量上传模板文件，包含标准字段格式和示例数据
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV模板文件
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: |
 *                 图书名称,ISBN,库存数量,作者,出版社,分类ID,封面URL
 *                 JavaScript高级程序设计,9787115275790,10,Nicholas C. Zakas,人民邮电出版社,1,https://example.com/cover.jpg
 *             examples:
 *               template:
 *                 $ref: '#/components/examples/TemplateDownloadSuccess'
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


// 下载模板 - 添加在现有路由之后
router.get('/bulk-upload/template', authenticate, async (req, res) => {
  try {
    // 检查用户权限
    if (!req.user._utype.includes('admin')) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

    const templateContent = generateCSVTemplate();
    const fileName = '图书批量上传模板.csv';
    const encodedFileName = encodeURIComponent(fileName);

    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    // 使用 RFC 5987 标准格式编码文件名
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    
    // 添加BOM以支持Excel正确打开CSV文件
    const BOM = '\uFEFF';
    res.send(BOM + templateContent);
  } catch (error) {
    console.error('下载模板错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});


// 批量插入图书的辅助函数
// 在 bulkInsertBooks 函数中添加更多日志
async function bulkInsertBooks(booksData) {
  console.log('开始批量插入图书，输入数据:', booksData);
  
  try {
    const transaction = await sequelize.transaction();
    let results = [];
    let errors = [];

    for (const bookData of booksData) {
      try {
        console.log('\n处理图书数据:', bookData);
        
        // 检查图书是否已存在
        const existingBook = await Book.findOne({
          where: { _isbn: bookData._isbn },
          transaction
        });
        
        console.log('查找现有图书结果:', existingBook);
        
        if (existingBook) {
          console.log('更新已存在的图书:', existingBook._book_name);
          const updatedBook = await existingBook.update(bookData, { transaction });
          results.push({
            ...updatedBook.toJSON(),
            action: 'updated'
          });
        } else {
          console.log('创建新图书:', bookData._book_name);
          const newBook = await Book.create(bookData, { transaction });
          results.push({
            ...newBook.toJSON(),
            action: 'inserted'
          });
        }
      } catch (error) {
        console.error('处理图书失败:', error);
        errors.push({
          isbn: bookData._isbn,
          title: bookData._book_name,
          error: error.message
        });
      }
    }
    
    console.log('\n准备提交事务，处理结果:', results);
    await transaction.commit();
    
    const result = {
      success: errors.length === 0,
      message: errors.length === 0 ? "批量上传成功" : "批量上传完成，但部分记录处理失败",
      data: {
        total: booksData.length,
        inserted: results.filter(r => r.action === 'inserted').length,
        updated: results.filter(r => r.action === 'updated').length,
        skipped: booksData.length - results.length,
        processed: results.length,
        errors: errors,
        results: results.map(r => ({
          _bid: r._bid,
          _book_name: r._book_name,
          _isbn: r._isbn,
          action: r.action
        }))
      }
    };
    
    console.log('\n批量插入最终结果:', result);
    return result;
  } catch (error) {
    console.error('批量插入失败:', error);
    throw error;
  }
}




/**
 * @swagger
 * /api/books/rank:
 *   get:
 *     summary: 获取图书借阅排名
 *     description: 获取借阅次数最多的前10本图书
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取图书排名成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/BookRankResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/BookRankSuccess'
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
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */

// 图书借阅排名
router.get('/rank', authenticate, async (req, res) => {
  try {
    const topBooks = await Book.findAll({
      order: [['_times', 'DESC']],
      limit: 10,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['_type_name']
      }]
    });

    res.json({
      success: true,
      message: '获取图书排名成功',
      data: {
        res_rank: topBooks
      }
    });

  } catch (error) {
    console.error('获取图书排名错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: 获取图书列表
 *     description: 获取图书列表，支持按关键词搜索和按分类筛选
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: 搜索关键词（图书名称、作者、出版社）
 *         example: "JavaScript"
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: 分类ID
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *         example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量
 *         example: 20
 *     responses:
 *       200:
 *         description: 获取图书列表成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/BookListResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/BookListSuccess'
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
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */

// 获取图书列表（需要认证）
router.get('/', authenticate, async (req, res) => {
  try {
    const { query, category } = req.query;
    
    console.log('查询图书:', { query, category, user: req.user });
    
    let whereCondition = {};
    
    // 搜索条件
    if (query) {
      whereCondition = {
        [Op.or]: [
          { _book_name: { [Op.like]: `%${query}%` } },
          { _author: { [Op.like]: `%${query}%` } },
          { _press: { [Op.like]: `%${query}%` } }
        ]
      };
    }
    
    // 分类筛选
    if (category) {
      whereCondition._tid = category;
    }

    const books = await Book.findAll({
      where: whereCondition,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['_type_name']
      }],
    });
    
    const formattedBooks = books.map(book => {
    const bookData = book.toJSON();
      return {
        ...bookData,
        _type_name: bookData.category ? bookData.category._type_name : null,
        category: undefined // 删除category对象
      };
    });


    res.json({
      success: true,
      message: '获取图书列表成功',
      data: {
        booklist: formattedBooks
      }
    });

  } catch (error) {
    console.error('获取图书列表错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: 新增图书
 *     description: 添加新图书，需要管理员权限
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookRequest'
 *           examples:
 *             computerBook:
 *               summary: 计算机图书
 *               value:
 *                 _book_name: "JavaScript高级程序设计"
 *                 _isbn: "9787115275790"
 *                 _num: 10
 *                 _author: "Nicholas C. Zakas"
 *                 _press: "人民邮电出版社"
 *                 _tid: 1
 *                 _cover_url: "https://example.com/cover.jpg"
 *             literatureBook:
 *               summary: 文学图书
 *               value:
 *                 _book_name: "三体"
 *                 _isbn: "9787536692930"
 *                 _num: 5
 *                 _author: "刘慈欣"
 *                 _press: "重庆出版社"
 *                 _tid: 2
 *                 _cover_url: "https://example.com/cover2.jpg"
 *     responses:
 *       200:
 *         description: 图书添加成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/CreateBookSuccess'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 $ref: '#/components/examples/MissingFieldsError'
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
// 新增图书（管理员功能）
router.post('/', authenticate, async (req, res) => {
  try {
    // 检查用户权限
    if (!req.user._utype.includes('admin')) {
      console.log('没有权限添加图书', req.user._utype);
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

    const { _book_name, _isbn, _num, _author, _press, _tid, _cover_url } = req.body;
    
    // 输入验证
    if (!_book_name || !_isbn || !_num || !_author || !_press || !_tid) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供完整的图书信息'
      });
    }

    const book = await Book.create({
      _book_name,
      _isbn,
      _num,
      _author,
      _press,
      _tid,
      _cover_url
    });

    res.json({
      success: true,
      message: '图书添加成功',
      data: book
    });

  } catch (error) {
    console.error('添加图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: 获取图书详情
 *     description: 根据图书ID获取图书的详细信息
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 图书ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 获取图书详情成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/BookDetailSuccess'
 *       404:
 *         description: 图书不存在
 *         content:
 *           application/json:
 *             examples:
 *               bookNotFound:
 *                 $ref: '#/components/examples/BookNotFoundError'
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
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 获取图书详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await Book.findByPk(id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['_type_name']
      }]
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        errorCode: 'BOOK_NOT_FOUND',
        message: '图书不存在'
      });
    }

    res.json({
      success: true,
      message: '成功获取图书详情',
      data: book
    });

  } catch (error) {
    console.error('获取图书详情错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: 更新图书信息
 *     description: 根据图书ID更新图书信息，需要管理员权限
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 图书ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookRequest'
 *           examples:
 *             updateExample:
 *               summary: 更新图书信息
 *               value:
 *                 _book_name: "更新后的图书名称"
 *                 _isbn: "9787115275790"
 *                 _num: 8
 *                 _author: "Nicholas C. Zakas"
 *                 _press: "人民邮电出版社"
 *                 _tid: 1
 *                 _cover_url: "https://example.com/updated-cover.jpg"
 *     responses:
 *       200:
 *         description: 图书信息更新成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/UpdateBookSuccess'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 $ref: '#/components/examples/MissingFieldsError'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       404:
 *         description: 图书不存在
 *         content:
 *           application/json:
 *             examples:
 *               bookNotFound:
 *                 $ref: '#/components/examples/BookNotFoundError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 更新图书信息
router.put('/:id', authenticate, async (req, res) => {
  try {
    // 检查用户权限
    if (!req.user._utype.includes('admin')) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

    const { id } = req.params;
    const { _book_name, _isbn, _num, _author, _press, _tid, _cover_url } = req.body;
    
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        errorCode: 'BOOK_NOT_FOUND',
        message: '图书不存在'
      });
    }

    // 输入验证
    if (!_book_name || !_isbn || !_num || !_author || !_press || !_tid) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: '请提供完整的图书信息'
      });
    }

    await book.update({
      _book_name,
      _isbn,
      _num,
      _author,
      _press,
      _tid,
      _cover_url
    });

    res.json({
      success: true,
      message: '图书信息更新成功',
      data: book
    });

  } catch (error) {
    console.error('更新图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: 删除图书
 *     description: 根据图书ID删除图书，需要管理员权限。如果图书有未归还的借阅记录，则无法删除。
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 图书ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 图书删除成功
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/DeleteBookSuccess'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             examples:
 *               permissionDenied:
 *                 $ref: '#/components/examples/PermissionDeniedError'
 *       404:
 *         description: 图书不存在
 *         content:
 *           application/json:
 *             examples:
 *               bookNotFound:
 *                 $ref: '#/components/examples/BookNotFoundError'
 *       400:
 *         description: 图书有未归还的借阅记录
 *         content:
 *           application/json:
 *             examples:
 *               bookHasBorrowRecords:
 *                 $ref: '#/components/examples/BookHasBorrowRecordsError'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             examples:
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 删除图书
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // 检查用户权限
    if (!req.user._utype.includes('admin')) {
      return res.status(403).json({
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: '没有权限执行此操作'
      });
    }

    const { id } = req.params;
    
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        errorCode: 'BOOK_NOT_FOUND',
        message: '图书不存在'
      });
    }

    // 检查是否有借阅记录
    const borrowRecords = await BorrowRecord.count({
      where: { 
        _bid: id,
        _status: 1 // 借出状态
      }
    });

    if (borrowRecords > 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'BOOK_HAS_BORROW_RECORDS',
        message: '该书有未归还的借阅记录，无法删除'
      });
    }

    await book.destroy();

    res.json({
      success: true,
      message: '图书删除成功',
      data: book
    });

  } catch (error) {
    console.error('删除图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/books/{id}/borrow:
 *   post:
 *     summary: 借阅图书
 *     description: 借阅指定图书，会检查库存、用户借阅限制等条件
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 图书ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 借书成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/BorrowBookResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/BorrowBookSuccess'
 *       404:
 *         description: 图书不存在
 *         content:
 *           application/json:
 *             examples:
 *               bookNotFound:
 *                 $ref: '#/components/examples/BookNotFoundError'
 *       400:
 *         description: 借阅条件不满足
 *         content:
 *           application/json:
 *             examples:
 *               outOfStock:
 *                 $ref: '#/components/examples/BookOutOfStockError'
 *               maxLimit:
 *                 $ref: '#/components/examples/MaxBorrowLimitError'
 *               alreadyBorrowed:
 *                 $ref: '#/components/examples/AlreadyBorrowedError'
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
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 借阅图书
router.post('/:id/borrow', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._uid;
    
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        errorCode: 'BOOK_NOT_FOUND',
        message: '图书不存在'
      });
    }

    // 检查图书库存
    if (book._num <= 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'BOOK_OUT_OF_STOCK',
        message: '该书暂无库存'
      });
    }

    // 检查用户是否已达到最大借阅数量
    const user = await User.findByPk(userId);
    const currentBorrowCount = await BorrowRecord.count({
      where: { 
        _uid: userId,
        _status: 1 // 借出状态
      }
    });

    if (currentBorrowCount >= user._max_num) {
      return res.status(400).json({
        success: false,
        errorCode: 'MAX_BORROW_LIMIT',
        message: '已达到最大借阅数量'
      });
    }

    // 检查是否已经借阅过同一本书且未归还
    const existingBorrow = await BorrowRecord.findAll({
      where: { 
        _bid: id,
        _uid: userId,
        _status: 0
      }
    });

    if (existingBorrow.length >=2) {
      return res.status(400).json({
        success: false,
        errorCode: 'ALREADY_BORROWED_TWICE',
        message: '同一本书籍只能连续借阅两次'
      });
    }

    // 计算应还日期（借阅30天）
    const beginDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // 创建借阅记录
    const borrowRecord = await BorrowRecord.create({
      _bid: id,
      _uid: userId,
      _begin_date: beginDate,
      _end_date: endDate,
      _status: 0 // 借出状态
    });

    // 更新图书库存和借阅次数
    await book.update({
      _num: book._num - 1,
      _times: book._times + 1
    });

    // 更新用户当前借阅数量
    await user.update({
      lend_num: currentBorrowCount + 1
    });

    res.json({
      success: true,
      message: '借书成功',
      data: {
        borrow_history: borrowRecord
      }
    });

  } catch (error) {
    console.error('借阅图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/books/{hid}/return:
 *   put:
 *     summary: 归还图书
 *     description: 归还借阅的图书
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hid
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 借阅记录ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 还书成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ReturnBookResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/ReturnBookSuccess'
 *       404:
 *         description: 借阅记录不存在
 *         content:
 *           application/json:
 *             examples:
 *               borrowRecordNotFound:
 *                 $ref: '#/components/examples/BorrowRecordNotFoundError'
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
 *               server_error:
 *                 $ref: '#/components/examples/ServerError'
 */
// 归还图书
router.put('/:hid/return', authenticate, async (req, res) => {
  try {
    const { hid } = req.params;
    const userId = req.user._uid;
    
    // 查找借阅记录
    const borrowRecord = await BorrowRecord.findOne({
      where: { 
        _hid: hid,
        _uid: userId,
        _status: 0 // 借出状态
      },
      include: [{  // 关联查询图书信息
        model: Book,
        as: 'book'  // 根据你的实际关联别名调整
      }]
    });

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        errorCode: 'BORROW_RECORD_NOT_FOUND',
        message: '借阅记录不存在'
      });
    }
    const book = borrowRecord.book;
    // 更新借阅记录状态为已归还
    await borrowRecord.update({
      _status: 1 ,// 已归还状态
      _end_date: new Date() // 实际归还日期
    });

    // 更新图书库存
    await book.update({
      _num: book._num + 1
    });

    // 更新用户当前借阅数量
    const user = await User.findByPk(userId);
    
    
    await user.update({
      lend_num: Math.max(0, user.lend_num - 1)
    });

    res.json({
      success: true,
      message: '还书成功',
      data: {
        suc_return: borrowRecord
      }
    });

  } catch (error) {
    console.error('归还图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * @swagger
 * /api/books/{hid}/renew:
 *   put:
 *     summary: 续借图书
 *     description: 续借已借阅的图书，延长归还日期30天
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hid
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 借阅记录ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 续借成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RenewBookResponse'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/RenewBookSuccess'
 *       404:
 *         description: 借阅记录不存在
 *         content:
 *           application/json:
 *             examples:
 *               borrowRecordNotFoundError:
 *                 $ref: '#/components/examples/BorrowRecordNotFoundError'
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
// 续借图书
router.put('/:hid/renew', authenticate, async (req, res) => {
  try {
    const { hid } = req.params;
    const userId = req.user._uid;
    
    // 查找借阅记录
    const borrowRecord = await BorrowRecord.findOne({
      where: { 
        _hid: hid,
        _uid: userId,
        _status: 0 // 借出状态
      },
      include: [{  // 关联查询图书信息
        model: Book,
        as: 'book'  // 根据你的实际关联别名调整
      }]
    });

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        errorCode: 'BORROW_RECORD_NOT_FOUND',
        message: '借阅记录不存在或不可续借'
      });
    }


    // 计算新的应还日期（在原应还日期基础上续借30天）
    const newEndDate = new Date(borrowRecord._end_date);
    newEndDate.setDate(newEndDate.getDate() + 30);

    // 更新借阅记录
    await borrowRecord.update({
      _end_date: newEndDate
    });

    res.json({
      success: true,
      message: '续借成功',
      data: {
        res_delay: borrowRecord
      }
    });

  } catch (error) {
    console.error('续借图书错误:', error);
    res.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});



module.exports = router;