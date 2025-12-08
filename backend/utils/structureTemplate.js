/**
 * 生成院系导入模板
 * @returns {string} CSV文件内容
 */
const generateDepartmentTemplate = () => {
  // 创建CSV内容
  const headers = ['院系名称'];
  const example = ['计算机学院'];
  const description = ['#必填'];
  const wrapWithQuotes = (arr) => arr.map(item => `"${item}"`).join(',');

  const rows = [
    '# 院系批量导入模板',
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
    '# 1. 院系名称为必填字段',
    '# 2. 院系名称不能重复',
    '# 3. 所有文本字段如果包含逗号，请用双引号包裹'
  ];

  return rows.join('\n');
};

/**
 * 生成专业导入模板
 * @returns {string} CSV文件内容
 */
const generateMajorTemplate = () => {
  // 创建CSV内容
  const headers = ['专业名称', '所属院系'];
  const example = ['计算机科学与技术', '计算机学院'];
  const description = ['#必填', '#必填（院系名称）'];
  const wrapWithQuotes = (arr) => arr.map(item => `"${item}"`).join(',');

  const rows = [
    '# 专业批量导入模板',
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
    '# 1. 专业名称和所属院系为必填字段',
    '# 2. 专业名称不能重复',
    '# 3. 所属院系必须是系统中已存在的院系名称',
    '# 4. 所有文本字段如果包含逗号，请用双引号包裹'
  ];

  return rows.join('\n');
};

/**
 * 生成班级导入模板
 * @returns {string} CSV文件内容
 */
const generateClassTemplate = () => {
  // 创建CSV内容
  const headers = ['班级名称', '所属专业'];
  const example = ['计算机科学与技术1班', '计算机科学与技术'];
  const description = ['#必填', '#必填（专业名称）'];
  const wrapWithQuotes = (arr) => arr.map(item => `"${item}"`).join(',');

  const rows = [
    '# 班级批量导入模板',
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
    '# 1. 班级名称和所属专业为必填字段',
    '# 2. 班级名称不能重复',
    '# 3. 所属专业必须是系统中已存在的专业名称',
    '# 4. 所有文本字段如果包含逗号，请用双引号包裹'
  ];

  return rows.join('\n');
};

module.exports = {
  generateDepartmentTemplate,
  generateMajorTemplate,
  generateClassTemplate
};
