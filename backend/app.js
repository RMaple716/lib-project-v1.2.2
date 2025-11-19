const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');

// 路由导入
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: 'http://localhost:8081', // 允许的前端源
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的 HTTP 方法
  allowedHeaders: ['Content-Type', 'Authorization'] // 允许的请求头
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

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
app.get('/', (req, res) => {
  res.json({
    message: '图书管理系统 API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        currentUser: 'GET /api/auth/current-user'
      },
      books: {
        list: 'GET /api/books',
        create: 'POST /api/books'
      }
    },
    examples: {
      login: {
        method: 'POST',
        url: '/api/auth/login',
        body: {
          account: 'admin_b',
          password: 'admin123',
          usertype: 'admin_b'
        }
      }
    }
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
  console.error('未处理的错误:', error);
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
      console.log(' 无法启动服务器：数据库连接失败');
      process.exit(1);
    }

    // 同步数据库表
    await syncDatabase();

    app.listen(PORT, () => {
      console.log('\n 服务器启动成功!');
      console.log(` 本地访问: http://localhost:${PORT}`);
      console.log(` API文档: http://localhost:${PORT}/`);
      console.log(` 健康检查: http://localhost:${PORT}/health`);
      console.log('\n 默认管理员账户:');
      console.log('   账号: admin_b');
      console.log('   密码: admin123');
      console.log('   类型: admin_b');
    });

  } catch (error) {
    console.error(' 启动服务器失败 =< :', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

startServer();

module.exports = app;