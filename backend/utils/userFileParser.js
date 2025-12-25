const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { Department, Major, Class, WorkDepartment } = require('../models');

const parseClassInfo = (classString) => {
  const parts = classString.split('-');
  
  if (parts.length >= 3) {
    // 格式：院系-专业-班级
    return {
      departmentName: parts[0],
      majorName: parts[1],
      className: parts.slice(2).join('-')
    };
  } else if (parts.length === 2) {
    if (parts[0].includes('学院') || parts[0].includes('系') || parts[0].includes('部')) {
      // 格式：院系-班级
      return {
        departmentName: parts[0],
        majorName: null,
        className: parts[1]
      };
    } else {
      // 格式：专业-班级
      return {
        departmentName: null,
        majorName: parts[0],
        className: parts[1]
      };
    }
  } else {
    // 只有班级名
    return {
      departmentName: null,
      majorName: null,
      className: classString
    };
  }
};


/**
 * 解析上传的用户文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<Array>} 解析后的用户数据数组
 */
const parseUserFile = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }

    // 检查文件类型
    const ext = path.extname(filePath).toLowerCase();
    // 添加调试日志
    console.log('文件路径:', filePath);
    console.log('文件扩展名:', ext);
    
    // 如果没有扩展名，尝试根据文件内容判断格式
    if (!ext) {
      console.log('文件没有扩展名，尝试根据内容判断格式...');
      // 尝试读取文件头部来判断文件类型
      const buffer = fs.readFileSync(filePath, { start: 0, end: 8 });
      const header = buffer.toString('hex');
      
      // XLSX 文件头部标识
      if (header.startsWith('504b0304')) {
        console.log('检测为XLSX格式');
        return await parseXLSXFile(filePath);
      }
      // CSV 文件没有特定的头部标识，默认尝试CSV解析
      else {
        console.log('尝试按CSV格式解析');
        try {
          return parseCSVFile(filePath);
        } catch (csvError) {
          console.error('CSV解析失败，尝试XLSX解析:', csvError);
          try {
            return await parseXLSXFile(filePath);
          } catch (xlsxError) {
            throw new Error('无法识别文件格式，既不是CSV也不是XLSX');
          }
        }
      }
    }

    if (ext === '.csv') {
      return parseCSVFile(filePath);
    } else if (ext === '.xlsx') {
      return await parseXLSXFile(filePath);
    } else {
      throw new Error(`不支持的文件格式: ${ext}`);
    }
  } catch (error) {
    console.error('解析文件失败:', error);
    throw new Error('文件解析失败: ' + error.message);
  }
};

/**
 * 解析CSV文件
 * @param {string} filePath - 文件路径
 * @returns {Array} 解析后的数据数组
 */
const parseCSVFile = (filePath) => {
  // 读取CSV文件
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // 解析CSV内容
  const lines = fileContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV文件内容不完整，至少需要标题行和一行数据');
  }

  // 解析标题行
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

  // 解析数据行
  const jsonData = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));

    if (values.length !== headers.length) {
      console.warn(`第${i+1}行数据列数与标题行不匹配，已跳过`);
      continue;
    }

    const rowObject = {};
    headers.forEach((header, index) => {
      rowObject[header] = values[index];
    });

    jsonData.push(rowObject);
  }

  return jsonData;
};

/**
 * 解析XLSX文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<Array>} 解析后的数据数组
 */
