const { User, Role, Class, Major, Department, sequelize, UserRole } = require('../models');
const { Op } = require('sequelize');
//const { findOrCreateDepartment, findOrCreateMajor, findOrCreateClass } = require('./userFileParser');
const bcrypt = require('bcryptjs');
/**
 * 优化后的批量导入学生函数
 * @param {Array} students - 学生数据数组
 * @param {Object} options - 导入选项
 * @returns {Promise<Object>} 导入结果
 */
const optimizedBatchImportStudents = async (students, options = {}) => {
  const {
    batchSize = 50, // 每批处理的学生数量
    parallelBatches = 3, // 并行处理的批次数量
    skipExisting = true, // 是否跳过已存在的账号
    logProgress = false // 是否记录进度
  } = options;

  let transaction;
  let total = 0;
  let imported = 0;
  let skipped = 0;
  let errors = [];
  console.log("这样吗？那开始导入学生数据了，来看看效率如何吧！");
  try {
    // 开始事务
    transaction = await sequelize.transaction();
    console.log("来了来了，事务开始了！");
    // 统计变量
    total = students.length;
    console.log(`准备导入 ${total} 名学生...,嗯，还算可以`);
    // 预处理所有需要的班级、院系数据
    const classNames = [...new Set(students.map(s => s._cname))];
    
    // 检查数据格式，判断是否包含院系和专业信息
    const hasDepartmentAndMajor = classNames.some(cn => cn.split('-').length >= 3);
    console.log("数据包含院系和专业信息吗？", hasDepartmentAndMajor);
    
    // 初始化变量
    let classRecords = [];
    let classMap = new Map();
    let majorMap = new Map();
    if (hasDepartmentAndMajor) {
      // 如果数据包含院系和专业信息
      const departments = [...new Set(classNames.map(cn => {
        const parts = cn.split('-');
        return parts.length >= 3 ? parts[0] : '默认院系';
      }))];

      console.log("让我们看看院系信息：", departments);
      // 批量创建或获取院系
      const departmentRecords = await batchFindOrCreateDepartment(departments, transaction);

      console.log("班级记录：", departmentRecords);
      // 批量创建或获取班级
      classRecords = await batchFindOrCreateClass(classNames, transaction, null);

      // 从班级记录中提取专业ID，创建专业记录
      const majorIds = [...new Set(classRecords.map(c => c._mid).filter(id => id))];
    
      if (majorIds.length > 0) {
        console.log("找找专业ID列表：", majorIds);
        const majors = await Major.findAll({
        where: {
          _mid: { [Op.in]: majorIds }
        },
        transaction
      });
      
        // 创建专业ID到记录的映射
        majorMap = new Map(majors.map(m => [m._mid, m]));
      
        // 获取缺失的专业记录
        const missingMajorIds = majorIds.filter(id => !majorMap.has(id));
      if (missingMajorIds.length > 0) {
        // 为缺失的专业创建记录（使用默认院系）
        const defaultDepartmentId = departmentRecords.find(d => d._dname === '默认院系')?._did || departmentRecords[0]._did;
        
          // 仍然缺失的专业需要创建
          const majorsToCreate = missingMajorIds.map(id => ({
            _mid: id,
            _mname: `专业${id}`,
            _did: defaultDepartmentId
          }));
        
        if (majorsToCreate.length > 0) {
            const createdMajors = await Major.bulkCreate(majorsToCreate, {
              transaction,
              returning: true
          });
          
            // 添加到映射
            for (const major of createdMajors) {
              majorMap.set(major._mid, major);
            }
        }
      }
    }

    // 创建映射关系
    classMap = new Map(classRecords.map(c => [c._cname, c]));
    console.log("班级映射关系已创建，包含", classMap.size, "个班级记录");
   } else{
    console.log("哦，原来只是没有找到院系和专业信息啊，那我们就直接根据提供的班级信息找找吧！");
    
    // 处理缺少院系和专业信息的情况
    // 批量创建或获取班级（不指定院系和专业）
    classRecords = await batchFindOrCreateClass(classNames, transaction, null);
    
    // 创建班级名称到记录的映射
    classMap = new Map(classRecords.map(c => [c._cname, c]));
    
    // 检查是否有缺失的班级记录
    const missingClasses = classNames.filter(name => !classMap.has(name));
    if (missingClasses.length > 0) {
      console.warn(`警告：无法找到以下班级的记录：${missingClasses.join(", ")}`);
    }
    
    // 获取所有专业ID
    const majorIds = [...new Set(classRecords.map(c => c._mid).filter(id => id))];
    
    // 如果有专业ID，获取专业信息
    let majors = [];
    if (majorIds.length > 0) {
      majors = await Major.findAll({
        where: {
          _mid: { [Op.in]: majorIds }
        },
        transaction
      });
    }
    
    // 创建专业ID到记录的映射
    majorMap = new Map(majors.map(m => [m._mid, m]));
    
    // 检查是否有缺失的专业记录
    const missingMajorIds = majorIds.filter(id => !majorMap.has(id));
    if (missingMajorIds.length > 0) {
      console.warn(`警告：无法找到以下专业的记录：${missingMajorIds.join(", ")}`);
      
      // 获取或创建默认院系
      let defaultDepartment = await Department.findOne({
        where: { _did: 1 },
        transaction
      });
      
      if (!defaultDepartment) {
        defaultDepartment = await Department.create({
          _dname: "默认院系",
          _did: 1
        }, { transaction });
      }
      
      const defaultDepartmentId = defaultDepartment._did; // 使用默认院系ID
      const majorsToCreate = missingMajorIds.map(id => ({
        _mid: id,
        _mname: `专业${id}`,
        _did: defaultDepartmentId
      }));
      
      if (majorsToCreate.length > 0) {
        const createdMajors = await Major.bulkCreate(majorsToCreate, {
          transaction,
          returning: true
        });
        
        // 添加到映射
        for (const major of createdMajors) {
          majorMap.set(major._mid, major);
        }
      }
    }
    
    console.log("成功创建班级映射关系，包含", classMap.size, "个班级");
    console.log("成功创建专业映射关系，包含", majorMap.size, "个专业");
   }
   console.log("开始获取读者角色...");
    // 获取读者角色
    const readerRole = await Role.findOne({ 
      where: { _rcode: 'reader' } 
    }, { transaction });

    if (!readerRole) {
      throw new Error('读者角色不存在');
    }

    // 分批处理学生
    const batches = [];
    for (let i = 0; i < students.length; i += batchSize) {
      console.log(`准备第 ${i / batchSize + 1} 批学生数据...`);
      batches.push(students.slice(i, i + batchSize));
    }

    // 处理每个批次
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += parallelBatches) {
      console.log(`处理批次 ${batchIndex + 1} 到 ${Math.min(batchIndex + parallelBatches, batches.length)}...`);
      const currentBatches = batches.slice(batchIndex, batchIndex + parallelBatches);

      // 并行处理多个批次
      const batchResults = await Promise.all(
        currentBatches.map(async (batch, idx) => {
          const batchNumber = batchIndex + idx;
          const batchStart = batchNumber * batchSize;

          // 准备批量插入的用户数据
          const usersToCreate = [];
          const roleAssignments = [];
          const batchErrors = [];

          // 检查账号是否已存在
          if (skipExisting) {
            const existingAccounts = batch.map(s => s._account);
            const existingUsers = await User.findAll({
              where: {
                _account: { [Op.in]: existingAccounts }
              },
              attributes: ['_account'],
              transaction
            });

            const existingAccountSet = new Set(existingUsers.map(u => u._account));

            for (const student of batch) {
              if (existingAccountSet.has(student._account)) {
                skipped++;
                batchErrors.push({
                  account: student._account,
                  error: '账号已存在'
                });
                continue;
              }

              // 获取班级记录
              let classRecord = classMap.get(student._cname);
              if (!classRecord) {
                console.log("班级不存在，尝试创建：", student._cname);
                try {
                  // 尝试创建班级
                  const newClass = await Class.create({
                    _cname: student._cname,
                    _mid: 1 // 使用默认专业ID
                  }, { transaction });
                  
                  // 添加到映射
                  classMap.set(student._cname, newClass);
                  classRecord = newClass;
                  
                  console.log("成功创建班级：", student._cname);
                } catch (error) {
                  console.error("创建班级失败：", error);
                  batchErrors.push({
                    account: student._account,
                    error: `班级 ${student._cname} 不存在且创建失败: ${error.message}`
                  });
                  skipped++;
                  continue;
                }
              }
            let hashedPassword = await bcrypt.hash(student._password, 10);
              // 准备用户数据
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
            console.log("准备分配角色了没？", student._account);
              // 准备角色分配数据
              roleAssignments.push({
                _uid: null, // 将在创建用户后设置
                _rid: readerRole._rid
              });
            }
          } else {
            // 不检查账号是否已存在，直接创建
            for (const student of batch) {
              // 获取班级记录
              let classRecord = classMap.get(student._cname);
              if (!classRecord) {
                console.log("班级不存在，尝试创建：", student._cname);
                try {
                  // 尝试创建班级
                  const newClass = await Class.create({
                    _cname: student._cname,
                    _mid: 1 // 使用默认专业ID
                  }, { transaction });
                  
                  // 添加到映射
                  classMap.set(student._cname, newClass);
                  classRecord = newClass;
                  
                  console.log("成功创建班级：", student._cname);
                } catch (error) {
                  console.error("创建班级失败：", error);
                  batchErrors.push({
                    account: student._account,
                    error: `班级 ${student._cname} 不存在且创建失败: ${error.message}`
                  });
                  skipped++;
                  continue;
                }
              }

              // 准备用户数据
              usersToCreate.push({
                _utype: 'student',
                _account: student._account,
                _name: student._name,
                _password: student._password,
                _email: student._email,
                _cid: classRecord._cid,
                _mid: classRecord._mid,
                _max_num: 10,
                lend_num: 0,
                _access: 1,
                _create_time: new Date()
              });

              // 准备角色分配数据
              roleAssignments.push({
                _uid: null, // 将在创建用户后设置
                _rid: readerRole._rid
              });
            }
          }

          // 批量创建用户
          if (usersToCreate.length > 0) {
            console.log('批量创建用户数量:', usersToCreate.length);
            const createdUsers = await User.bulkCreate(usersToCreate, {
              transaction,
              validate: true,
              returning: true
            });

            // 更新角色分配数据中的用户ID
            const updatedRoleAssignments = createdUsers.map((user, index) => ({
              _uid: user._uid,
              _rid: roleAssignments[index]._rid
            }));
            console.log('批量创建用户成功，分配角色数量:', updatedRoleAssignments.length);
            // 批量分配角色，使用ignoreDuplicates选项避免唯一性冲突
            await UserRole.bulkCreate(updatedRoleAssignments, {
              transaction,
              ignoreDuplicates: true  // 忽略重复记录，而不是报错
            });

            imported += createdUsers.length;

            if (logProgress) {
              console.log(`已处理 ${batchStart + usersToCreate.length}/${total} 条学生记录`);
            }
          }

          return {
            batchNumber,
            processed: usersToCreate.length,
            errors: batchErrors
          };
        })
      );

      // 收集批次错误
      for (const result of batchResults) {
        console.log(`批次 ${result.batchNumber} 处理完成，处理数量: ${result.processed}，错误数量: ${result.errors.length}`);
        errors.push(...result.errors.map(err => ({
          ...err,
          batch: result.batchNumber
        })));
      }
    }

    // 提交事务
    await transaction.commit();

     return {
      success: true,
      message: `批量导入学生完成，成功导入 ${imported} 个，跳过 ${skipped} 个`,
      data: {
        total,
        imported,
        skipped,
        errors
      }
     };
  } catch (error) {
    console.error('批量导入学生失败:', error);

    // 回滚事务
    if (transaction) {
      await transaction.rollback();
    }

    return {
      success: false,
      message: '批量导入学生失败',
      error: error.message,
      data: {
        total: total || 0,
        imported: imported || 0,
        skipped: skipped || 0,
        error: error.message
      }
    };
  }
};

