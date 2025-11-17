-- 图书管理系统数据库表结构
-- PostgreSQL版本

-- 图书类型表
CREATE TABLE t_type (
    _tid SERIAL PRIMARY KEY,
    _type_name VARCHAR(8) NOT NULL UNIQUE
);

COMMENT ON TABLE t_type IS '图书类型表';
COMMENT ON COLUMN t_type._tid IS '图书类型ID';
COMMENT ON COLUMN t_type._type_name IS '图书类型名';

-- 用户表
CREATE TABLE t_user (
    _uid SERIAL PRIMARY KEY,
    _utype VARCHAR(7) NOT NULL,
    _account VARCHAR(10) NOT NULL UNIQUE,
    _name VARCHAR(50) NOT NULL,
    _password VARCHAR(127) NOT NULL,
    _email VARCHAR(20) NOT NULL,
    _max_num INTEGER NOT NULL DEFAULT 10,
    lend_num INTEGER NOT NULL DEFAULT 0,
    _access INTEGER NOT NULL DEFAULT 1,
    _totle INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE t_user IS '用户表';
COMMENT ON COLUMN t_user._uid IS '用户ID';
COMMENT ON COLUMN t_user._utype IS '用户类型';
COMMENT ON COLUMN t_user._account IS '用户账号';
COMMENT ON COLUMN t_user._name IS '用户名';
COMMENT ON COLUMN t_user._password IS '用户密码';
COMMENT ON COLUMN t_user._email IS '用户邮箱';
COMMENT ON COLUMN t_user._max_num IS '最大借书数量';
COMMENT ON COLUMN t_user.lend_num IS '当前借书数量';
COMMENT ON COLUMN t_user._access IS '用户能否登录系统';
COMMENT ON COLUMN t_user._totle IS '用户累计阅读时间';

-- 书籍表
CREATE TABLE t_book (
    _bid SERIAL PRIMARY KEY,
    _book_name VARCHAR(741) NOT NULL,
    _ISBN VARCHAR(20) NOT NULL UNIQUE,
    _num INTEGER NOT NULL DEFAULT 1,
    _author VARCHAR(50) NOT NULL,
    _press VARCHAR(30) NOT NULL,
    _profile TEXT,
    _cover_url VARCHAR(255),
    _tid INTEGER NOT NULL,
    _times INTEGER NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (_tid) REFERENCES t_type(_tid) ON DELETE RESTRICT ON UPDATE CASCADE
);

COMMENT ON TABLE t_book IS '书籍表';
COMMENT ON COLUMN t_book._bid IS '书籍ID';
COMMENT ON COLUMN t_book._book_name IS '书籍名';
COMMENT ON COLUMN t_book._ISBN IS 'ISBN码';
COMMENT ON COLUMN t_book._num IS '馆藏书籍数量';
COMMENT ON COLUMN t_book._author IS '作者';
COMMENT ON COLUMN t_book._press IS '出版社';
COMMENT ON COLUMN t_book._profile IS '图书简介';
COMMENT ON COLUMN t_book._cover_url IS '图书封面图片的存储路径';
COMMENT ON COLUMN t_book._tid IS '图书类型ID';
COMMENT ON COLUMN t_book._times IS '借阅次数';
COMMENT ON COLUMN t_book.create_time IS '管理员添加图书的时间，用于新书推荐';

-- 借阅记录表
CREATE TABLE t_history (
    _hid SERIAL PRIMARY KEY,
    _uid INTEGER NOT NULL,
    _bid INTEGER NOT NULL,
    _begin_time DATE NOT NULL,
    _end_date DATE NOT NULL,
    _status INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (_uid) REFERENCES t_user(_uid) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (_bid) REFERENCES t_book(_bid) ON DELETE RESTRICT ON UPDATE CASCADE
);

COMMENT ON TABLE t_history IS '借阅记录表';
COMMENT ON COLUMN t_history._hid IS '借阅记录ID';
COMMENT ON COLUMN t_history._uid IS '用户ID';
COMMENT ON COLUMN t_history._bid IS '书籍ID';
COMMENT ON COLUMN t_history._begin_time IS '借阅时间';
COMMENT ON COLUMN t_history._end_date IS '归还时间';
COMMENT ON COLUMN t_history._status IS '借阅状态';

-- 预约记录表
CREATE TABLE t_order (
    _oid SERIAL PRIMARY KEY,
    _uid INTEGER NOT NULL,
    _bid INTEGER NOT NULL,
    _otime DATE NOT NULL DEFAULT CURRENT_DATE,
    FOREIGN KEY (_uid) REFERENCES t_user(_uid) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (_bid) REFERENCES t_book(_bid) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (_uid, _bid)
);

COMMENT ON TABLE t_order IS '预约记录表';
COMMENT ON COLUMN t_order._oid IS '预约记录ID';
COMMENT ON COLUMN t_order._uid IS '用户ID';
COMMENT ON COLUMN t_order._bid IS '书籍ID';
COMMENT ON COLUMN t_order._otime IS '预约时间';

-- 公告表
CREATE TABLE t_announcements (
    _aid SERIAL PRIMARY KEY,
    _title VARCHAR(255) NOT NULL,
    _content TEXT NOT NULL,
    _adate DATE NOT NULL DEFAULT CURRENT_DATE,
    _publisher VARCHAR(50) NOT NULL
);

COMMENT ON TABLE t_announcements IS '公告表';
COMMENT ON COLUMN t_announcements._aid IS '公告ID';
COMMENT ON COLUMN t_announcements._title IS '公告标题';
COMMENT ON COLUMN t_announcements._content IS '公告内容';
COMMENT ON COLUMN t_announcements._adate IS '发布日期';
COMMENT ON COLUMN t_announcements._publisher IS '发布人';

-- 意见反馈表
CREATE TABLE t_feedbacks (
    _fid SERIAL PRIMARY KEY,
    _name VARCHAR(50) NOT NULL,
    _email VARCHAR(20) NOT NULL,
    _ftype VARCHAR(20) NOT NULL,
    _fcontent TEXT NOT NULL,
    _fdate DATE NOT NULL DEFAULT CURRENT_DATE
);

COMMENT ON TABLE t_feedbacks IS '意见反馈表';
COMMENT ON COLUMN t_feedbacks._fid IS '反馈ID';
COMMENT ON COLUMN t_feedbacks._name IS '用户名';
COMMENT ON COLUMN t_feedbacks._email IS '用户邮箱';
COMMENT ON COLUMN t_feedbacks._ftype IS '反馈类型（建议、问题，其他）';
COMMENT ON COLUMN t_feedbacks._fcontent IS '反馈内容';
COMMENT ON COLUMN t_feedbacks._fdate IS '提交时间';

-- 阅读时长记录表
CREATE TABLE t_read_records (
    _did SERIAL PRIMARY KEY,
    _uid INTEGER NOT NULL,
    _bid INTEGER NOT NULL,
    _duration INTEGER NOT NULL,
    _read_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (_uid) REFERENCES t_user(_uid) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (_bid) REFERENCES t_book(_bid) ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE t_read_records IS '阅读时长记录表';
COMMENT ON COLUMN t_read_records._did IS '时长记录ID';
COMMENT ON COLUMN t_read_records._uid IS '用户ID';
COMMENT ON COLUMN t_read_records._bid IS '书籍ID';
COMMENT ON COLUMN t_read_records._duration IS '单次阅读时长';
COMMENT ON COLUMN t_read_records._read_date IS '阅读日期时间';

-- 创建索引以提高查询性能
CREATE INDEX idx_user_account ON t_user(_account);
CREATE INDEX idx_user_email ON t_user(_email);
CREATE INDEX idx_type_name ON t_type(_type_name);
CREATE INDEX idx_book_isbn ON t_book(_ISBN);
CREATE INDEX idx_book_name ON t_book(_book_name);
CREATE INDEX idx_book_author ON t_book(_author);
CREATE INDEX idx_book_type ON t_book(_tid);
CREATE INDEX idx_history_user ON t_history(_uid);
CREATE INDEX idx_history_book ON t_history(_bid);
CREATE INDEX idx_history_status ON t_history(_status);
CREATE INDEX idx_history_dates ON t_history(_begin_time, _end_date);
CREATE INDEX idx_order_user ON t_order(_uid);
CREATE INDEX idx_order_book ON t_order(_bid);
CREATE INDEX idx_order_time ON t_order(_otime);
CREATE INDEX idx_announcement_date ON t_announcements(_adate);
CREATE INDEX idx_announcement_publisher ON t_announcements(_publisher);
CREATE INDEX idx_feedback_date ON t_feedbacks(_fdate);
CREATE INDEX idx_feedback_type ON t_feedbacks(_ftype);
CREATE INDEX idx_read_user ON t_read_records(_uid);
CREATE INDEX idx_read_book ON t_read_records(_bid);
CREATE INDEX idx_read_date ON t_read_records(_read_date);