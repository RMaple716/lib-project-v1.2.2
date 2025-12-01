// config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '图书管理系统 API',
      version: '1.0.0',
      description: '基于Node.js和Express的图书管理系统后端API文档',
      contact: {
        name: 'API支持',
        email: 'support@library.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // 通用响应格式
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '请求是否成功'
            },
            message: {
              type: 'string',
              description: '响应消息'
            },
            data: {
              type: 'object',
              description: '响应数据'
            },
            errorCode: {
              type: 'string',
              description: '错误代码'
            }
          }
        },
        // 用户相关模型
        User: {
          type: 'object',
          properties: {
            _uid: {
              type: 'integer',
              description: '用户ID',
              example: 1
            },
            _utype: {
              type: 'string',
              enum: ['student', 'teacher', 'admin_t', 'admin_b', 'admin_l'],
              description: '用户类型',
              example: "admin_t"
            },
            _account: {
              type: 'string',
              description: '账号',
              example: "admin_t"
            },
            _name: {
              type: 'string',
              description: '姓名',
              example: "系统管理员"
            },
            _email: {
              type: 'string',
              description: '邮箱',
              example: "admin@library.com"
            },
            _max_num: {
              type: 'integer',
              description: '最大借书数量',
              example: 10
            },
            lend_num: {
              type: 'integer',
              description: '当前借书数量',
              example: 2
            },
            _access: {
              type: 'integer',
              description: '访问权限',
              example: 1
            },
            _create_time: {
              type: 'string',
              format: 'date-time',
              description: '创建时间',
              example: "2024-01-15T10:30:00.000Z"
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['account', 'password', 'usertype'],
          properties: {
            account: {
              type: 'string',
              example: 'admin_t'
            },
            password: {
              type: 'string',
              example: 'admin123'
            },
            usertype: {
              type: 'string',
              example: 'admin_t'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['account', 'name', 'email', 'usertype', 'password'],
          properties: {
            account: {
              type: 'string',
              example: 'student001'
            },
            name: {
              type: 'string',
              example: '张三'
            },
            email: {
              type: 'string',
              example: 'zhangsan@example.com'
            },
            usertype: {
              type: 'string',
              example: 'student'
            },
            password: {
              type: 'string',
              example: 'Student123!'
            }
          }
        },
        // 分类相关模型
        Category: {
          type: "object",
          properties: {
            _tid: {
              type: "integer",
              description: "分类ID",
              example: 1
            },
            _type_name: {
              type: "string",
              description: "分类名称",
              example: "计算机科学"
            }
          }
        },
        CategoryListResponse: {
        type: "object",
        properties: {
          catlist: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Category"
            }
          }
        }
        },
        CreateCategoryRequest: {
          type: "object",
          required: ["_type_name"],
          properties: {
            _type_name: {
              type: "string",
              description: "分类名称",
              example: "文学小说"
            }
          }
        },
        UpdateCategoryRequest: {
          type: "object",
          required: ["_type_name"],
          properties: {
            _type_name: {
              type: "string",
              description: "分类名称",
              example: "更新后的分类名称"
            }
          }
        },
        // 图书相关模型
        Book: {
          type: "object",
          properties: {
            _bid: {
              type: "integer",
              description: "图书ID",
              example: 1
            },
            _book_name: {
              type: "string",
              description: "图书名称",
              example: "JavaScript高级程序设计"
            },
            _isbn: {
              type: "string",
              description: "ISBN号",
              example: "9787115275790"
            },
            _num: {
              type: "integer",
              description: "库存数量",
              example: 5
            },
            _author: {
              type: "string",
              description: "作者",
              example: "Nicholas C. Zakas"
            },
            _press: {
              type: "string",
              description: "出版社",
              example: "人民邮电出版社"
            },
            _cover_url: {
              type: "string",
              description: "封面图片URL",
              example: "https://example.com/cover.jpg"
            },
            _tid: {
              type: "integer",
              description: "分类ID",
              example: 1
            },
            _times: {
              type: "integer",
              description: "借阅次数",
              example: 15
            },
            _create_time: {
              type: "string",
              format: "date-time",
              description: "创建时间",
              example: "2024-01-15T10:30:00.000Z"
            },
            _type_name: {
              type: "string",
              description: "分类名称",
              example: "计算机科学"
            }
          }
        },
        BookListResponse: {
          type: "object",
          properties: {
            booklist: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Book"
              }
            }
          }
        },
        BookRankResponse: {
          type: "object",
          properties: {
            res_rank: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Book"
              }
            }
          }
        },
        CreateBookRequest: {
          type: "object",
          required: ["_book_name", "_isbn", "_num", "_author", "_press", "_tid"],
          properties: {
            _book_name: {
              type: "string",
              example: "JavaScript高级程序设计"
            },
            _isbn: {
              type: "string",
              example: "9787115275790"
            },
            _num: {
              type: "integer",
              example: 10
            },
            _author: {
              type: "string",
              example: "Nicholas C. Zakas"
            },
            _press: {
              type: "string",
              example: "人民邮电出版社"
            },
            _tid: {
              type: "integer",
              example: 1
            },
            _cover_url: {
              type: "string",
              example: "https://example.com/cover.jpg"
            }
          }
        },
        UpdateBookRequest: {
          type: "object",
          required: ["_book_name", "_isbn", "_num", "_author", "_press", "_tid"],
          properties: {
            _book_name: {
              type: "string",
              example: "更新后的图书名称"
            },
            _isbn: {
              type: "string",
              example: "9787115275790"
            },
            _num: {
              type: "integer",
              example: 8
            },
            _author: {
              type: "string",
              example: "作者名"
            },
            _press: {
              type: "string",
              example: "出版社"
            },
            _tid: {
              type: "integer",
              example: 1
            },
            _cover_url: {
              type: "string",
              example: "https://example.com/new-cover.jpg"
            }
          }
        },
        BorrowBookResponse: {
          type: "object",
          properties: {
            borrow_history: {
              type: "object",
              properties: {
                _hid: {
                  type: "integer",
                  example: 1
                },
                _bid: {
                  type: "integer",
                  example: 1
                },
                _uid: {
                  type: "integer",
                  example: 1
                },
                _begin_date: {
                  type: "string",
                  format: "date-time",
                  example: "2024-01-15T10:30:00.000Z"
                },
                _end_date: {
                  type: "string",
                  format: "date-time",
                  example: "2024-02-14T10:30:00.000Z"
                },
                _status: {
                  type: "integer",
                  example: 0
                }
              }
            }
          }
        },
        ReturnBookResponse: {
          type: "object",
          properties: {
            suc_return: {
              type: "object",
              properties: {
                _hid: {
                  type: "integer",
                  example: 1
                },
                _bid: {
                  type: "integer",
                  example: 1
                },
                _uid: {
                  type: "integer",
                  example: 1
                },
                _begin_date: {
                  type: "string",
                  format: "date-time",
                  example: "2024-01-15T10:30:00.000Z"
                },
                _end_date: {
                  type: "string",
                  format: "date-time",
                  example: "2024-01-20T10:30:00.000Z"
                },
                _status: {
                  type: "integer",
                  example: 1
                }
              }
            }
          }
        },
        RenewBookResponse: {
          type: "object",
          properties: {
            res_delay: {
              type: "object",
              properties: {
                _hid: {
                  type: "integer",
                  example: 1
                },
                _bid: {
                  type: "integer",
                  example: 1
                },
                _uid: {
                  type: "integer",
                  example: 1
                },
                _begin_date: {
                  type: "string",
                  format: "date-time",
                  example: "2024-01-15T10:30:00.000Z"
                },
                _end_date: {
                  type: "string",
                  format: "date-time",
                  example: "2024-03-15T10:30:00.000Z"
                },
                _status: {
                  type: "integer",
                  example: 0
                }
              }
            }
          }
        },
        Announcement: {
          type: "object",
          properties: {
            _aid: {
              type: "integer",
              description: "公告ID",
              example: 1
            },
            _title: {
              type: "string",
              description: "公告标题",
              example: "系统维护通知"
            },
            _content: {
              type: "string",
              description: "公告内容",
              example: "系统将于本周六进行维护，届时将暂停服务2小时。"
            },
            _publisher: {
              type: "string",
              description: "发布者",
              example: "系统管理员"
            },
            _date: {
              type: "string",
              format: "date-time",
              description: "发布日期",
              example: "2024-01-15T10:30:00.000Z"
            },
            _status: {
              type: "integer",
              description: "公告状态 (1: 已发布, 0: 未发布)",
              example: 1
            }
          }
        },
        AnnouncementListResponse: {
          type: "object",
          properties: {
            annlist: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Announcement"
              }
            }
          }
        },
        CreateAnnouncementRequest: {
          type: "object",
          required: ["_title", "_content"],
          properties: {
            _title: {
              type: "string",
              example: "系统维护通知"
            },
            _content: {
              type: "string",
              example: "系统将于本周六进行维护"
            },
            _status: {
              type: "integer",
              example: 1
            }
          }
        },
        UpdateAnnouncementRequest: {
          type: "object",
          required: ["_title", "_content", "_status"],
          properties: {
            _title: {
              type: "string",
              example: "更新后的公告标题"
            },
            _content: {
              type: "string",
              example: "更新后的公告内容"
            },
            _status: {
              type: "integer",
              example: 1
            }
          }
        },
        ReaderListResponse: {
          type: "object",
          properties: {
            readerlist: {
              type: "array",
              items: {
                $ref: "#/components/schemas/User"
              }
            }
          }
        },
        CreateReaderRequest: {
          type: "object",
          required: ["_account", "_name", "_password", "_utype", "_email"],
          properties: {
            _account: {
              type: "string",
              example: "student001"
            },
            _name: {
              type: "string",
              example: "张三"
            },
            _password: {
              type: "string",
              example: "Student123!"
            },
            _utype: {
              type: "string",
              enum: ["student", "teacher"],
              example: "student"
            },
            _email: {
              type: "string",
              example: "zhangsan@example.com"
            }
          }
        },
        UpdateReaderRequest: {
          type: "object",
          required: ["_account", "_name", "_email"],
          properties: {
            _account: {
              type: "string",
              example: "student001"
            },
            _name: {
              type: "string",
              example: "张三"
            },
            _email: {
              type: "string",
              example: "zhangsan@example.com"
            }
          }
        },
        ReaderBorrowCountResponse: {
          type: "object",
          properties: {
            _name: {
              type: "string",
              example: "张三"
            },
            _lend_num: {
              type: "integer",
              example: 3
            }
          }
        },
        ReaderRankResponse: {
          type: "object",
          properties: {
            res_rank: {
              type: "array",
              items: {
                $ref: "#/components/schemas/User"
              }
            }
          }
        },
        BorrowRecord: {
          type: "object",
          properties: {
            _hid: {
              type: "integer",
              description: "借阅记录ID",
              example: 1
            },
            _bid: {
              type: "integer",
              description: "图书ID",
              example: 1
            },
            _uid: {
              type: "integer",
              description: "用户ID",
              example: 1001
            },
            _begin_time: {
              type: "string",
              format: "date",
              description: "借阅开始日期",
              example: "2024-01-15"
            },
            _end_date: {
              type: "string",
              format: "date",
              description: "应还日期",
              example: "2024-02-14"
            },
            _status: {
              type: "integer",
              description: "借阅状态 (0: 借出, 1: 已归还)",
              example: 0
            },
            user: {
              type: "object",
              description: "用户信息",
              properties: {
                _uid: {
                  type: "integer",
                  example: 1001
                },
                _name: {
                  type: "string",
                  example: "张三"
                },
                _account: {
                  type: "string",
                  example: "student001"
                }
              }
            },
            book: {
              type: "object",
              description: "图书信息",
              properties: {
                _bid: {
                  type: "integer",
                  example: 1
                },
                _book_name: {
                  type: "string",
                  example: "JavaScript高级程序设计"
                },
                _author: {
                  type: "string",
                  example: "Nicholas C. Zakas"
                },
                _cover_url: {
                  type: "string",
                  example: "https://example.com/cover.jpg"
                },
                _isbn: {
                  type: "string",
                  example: "9787115275790"
                }
              }
            }
          }
        },
        BorrowRecordListResponse: {
          type: "object",
          properties: {
            historylist: {
              type: "array",
              items: {
                $ref: "#/components/schemas/BorrowRecord"
              }
            }
          }
        },
        MyBorrowRecordListResponse: {
          type: "object",
          properties: {
            ownlist: {
              type: "array",
              items: {
                $ref: "#/components/schemas/BorrowRecord"
              }
            }
          }
        }
      }, 
      examples: {
        // 通用错误示例
        MissingFieldsError: {
          summary: '缺少必填字段',
          value: {
            success: false,
            errorCode: "MISSING_FIELDS",
            message: "请提供完整的必填信息"
          }
        },
        ServerError: {
          summary: '服务器内部错误',
          value: {
            success: false,
            errorCode: "SERVER_ERROR", 
            message: "服务器内部错误"
          }
        },
        // 认证相关示例
        LoginSuccess: {
          summary: '登录成功',
          value: {
            success: true,
            message: "登录成功",
            data: {
              token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfdWlkIjoxLCJfdXR5cGUiOiJhZG1pbl90IiwiX2FjY291bnQiOiJhZG1pbl90IiwiaWF0IjoxNzA1MDAwMDAwLCJleHAiOjE3MDUwODY0MDB9.example_token",
              usertype: "admin_t",
              userInfo: {
                _uid: 1,
                _name: "系统管理员",
                _account: "admin_t",
                _email: "admin@library.com"
              }
            }
          }
        },
        UserNotFoundError: {
          summary: '用户不存在',
          value: {
            success: false,
            errorCode: "USER_NOT_EXISTS",
            message: "用户不存在"
          }
        },
        PasswordError: {
          summary: '密码错误',
          value: {
            success: false,
            errorCode: "PASSWORD_INCORRECT",
            message: "密码错误"
          }
        },
        RegisterSuccess: {
          summary: '注册成功',
          value: {
            success: true,
            message: "注册成功",
            data: {
              _uid: 1001,
              _utype: "student",
              _account: "student001",
              _name: "张三"
            }
          }
        },
        UserExistsError: {
          summary: '用户已存在',
          value: {
            success: false,
            errorCode: "USER_ALREADY_EXISTS", 
            message: "用户已存在"
          }
        },
        PasswordSimpleError: {
          summary: '密码过于简单',
          value: {
            success: false,
            errorCode: "PASSWORD_TOO_SIMPLE",
            message: "密码过于简单，需包含字母、数字和特殊字符，且长度不少于8位"
          }
        },

         // 分类相关示例
        CategoryListSuccess: {
          summary: "获取分类列表成功",
          value: {
            success: true,
            message: "获取分类列表成功",
            data: {
              catlist: [
                {
                  _tid: 1,
                  _type_name: "计算机科学"
                },
                {
                  _tid: 2,
                  _type_name: "文学小说"
                },
                {
                  _tid: 3,
                  _type_name: "历史传记"
                }
              ]
            }
          }
        },
        CategoryDetailSuccess: {
          summary: "获取分类详情成功",
          value: {
            success: true,
            message: "成功获取分类详情",
            data: {
              _tid: 1,
              _type_name: "计算机科学"
            }
          }
        },
        CreateCategorySuccess: {
          summary: "创建分类成功",
          value: {
            success: true,
            message: "添加分类成功",
            data: {
              _tid: 4,
              _type_name: "新分类"
            }
          }
        },
        UpdateCategorySuccess: {
          summary: "更新分类成功",
          value: {
            success: true,
            message: "分类更新成功",
            data: {
              _tid: 1,
              _type_name: "更新后的分类名称"
            }
          }
        },
        DeleteCategorySuccess: {
          summary: "删除分类成功",
          value: {
            success: true,
            message: "分类删除成功",
            data: {
              _tid: 1,
              _type_name: "计算机科学"
            }
          }
        },
        CategoryNotFoundError: {
          summary: "分类不存在",
          value: {
            success: false,
            errorCode: "CATEGORY_NOT_FOUND",
            message: "分类不存在"
          }
        },
        BookListSuccess: {
          summary: "获取图书列表成功",
          value: {
            success: true,
            message: "获取图书列表成功",
            data: {
              booklist: [
                {
                  _bid: 1,
                  _book_name: "JavaScript高级程序设计",
                  _isbn: "9787115275790",
                  _num: 5,
                  _author: "Nicholas C. Zakas",
                  _press: "人民邮电出版社",
                  _cover_url: "https://example.com/cover1.jpg",
                  _tid: 1,
                  _times: 15,
                  _create_time: "2024-01-15T10:30:00.000Z",
                  _type_name: "计算机科学"
                },
                {
                  _bid: 2,
                  _book_name: "三体",
                  _isbn: "9787536692930",
                  _num: 3,
                  _author: "刘慈欣",
                  _press: "重庆出版社",
                  _cover_url: "https://example.com/cover2.jpg",
                  _tid: 2,
                  _times: 25,
                  _create_time: "2024-01-10T08:15:00.000Z",
                  _type_name: "科幻小说"
                }
              ]
            }
          }
        },
        BookRankSuccess: {
          summary: "获取图书排名成功",
          value: {
            success: true,
            message: "获取图书排名成功",
            data: {
              res_rank: [
                {
                  _bid: 2,
                  _book_name: "三体",
                  _isbn: "9787536692930",
                  _num: 3,
                  _author: "刘慈欣",
                  _press: "重庆出版社",
                  _cover_url: "https://example.com/cover2.jpg",
                  _tid: 2,
                  _times: 25,
                  _create_time: "2024-01-10T08:15:00.000Z",
                  _type_name: "科幻小说"
                },
                {
                  _bid: 1,
                  _book_name: "JavaScript高级程序设计",
                  _isbn: "9787115275790",
                  _num: 5,
                  _author: "Nicholas C. Zakas",
                  _press: "人民邮电出版社",
                  _cover_url: "https://example.com/cover1.jpg",
                  _tid: 1,
                  _times: 15,
                  _create_time: "2024-01-15T10:30:00.000Z",
                  _type_name: "计算机科学"
                }
              ]
            }
          }
        },
        BookDetailSuccess: {
          summary: "获取图书详情成功",
          value: {
            success: true,
            message: "成功获取图书详情",
            data: {
              _bid: 1,
              _book_name: "JavaScript高级程序设计",
              _isbn: "9787115275790",
              _num: 5,
              _author: "Nicholas C. Zakas",
              _press: "人民邮电出版社",
              _cover_url: "https://example.com/cover1.jpg",
              _tid: 1,
              _times: 15,
              _create_time: "2024-01-15T10:30:00.000Z",
              category: {
                _type_name: "计算机科学"
              }
            }
          }
        },
        CreateBookSuccess: {
          summary: "创建图书成功",
          value: {
            success: true,
            message: "图书添加成功",
            data: {
              _bid: 3,
              _book_name: "新图书",
              _isbn: "9781234567890",
              _num: 10,
              _author: "新作者",
              _press: "新出版社",
              _cover_url: "https://example.com/new-cover.jpg",
              _tid: 1,
              _times: 0,
              _create_time: "2024-01-20T14:25:00.000Z"
            }
          }
        },
        UpdateBookSuccess: {
          summary: "更新图书成功",
          value: {
            success: true,
            message: "图书信息更新成功",
            data: {
              _bid: 1,
              _book_name: "更新后的图书名称",
              _isbn: "9787115275790",
              _num: 8,
              _author: "Nicholas C. Zakas",
              _press: "人民邮电出版社",
              _cover_url: "https://example.com/updated-cover.jpg",
              _tid: 1,
              _times: 15,
              _create_time: "2024-01-15T10:30:00.000Z"
            }
          }
        },
        DeleteBookSuccess: {
          summary: "删除图书成功",
          value: {
            success: true,
            message: "图书删除成功",
            data: {
              _bid: 1,
              _book_name: "JavaScript高级程序设计",
              _isbn: "9787115275790",
              _num: 5,
              _author: "Nicholas C. Zakas",
              _press: "人民邮电出版社",
              _cover_url: "https://example.com/cover1.jpg",
              _tid: 1,
              _times: 15,
              _create_time: "2024-01-15T10:30:00.000Z"
            }
          }
        },
        BorrowBookSuccess: {
          summary: "借阅图书成功",
          value: {
            success: true,
            message: "借书成功",
            data: {
              borrow_history: {
                _hid: 1,
                _bid: 1,
                _uid: 1001,
                _begin_date: "2024-01-20T10:30:00.000Z",
                _end_date: "2024-02-19T10:30:00.000Z",
                _status: 0
              }
            }
          }
        },
        ReturnBookSuccess: {
          summary: "归还图书成功",
          value: {
            success: true,
            message: "还书成功",
            data: {
              suc_return: {
                _hid: 1,
                _bid: 1,
                _uid: 1001,
                _begin_date: "2024-01-20T10:30:00.000Z",
                _end_date: "2024-01-25T10:30:00.000Z",
                _status: 1
              }
            }
          }
        },
        RenewBookSuccess: {
          summary: "续借图书成功",
          value: {
            success: true,
            message: "续借成功",
            data: {
              res_delay: {
                _hid: 1,
                _bid: 1,
                _uid: 1001,
                _begin_date: "2024-01-20T10:30:00.000Z",
                _end_date: "2024-03-20T10:30:00.000Z",
                _status: 0
              }
            }
          }
        },
        BookNotFoundError: {
          summary: "图书不存在",
          value: {
            success: false,
            errorCode: "BOOK_NOT_FOUND",
            message: "图书不存在"
          }
        },
        PermissionDeniedError: {
          summary: "权限不足",
          value: {
            success: false,
            errorCode: "PERMISSION_DENIED",
            message: "没有权限执行此操作"
          }
        },
        BookOutOfStockError: {
          summary: "图书库存不足",
          value: {
            success: false,
            errorCode: "BOOK_OUT_OF_STOCK",
            message: "该书暂无库存"
          }
        },
        MaxBorrowLimitError: {
          summary: "达到最大借阅限制",
          value: {
            success: false,
            errorCode: "MAX_BORROW_LIMIT",
            message: "已达到最大借阅数量"
          }
        },
        AlreadyBorrowedError: {
          summary: "已借阅过该书",
          value: {
            success: false,
            errorCode: "ALREADY_BORROWED_TWICE",
            message: "同一本书籍只能连续借阅两次"
          }
        },
        BookHasBorrowRecordsError: {
          summary: "图书有关联借阅记录",
          value: {
            success: false,
            errorCode: "BOOK_HAS_BORROW_RECORDS",
            message: "该书有未归还的借阅记录，无法删除"
          }
        },
        BorrowRecordNotFoundError: {
          summary: "借阅记录不存在",
          value: {
            success: false,
            errorCode: "BORROW_RECORD_NOT_FOUND",
            message: "借阅记录不存在"
          }
        },
        UnauthorizedError: {
          summary: '未提供有效的Token',
          description: '当请求头缺少Authorization或不是Bearer格式时返回',
          value: {
            success: false,
            errorCode: "UNAUTHORIZED",
            message: "请提供有效的Token"
          }
        },
        TokenInvalidError: {
          summary: 'Token无效或已过期',
          description: '当Token验证失败或过期时返回',
          value: {
            success: false,
            errorCode: "TOKEN_INVALID",
            message: "Token无效或已过期"
          }
        },
        AnnouncementListSuccess: {
          summary: "获取公告列表成功",
          value: {
            success: true,
            message: "获取公告列表成功",
            data: {
              annlist: [
                {
                  _aid: 1,
                  _title: "系统维护通知",
                  _content: "系统将于本周六进行维护",
                  _publisher: "系统管理员",
                  _date: "2024-01-15T10:30:00.000Z",
                  _status: 1
                },
                {
                  _aid: 2,
                  _title: "新书上架",
                  _content: "最新计算机图书已上架",
                  _publisher: "图书管理员",
                  _date: "2024-01-10T08:15:00.000Z",
                  _status: 1
                }
              ]
            }
          }
        },
        AnnouncementDetailSuccess: {
          summary: "获取公告详情成功",
          value: {
            success: true,
            message: "成功获取公告详情",
            data: {
              _aid: 1,
              _title: "系统维护通知",
              _content: "系统将于本周六进行维护，届时将暂停服务2小时。",
              _publisher: "系统管理员",
              _date: "2024-01-15T10:30:00.000Z",
              _status: 1
            }
          }
        },
        CreateAnnouncementSuccess: {
          summary: "创建公告成功",
          value: {
            success: true,
            message: "添加公告成功",
            data: {
              res_insert: {
                _aid: 3,
                _title: "新公告",
                _content: "这是新发布的公告内容",
                _publisher: "终端管理员",
                _date: "2024-01-20T14:25:00.000Z",
                _status: 1
              }
            }
          }
        },
        UpdateAnnouncementSuccess: {
          summary: "更新公告成功",
          value: {
            success: true,
            message: "公告更新成功",
            data: {
              _aid: 1,
              _title: "更新后的公告标题",
              _content: "更新后的公告内容",
              _publisher: "系统管理员",
              _date: "2024-01-15T10:30:00.000Z",
              _status: 1
            }
          }
        },
        DeleteAnnouncementSuccess: {
          summary: "删除公告成功",
          value: {
            success: true,
            message: "公告删除成功",
            data: {
              _aid: 1,
              _title: "系统维护通知",
              _content: "系统将于本周六进行维护",
              _publisher: "系统管理员",
              _date: "2024-01-15T10:30:00.000Z",
              _status: 1
            }
          }
        },
        AnnouncementNotFoundError: {
          summary: "公告不存在",
          value: {
            success: false,
            errorCode: "ANNOUNCEMENT_NOT_FOUND",
            message: "公告不存在"
          }
        },
        ReaderListSuccess: {
          summary: "获取读者列表成功",
          value: {
            success: true,
            message: "获取读者列表成功",
            data: {
              readerlist: [
                {
                  _uid: 1001,
                  _utype: "student",
                  _account: "student001",
                  _name: "张三",
                  _email: "zhangsan@example.com",
                  _max_num: 10,
                  lend_num: 2,
                  _access: 1,
                  _create_time: "2024-01-15T10:30:00.000Z"
                },
                {
                  _uid: 1002,
                  _utype: "teacher",
                  _account: "teacher001",
                  _name: "李老师",
                  _email: "li@example.com",
                  _max_num: 20,
                  lend_num: 5,
                  _access: 1,
                  _create_time: "2024-01-10T08:15:00.000Z"
                }
              ]
            }
          }
        },
        ReaderDetailSuccess: {
          summary: "获取读者详情成功",
          value: {
            success: true,
            message: "成功获取读者详情",
            data: {
              _uid: 1001,
              _utype: "student",
              _account: "student001",
              _name: "张三",
              _email: "zhangsan@example.com",
              _max_num: 10,
              lend_num: 2,
              _access: 1,
              _create_time: "2024-01-15T10:30:00.000Z"
            }
          }
        },
        CreateReaderSuccess: {
          summary: "创建读者成功",
          value: {
            success: true,
            message: "读者添加成功",
            data: {
              r_add: {
                _uid: 1003,
                _utype: "student",
                _account: "student002",
                _name: "李四",
                _email: "lisi@example.com",
                _max_num: 10,
                lend_num: 0,
                _access: 1,
                _create_time: "2024-01-20T14:25:00.000Z"
              }
            }
          }
        },
        UpdateReaderSuccess: {
          summary: "更新读者信息成功",
          value: {
            success: true,
            message: "读者信息更新成功",
            data: {
              _uid: 1001,
              _utype: "student",
              _account: "student001",
              _name: "张三（已更新）",
              _email: "zhangsan_updated@example.com",
              _max_num: 10,
              lend_num: 2,
              _access: 1,
              _create_time: "2024-01-15T10:30:00.000Z"
            }
          }
        },
        DeleteReaderSuccess: {
          summary: "删除读者成功",
          value: {
            success: true,
            message: "读者删除成功",
            data: {
              _uid: 1001,
              _utype: "student",
              _account: "student001",
              _name: "张三",
              _email: "zhangsan@example.com",
              _max_num: 10,
              lend_num: 0,
              _access: 1,
              _create_time: "2024-01-15T10:30:00.000Z"
            }
          }
        },
        ReaderBorrowCountSuccess: {
          summary: "查询读者借阅数量成功",
          value: {
            success: true,
            message: "查询成功",
            data: {
              _name: "张三",
              _lend_num: 3
            }
          }
        },
        ReaderRankSuccess: {
          summary: "获取读者排名成功",
          value: {
            success: true,
            message: "获取读者排名成功",
            data: {
              res_rank: [
                {
                  _uid: 1002,
                  _utype: "teacher",
                  _account: "teacher001",
                  _name: "李老师",
                  _email: "li@example.com",
                  _max_num: 20,
                  lend_num: 15,
                  _access: 1,
                  _create_time: "2024-01-10T08:15:00.000Z"
                },
                {
                  _uid: 1001,
                  _utype: "student",
                  _account: "student001",
                  _name: "张三",
                  _email: "zhangsan@example.com",
                  _max_num: 10,
                  lend_num: 8,
                  _access: 1,
                  _create_time: "2024-01-15T10:30:00.000Z"
                }
              ]
            }
          }
        },
        ReaderNotFoundError: {
          summary: "读者不存在",
          value: {
            success: false,
            errorCode: "READER_NOT_FOUND",
            message: "读者不存在"
          }
        },
        InvalidUserTypeError: {
          summary: "无效的用户类型",
          value: {
            success: false,
            errorCode: "INVALID_USER_TYPE",
            message: "用户类型只能是student或teacher"
          }
        },
        AccountAlreadyExistsError: {
          summary: "账号已存在",
          value: {
            success: false,
            errorCode: "ACCOUNT_ALREADY_EXISTS",
            message: "账号已被其他用户使用"
          }
        },
        ReaderHasActiveBorrowsError: {
          summary: "读者有未归还的图书",
          value: {
            success: false,
            errorCode: "READER_HAS_ACTIVE_BORROWS",
            message: "该读者有未归还的图书，无法删除"
          }
        },
        BorrowRecordListSuccess: {
          summary: "获取借阅记录列表成功",
          value: {
            success: true,
            message: "获取借阅记录成功",
            data: {
              historylist: [
                {
                  _hid: 1,
                  _bid: 1,
                  _uid: 1001,
                  _begin_time: "2024-01-15",
                  _end_date: "2024-02-14",
                  _status: 0,
                  user: {
                    _uid: 1001,
                    _name: "张三",
                    _account: "student001"
                  },
                  book: {
                    _bid: 1,
                    _book_name: "JavaScript高级程序设计",
                    _author: "Nicholas C. Zakas"
                  }
                },
                {
                  _hid: 2,
                  _bid: 2,
                  _uid: 1002,
                  _begin_time: "2024-01-10",
                  _end_date: "2024-02-09",
                  _status: 1,
                  user: {
                    _uid: 1002,
                    _name: "李老师",
                    _account: "teacher001"
                  },
                  book: {
                    _bid: 2,
                    _book_name: "三体",
                    _author: "刘慈欣"
                  }
                }
              ]
            }
          }
        },
        MyBorrowRecordListSuccess: {
          summary: "获取我的借阅记录成功",
          value: {
            success: true,
            message: "获取借阅记录成功",
            data: {
              ownlist: [
                {
                  _hid: 1,
                  _bid: 1,
                  _uid: 1001,
                  _begin_time: "2024-01-15",
                  _end_date: "2024-02-14",
                  _status: 0,
                  book: {
                    _book_name: "JavaScript高级程序设计",
                    _isbn: "9787115275790",
                    _author: "Nicholas C. Zakas",
                    _cover_url: "https://example.com/cover.jpg"
                  }
                },
                {
                  _hid: 3,
                  _bid: 3,
                  _uid: 1001,
                  _begin_time: "2024-01-12",
                  _end_date: "2024-01-20",
                  _status: 1,
                  book: {
                    _book_name: "三体",
                    _isbn: "9787536692930",
                    _author: "刘慈欣",
                    _cover_url: "https://example.com/cover2.jpg"
                  }
                }
              ]
            }
          }
        },
        NoBorrowRecordsError: {
          summary: "没有借阅记录",
          value: {
            success: false,
            errorCode: "NO_BORROW_RECORDS",
            message: "暂无借阅记录"
          }
        },
        CaptchaSuccess: {
          summary: "验证码生成成功",
          value: {
            success: true,
            message: "验证码生成成功",
            data: "<svg width='150' height='50' viewBox='0 0 150 50' xmlns='http://www.w3.org/2000/svg'><!-- 实际的SVG内容 --></svg>"
          }
        },
        MissingUserIdError: {
          summary: "缺少用户ID",
          value: {
            success: false,
            errorCode: "MISSING_USER_ID",
            message: "请提供用户ID"
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './models/*.js',
    './utils/*.js'
  ]
};

const specs = swaggerJsdoc(options);
module.exports = specs;