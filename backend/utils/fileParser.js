// utils/fileParser.js
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');


/**
 * 解析上传的文件
 * @param {string} filePath - 文件路径
 * @param {string} fileType - 文件类型 (csv, xlsx, xls)
 * @returns {Promise<Array>} 解析后的数据数组
 */
async function parseFile(filePath, fileType) {
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
        result = await parseCSV(filePath);
        break;
      case 'xlsx':
      case 'xls':
        console.log('使用原生方法解析Excel文件');
        result = await parseExcel(filePath);
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
 * 解析CSV文件 - 使用原生JavaScript实现
 */
function parseCSV(filePath) {
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
        const standardizedRow = standardizeRowFields(row);
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
/**
 * 解析Excel文件 
 */
async function parseExcel(filePath) {
  try {
    console.log('开始解析Excel文件:', filePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    let data = [];
    
    console.log('Excel文件总行数:', worksheet.rowCount);
    
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
    
    console.log('找到标题行在第:', headerRowIndex, '行');
    
    // 获取标题行
    const headerRow = worksheet.getRow(headerRowIndex);
    let headers = [];
    headerRow.eachCell((cell, colNumber) => {
      const value = cell.value ? String(cell.value).replace(/^#/, '').trim() : '';
      headers.push(value);
      console.log(`标题列 ${colNumber}:`, value);
    });
    
    console.log('解析后的标题:', headers);
    
    // 处理数据行
    for (let rowNumber = headerRowIndex + 1; rowNumber <= worksheet.rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        console.log(`\n处理第 ${rowNumber} 行:`);
        
        // 获取第一个单元格的值
        const firstCell = row.getCell(1).value;
        console.log('第一个单元格的值:', firstCell);
        
        // 检查是否是注释行
        if (firstCell && String(firstCell).startsWith('#')) {
          console.log('跳过注释行');
          continue;
        }
        
        // 检查是否是注意事项行
        if (firstCell && (String(firstCell).includes('注意') || String(firstCell).includes('说明'))) {
          console.log('跳过说明行');
          continue;
        }
        
        // 检查行是否有数据
        const hasData = row.values && row.values.some(value => 
          value !== null && value !== undefined && value !== ''
        );
        if (!hasData) {
          console.log('跳过空行');
          continue;
        }
        
        // 处理行数据
        let rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            const value = cell.value ? String(cell.value).trim() : '';
            rowData[header] = value;
            console.log(`列 ${colNumber} (${header}):`, value);
          }
        });
        
        console.log('原始行数据:', rowData);
        
        // 标准化行字段
        const standardizedRow = standardizeRowFields(rowData);
        console.log('标准化后的行:', standardizedRow);
        
        // 检查标准化后的行是否有效
        if (Object.values(standardizedRow).some(v => v !== '')) {
          console.log('添加有效行到结果');
          data.push(standardizedRow);
        } else {
          console.log('跳过无效行');
        }
      } catch (rowError) {
        console.error(`处理第 ${rowNumber} 行时出错:`, rowError);
        continue;
      }
    }
    
    console.log('\nExcel解析完成，处理的数据：', data);
    return {
      data,
      meta: {
        totalRows: worksheet.rowCount,
        validDataCount: data.length
      }
    };
  } catch (error) {
    console.error('Excel解析错误:', error);
    throw new Error(`Excel文件解析失败: ${error.message}`);
  }
}



/**
 * 标准化行字段名
 */
