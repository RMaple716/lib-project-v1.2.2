const { User, Role, Class, Major, Department, sequelize, UserRole } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// 辅助函数：创建统一的响应格式
const createResponse = (success, message, data = null) => ({
  success,
  message,
  data
});

// 辅助函数：错误处理
const handleError = (error, context) => {
  console.error(`${context}失败:`, error);
  return createResponse(false, `${context}失败`, { error: error.message });
};

// 辅助函数：事务管理
const withTransaction = async (callback) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// 辅助函数：批量创建
const batchCreate = async (Model, data, transaction) => {
  if (data.length === 0) return [];
  return await Model.bulkCreate(data, {
    transaction,
    returning: true
  });
};

// 辅助函数：数据验证
const validateStudentData = (student) => {
  const required = ['_account', '_name', '_email', '_cname', '_dname', '_mname', '_password'];
  const missing = required.filter(field => !student[field]);
  if (missing.length > 0) {
    throw new Error(`缺少必要字段: ${missing.join(', ')}`);
  }
};

const parseClassInfo = (student) => {
  return {
    className: student._cname,
    departmentName: student._dname,
    majorName: student._mname
  };
};

// 辅助函数：创建班级（如果需要）
const createClassIfNeeded = async (className, classMap, transaction) => {
  if (!classMap.has(className)) {
    try {
      const newClass = await Class.create({
        _cname: className,
        _mid: 1 // 使用默认专业ID
      }, { transaction });
      classMap.set(className, newClass);
      return newClass;
    } catch (error) {
      throw new Error(`创建班级 ${className} 失败: ${error.message}`);
    }
  }
  return classMap.get(className);
};

/**
 * 批量创建或获取院系
 * @param {Array} departmentNames - 院系名称数组
 * @param {Object} transaction - 数据库事务
 * @returns {Promise<Array>} 院系记录数组
 */
const batchFindOrCreateDepartment = async (departmentNames, transaction) => {
  const existingDepartments = await Department.findAll({
    where: { _dname: { [Op.in]: departmentNames } },
    transaction
  });

  const existingMap = new Map(existingDepartments.map(d => [d._dname, d]));
  const departmentsToCreate = departmentNames
    .filter(name => !existingMap.has(name))
    .map(name => ({ _dname: name }));

  if (departmentsToCreate.length > 0) {
    const createdDepartments = await batchCreate(Department, departmentsToCreate, transaction);
    createdDepartments.forEach(dept => existingMap.set(dept._dname, dept));
  }

  return Array.from(existingMap.values());
};

/**
 * 批量创建或获取专业
 * @param {Array} majorInfos - 专业信息数组
 * @param {Array} departmentRecords - 院系记录数组
 * @param {Object} transaction - 数据库事务
 * @returns {Promise<Array>} 专业记录数组
 */
const batchFindOrCreateMajor = async (majorInfos, departmentRecords, transaction) => {
  const departmentMap = new Map(departmentRecords.map(d => [d._dname, d._did]));
  
  // 提取所有纯专业名称
  const pureMajorNames = majorInfos.map(info => info.majorName);
  
  // 查询所有已存在的专业
  const existingMajors = await Major.findAll({
    where: { _mname: { [Op.in]: pureMajorNames } },
    transaction
  });

  const existingMap = new Map(existingMajors.map(m => [m._mname, m]));
  const majorsToCreate = [];

  // 准备需要创建的专业信息
  for (const info of majorInfos) {
    if (!existingMap.has(info.majorName)) {
      const departmentId = info.departmentName 
        ? departmentMap.get(info.departmentName)
        : null;

      if (!departmentId && info.departmentName) {
        console.warn(`院系 ${info.departmentName} 不存在，跳过创建专业 ${info.majorName}`);
        continue;
      }

      majorsToCreate.push({
        _mname: info.majorName,
        _did: departmentId || 1 // 如果没有院系，使用默认院系ID
      });
    }
  }

  // 批量创建新专业
  if (majorsToCreate.length > 0) {
    const createdMajors = await batchCreate(Major, majorsToCreate, transaction);
    createdMajors.forEach(major => existingMap.set(major._mname, major));
  }

  return Array.from(existingMap.values());
};

/**
 * 批量创建或获取班级
 * @param {Array} classNames - 班级名称数组
 * @param {Map} classInfoMap - 班级信息映射
 * @param {Map} majorMap - 专业映射
 * @param {Object} transaction - 数据库事务
 * @returns {Promise<Array>} 班级记录数组
 */
const batchFindOrCreateClass = async (classNames, classInfoMap, majorMap, transaction) => {
  const existingClasses = await Class.findAll({
    where: { _cname: { [Op.in]: classNames } },
    transaction
  });

  const existingMap = new Map(existingClasses.map(c => [c._cname, c]));
  const classesToCreate = [];

  for (const className of classNames) {
    if (!existingMap.has(className)) {
      const classInfo = classInfoMap.get(className);
      let majorId = null;

      if (classInfo && classInfo.majorName) {
        const major_id = majorMap.get(classInfo.majorName);
        if (!major_id) {
          console.log("我瞧瞧专业信息:", major_id);
          throw new Error(`专业 ${classInfo.majorName} 不存在，无法为班级 ${className} 创建记录`);
        }
        majorId = major_id;
        } else {
        throw new Error(`班级 ${className} 的专业信息缺失，无法创建记录`);
        }

      classesToCreate.push({
        _cname: className,
        _mid: majorId
      });
    }
  }

  if (classesToCreate.length > 0) {
    const createdClasses = await batchCreate(Class, classesToCreate, transaction);
    createdClasses.forEach(cls => existingMap.set(cls._cname, cls));
  }

  return Array.from(existingMap.values());
};

