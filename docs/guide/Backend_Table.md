## 后端数据库表一览

>#### 提醒:
> VSCode中查看markdown文件的预览的快捷键：`ctrl + shift + v`
  VSCode中导出markdown文件为pdf的快捷键：`ctrl + shift + p`，然后输入`Markdown PDF`，选择`Markdown PDF: Export`，然后选择导出路径。
  VSCode中在预览中查找特定词汇的快捷键：`ctrl + f`

---

### 用户表(t_user)

| 字段名 | 类型 | 描述 |
| :----: | :----: | :----: |
| _uid | int4 | 用户ID |
| _utype | varchar(7) | 用户类型 |
| _account | varchar(10) | 用户账号 |
| _name | varchar(50) | 用户名 |
| _password | varchar(127) | 用户密码 |
| _email | varchar(20) | 用户邮箱 |
| _max_num | int4 | 最大借书数量 |
| lend_num | int4 | 当前借书数量 |
| _access | int4 | 用户能否登录系统 |
| _totle | int4 | 用户累计阅读时间 |

### 书籍表(t_book)

| 字段名 | 类型 | 描述 |
| :----: | :----: | :----: |
| _bid | int4 | 书籍ID |
| _book_name | varchar(741) | 书籍名 |
| _ISBN | varchar(20) | ISBN码 |
| _num | int4 | 馆藏书籍数量 |
| _author | varchar(50) | 作者 |
| _press | varchar(30) | 出版社 |
| _profile | text | 图书简介 |
| _cover_url | varchar(255) | 图书封面图片的存储路径 |
| _tid | int4 | 图书类型ID |
| _times | int4 | 借阅次数 |
| create_time | datetime | 管理员添加图书的时间，用于新书推荐 |

### 图书类型表(t_type)

| 字段名 | 类型 | 描述 |
| :----: | :----: | :----: |
| _tid | int4 | 图书类型ID |
| _type_name | varchar(8) | 图书类型名 |

### 借阅记录表(t_history)

| 字段名 | 类型 | 描述 |
| :----: | :----: | :----: |
| _hid | int4 | 借阅记录ID |
| _uid | int4 | 用户ID |
| _bid | int4 | 书籍ID 
| _begin_time | date | 借阅时间 |
| _end_date | date | 归还时间 |
| _status | int4 | 借阅状态 |

### 预约记录表(t_order)

| 字段名 | 类型 | 描述 |
| :----: | :----: | :----: |
| _oid | int4 | 预约记录ID |
| _uid | int4 | 用户ID |
| _bid | int4 | 书籍ID |
| _otime | date | 预约时间 |

### 公告表(t_announcements)

| 字段名 | 类型 | 描述 |
| :----: | :----: | :----: |
| _aid | int4 | 公告ID |
| _title | varchar(255) | 公告标题 |
| _content | text | 公告内容 |
| _adate | date | 发布日期 |
| _publisher | varchar(50) | 发布人 |

### 意见反馈表(t_feedbacks)

| 字段名 | 类型 | 描述 |
| :----: | :----: | :----: |
| _fid | int4 | 反馈ID |
| _name | varchar(50) | 用户名 |
| _email | varchar(20) | 用户邮箱 |
| _ftype | varchar(20) | 反馈类型（建议、问题，其他） |
| _fcontent| text | 反馈内容 |
| _fdate | date | 提交时间 |

### 阅读时长记录表(t_read_records)

| 字段名 | 类型 | 描述 |
| :----: | :----: | :----: |
| _did | int4 | 时长记录ID |
| _uid | int4 | 用户ID |
| _bid | int4 | 书籍ID |
| _duration | int4 | 单次阅读时长 |
| _read_date | datetime | 阅读日期时间 |