const parseXLSXFile = async (filePath) => {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }

    console.log('开始解析XLSX文件:', filePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
      throw new Error('Excel文件中没有工作表');
    }

    let data = [];
    console.log('Excel文件总行数:', worksheet.rowCount);

    // 跳过开头的注释行，找到真正的标题行
    let headerRowIndex = 1;
    let foundHeader = false;

    while (headerRowIndex <= worksheet.rowCount) {
      const row = worksheet.getRow(headerRowIndex);
      const firstCell = row.getCell(1).value;

      // 检查是否是注释行
      if (firstCell && String(firstCell).startsWith('#')) {
        headerRowIndex++;
        continue;
      }

      // 检查是否是空行
      if (!firstCell) {
        headerRowIndex++;
        continue;
      }

      // 检查是否是模板说明行
      if (String(firstCell).includes('模板') || String(firstCell).includes('说明')) {
        headerRowIndex++;
        continue;
      }

      // 检查是否是字段说明行
      if (String(firstCell).includes('必填') || String(firstCell).includes('可选')) {
        headerRowIndex++;
        continue;
      }

      // 检查是否是示例数据行
      if (String(firstCell).includes('示例')) {
        headerRowIndex++;
        continue;
      }

      // 如果不是上述特殊行，则认为是标题行
      foundHeader = true;
      break;
    }

    if (!foundHeader) {
      throw new Error('未找到有效的标题行');
    }

    console.log('找到标题行在第:', headerRowIndex, '行');

    // 获取标题行
    const headerRow = worksheet.getRow(headerRowIndex);
    let headers = [];
    headerRow.eachCell((cell, colNumber) => {
      const value = cell.value ? String(cell.value).replace(/^#/, '').trim() : '';
      headers.push(value);
    });

    console.log('解析后的标题:', headers);

    // 处理数据行
    for (let rowNumber = headerRowIndex + 1; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      // 获取第一个单元格的值
      const firstCell = row.getCell(1).value;
      
      // 检查是否是注释行
      if (firstCell && String(firstCell).startsWith('#')) {
        continue;
      }

      // 检查是否是空行
      if (!firstCell) {
        continue;
      }

      // 创建数据对象
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        if (headers[colNumber - 1]) {
          rowData[headers[colNumber - 1]] = cell.value;
        }
      });

      // 只添加非空数据行
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    }

    console.log('解析完成，共解析数据行数:', data.length);
    return data;

  } catch (error) {
    console.error('解析XLSX文件失败:', error);
    throw new Error('XLSX文件解析失败: ' + error.message);
  }
};

/**
 * 验证学生数据
 * @param {Array} students - 学生数据数组
 * @returns {Object} 验证结果 {valid: boolean, errors: Array, validStudents: Array}
 */