/**
 * 批量创建或获取院系
 * @param {Array} departmentNames - 院系名称数组
 * @param {Object} transaction - 数据库事务
 * @returns {Promise<Array>} 院系记录数组
 */
const batchFindOrCreateDepartment = async (departmentNames, transaction) => {
  const departments = [];
  const departmentsToCreate = [];

  // 查询所有院系
  const existingDepartments = await Department.findAll({
    where: {
      _dname: { [Op.in]: departmentNames }
    },
    transaction
  });

  // 创建院系名称到记录的映射
  const existingMap = new Map(existingDepartments.map(d => [d._dname, d]));

  // 确定需要创建的院系
  for (const name of departmentNames) {
    if (!existingMap.has(name)) {
      departmentsToCreate.push({
        _dname: name
      });
    }
  }

  // 批量创建新院系
  if (departmentsToCreate.length > 0) {
    const createdDepartments = await Department.bulkCreate(departmentsToCreate, {
      transaction,
      returning: true
    });

    // 添加到映射
    for (const dept of createdDepartments) {
      existingMap.set(dept._dname, dept);
    }
  }

  // 返回所有院系记录
  return departmentNames.map(name => existingMap.get(name));
};

/**
 * 批量创建或获取专业
 * @param {Array} majorNames - 专业名称数组
 * @param {Array} departmentRecords - 院系记录数组
 * @param {Object} transaction - 数据库事务
 * @returns {Promise<Array>} 专业记录数组
 */
