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
              enum: ['student', 'teacher', 'tempworker', 'admin_t', 'admin_n'],
              description: '用户类型',
              example: "admin_terminal"
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
            },
            department: {
              type: 'object',
              description: '院系信息（教师）',
              nullable: true,
              properties: {
                id: {
                  type: 'integer',
                  description: '院系ID',
                  example: 1
                },
                name: {
                  type: 'string',
                  description: '院系名称',
                  example: '计算机学院'
                }
              }
            },
            major: {
              type: 'object',
              description: '专业信息',
              nullable: true,
              properties: {
                id: {
                  type: 'integer',
                  description: '专业ID',
                  example: 1
                },
                name: {
                  type: 'string',
                  description: '专业名称',
                  example: '计算机科学与技术'
                },
                department: {
                  type: 'object',
                  description: '专业所属院系',
                  nullable: true,
                  properties: {
                    id: {
                      type: 'integer',
                      description: '院系ID',
                      example: 1
                    },
                    name: {
                      type: 'string',
                      description: '院系名称',
                      example: '计算机学院'
                    }
                  }
                }
              }
            },
            class: {
              type: 'object',
              description: '班级信息（学生）',
              nullable: true,
              properties: {
                id: {
                  type: 'integer',
                  description: '班级ID',
                  example: 1
                },
                name: {
                  type: 'string',
                  description: '班级名称',
                  example: '计算机科学与技术1班'
                }
              }
            },
            workDepartment: {
              type: 'object',
              description: '工作部门信息（临时工）',
              nullable: true,
              properties: {
                id: {
                  type: 'integer',
                  description: '工作部门ID',
                  example: 1
                },
                name: {
                  type: 'string',
                  description: '工作部门名称',
                  example: '校图书馆'
                }
              }
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
            },
            category: {
              type: "object",
              description: "分类信息",
              nullable: true,
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
        AdminListResponse: {
          type: "object",
          properties: {
            adminlist: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Admin"
              },
              description: "管理员列表"
            }
          }
        },
        Admin: {
          type: "object",
          properties: {
            _uid: {
              type: "integer",
              description: "管理员ID",
              example: 100
            },
            _utype: {
              type: "string",
              enum: ["admin_t", "admin_n"],
              description: "管理员类型",
              example: "admin_n"
            },
            _account: {
              type: "string",
              description: "账号",
              example: "admin_n"
            },
            _name: {
              type: "string",
              description: "姓名",
              example: "普通管理员"
            },
            _email: {
              type: "string",
              description: "邮箱",
              example: "admin_n@library.com"
            },
            _max_num: {
              type: "integer",
              description: "最大借书数量",
              example: 50
            },
            lend_num: {
              type: "integer",
              description: "当前借书数量",
              example: 5
            },
            _access: {
              type: "integer",
              description: "访问权限",
              example: 1
            },
            _create_time: {
              type: "string",
              format: "date-time",
              description: "创建时间",
              example: "2024-01-15T10:30:00.000Z"
            },
            roles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  _rid: {
                    type: "integer",
                    description: "角色ID",
                    example: 1
                  },
                  _rname: {
                    type: "string",
                    description: "角色名称",
                    example: "图书管理员"
                  },
                  _rcode: {
                    type: "string",
                    description: "角色代码",
                    example: "book_admin"
                  },
                  _rdesc: {
                    type: "string",
                    description: "角色描述",
                    example: "负责图书管理的管理员"
                  }
                }
              },
              description: "管理员拥有的角色"
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
        // 消息相关模型
        Message: {
          type: "object",
          properties: {
            _mid: {
              type: "integer",
              description: "消息ID",
              example: 1
            },
            _sender_id: {
              type: "integer",
              description: "发送者ID",
              example: 100
            },
            _receiver_id: {
              type: "integer",
              description: "接收者ID",
              example: 200
            },
            _title: {
              type: "string",
              description: "消息标题",
              example: "图书即将到期提醒"
            },
            _content: {
              type: "string",
              description: "消息内容",
              example: "您借阅的《JavaScript高级程序设计》将于3天后到期，请及时归还或续借。"
            },
            _type: {
              type: "integer",
              description: "消息类型 (1: 系统通知, 2: 借阅提醒, 3: 预约通知, 4: 其他)",
              example: 2
            },
            _status: {
              type: "integer",
              description: "消息状态 (0: 未读, 1: 已读)",
              example: 0
            },
            _create_time: {
              type: "string",
              format: "date-time",
              description: "创建时间",
              example: "2024-01-15T10:30:00.000Z"
            },
            _read_time: {
              type: "string",
              format: "date-time",
              description: "阅读时间",
              nullable: true,
              example: "2024-01-16T09:15:00.000Z"
            },
            sender: {
              type: "object",
              description: "发送者信息",
              properties: {
                _uid: {
                  type: "integer",
                  description: "用户ID",
                  example: 100
                },
                _name: {
                  type: "string",
                  description: "用户姓名",
                  example: "系统管理员"
                },
                _account: {
                  type: "string",
                  description: "用户账号",
                  example: "admin_t"
                }
              }
            }
          }
        },
        MessageListResponse: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Message"
              }
            },
            pagination: {
              type: "object",
              properties: {
                total: {
                  type: "integer",
                  description: "总记录数",
                  example: 25
                },
                page: {
                  type: "integer",
                  description: "当前页码",
                  example: 1
                },
                limit: {
                  type: "integer",
                  description: "每页记录数",
                  example: 10
                },
                totalPages: {
                  type: "integer",
                  description: "总页数",
                  example: 3
                }
              }
            }
          }
        },
        CreateMessageRequest: {
          type: "object",
          required: ["_receiver_id", "_title", "_content"],
          properties: {
            _receiver_id: {
              type: "integer",
              description: "接收者ID",
              example: 200
            },
            _title: {
              type: "string",
              description: "消息标题",
              example: "图书即将到期提醒"
            },
            _content: {
              type: "string",
              description: "消息内容",
              example: "您借阅的《JavaScript高级程序设计》将于3天后到期，请及时归还或续借。"
            },
            _type: {
              type: "integer",
              description: "消息类型 (1: 系统通知, 2: 借阅提醒, 3: 预约通知, 4: 其他)",
              example: 2
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
        },
        BorrowStatsResponse: {
          type: "object",
          properties: {
            date: {
              type: "string",
              format: "date",
              description: "日期",
              example: "2025-11-15"
            },
            count: {
              type: "integer",
              description: "借阅数量",
              example: 3
            }
          }
        },
        BorrowStatsListResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              description: "借阅统计数据",
              items: {
                $ref: "#/components/schemas/BorrowStatsResponse"
              }
            }
          }
        },
        // 权限相关模型
        Permission: {
          type: "object",
          properties: {
            _pid: {
              type: "integer",
              description: "权限ID",
              example: 1
            },
            _pname: {
              type: "string",
              description: "权限名称",
              example: "查看读者列表"
            },
            _pcode: {
              type: "string",
              description: "权限代码",
              example: "readers.view"
            },
            _pdesc: {
              type: "string",
              description: "权限描述",
              example: "查看读者列表和详情"
            },
            _pmodule: {
              type: "string",
              description: "所属模块",
              example: "readers"
            },
            _create_time: {
              type: "string",
              format: "date-time",
              description: "创建时间",
              example: "2024-01-15T10:30:00.000Z"
            },
            _update_time: {
              type: "string",
              format: "date-time",
              description: "更新时间",
              example: "2024-01-15T10:30:00.000Z"
            }
          }
        },
        Role: {
          type: "object",
          properties: {
            _id: {
              type: "integer",
              description: "角色ID",
              example: 1
            },
            _rname: {
              type: "string",
              description: "角色名称",
              example: "图书管理员"
            },
            _rcode: {
              type: "string",
              description: "角色代码",
              example: "librarian"
            },
            _rdesc: {
              type: "string",
              description: "角色描述",
              example: "负责图书管理的管理员"
            },
            _create_time: {
              type: "string",
              format: "date-time",
              description: "创建时间",
              example: "2024-01-15T10:30:00.000Z"
            },
            _update_time: {
              type: "string",
              format: "date-time",
              description: "更新时间",
              example: "2024-01-15T10:30:00.000Z"
            },
            permissions: {
              type: "array",
              description: "角色拥有的权限",
              items: {
                $ref: "#/components/schemas/Permission"
              }
            }
          }
        },
        CreatePermissionRequest: {
          type: "object",
          required: ["_pname", "_pcode", "_pmodule"],
          properties: {
            _pname: {
              type: "string",
              description: "权限名称",
              example: "查看读者列表"
            },
            _pcode: {
              type: "string",
              description: "权限代码",
              example: "readers.view"
            },
            _pdesc: {
              type: "string",
              description: "权限描述",
              example: "查看读者列表和详情"
            },
            _pmodule: {
              type: "string",
              description: "所属模块",
              example: "readers"
            }
          }
        },
        UpdatePermissionRequest: {
          type: "object",
          properties: {
            _pname: {
              type: "string",
              description: "权限名称",
              example: "查看读者列表"
            },
            _pcode: {
              type: "string",
              description: "权限代码",
              example: "readers.view"
            },
            _pdesc: {
              type: "string",
              description: "权限描述",
              example: "查看读者列表和详情"
            },
            _pmodule: {
              type: "string",
              description: "所属模块",
              example: "readers"
            }
          }
        },
        CreateRoleRequest: {
          type: "object",
          required: ["_rname", "_rcode"],
          properties: {
            _rname: {
              type: "string",
              description: "角色名称",
              example: "图书管理员"
            },
            _rcode: {
              type: "string",
              description: "角色代码",
              example: "librarian"
            },
            _rdesc: {
              type: "string",
              description: "角色描述",
              example: "负责图书管理的管理员"
            },
            permissionIds: {
              type: "array",
              description: "权限ID列表",
              items: {
                type: "integer"
              },
              example: [1, 2, 3]
            }
          }
        },
        UpdateRoleRequest: {
          type: "object",
          properties: {
            _rname: {
              type: "string",
              description: "角色名称",
              example: "图书管理员"
            },
            _rcode: {
              type: "string",
              description: "角色代码",
              example: "librarian"
            },
            _rdesc: {
              type: "string",
              description: "角色描述",
              example: "负责图书管理的管理员"
            },
            permissionIds: {
              type: "array",
              description: "权限ID列表",
              items: {
                type: "integer"
              },
              example: [1, 2, 3]
            }
          }
        },
        AssignRoleRequest: {
          type: "object",
          required: ["roleIds"],
          properties: {
            roleIds: {
              type: "array",
              description: "角色ID列表",
              items: {
                type: "integer"
              },
              example: [1, 2]
            }
          }
        },
        // 批量上传相关模型（添加到现有 schemas 对象中）
        BulkUploadResponse: {
          type: "object",
          properties: {
            total: {
              type: "integer",
              description: "总记录数",
              example: 5
            },
            inserted: {
              type: "integer",
              description: "成功插入记录数",
              example: 4
            },
            updated: {
              type: "integer",
              description: "成功更新记录数",
              example: 0
            },
            skipped: {
              type: "integer",
              description: "跳过记录数",
              example: 1
            },
            errors: {
              type: "array",
              description: "错误详情",
              items: {
                type: "object",
                properties: {
                  index: {
                    type: "integer",
                    description: "记录索引",
                    example: 3
                  },
                  isbn: {
                    type: "string",
                    description: "ISBN号",
                    example: "9787301234567"
                  },
                  title: {
                    type: "string",
                    description: "图书名称",
                    example: "测试图书"
                  },
                  error: {
                    type: "string",
                    description: "错误信息",
                    example: "ISBN已存在"
                  }
                }
              }
            }
          }
        },
        BulkUploadErrorDetail: {
          type: "object",
          properties: {
            line: {
              type: "integer",
              description: "文件行号",
              example: 1
            },
            isbn: {
              type: "string",
              description: "ISBN号",
              example: "9787301234567"
            },
            title: {
              type: "string",
              description: "图书名称",
              example: "测试图书"
            },
            errors: {
              type: "array",
              items: {
                type: "string"
              },
              description: "错误列表",
              example: ["图书名称不能为空", "库存数量必须是非负整数"]
            }
          }
        },
        BulkUploadValidationResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "验证是否成功"
            },
            total: {
              type: "integer",
              description: "总记录数"
            },
            valid: {
              type: "integer",
              description: "有效记录数"
            },
            invalid: {
              type: "integer",
              description: "无效记录数"
            },
            errors: {
              type: "array",
              items: {
                $ref: "#/components/schemas/BulkUploadErrorDetail"
              }
            }
          }
        },
        BulkUploadTemplateRequest: {
          type: "object",
          properties: {
            file: {
              type: "string",
              format: "binary",
              description: "CSV或Excel文件"
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
                  _type_name: "计算机科学",
                  _total_copies: 5,
                  _available_copies: 4
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
                  _type_name: "科幻小说",
                  _total_copies: 3,
                  _available_copies: 1
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
              },
              _total_copies: 5,
              _available_copies: 4
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
                    _author: "Nicholas C. Zakas",
                    _isbn:"19787115275790"
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
                    _author: "刘慈欣",
                    _isbn:"19787115275791"
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
        },
        // 批量上传相关示例
        BulkUploadSuccess: {
          summary: "批量上传成功",
          value: {
            success: true,
            message: "批量上传完成",
            data: {
              total: 5,
              inserted: 4,
              updated: 0,
              skipped: 1,
              errors: [
                {
                  index: 3,
                  isbn: "9787301234567",
                  title: "测试图书",
                  error: "ISBN已存在，跳过此记录"
                }
              ]
            }
          }
        },
        BulkUploadValidationSuccess: {
          summary: "文件验证成功",
          value: {
            success: true,
            message: "文件验证通过",
            data: {
              total: 10,
              valid: 10,
              invalid: 0,
              errors: []
            }
          }
        },
        BulkUploadValidationFailed: {
          summary: "文件验证失败",
          value: {
            success: false,
            errorCode: "DATA_VALIDATION_FAILED",
            message: "数据验证失败",
            errors: [
              {
                line: 1,
                isbn: "9787301111111",
                title: "",
                errors: ["图书名称不能为空", "作者不能为空"]
              },
              {
                line: 3,
                isbn: "9787301111113",
                title: "测试图书3",
                errors: ["库存数量必须是非负整数"]
              }
            ],
            validCount: 8,
            invalidCount: 2
          }
        },
        MissingFileError: {
          summary: "缺少上传文件",
          value: {
            success: false,
            errorCode: "MISSING_FILE",
    message: "请选择上传文件"
  }
},
InvalidFileTypeError: {
  summary: "无效的文件类型",
  value: {
    success: false,
    errorCode: "INVALID_FILE_TYPE",
    message: "只支持CSV和Excel文件"
  }
},
FileParseError: {
  summary: "文件解析失败",
  value: {
    success: false,
    errorCode: "FILE_PARSE_ERROR",
    message: "文件解析失败",
    details: "Excel文件格式不正确"
  }
},
TemplateDownloadSuccess: {
  summary: "模板下载成功",
  value: "图书名称,ISBN,库存数量,作者,出版社,分类ID,封面URL\nJavaScript高级程序设计,9787115275790,10,Nicholas C. Zakas,人民邮电出版社,1,"
},
FileTooLargeError: {
  summary: "文件大小超过限制",
  value: {
    success: false,
    errorCode: "FILE_TOO_LARGE",
    message: "文件大小不能超过10MB"
  }
},
BulkUploadPartialSuccess: {
  summary: "部分成功",
  value: {
    success: true,
    message: "批量上传完成，部分记录处理失败",
    data: {
      total: 100,
      inserted: 85,
      updated: 5,
      skipped: 10,
      errors: [
        {
          index: 12,
          isbn: "9787301234567",
          title: "重复图书1",
          error: "ISBN已存在"
        },
        {
          index: 45,
          isbn: "9787301234578",
          title: "数据错误图书",
          error: "数据库插入失败: 字段长度超限"
        },
        {
          index: 78,
          isbn: "9787301234590",
          title: "测试图书78",
          error: "分类ID不存在"
        }
      ]
    }
  }
},
BulkUploadDatabaseError: {
  summary: "数据库错误",
  value: {
    success: false,
    errorCode: "DATABASE_ERROR",
    message: "数据库操作失败",
    details: "数据库连接超时，请稍后重试"
  }
},
BulkUploadEmptyFile: {
  summary: "空文件",
  value: {
    success: false,
    errorCode: "EMPTY_FILE",
    message: "上传的文件为空"
  }
},
// 消息相关示例
MessageListSuccess: {
  summary: "获取消息列表成功",
  value: {
    success: true,
    message: "获取消息列表成功",
    data: {
      messages: [
        {
          _mid: 1,
          _sender_id: 100,
          _receiver_id: 200,
          _title: "图书即将到期提醒",
          _content: "您借阅的《JavaScript高级程序设计》将于3天后到期，请及时归还或续借。",
          _type: 2,
          _status: 0,
          _create_time: "2024-01-15T10:30:00.000Z",
          _read_time: null,
          sender: {
            _uid: 100,
            _name: "系统管理员",
            _account: "admin_t"
          }
        },
        {
          _mid: 2,
          _sender_id: 100,
          _receiver_id: 200,
          _title: "预约图书到馆通知",
          _content: "您预约的《深入理解计算机系统》已经到馆，请在一周内到图书馆借阅。",
          _type: 3,
          _status: 1,
          _create_time: "2024-01-14T14:20:00.000Z",
          _read_time: "2024-01-14T15:30:00.000Z",
          sender: {
            _uid: 100,
            _name: "系统管理员",
            _account: "admin_t"
          }
        }
      ],
      pagination: {
        total: 5,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    }
  }
},
// 管理员相关模式
AdminListResponse: {
  type: "object",
  properties: {
    adminlist: {
      type: "array",
      items: {
        $ref: "#/components/schemas/Admin"
      },
      description: "管理员列表"
    }
  }
},
Admin: {
  type: "object",
  properties: {
    _uid: {
      type: "integer",
      description: "管理员ID",
      example: 100
    },
    _utype: {
      type: "string",
      enum: ["admin_t", "admin_n"],
      description: "管理员类型",
      example: "admin_n"
    },
    _account: {
      type: "string",
      description: "账号",
      example: "admin_n"
    },
    _name: {
      type: "string",
      description: "姓名",
      example: "普通管理员"
    },
    _email: {
      type: "string",
      description: "邮箱",
      example: "admin_n@library.com"
    },
    _max_num: {
      type: "integer",
      description: "最大借书数量",
      example: 50
    },
    lend_num: {
      type: "integer",
      description: "当前借书数量",
      example: 5
    },
    _access: {
      type: "integer",
      description: "访问权限",
      example: 1
    },
    _create_time: {
      type: "string",
      description: "创建时间",
      example: "2024-01-15T10:30:00.000Z"
    },
    roles: {
      type: "array",
      items: {
        $ref: "#/components/schemas/Role"
      },
      description: "管理员拥有的角色"
    }
  }
},
AdminListSuccess: {
  summary: "获取管理员列表成功",
  value: {
    success: true,
    message: "获取管理员列表成功",
    data: {
      adminlist: [
        {
          _uid: 100,
          _utype: "admin_t",
          _account: "admin_t",
          _name: "终端管理员",
          _email: "admin_t@library.com",
          _max_num: 100,
          lend_num: 10,
          _access: 1,
          _create_time: "2024-01-15T10:30:00.000Z",
          roles: [
            {
              _rid: 1,
              _rname: "系统管理员",
              _rcode: "system_admin",
              _rdesc: "拥有所有权限的系统管理员"
            }
          ]
        },
        {
          _uid: 101,
          _utype: "admin_n",
          _account: "admin_n",
          _name: "普通管理员",
          _email: "admin_n@library.com",
          _max_num: 50,
          lend_num: 5,
          _access: 1,
          _create_time: "2024-01-10T08:15:00.000Z",
          roles: [
            {
              _rid: 2,
              _rname: "图书管理员",
              _rcode: "book_admin",
              _rdesc: "负责图书管理的管理员"
            }
          ]
        }
      ]
    }
  }
},
AdminDetailSuccess: {
  summary: "获取管理员详情成功",
  value: {
    success: true,
    message: "成功获取管理员详情",
    data: {
      _uid: 101,
      _utype: "admin_n",
      _account: "admin_n",
      _name: "普通管理员",
      _email: "admin_n@library.com",
      _max_num: 50,
      lend_num: 5,
      _access: 1,
      _create_time: "2024-01-10T08:15:00.000Z",
      roles: [
        {
          _rid: 2,
          _rname: "图书管理员",
          _rcode: "book_admin",
          _rdesc: "负责图书管理的管理员",
          permissions: [
            {
              _pid: 1,
              _pname: "查看图书列表",
              _pcode: "book.view",
              _pdesc: "查看图书列表和详情",
              _pmodule: "book"
            },
            {
              _pid: 2,
              _pname: "添加图书",
              _pcode: "book.add",
              _pdesc: "添加新图书",
              _pmodule: "book"
            }
          ]
        }
      ]
    }
  }
},
UpdateAdminSuccess: {
  summary: "更新管理员信息成功",
  value: {
    success: true,
    message: "管理员信息更新成功",
    data: {
      _uid: 101,
      _utype: "admin_n",
      _account: "admin_n",
      _name: "普通管理员（已更新）",
      _email: "admin_n_updated@library.com",
      _max_num: 50,
      lend_num: 5,
      _access: 1,
      _create_time: "2024-01-10T08:15:00.000Z"
    }
  }
},
DeleteAdminSuccess: {
  summary: "删除管理员成功",
  value: {
    success: true,
    message: "管理员删除成功",
    data: {
      _uid: 101,
      _utype: "admin_n",
      _account: "admin_n",
      _name: "普通管理员",
      _email: "admin_n@library.com",
      _max_num: 50,
      lend_num: 0,
      _access: 1,
      _create_time: "2024-01-10T08:15:00.000Z"
    }
  }
},
AdminNotFoundError: {
  summary: "管理员不存在",
  value: {
    success: false,
    errorCode: "ADMIN_NOT_FOUND",
    message: "管理员不存在"
  }
},
CreateAdminRequest: {
  type: "object",
  required: ["_account", "_name", "_password", "_email", "_utype"],
  properties: {
    _account: {
      type: "string",
      description: "管理员账号",
      example: "admin_n_001"
    },
    _name: {
      type: "string",
      description: "管理员姓名",
      example: "新普通管理员"
    },
    _password: {
      type: "string",
      description: "管理员密码",
      example: "Admin123!"
    },
    _email: {
      type: "string",
      description: "管理员邮箱",
      example: "admin_n_001@example.com"
    },
    _utype: {
      type: "string",
      enum: ["admin_t", "admin_n"],
      description: "管理员类型",
      example: "admin_n"
    }
  }
},
CreateAdminSuccess: {
  summary: "创建管理员成功",
  value: {
    success: true,
    message: "管理员创建成功",
    data: {
      r_add: {
        _uid: 102,
        _utype: "admin_n",
        _account: "admin_n_001",
        _name: "新普通管理员",
        _email: "admin_n_001@example.com",
        _max_num: 50,
        lend_num: 0,
        _access: 1,
        _create_time: "2024-01-20T14:25:00.000Z"
      }
    }
  }
},
MessageDetailSuccess: {
  summary: "获取消息详情成功",
  value: {
    success: true,
    message: "成功获取消息详情",
    data: {
      _mid: 1,
      _sender_id: 100,
      _receiver_id: 200,
      _title: "图书即将到期提醒",
      _content: "您借阅的《JavaScript高级程序设计》将于3天后到期，请及时归还或续借。",
      _type: 2,
      _status: 0,
      _create_time: "2024-01-15T10:30:00.000Z",
      _read_time: null,
      sender: {
        _uid: 100,
        _name: "系统管理员",
        _account: "admin_t"
      }
    }
  }
},
CreateMessageSuccess: {
  summary: "发送消息成功",
  value: {
    success: true,
    message: "消息发送成功",
    data: {
      _mid: 3,
      _sender_id: 100,
      _receiver_id: 200,
      _title: "系统维护通知",
      _content: "系统将于本周六进行维护，届时将暂停服务2小时。",
      _type: 1,
      _status: 0,
      _create_time: "2024-01-16T09:00:00.000Z",
      _read_time: null,
      sender: {
        _uid: 100,
        _name: "系统管理员",
        _account: "admin_t"
      }
    }
  }
},
MessageNotFoundError: {
  summary: "消息不存在",
  value: {
    success: false,
    errorCode: "MESSAGE_NOT_FOUND",
    message: "消息不存在"
  }
},
ReceiverNotFoundError: {
  summary: "接收者不存在",
  value: {
    success: false,
    errorCode: "RECEIVER_NOT_FOUND",
    message: "接收者不存在"
  }
},
BulkUploadDuplicateISBN: {
  summary: "文件内重复ISBN",
  value: {
    success: false,
    errorCode: "DUPLICATE_ISBN_IN_FILE",
    message: "文件中存在重复的ISBN",
    duplicates: [
      {
        isbn: "9787301234567",
        lines: [3, 15, 22]
      }
    ]
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