const validateStudents = (students) => {
  const errors = [];
  const validStudents = [];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const rowErrors = [];

    // 检查必填字段
    if (!student['账号'] || !student['账号'].toString().trim()) {
      rowErrors.push('账号不能为空');
    }

    if (!student['姓名'] || !student['姓名'].toString().trim()) {
      rowErrors.push('姓名不能为空');
    }

    if (!student['邮箱'] || !student['邮箱'].toString().trim()) {
      rowErrors.push('邮箱不能为空');
    }

    if (!student['班级'] || !student['班级'].toString().trim()) {
      rowErrors.push('班级不能为空');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (student['邮箱'] && !emailRegex.test(student['邮箱'])) {
      rowErrors.push('邮箱格式不正确');
    }

    // 如果有错误，记录到错误列表
    if (rowErrors.length > 0) {
      errors.push({
        row: i + 2, // Excel行号从1开始，加上标题行
        data: student,
        errors: rowErrors
      });
    } else {
      // 解析班级信息
      const classInfo = parseClassInfo(student['班级'].toString().trim());
      console.log(`解析班级信息: ${student['班级']} =>`, classInfo);
      // 如果没有错误，添加到有效学生列表
      validStudents.push({
        _account: student['账号'].toString().trim(),
        _name: student['姓名'].toString().trim(),
        _email: student['邮箱'].toString().trim(),
        _cname: classInfo.className,
        _dname: classInfo.departmentName,
        _mname: classInfo.majorName,
        _password: student['密码'] ? student['密码'].toString().trim() : '123456'
      });
      
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    validStudents
  };
};

/**
 * 验证教师数据
 * @param {Array} teachers - 教师数据数组
 * @returns {Object} 验证结果 {valid: boolean, errors: Array, validTeachers: Array}
 */
const validateTeachers = (teachers) => {
  const errors = [];
  const validTeachers = [];

  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    const rowErrors = [];

    // 检查必填字段
    if (!teacher['账号'] || !teacher['账号'].toString().trim()) {
      rowErrors.push('账号不能为空');
    }

    if (!teacher['姓名'] || !teacher['姓名'].toString().trim()) {
      rowErrors.push('姓名不能为空');
    }

    if (!teacher['邮箱'] || !teacher['邮箱'].toString().trim()) {
      rowErrors.push('邮箱不能为空');
    }

    if (!teacher['院系'] || !teacher['院系'].toString().trim()) {
      rowErrors.push('院系不能为空');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (teacher['邮箱'] && !emailRegex.test(teacher['邮箱'])) {
      rowErrors.push('邮箱格式不正确');
    }

    // 如果有错误，记录到错误列表
    if (rowErrors.length > 0) {
      errors.push({
        row: i + 2, // Excel行号从1开始，加上标题行
        data: teacher,
        errors: rowErrors
      });
    } else {
      // 如果没有错误，添加到有效教师列表
      validTeachers.push({
        account: teacher['账号'].toString().trim(),
        name: teacher['姓名'].toString().trim(),
        email: teacher['邮箱'].toString().trim(),
        departmentName: teacher['院系'].toString().trim(),
        password: teacher['密码'] ? teacher['密码'].toString().trim() : '123456' // 默认密码
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validTeachers
  };
};

/**
 * 验证临时工数据
 * @param {Array} tempWorkers - 临时工数据数组
 * @returns {Object} 验证结果 {valid: boolean, errors: Array, validTempWorkers: Array}
 */
const validateTempWorkers = (tempWorkers) => {
  const errors = [];
  const validTempWorkers = [];

  for (let i = 0; i < tempWorkers.length; i++) {
    const tempWorker = tempWorkers[i];
    const rowErrors = [];

    // 检查必填字段
    if (!tempWorker['账号'] || !tempWorker['账号'].toString().trim()) {
      rowErrors.push('账号不能为空');
    }

    if (!tempWorker['姓名'] || !tempWorker['姓名'].toString().trim()) {
      rowErrors.push('姓名不能为空');
    }

    if (!tempWorker['邮箱'] || !tempWorker['邮箱'].toString().trim()) {
      rowErrors.push('邮箱不能为空');
    }

    if (!tempWorker['工作部门'] || !tempWorker['工作部门'].toString().trim()) {
      rowErrors.push('工作部门不能为空');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (tempWorker['邮箱'] && !emailRegex.test(tempWorker['邮箱'])) {
      rowErrors.push('邮箱格式不正确');
    }

    // 如果有错误，记录到错误列表
    if (rowErrors.length > 0) {
      errors.push({
        row: i + 2, // Excel行号从1开始，加上标题行
        data: tempWorker,
        errors: rowErrors
      });
    } else {
      // 如果没有错误，添加到有效临时工列表
      validTempWorkers.push({
        account: tempWorker['账号'].toString().trim(),
        name: tempWorker['姓名'].toString().trim(),
        email: tempWorker['邮箱'].toString().trim(),
        workDepartmentName: tempWorker['工作部门'].toString().trim(),
        password: tempWorker['密码'] ? tempWorker['密码'].toString().trim() : '123456' // 默认密码
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validTempWorkers
  };
};

/**
 * 生成学生导入模板
 * @returns {string} CSV文件内容
 */
const generateStudentTemplate = () => {
  // 创建CSV内容
  const headers = ['账号', '姓名', '邮箱', '班级', '密码'];
  const example = ['20210001', '张三', 'zhangsan@example.com', '计算机与网络空间安全学院-计算机科学与技术-计科1班', '123456'];
  const description = ['#必填', '#必填', '#必填', '#必填（学院名-专业名-班级名）', '#必填'];
  const wrapWithQuotes = (arr) => arr.map(item => `"${item}"`).join(',');

  const rows = [
    '# 学生批量导入模板',
    '# 说明：',
    '# 1. 第一行为标题行，请勿修改',
    '# 2. 第二行为字段说明，请勿修改',
    '# 3. 第三行为示例数据，可以删除',
    '# 4. 以#开头的行为注释行，会被自动忽略',
    '',
    wrapWithQuotes(headers),
    wrapWithQuotes(description),
    wrapWithQuotes(example),
    '',
    '# 注意事项：',
    '# 1. 账号、姓名、邮箱、班级为必填字段',
    '# 2. 密码为必填字段，建议使用6位以上数字或字母',
    '# 3. 班级必须是系统中已存在的班级名称',
    '# 4. 所有文本字段如果包含逗号，请用双引号包裹'
  ];

  return rows.join('\n');
};

/**
 * 生成教师导入模板
 * @returns {string} CSV文件内容
 */
const generateTeacherTemplate = () => {
  // 创建CSV内容
  const headers = ['账号', '姓名', '邮箱', '院系', '密码'];
  const example = ['T001', '李老师', 'liteacher@example.com', '计算机学院', '123456'];
  const description = ['#必填', '#必填', '#必填', '#必填（院系名称）', '#必填'];
  const wrapWithQuotes = (arr) => arr.map(item => `"${item}"`).join(',');

  const rows = [
    '# 教师批量导入模板',
    '# 说明：',
    '# 1. 第一行为标题行，请勿修改',
    '# 2. 第二行为字段说明，请勿修改',
    '# 3. 第三行为示例数据，可以删除',
    '# 4. 以#开头的行为注释行，会被自动忽略',
    '',
    wrapWithQuotes(headers),
    wrapWithQuotes(description),
    wrapWithQuotes(example),
    '',
    '# 注意事项：',
    '# 1. 账号、姓名、邮箱、院系为必填字段',
    '# 2. 密码为必填字段，建议使用6位以上数字或字母',
    '# 3. 院系必须是系统中已存在的院系名称',
    '# 4. 所有文本字段如果包含逗号，请用双引号包裹'
  ];

  return rows.join('\n');
};

/**
 * 生成临时工导入模板
 * @returns {string} CSV文件内容
 */
const generateTempWorkerTemplate = () => {
  // 创建CSV内容
  const headers = ['账号', '姓名', '邮箱', '工作部门', '密码'];
  const example = ['W001', '王临时工', 'wangworker@example.com', '校图书馆', '123456'];
  const description = ['#必填', '#必填', '#必填', '#必填（工作部门名称）', '#必填'];
  const wrapWithQuotes = (arr) => arr.map(item => `"${item}"`).join(',');

  const rows = [
    '# 临时工批量导入模板',
    '# 说明：',
    '# 1. 第一行为标题行，请勿修改',
    '# 2. 第二行为字段说明，请勿修改',
    '# 3. 第三行为示例数据，可以删除',
    '# 4. 以#开头的行为注释行，会被自动忽略',
    '',
    wrapWithQuotes(headers),
    wrapWithQuotes(description),
    wrapWithQuotes(example),
    '',
    '# 注意事项：',
    '# 1. 账号、姓名、邮箱、工作部门为必填字段',
    '# 2. 密码为必填字段，建议使用6位以上数字或字母',
    '# 3. 工作部门必须是系统中已存在的工作部门名称',
    '# 4. 所有文本字段如果包含逗号，请用双引号包裹'
  ];

  return rows.join('\n');
};

/**
 * 自动创建院系（如果不存在）
 * @param {string} departmentName - 院系名称
 * @returns {Promise<Object>} 院系对象
 */
const findOrCreateDepartment = async (departmentName) => {
  let department = await Department.findOne({
    where: { _dname: departmentName }
  });

  if (!department) {
    department = await Department.create({
      _dname: departmentName
    });
    console.log(`自动创建院系: ${departmentName}`);
  }

  return department;
};

/**
 * 自动创建专业（如果不存在）
 * @param {string} majorName - 专业名称
 * @param {number} departmentId - 院系ID
 * @returns {Promise<Object>} 专业对象
 */
const findOrCreateMajor = async (majorName, departmentId) => {
  let major = await Major.findOne({
    where: { _mname: majorName }
  });

  if (!major) {
    major = await Major.create({
      _mname: majorName,
      _did: departmentId
    });
    console.log(`自动创建专业: ${majorName}`);
  }

  return major;
};

/**
 * 自动创建班级（如果不存在）
 * @param {string} className - 班级名称
 * @param {number} majorId - 专业ID
 * @returns {Promise<Object>} 班级对象
 */
const findOrCreateClass = async (className, majorId) => {
  let classRecord = await Class.findOne({
    where: { name: className }
  });

  if (!classRecord) {
    classRecord = await Class.create({
      name: className,
      major_id: majorId
    });
    console.log(`自动创建班级: ${className}`);
  }

  return classRecord;
};

/**
 * 自动创建工作部门（如果不存在）
 * @param {string} workDepartmentName - 工作部门名称
 * @returns {Promise<Object>} 工作部门对象
 */
const findOrCreateWorkDepartment = async (workDepartmentName) => {
  let workDepartment = await WorkDepartment.findOne({
    where: { _wdname: workDepartmentName }
  });

  if (!workDepartment) {
    workDepartment = await WorkDepartment.create({
      _wdname: workDepartmentName
    });
    console.log(`自动创建工作部门: ${workDepartmentName}`);
  }

  return workDepartment;
};

/**
 * 根据班级名称获取或创建班级及其关联的专业和院系
 * @param {string} className - 班级名称
 * @returns {Promise<Object>} 班级对象
 */
const getOrCreateClassWithHierarchy = async (className) => {
  // 查找班级
  let classRecord = await Class.findOne({
    where: { _cname: className },
    include: [
      {
        model: Major,
        as: 'major',
        include: [
          {
            model: Department,
            as: 'department'
          }
        ]
      }
    ]
  });

  // 如果班级不存在，则尝试解析班级名称并创建层级结构
  if (!classRecord) {
    const classInfo = parseClassInfo(className);
    
    if (classInfo.departmentName && classInfo.majorName) {
      // 有院系和专业信息
      const department = await findOrCreateDepartment(classInfo.departmentName);
      const major = await findOrCreateMajor(classInfo.majorName, department._did);
      classRecord = await findOrCreateClass(className, major._mid);
    } else if (classInfo.departmentName) {
      // 只有院系信息
      const department = await findOrCreateDepartment(classInfo.departmentName);
      const major = await findOrCreateMajor('默认专业', department._did);
      classRecord = await findOrCreateClass(className, major._mid);
    } else if (classInfo.majorName) {
      // 只有专业信息
      const department = await findOrCreateDepartment('默认院系');
      const major = await findOrCreateMajor(classInfo.majorName, department._did);
      classRecord = await findOrCreateClass(className, major._mid);
    } else {
      // 只有班级信息
      const department = await findOrCreateDepartment('默认院系');
      const major = await findOrCreateMajor('默认专业', department._did);
      classRecord = await findOrCreateClass(className, major._mid);
    }
  }

  return classRecord;
};

/**
 * 清理临时文件
 * @param {string} filePath - 文件路径
 */
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('临时文件已删除:', filePath);
    }
  } catch (error) {
    console.error('删除临时文件失败:', error);
  }
};

module.exports = {
  parseUserFile,
  validateStudents,
  validateTeachers,
  validateTempWorkers,
  generateStudentTemplate,
  generateTeacherTemplate,
  generateTempWorkerTemplate,
  findOrCreateDepartment,
  findOrCreateMajor,
  findOrCreateClass,
  findOrCreateWorkDepartment,
  getOrCreateClassWithHierarchy,
  cleanupTempFile
};