const batchFindOrCreateMajor = async (majorNames, departmentRecords, transaction) => {
  const majors = [];
  const majorsToCreate = [];

  // 创建院系名称到ID的映射
  const departmentMap = new Map(departmentRecords.map(d => [d._dname, d._did]));

  // 查询所有专业
  const existingMajors = await Major.findAll({
    where: {
      _mname: { [Op.in]: majorNames }
    },
    transaction
  });

  // 创建专业名称到记录的映射
  const existingMap = new Map(existingMajors.map(m => [m._mname, m]));

  // 确定需要创建的专业
  for (const name of majorNames) {
    if (!existingMap.has(name)) {
      // 获取专业所属的院系ID
      const departmentName = [...departmentMap.keys()].find(d => majorNames.includes(`${d}-${name}`)) || '默认院系';
      const departmentId = departmentMap.get(departmentName);

      majorsToCreate.push({
        _mname: name,
        _did: departmentId
      });
    }
  }

  // 批量创建新专业
  if (majorsToCreate.length > 0) {
    const createdMajors = await Major.bulkCreate(majorsToCreate, {
      transaction,
      returning: true
    });

    // 添加到映射
    for (const major of createdMajors) {
      existingMap.set(major._mname, major);
    }
  }

  // 返回所有专业记录
  return majorNames.map(name => existingMap.get(name));
};

