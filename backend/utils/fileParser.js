// utils/fileParser.js
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

/* 解析上传的文件
 * @param {string} filePath - 文件路径
 * @param {string} fileType - 文件类型 (csv, xlsx, xls)
 * @param {Object} dbConnection - 数据库连接对象
 * @returns {Promise<Array>} 解析后的数据数组
 */
async function parseFile(filePath, fileType, dbConnection) {
  try {
    console.log('开始解析文件:', filePath);
    console.log('文件类型:', fileType);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }
    
    const stats = fs.statSync(filePath);
    console.log('文件大小:', stats.size, 'bytes');
    let result;
    
    switch (fileType.toLowerCase()) {
      case 'csv':
        console.log('使用原生方法解析CSV文件');
        result = await parseCSV(filePath, dbConnection);
        break;
      case 'xlsx':
      case 'xls':
        console.log('使用原生方法解析Excel文件');
        result = await parseExcel(filePath, dbConnection);
        break;
      default:
        throw new Error(`不支持的文件类型: ${fileType}`);
    }
    
    return result.data;
  } catch (error) {
    throw new Error(`文件文件解析失败: ${error.message}`);
  }
}


/**
 * 标准化行字段名
 */
async function standardizeRowFields(row, dbConnection) {
  console.log('标准化行字段，输入行:', row);
  if (!row || typeof row !== 'object') {
    return {
      _book_name: '',
      _isbn: '',
      _total_copies: '',
      _available_copies: '',
      _author: '',
      _press: '',
      _tid: null,
      _cover_url: ''
    };
  }
  
  const fieldMappings = {
    '_book_name': ['图书名称', '书名', '名称', 'title', 'book_name', '_book_name'],
    '_isbn': ['ISBN', '书号', 'isbn', '_isbn'],
    '_total_copies': ['库存', '数量', '库存数量', 'stock', 'total_copies', '_total_copies'],
    '_available_copies': ['可借数量', '可用数量', 'available_copies', '_available_copies'],
    '_author': ['作者', '著者', 'author', '_author'],
    '_press': ['出版社', '出版单位', 'press', 'publisher', '_press'],
    '_type_name': ['分类名称', '类型名称', '类别名称', '图书类别', '分类', '类别', 'category_name', '_type_name'],
    '_cover_url': ['封面URL', '封面地址', '图片URL', 'cover', 'cover_url', '_cover_url']
  };
  
  let standardizedRow = {};
  Object.keys(fieldMappings).forEach(dbField => {
    console.log(`处理字段: ${dbField}`);
    const possibleNames = fieldMappings[dbField];
    let found = false;
    
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        standardizedRow[dbField] = String(row[name]).trim();
        found = true;
        break;
      }
    }
    
    if (!found) {
      standardizedRow[dbField] = '';
    }
  });
  // 处理分类ID转换
  console.log('处理分类ID转换，当前行:', standardizedRow._type_name);
  console.log('数据库连接状态:', dbConnection ? '已连接' : '未连接');
  if (standardizedRow._type_name && dbConnection) {
    console.log("开始处理分类名称转储为ID")
    try {
      // 确保默认分类存在
      console.log("开始查找或创建分类");
      // 查找或创建分类
      const [category] = await dbConnection.Category.findOrCreate({
        where: { _type_name: standardizedRow._type_name },
        defaults: {
          _type_name: standardizedRow._type_name
        }
      });
      console.log(`###分类 "${standardizedRow._type_name}" 的ID:`, category._tid);
      // 设置分类ID
      standardizedRow._tid = category._tid;
      delete standardizedRow._type_name;

    } catch (error) {
      console.error('处理分类时出错:', error);
      throw new Error(`处理分类 "${standardizedRow._type_name}" 时出错: ${error.message}`);
    }
  } else if (!standardizedRow._type_name && dbConnection) {
    try {
      // 如果没有指定分类，使用默认分类
      const [defaultCategory] = await dbConnection.Category.findOrCreate({
        where: { _type_name: '默认分类' },
        defaults: {
          _type_name: '默认分类'
        }
      });
      standardizedRow._tid = defaultCategory._tid;
    } catch (error) {
      console.error('获取默认分类时出错:', error);
      throw new Error(`获取默认分类时出错: ${error.message}`);
    }
  }
  
  return standardizedRow;
}



/**
 * 解析CSV文件 - 使用原生JavaScript实现
 */