function standardizeRowFields(row) {
  if (!row || typeof row !== 'object') {
    return {
      _book_name: '',
      _isbn: '',
      _num: '',
      _author: '',
      _press: '',
      _tid: '',
      _cover_url: ''
    };
  }
  
  const fieldMappings = {
    '_book_name': ['图书名称', '书名', '名称', 'title', 'book_name', '_book_name'],
    '_isbn': ['ISBN', '书号', 'isbn', '_isbn'],
    '_num': ['库存', '数量', '库存数量', 'stock', 'num', '_num'],
    '_author': ['作者', '著者', 'author', '_author'],
    '_press': ['出版社', '出版单位', 'press', 'publisher', '_press'],
    '_tid': ['分类ID', '类型ID', '类别ID', '图书类别', '分类', '类别', 'tid', 'category_id', '_tid'],
    '_cover_url': ['封面URL', '封面地址', '图片URL', 'cover', 'cover_url', '_cover_url']
  };
  
  let standardizedRow = {};
  Object.keys(fieldMappings).forEach(dbField => {
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
  
  return standardizedRow;
}

/**
 * 验证图书数据
 */
async function validateBooks(booksData, dbConnection) {
  console.log('开始验证图书数据，输入数据:', booksData);
  
  const errors = [];
  const validBooks = [];
  const newCategories = new Set();
  
  // 创建事务
  const transaction = await dbConnection.transaction();
  
  try {
    // 分批处理，每批1000条
    const batchSize = 1000;
    const batches = [];
    for (let i = 0; i < booksData.length; i += batchSize) {
      batches.push(booksData.slice(i, i + batchSize));
    }

    // 一次性获取所有ISBN对应的图书
    const allIsbns = booksData.map(book => book._isbn).filter(Boolean);
    const existingBooks = await dbConnection.models.Book.findAll({
      where: {
        _isbn: allIsbns
      },
      attributes: ['_isbn', '_num', '_tid'],
      transaction
    });
    
    // 创建图书映射
    const existingBooksMap = new Map();
    existingBooks.forEach(book => {
      existingBooksMap.set(book._isbn, {
        num: book._num,
        tid: book._tid
      });
    });

    // 处理每个批次
    for (const batch of batches) {
      // 处理当前批次
      for (const [index, book] of batch.entries()) {
        const lineNumber = (batches.indexOf(batch) * batchSize) + index + 1;
        const bookErrors = [];
        
        console.log(`\n处理第 ${lineNumber} 本图书:`, book);
        
        const getStringValue = (value) => {
          if (value === null || value === undefined) return '';
          return String(value).trim();
        };
        
        const getIntValue = (value) => {
          if (value === null || value === undefined || value === '') return 0;
          const num = parseInt(String(value));
          return isNaN(num) ? 0 : num;
        };
        
        // 必填字段检查
        const bookName = getStringValue(book._book_name);
        if (!bookName) {
          bookErrors.push('图书名称不能为空');
        }
        
        const isbn = getStringValue(book._isbn);
        if (!isbn) {
          bookErrors.push('ISBN不能为空');
        }
        
        const author = getStringValue(book._author);
        if (!author) {
          bookErrors.push('作者不能为空');
        }
        
        const press = getStringValue(book._press);
        if (!press) {
          bookErrors.push('出版社不能为空');
        }
        
        // 数值字段验证
        const num = getIntValue(book._num);
        if (num < 0) {
          bookErrors.push('库存数量必须是非负整数');
        }
        
        // 检查ISBN是否已存在
        if (isbn && existingBooksMap.has(isbn)) {
          const existingBook = existingBooksMap.get(isbn);
          console.log('发现已存在的图书:', {
            isbn,
            existingNum: existingBook.num,
            newNum: num
          });
          
          // 更新库存数量
          const updatedNum = existingBook.num + num;
          
          // 准备更新数据
          const updateData = {
            _num: updatedNum,
            _update_time: new Date()
          };
          
          // 批量更新操作
          if (!batch.updates) batch.updates = [];
          batch.updates.push({
            where: { _isbn: isbn },
            updateData
          });
          
          // 记录更新信息
          validBooks.push({
            ...book,
            _num: updatedNum,
            _tid: existingBook.tid,
            _update_time: new Date(),
            isUpdate: true
          });
          
          console.log('准备更新图书库存');
          continue;
        }
        
        // 处理分类
        let categoryId;
        try {
          const categoryValue = getStringValue(book._tid);
          
          if (categoryValue) {
            const numericId = getIntValue(categoryValue);
            if (numericId > 0) {
              categoryId = numericId;
            } else {
              // 批量查找或创建分类
              if (!batch.categories) batch.categories = new Set();
              batch.categories.add(categoryValue);
            }
          }
        } catch (error) {
          console.error('分类处理错误:', error);
          bookErrors.push('分类处理失败: ' + error.message);
        }
        
        // 格式化数据
        const formattedBook = {
          _book_name: bookName,
          _isbn: isbn,
          _num: num,
          _author: author,
          _press: press,
          _tid: categoryId || 1,
          _cover_url: getStringValue(book._cover_url) || null,
          _times: 0,
          _create_time: new Date(),
          isUpdate: false
        };
        
        if (bookErrors.length === 0) {
          // 准备新建数据
          if (!batch.creates) batch.creates = [];
          batch.creates.push(formattedBook);
          validBooks.push(formattedBook);
        } else {
          errors.push({
            line: lineNumber,
            isbn: isbn || '未知',
            title: bookName || '未知',
            errors: bookErrors
          });
        }
      }

      // 批量处理分类
      if (batch.categories && batch.categories.size > 0) {
        const categoryNames = Array.from(batch.categories);
        const categories = await Promise.all(
          categoryNames.map(async (name) => {
            const [category, created] = await dbConnection.models.Category.findOrCreate({
              where: { _type_name: name },
              defaults: { _type_name: name },
              transaction
            });
            return category;
          })
        );
        
        // 创建分类名称到ID的映射
        const categoryMap = new Map();
        categories.forEach(cat => {
          categoryMap.set(cat._type_name, cat._tid);
        });
        
        // 更新图书的分类ID
        batch.creates.forEach(book => {
          if (typeof book._tid === 'string') {
            const categoryId = categoryMap.get(book._tid);
            if (categoryId) {
              book._tid = categoryId;
              newCategories.add(book._tid);
            }
          }
        });
      }

      // 批量执行更新操作
      if (batch.updates && batch.updates.length > 0) {
        await Promise.all(batch.updates.map(update => 
          dbConnection.models.Book.update(update.updateData, {
            where: update.where,
            transaction
          })
        ));
      }

      // 批量执行创建操作
      if (batch.creates && batch.creates.length > 0) {
        await dbConnection.models.Book.bulkCreate(batch.creates, {
          transaction
        });
      }
    }
    
    // 提交事务
    await transaction.commit();
    
    const result = {
      valid: errors.length === 0,
      validBooks,
      errors,
      validCount: validBooks.length,
      invalidCount: errors.length,
      newCategories: Array.from(newCategories),
      updateCount: validBooks.filter(book => book.isUpdate).length,
      newCount: validBooks.filter(book => !book.isUpdate).length
    };
    
    console.log('\n验证结果:', result);
    return result;
    
  } catch (error) {
    // 如果出错，回滚事务
    await transaction.rollback();
    console.error('验证过程中出错:', error);
    throw error;
  }
}




/**
 * 生成CSV模板
 */
function generateCSVTemplate() {
  const headers = ['图书名称', 'ISBN', '库存数量', '作者', '出版社', '图书类别', '封面URL'];
  const example = ['JavaScript高级程序设计', '9787115275790', '10', 'Nicholas C. Zakas', '人民邮电出版社', '编程', 'https://example.com/cover.jpg'];
  const description = ['#必填', '必填', '必填 整数', '必填', '必填', '必填（可以是数字ID或类别名称）', '可选'];
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