/**
 * 批量创建或获取班级
 * @param {Array} classNames - 班级名称数组
 * @param {Object} transaction - 数据库事务
 * @param {number} defaultMajorId - 默认专业ID（可选）
 * @returns {Promise<Array>} 班级记录数组
 */
const batchFindOrCreateClass = async (classNames, transaction, defaultMajorId = null) => {
  const classes = [];
  const classesToCreate = [];

  // 查询所有班级
  const existingClasses = await Class.findAll({
    where: {
      _cname: { [Op.in]: classNames }
    },
    transaction
  });

  // 创建班级名称到记录的映射
  const existingMap = new Map(existingClasses.map(c => [c._cname, c]));

  // 确定需要创建的班级
  for (const name of classNames) {
    if (!existingMap.has(name)) {
      // 查询已存在的班级，从中获取专业ID
      // 这里我们假设班级名称格式为"院系-专业-班级"或"专业-班级"
      // 我们尝试查找相似的班级名称来获取专业ID
      
      let majorId = defaultMajorId || 1; // 使用提供的默认专业ID或默认值
      
      // 如果没有提供默认专业ID，尝试查找相似名称的班级来获取专业ID
      if (!defaultMajorId) {
        // 尝试查找完全相同的班级名称（可能大小写不同）
        const exactMatch = await Class.findOne({
          where: {
            _cname: {
              [Op.iLike]: name
            }
          },
          attributes: ['_mid'],
          transaction
        });
        
        if (exactMatch) {
          majorId = exactMatch._mid;
        } else {
          const similarClasses = await Class.findAll({
        where: {
          _cname: {
            [Op.like]: `%${name.split('-').slice(-1)[0]}%`
          }
        },
        attributes: ['_cname', '_mid'],
        limit: 1,
        transaction
      });
      
          if (similarClasses.length > 0) {
            // 使用相似班级的专业ID
            majorId = similarClasses[0]._mid;
          }
        }
      }

      classesToCreate.push({
        _cname: name,
        _mid: majorId
      });
    }
  }

  // 批量创建新班级
  if (classesToCreate.length > 0) {
    const createdClasses = await Class.bulkCreate(classesToCreate, {
      transaction,
      returning: true
    });

    // 添加到映射
    for (const cls of createdClasses) {
      existingMap.set(cls._cname, cls);
    }
  }

  // 返回所有班级记录
  return classNames.map(name => existingMap.get(name));
};

module.exports = {
  optimizedBatchImportStudents,
  batchFindOrCreateDepartment,
  batchFindOrCreateMajor,
  batchFindOrCreateClass
};
