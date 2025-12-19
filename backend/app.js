const express = require('express');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');
const swaggerSpecs = require('./config/swagger');
const { isPublicEndpoint } = require('./middleware/rbac');

// 路由导入
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const readerRoutes = require('./routes/readers');
const announcementRoutes = require('./routes/announcement');
const messageRoutes = require('./routes/message');
const categoryRoutes = require('./routes/category');
const borrowRecordRoutes = require('./routes/borrow-record');
const userImportRoutes = require('./routes/userImport');
const departmentRoutes = require('./routes/departments');
const majorRoutes = require('./routes/majors');
const classRoutes = require('./routes/classes');
const workDepartmentRoutes = require('./routes/workDepartments');
const structureImportRoutes = require('./routes/structureImport');
const adminAuthRoutes = require('./routes/adminAuth');
const permissionRoutes = require('./routes/permissions');
const roleRoutes = require('./routes/roles');
const userRoleRoutes = require('./routes/userRoles');
const adminRoutes = require('./routes/admins');
const recommendationRoutes = require('./routes/recommendations');

// 创建统一的日志记录器
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

app.options('*', cors());

// 中间件
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Swagger API文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '图书管理系统 API文档'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/readers', readerRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/borrow-records', borrowRecordRoutes);
app.use('/api/user-import', userImportRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/majors', majorRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/work-departments', workDepartmentRoutes);
app.use('/api/structure', structureImportRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/recommendations', recommendationRoutes);

// 健康检查端点
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV
  });
});

// API文档端点
app.get('/api-docs-json', (req, res) => {
  res.json(swaggerSpecs);
});

app.get('/', (req, res) => {
  res.json({
    message: '图书管理系统 API',
    version: '1.0.0',
    documentation: '请访问 /api-docs 查看完整的API文档',
    health_check: '/health'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    errorCode: 'NOT_FOUND',
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  logger.error(`未处理的错误: ${error.message}`);
  res.status(500).json({
    success: false,
    errorCode: 'SERVER_ERROR',
    message: '服务器内部错误'
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('无法启动服务器：数据库连接失败');
      process.exit(1);
    }

    // 同步数据库表
    await syncDatabase();

    app.listen(PORT, () => {
      logger.info('服务器启动成功', {
        port: PORT,
        localUrl: `http://localhost:${PORT}`,
        apiDocs: `http://localhost:${PORT}/api-docs`,
        healthCheck: `http://localhost:${PORT}/health`,
        defaultAdmin: {
          account: 'admin_t',
          password: 'admin123',
          type: 'admin_t'
        },
        availableRoutes: {
          auth: '/api/auth',
          books: '/api/books',
          readers: '/api/readers',
          announcements: '/api/announcements',
          messages: '/api/messages',
          categories: '/api/categories',
          borrowRecords: '/api/borrow-records',
          recommendations: '/api/recommendations'
        }
      });
    });

  } catch (error) {
    logger.error(`启动服务器失败: ${error.message}`);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;