/**
 * 优化后的批量导入学生函数
 * @param {Array} students - 学生数据数组
 * @param {Object} options - 导入选项
 * @returns {Promise<Object>} 导入结果
 */
// 修改 optimizedBatchImportStudents 函数中的数据处理部分
const optimizedBatchImportStudents = async (students, options = {}) => {
  const {
    batchSize = 50,
    parallelBatches = 3,
    skipExisting = true,
    logProgress = false
  } = options;

  const stats = {
    total: students.length,
    imported: 0,
    skipped: 0,
    errors: []
  };

  try {
    return await withTransaction(async (transaction) => {
      // 收集所有院系、专业、班级
      const departmentSet = new Set();
      const majorSet = new Set();
      const classSet = new Set();
      const classInfoMap = new Map();

      students.forEach(student => {
        const info = {
          className: student._cname,
          departmentName: student._dname,
          majorName: student._mname
        };
        classInfoMap.set(student._cname, info);
        if (info.departmentName) departmentSet.add(info.departmentName);
        if (info.majorName) majorSet.add(info.majorName);
        if (info.className) classSet.add(info.className);
      });

      // 创建或获取院系
      const departmentRecords = await batchFindOrCreateDepartment(Array.from(departmentSet), transaction);

      // 创建或获取专业
      const majorInfos = Array.from(majorSet).map(majorName => {
        const student = students.find(s => s._mname === majorName);
        return {
          majorName,
          departmentName: student ? student._dname : null
        };
      });
      const majorRecords = await batchFindOrCreateMajor(majorInfos, departmentRecords, transaction);
      const majorMap = new Map(majorRecords.map(m => [m._mname, m._mid]));

      // 创建或获取班级
      const classRecords = await batchFindOrCreateClass(
        Array.from(classSet),
        classInfoMap,
        majorMap,
        transaction
      );
      const classMap = new Map(classRecords.map(c => [c._cname, c]));

      // 获取读者角色
      const readerRole = await Role.findOne({
        where: { _rcode: 'reader' },
        transaction
      });

      if (!readerRole) {
        throw new Error('读者角色不存在');
      }

      // 分批处理学生
      const batches = [];
      for (let i = 0; i < students.length; i += batchSize) {
        batches.push(students.slice(i, i + batchSize));
      }

      // 处理每个批次
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += parallelBatches) {
        const currentBatches = batches.slice(batchIndex, batchIndex + parallelBatches);

        const batchResults = await Promise.all(
          currentBatches.map(async (batch, idx) => {
            const batchNumber = batchIndex + idx;
            const batchErrors = [];
            const usersToCreate = [];
            const roleAssignments = [];

            for (const student of batch) {
              try {
                validateStudentData(student);

                if (skipExisting) {
                  const existingUser = await User.findOne({
                    where: { _account: student._account },
                    transaction
                  });

                  if (existingUser) {
                    stats.skipped++;
                    continue;
                  }
                }

                const classRecord = classMap.get(student._cname);
                if (!classRecord) {
                  throw new Error(`班级 ${student._cname} 不存在`);
                }

                const hashedPassword = await bcrypt.hash(student._password, 10);

                usersToCreate.push({
                  _utype: 'student',
                  _account: student._account,
                  _name: student._name,
                  _password: hashedPassword,
                  _email: student._email,
                  _cid: classRecord._cid,
                  _mid: classRecord._mid,
                  _max_num: 10,
                  lend_num: 0,
                  _access: 1,
                  _create_time: new Date()
                });

                roleAssignments.push({
                  _rid: readerRole._rid
                });
              } catch (error) {
                batchErrors.push({
                  account: student._account,
                  error: error.message
                });
              }
            }

            if (usersToCreate.length > 0) {
              const createdUsers = await batchCreate(User, usersToCreate, transaction);
              
              const userRoleAssignments = createdUsers.map((user, index) => ({
                _uid: user._uid,
                _rid: roleAssignments[index]._rid
              }));

              await UserRole.bulkCreate(userRoleAssignments, {
                transaction,
                ignoreDuplicates: true
              });

              stats.imported += createdUsers.length;
            }

            return {
              batchNumber,
              processed: usersToCreate.length,
              errors: batchErrors
            };
          })
        );

        // 收集错误
        batchResults.forEach(result => {
          stats.errors.push(...result.errors.map(err => ({
            ...err,
            batch: result.batchNumber
          })));
        });

        if (logProgress) {
          console.log(`已处理 ${Math.min((batchIndex + parallelBatches) * batchSize, stats.total)}/${stats.total} 条学生记录`);
        }
      }

      return createResponse(true, `批量导入学生完成，成功导入 ${stats.imported} 个，跳过 ${stats.skipped} 个`, stats);
    });
  } catch (error) {
    return handleError(error, '批量导入学生');
  }
};

module.exports = {
  optimizedBatchImportStudents,
  batchFindOrCreateDepartment,
  batchFindOrCreateMajor,
  batchFindOrCreateClass
};