function parseCSV(filePath, dbConnection) {
  return new Promise((resolve, reject) => {
    console.log('开始解析CSV文件:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('文件不存在:', filePath);
      reject(new Error('文件不存在'));
      return;
    }
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('读取文件失败:', err);
        reject(err);
        return;
      }
    // 移除BOM标记（如果存在）
      if (data.charCodeAt(0) === 0xFEFF) {
        data = data.slice(1);
      }

      console.log('原始文件内容:');
      console.log(data);  // 添加这行查看原始内容

      const lines = data.split('\n').filter(line => line.trim());
      console.log('分割后的行数:', lines.length);  // 添加这行查看行数
      console.log('所有行内容:', lines);  // 添加这行查看所有行内容
      if (lines.length === 0) {
        resolve({ data: [], meta: { totalLines: 0, validDataCount: 0 } });
        return;
      }
      
      // 跳过注释行，找到第一个非注释行作为标题行
      let headerIndex = 0;
      while (headerIndex < lines.length) {
        const line = lines[headerIndex].trim();
        if (!line) {
          console.log('跳过空行');
          headerIndex++;
          continue;
        }
        if (line.startsWith('#')) {
          console.log('跳过注释行:', line);
          headerIndex++;
          continue;
        }
        // 检查是否是有效的标题行（至少包含一个非逗号字符）
        if (!line.match(/^[,\s]*$/)) {
          break;
        }
        headerIndex++;
      }
      if (headerIndex >= lines.length) {
        reject(new Error('CSV文件没有有效的标题行'));
        return;
      }
      
      // 处理CSV标题行，正确处理引号
      const headerLine = lines[headerIndex];
      console.log('标题行:', headerLine);  // 添加这行查看标题行
      const headers = parseCSVLine(headerLine);
      console.log('解析后的标题:', headers);  // 添加这行查看解析后的标题
      
      // 处理数据行
      let results = [];
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        console.log(`处理第${i}行:`, line);  // 添加这行查看每行内容
        if (!line || line.startsWith('#'))
          {
            console.log('跳过空行或注释行');
            continue;
          } 
        if (line.match(/^[,\s]*$/)) {
          console.log('跳过无效数据行');
          continue;
        }
        // 使用改进的解析函数处理每行
        const values = parseCSVLine(line);
        console.log('解析后的值:', values);  // 添加这行查看解析后的值
        // 创建行对象
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        console.log('创建的行对象:', row);  // 添加这行查看行对象
        const standardizedRow = standardizeRowFields(row, dbConnection);
        console.log('标准化后的行:', standardizedRow);
        if (Object.values(standardizedRow).some(v => v !== '')) {
          console.log('添加有效行到结果');
          results.push(standardizedRow);
        }
      }
      console.log('最终解析结果:', results);  // 添加这行查看最终结果
      resolve({
        data: results,
        meta: {
          totalLines: lines.length,
          validDataCount: results.length
        }
      });
    });
  });
}

// 新增辅助函数，用于正确解析CSV行
function parseCSVLine(line) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 处理转义的引号
        currentValue += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
    i++;
  }
  
  // 添加最后一个值
  values.push(currentValue.trim());
  
  return values;
}

/**
 * 解析Excel文件 
 */

async function parseExcel(filePath, dbConnection) {
  try {
    console.log('开始解析Excel文件:', filePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    let data = [];
    
   // console.log('Excel文件总行数:', worksheet.rowCount);
    
    // 跳过开头的注释行，找到真正的标题行
    let headerRowIndex = 1;
    let foundHeader = false;
    const expectedHeaders = ['图书名称', 'ISBN', '库存数量', '作者', '出版社', '图书类别', '封面URL'];
    
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
      if (String(firstCell).includes('JavaScript') || String(firstCell).includes('示例')) {
        headerRowIndex++;
        continue;
      }
      
      // 检查是否是真正的标题行
      const rowValues = [];
      row.eachCell((cell) => {
        rowValues.push(String(cell.value).trim());
      });
      
      // 检查是否包含预期的标题
      const hasExpectedHeaders = expectedHeaders.some(header => 
        rowValues.some(value => value === header)
      );
      
      if (hasExpectedHeaders) {
        foundHeader = true;
        break;
      }
      
      headerRowIndex++;
    }
    
    if (!foundHeader) {
      throw new Error('未找到有效的标题行');
    }
    
    //console.log('找到标题行在第:', headerRowIndex, '行');
    
    // 获取标题行
    const headerRow = worksheet.getRow(headerRowIndex);
    let headers = [];
    headerRow.eachCell((cell, colNumber) => {
      const value = cell.value ? String(cell.value).replace(/^#/, '').trim() : '';
      headers.push(value);
      //console.log(`标题列 ${colNumber}:`, value);
    });
    
    //console.log('解析后的标题:', headers);
    
    // 处理数据行
    for (let rowNumber = headerRowIndex + 1; rowNumber <= worksheet.rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        //console.log(`\n处理第 ${rowNumber} 行:`);
        
        // 获取第一个单元格的值
        const firstCell = row.getCell(1).value;
        //console.log('第一个单元格的值:', firstCell);
        
        // 检查是否是注释行
        if (firstCell && String(firstCell).startsWith('#')) {
          //console.log('跳过注释行');
          continue;
        }
        
        // 检查是否是注意事项行
        if (firstCell && (String(firstCell).includes('注意') || String(firstCell).includes('说明'))) {
          //console.log('跳过说明行');
          continue;
        }
        
        // 检查行是否有数据
        const hasData = row.values && row.values.some(value => 
          value !== null && value !== undefined && value !== ''
        );
        if (!hasData) {
          //console.log('跳过空行');
          continue;
        }
        
        // 处理行数据
        let rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            const value = cell.value ? String(cell.value).trim() : '';
            rowData[header] = value;
            //console.log(`列 ${colNumber} (${header}):`, value);
          }
        });
        
        //console.log('原始行数据:', rowData);
        
        // 标准化行字段，等待异步操作完成



        console.log('原始行数据:', rowData);
        const standardizedRow = await standardizeRowFields(rowData, dbConnection);
        console.log('标准化后的行:', standardizedRow);


        //console.log('标准化后的行:', standardizedRow);
        
        // 检查标准化后的行是否有效(标准化后出现问题)
        if (Object.values(standardizedRow).some(v => v !== '')) {
          //console.log('添加有效行到结果');
          data.push(standardizedRow);
        } else {
          //console.log('跳过无效行');
        }
      } catch (rowError) {
        //console.error(`处理第 ${rowNumber} 行时出错:`, rowError);
        continue;
      }
    }
    
    //console.log('\nExcel解析完成，处理的数据：', data);
    return {
      data,
      meta: {
        totalRows: worksheet.rowCount,
        validDataCount: data.length
      }
    };
  } catch (error) {
    //console.error('Excel解析错误:', error);
    throw new Error(`Excel文件解析失败: ${error.message}`);
  }
}




/**
 * 验证图书数据
 */
async function validateBooks(booksData, dbConnection) {
  console.log('开始验证图书数据，输入数据:', booksData);
  
  // 检查必要的模型和连接
  if (!dbConnection || !dbConnection.sequelize || !dbConnection.Book) {
    throw new Error('数据库连接或模型未正确初始化');
  }

  const errors = [];
  const validBooks = [];
  
  // 处理图书数据
  for (const [index, book] of booksData.entries()) {
    const bookErrors = [];
    const lineNumber = index + 1;
    
    // 验证必填字段
    if (!book._book_name?.trim()) bookErrors.push('图书名称不能为空');
    if (!book._isbn?.trim()) bookErrors.push('ISBN不能为空');
    if (!book._author?.trim()) bookErrors.push('作者不能为空');
    if (!book._press?.trim()) bookErrors.push('出版社不能为空');
    
    // 验证分类ID
    if (!book._tid) {
      bookErrors.push('未指定有效的分类ID');
    }
    
    // 只有在没有错误的情况下才格式化数据
    if (bookErrors.length === 0) {
      const formattedBook = {
        _book_name: book._book_name.trim(),
        _isbn: book._isbn.trim(),
        _total_copies: parseInt(book._total_copies) || 0,
        _available_copies: parseInt(book._available_copies) || 0,
        _author: book._author.trim(),
        _press: book._press.trim(),
        _cover_url: book._cover_url?.trim() || null,
        _tid: book._tid,
        _times: 0,
        _create_time: new Date()
      };
      validBooks.push(formattedBook);
    } else {
      errors.push({
        line: lineNumber,
        isbn: book._isbn?.trim() || '未知',
        title: book._book_name?.trim() || '未知',
        errors: bookErrors
      });
    }
  }

  return {
    valid: errors.length === 0,
    validBooks,
    errors,
    validCount: validBooks.length,
    invalidCount: errors.length
  };
}




/**
 * 生成CSV模板
 */
function generateCSVTemplate() {
  const headers = ['图书名称', 'ISBN', '库存数量',' 可借数量', '作者', '出版社', '图书类别', '封面URL'];
  const example = ['JavaScript高级程序设计', '9787115275790', '10', '10', 'Nicholas C. Zakas', '人民邮电出版社', '编程', 'https://example.com/cover.jpg'];
  const description = ['#必填', '必填', '必填 整数', '必填 整数', '必填', '必填', '必填（可以是数字ID或类别名称）', '可选'];
  const wrapWithQuotes = (arr) => arr.map(item => `"${item}"`).join(',');
  
  const rows = [
    '# 图书批量导入模板',
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
    '# 1. 图书名称、ISBN、作者、出版社为必填字段',
    '# 2. 图书类别可以是数字ID或类别名称，不存在的类别会自动创建',
    '# 3. 封面URL为可选字段，可以留空',
    '# 4. 所有文本字段如果包含逗号，请用双引号包裹'
  ];
  
  return rows.join('\n');
}

/**
 * 生成Excel模板 - 简化版本
 */
async function generateExcelTemplate() {
  // 由于不使用外部包，这里生成一个CSV格式的模板文件
  // 实际使用时可以用Excel打开
  return generateCSVTemplate();
}

/**
 * 清理临时文件
 */
function cleanupTempFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('删除临时文件失败:', error);
    }
  }
}

module.exports = {
  parseFile,
  validateBooks,
  generateCSVTemplate,
  generateExcelTemplate,
  cleanupTempFile
};
