<template> 
  <div id="app">
    <div id="viewport">
      <!-- 顶部导航栏 -->
      <div id="top-navbar">
        <div class="top-navbar-content">
          <div class="system-title">
            <h1>图书管理系统</h1>
          </div>
          <div class="user-info">
            <div class="user-avatar" @click="toggleUserInfo">
              <i class="fas fa-user"></i>
            </div>
            <span class="user-name">管理员</span>
          </div>

          <!-- 管理员信息弹窗 -->
          <div id="userInfoModal" class="modal" v-if="showUserInfoModal">
            <div class="modal-content">
              <span class="close-button" @click="closeUserInfoModal">&times;</span>
              <h2>管理员信息</h2>
              <div class="user-info-content">
                <div class="info-item">
                  <label>管理员ID：</label>
                  <span>{{ currentAdmin._uid }}</span>
                </div>
                <div class="info-item">
                  <label>账号：</label>
                  <span>{{ currentAdmin._username }}</span>
                </div>
                <div class="info-item">
                  <label>用户名：</label>
                  <span>{{ currentAdmin._name }}</span>
                </div>
                <div class="info-item">
                  <label>管理员类型：</label>
                  <span class="admin-type">{{ getAdminTypeText(currentAdmin._type) }}</span>
                </div>
                <div class="info-item">
                  <label>邮箱：</label>
                  <span>{{ currentAdmin._email }}</span>
                </div>
                <div class="info-item">
                  <label>注册时间：</label>
                  <span>{{ formatDate(currentAdmin._create_time) }}</span>
                </div>
              </div>
              <div class="modal-buttons">
                <button class="cancel-button" @click="closeUserInfoModal">关闭</button>
                <button class="logout-button" @click="logout">退出登录</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="main-container">
        <!-- 侧边导航栏 -->
        <div id="sidebar">
          <ul class="nav">
            <li>
              <a href="#" @click.prevent="changePage('home')">
                <i class="fas fa-home"></i>
                <span>主页</span>
              </a>
            </li>
            <li>
              <a href="#" @click.prevent="changePage('book_admin')">
                <i class="fas fa-book"></i>
                <span>图书管理</span>
              </a>
            </li>
            <li>
              <a href="#" @click.prevent="changePage('user_admin')">
                <i class="fas fa-users"></i>
                <span>用户管理</span>
              </a>
            </li>
            <li>
              <a href="#" @click.prevent="changePage('booktype_admin')">
                <i class="fas fa-tags"></i>
                <span>图书分类管理</span>
              </a>
            </li>
            <li>
              <a href="#" @click.prevent="changePage('booklend_message')">
                <i class="fas fa-exchange-alt"></i>
                <span>图书借阅归还</span>
              </a>
            </li>
            <li>
              <a href="#" @click.prevent="changePage('announcement_admin')">
                <i class="fas fa-bullhorn"></i>
                <span>公告管理</span>
              </a>
            </li>
            <li>
              <a href="#" @click.prevent="changePage('feedback_admin')">
                <i class="fas fa-comments"></i>
                <span>意见建议回馈</span>
              </a>
            </li>
            <li class="logout-item">
              <a href="#" @click.prevent="logout">
                <i class="fas fa-sign-out-alt"></i>
                <span>退出登录</span>
              </a>
            </li>
          </ul>
        </div>
        
        <!-- 内容区域 -->
        <div id="content">
          <div class="container-fluid">
            <!-- 主页 -->
            <div v-show="currentPage === 'home'" class="page">
              <h1 class="home-title">管理员，您好！</h1>

              <!-- 数据概览卡片 -->
              <div class="stats-cards">
                <div class="stat-card">
                  <div class="stat-icon book-icon">
                    <i class="fas fa-book"></i>
                  </div>
                  <div class="stat-info">
                    <h3>{{ bookCount }}</h3>
                    <p>图书总数</p>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon user-icon">
                    <i class="fas fa-users"></i>
                  </div>
                  <div class="stat-info">
                    <h3>{{ userCount }}</h3>
                    <p>用户总数</p>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon announcement-icon">
                    <i class="fas fa-bullhorn"></i>
                  </div>
                  <div class="stat-info">
                    <h3>{{ announcementCount }}</h3>
                    <p>公告总数</p>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon lend-icon">
                    <i class="fas fa-exchange-alt"></i>
                  </div>
                  <div class="stat-info">
                    <h3>{{ activeLends }}</h3>
                    <p>活跃借阅</p>
                  </div>
                </div>
              </div>
              
              <!-- 图表区域 -->
              <div class="charts-container">
                <div class="chart-row">
                  <!-- 图书分类分布 -->
                  <div class="chart-card">
                    <h3>图书分类分布</h3>
                    <div class="chart-wrapper">
                      <canvas id="bookCategoryChart"></canvas>
                    </div>
                  </div>
                  
                  <!-- 借阅趋势 -->
                  <div class="chart-card">
                    <div class="chart-header">
                      <h3>借阅趋势</h3>
                      <div class="date-filter">
                        <label for="startDate">开始日期：</label>
                        <input type="date" id="startDate" v-model="lendTrendStartDate">
                        <label for="endDate">结束日期：</label>
                        <input type="date" id="endDate" v-model="lendTrendEndDate">
                        <button @click="updateLendTrendChart" class="refresh-button">刷新</button>
                      </div>
                    </div>
                    <div class="chart-wrapper">
                      <canvas id="lendTrendChart"></canvas>
                    </div>
                  </div>
                </div>
                
                <div class="chart-row">
                  <!-- 用户类型分布 -->
                  <div class="chart-card">
                    <h3>用户类型分布</h3>
                    <div class="chart-wrapper">
                      <canvas id="userTypeChart"></canvas>
                    </div>
                  </div>
                  
                  <!-- 类别/图书借阅统计 -->
                  <div class="chart-card">
                    <div class="chart-tabs">
                      <button :class="{ active: borrowStatsTab === 'category' }" @click="switchBorrowStatsTab('category')">类别借阅</button>
                      <button :class="{ active: borrowStatsTab === 'book' }" @click="switchBorrowStatsTab('book')">单本借阅</button>
                    </div>
                    <div class="chart-wrapper">
                      <canvas id="borrowStatsChart"></canvas>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 快速操作 -->
              <div class="quick-actions">
                <h3>快速操作</h3>
                <div class="action-buttons">
                  <button class="action-btn" @click="changePage('book_admin')">
                    <i class="fas fa-plus"></i>
                    <span>添加图书</span>
                  </button>
                  <button class="action-btn" @click="changePage('user_admin')">
                    <i class="fas fa-user-plus"></i>
                    <span>添加用户</span>
                  </button>
                  <button class="action-btn" @click="changePage('announcement_admin')">
                    <i class="fas fa-bullhorn"></i>
                    <span>发布公告</span>
                  </button>
                  <button class="action-btn" @click="changePage('booklend_message')">
                    <i class="fas fa-exchange-alt"></i>
                    <span>借阅管理</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 图书管理 -->
            <div v-show="currentPage === 'book_admin'" class="page">
              <form class="search-form">
                <select id="searchType" class="search-select" v-model="searchType">
                  <option value="_bid">序号</option> 
                  <option value="_book_name">书名</option>
                  <option value="_author">作者</option>
                  <option value="_isbn">ISBN号</option>
                  <option value="_type_name">图书类型</option>
                </select>
                <input type="text" id="searchInput" class="search-input" placeholder="请输入查询内容" v-model="searchKeyword">
                <button type="button" class="search-button" @click="handleBookSearch">查询</button>
                <button type="button" class="reset-button" @click="handleReset">重置</button>
                <button type="button" class="addBookModal" @click="showAddBookModal">添加图书</button>
                <button type="button" class="bulkUploadButton" @click="showBulkUploadModal">批量上传</button>
                <button type="button" class="downloadTemplateButton" @click="downloadTemplate">下载模板</button>
              </form>

              <!-- 添加/编辑图书弹窗 -->
              <div id="addBookModal" class="modal" v-if="showAddBookModalFlag">
                <div class="modal-content">
                  <span class="close-button" @click="closeAddBookModal">&times;</span>
                  <h2>{{ isEditBook ? '编辑图书' : '添加图书' }}</h2>
                  <form @submit.prevent="submitBookForm">
                    <label for="bookTitle">书名：</label>
                    <input type="text" id="bookTitle" v-model="bookForm.bookTitle" placeholder="请输入书名">
                    <label for="author">作者：</label>
                    <input type="text" id="author" v-model="bookForm.author" placeholder="请输入作者">
                    <label for="isbn">ISBN号：</label>
                    <input type="text" id="isbn" v-model="bookForm.isbn" placeholder="请输入ISBN号">                
                    <label for="bookType">图书类型：</label>
                    <select id="bookType" v-model="bookForm.bookType">
                      <option v-for="cat in categories" :value="cat._tid" :key="cat._tid">{{ cat._type_name }}</option>
                    </select>                 
                    <label for="publisher">出版社：</label>
                    <input type="text" id="publisher" v-model="bookForm.publisher" placeholder="请输入出版社">                  
                    <label for="totalQuantity">总数量：</label>
                    <input type="number" id="totalQuantity" v-model="bookForm.totalQuantity" placeholder="请输入总数量">
                    <label for="coverUrl">封面URL：</label>
                    <input type="text" id="coverUrl" v-model="bookForm.coverUrl" placeholder="请输入封面图片URL"> 
                    <button type="submit" class="submit-button">提交</button>
                  </form>
                </div>
              </div>
              <!-- 批量上传图书弹窗 -->
              <div id="bulkUploadModal" class="modal" v-if="showBulkUploadModalFlag">
                <div class="modal-content">
                  <span class="close-button" @click="closeBulkUploadModal">&times;</span>
                  <h2>批量上传图书</h2>
                  <form @submit.prevent="submitBulkUpload">
                    <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
                      <input type="file" ref="fileInput" accept=".csv,.xlsx,.xls" @change="handleFileSelect" style="display: none;">
                      <div class="upload-content" @click="$refs.fileInput.click()">
                        <i class="fas fa-cloud-upload-alt upload-icon"></i>
                        <p>点击选择文件或将文件拖拽到此处</p>
                        <p class="file-types">支持 CSV、XLSX、XLS 格式</p>
                        <p v-if="selectedFile" class="selected-file">已选择文件: {{ selectedFile.name }}</p>
                      </div>
                    </div>
                    
                    <div class="upload-info">
                      <p><strong>说明：</strong></p>
                      <ul>
                        <li>请使用我们提供的模板文件进行批量上传</li>
                        <li>支持 CSV、Excel 格式</li>
                        <li>文件大小不能超过 10MB</li>
                        <li>系统会自动处理重复图书（更新库存）</li>
                      </ul>
                    </div>
                    
                    <div class="modal-buttons">
                      <button type="button" class="cancel-button" @click="closeBulkUploadModal">取消</button>
                      <button type="submit" class="submit-button" :disabled="!selectedFile">开始上传</button>
                    </div>
                  </form>
                </div>
              </div>
              <!-- 图书管理表格 -->
              <table class="book_table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>图书类型</th>
                    <th>书名</th>
                    <th>作者</th>
                    <th>ISBN号</th>
                    <th>出版社</th>
                    <th>总数量</th>
                    <th>封面</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="currentPageBooks.length === 0">
                    <td colspan="9">{{ filteredBooks.length === 0 ? '暂无图书数据' : '没有找到相关图书' }}</td>
                  </tr>
                  <tr v-for="book in currentPageBooks" :key="book._bid">
                    <td>{{ book._bid }}</td>
                    <td>{{ book._type_name}}</td>
                    <td>{{ book._book_name }}</td>
                    <td>{{ book._author }}</td>
                    <td>{{ book._isbn }}</td>
                    <td>{{ book._press }}</td>
                    <td>{{ book._num }}</td>
                    <td>
                      <img v-if="book._cover_url" :src="book._cover_url" alt="封面" class="book-cover">
                      <span v-else>无封面</span>
                    </td>
                    <td>
                      <button class="edit-button" @click="editBook(book)">编辑</button>
                      <button class="delete-button" @click="deleteBook(book._bid)">删除</button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- 分页功能 -->
              <div class="pagination">
                <span class="total-pages">共{{ totalBookPages }}页</span>
                <span class="page-numbers">
                  <button @click="changeBookPage(1)" :disabled="bookCurrentPage === 1">首页</button>
                  <button @click="changeBookPage(bookCurrentPage - 1)" :disabled="bookCurrentPage === 1">上一页</button>
                  <button v-for="page in visibleBookPages" :key="page" 
                    @click="changeBookPage(page)" 
                    :class="{ 'active': bookCurrentPage === page }">
                    {{ page }}
                  </button>
                  <button @click="changeBookPage(bookCurrentPage + 1)" :disabled="bookCurrentPage === totalBookPages">下一页</button>
                  <button @click="changeBookPage(totalBookPages)" :disabled="bookCurrentPage === totalBookPages">末页</button>
                </span>
              </div>
            </div>

            <!-- 用户管理 -->
            <div v-show="currentPage === 'user_admin'" class="page">
              <form class="search-form">
                <select id="userSearchType" class="search-select" v-model="userSearchType">
                  <option value="_uid">用户ID</option>
                  <option value="_account">账号</option> 
                  <option value="_name">用户名</option>
                </select>
                <input type="text" id="userSearchInput" class="search-input" placeholder="请输入查询内容" v-model="userSearchKeyword">
                <button type="button" class="search-button" @click="handleUserSearch">查询</button>
                <button type="button" class="reset-button" @click="handleReset">重置</button>
                <button type="button" class="addUserModal" @click="showAddUserModal">添加用户</button>
                <button type="button" class="bulkUploadButton" @click="showBulkUserUploadModal">批量上传</button>
                <button type="button" class="downloadUserTemplateButton" @click="downloadUserTemplate">下载模板</button>
              </form>

              <!-- 添加/编辑用户弹窗 -->
              <div id="addUserModal" class="modal" v-if="showAddUserModalFlag">
                <div class="modal-content">
                  <span class="close-button" @click="closeAddUserModal">&times;</span>
                  <h2>{{ isEditUser ? '编辑用户' : '添加用户' }}</h2>
                  <form @submit.prevent="submitUserForm">
                    <label for="account">账号：</label>
                    <input type="text" id="account" v-model="userForm.account" :placeholder="isEditUser ? '请输入账号' : '请输入账号'" required>

                    <label for="name">用户名：</label>
                    <input type="text" id="name" v-model="userForm.name" :placeholder="isEditUser ? '请输入用户名' : '请输入用户名'" required>

                    <label for="password">密码：</label>
                    <input type="password" id="password" v-model="userForm.password" :placeholder="isEditUser ? '留空则不修改密码' : '请输入密码'" :required="!isEditUser">

                    <label for="email">邮箱：</label>
                    <input type="email" id="email" v-model="userForm.email" placeholder="请输入邮箱" required>
                    
                    <label for="userType">用户类型：</label>
                    <select id="userType" v-model="userForm.userType" @change="onUserTypeChange">
                      <option value="student">学生</option>
                      <option value="teacher">教师</option>
                      <option value="tempworker">临时工</option>
                      <option value="admin_t">终端管理员</option>
                      <option value="admin_n">普通管理员</option>
                    </select>
                    
                    <!-- 根据用户类型动态显示不同字段 -->
                    <div v-if="userForm.userType === 'student'">
                      <label for="class">班级：</label>
                      <input type="text" id="class" v-model="userForm.class" placeholder="请输入班级名称">
                    </div>
                    
                    <div v-else-if="userForm.userType === 'teacher'">
                      <label for="department">院系：</label>
                      <input type="text" id="department" v-model="userForm.department" placeholder="请输入院系名称">
                    </div>
                    
                    <div v-else-if="userForm.userType === 'tempworker'">
                      <label for="workDepartment">工作部门：</label>
                      <input type="text" id="workDepartment" v-model="userForm.workDepartment" placeholder="请输入工作部门名称">
                    </div>

                    <button type="submit" class="submit-button">提交</button>
                  </form>
                </div>
              </div>

              <!-- 批量上传用户弹窗 -->
              <div id="bulkUserUploadModal" class="modal" v-if="showBulkUserUploadModalFlag">
                <div class="modal-content">
                  <span class="close-button" @click="closeBulkUserUploadModal">&times;</span>
                  <h2>批量上传用户</h2>
                  <form @submit.prevent="submitBulkUserUpload">
                    <div class="upload-area" @dragover.prevent @drop.prevent="handleUserDrop">
                      <input type="file" ref="userFileInput" accept=".csv,.xlsx" @change="handleUserFileSelect" style="display: none;">
                      <div class="upload-content" @click="$refs.userFileInput.click()">
                        <i class="fas fa-cloud-upload-alt upload-icon"></i>
                        <p>点击选择文件或将文件拖拽到此处</p>
                        <p class="file-types">支持 CSV、XLSX 格式</p>
                        <p v-if="selectedUserFile" class="selected-file">已选择文件: {{ selectedUserFile.name }}</p>
                      </div>
                    </div>
                    
                    <div class="upload-info">
                      <p><strong>说明：</strong></p>
                      <ul>
                        <li>请使用我们提供的模板文件进行批量上传</li>
                        <li>支持 CSV、Excel 格式</li>
                        <li>文件大小不能超过 10MB</li>
                        <li>系统会自动跳过已存在的账号</li>
                      </ul>
                    </div>
                    
                    <div class="modal-buttons">
                      <button type="button" class="cancel-button" @click="closeBulkUserUploadModal">取消</button>
                      <button type="submit" class="submit-button" :disabled="!selectedUserFile">开始上传</button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- 用户管理表格 -->
              <table class="user_table">
                <thead>
                  <tr>
                    <th>用户ID</th>
                    <th>账号</th> 
                    <th>用户名</th>
                    <th>邮箱</th>
                    <th>用户类型</th>
                    <th>院系/部门</th>
                    <th>专业/班级</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="currentPageUsers.length === 0">
                    <td colspan="9">{{ filteredUsers.length === 0 ? '暂无用户数据' : '没有找到相关用户' }}</td>
                  </tr>
                  <tr v-for="user in currentPageUsers" :key="user._uid">
                    <td>{{ user._uid }}</td>
                    <td>{{ user._account || '-' }}</td>
                    <td>{{ user._name }}</td>
                    <td>{{ user._email }}</td>
                    <td>{{ getUserTypeText(user._utype) }}</td>
                    <td>
                      <span v-if="user.department && user.department.name">{{ user.department.name }}</span>
                      <span v-else-if="user.workDepartment && user.workDepartment.name">{{ user.workDepartment.name }}</span>
                      <span v-else>-</span>
                    </td>
                    <td>
                      <span v-if="user.major && user.major.name">{{ user.major.name }}</span>
                      <span v-else-if="user.class && user.class.name">{{ user.class.name }}</span>
                      <span v-else>-</span>
                    </td>
                    <td>{{ formatDate(user._create_time) }}</td>
                    <td>
                      <button @click="editUser(user)" class="edit-user">编辑</button>
                      <button @click="deleteUser(user._uid)" class="delete-user">删除</button>
                      <button @click="resetPassword(user._uid)" class="reset-password">重置密码</button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- 分页功能 -->
              <div class="pagination">
                <span class="total-pages">共{{ totalUserPages }}页</span>
                <span class="page-numbers">
                  <button @click="changeUserPage(1)" :disabled="userCurrentPage === 1">首页</button>
                  <button @click="changeUserPage(userCurrentPage - 1)" :disabled="userCurrentPage === 1">上一页</button>
                  <button v-for="page in visibleUserPages" :key="page" 
                    @click="changeUserPage(page)" 
                    :class="{ 'active': userCurrentPage === page }">
                    {{ page }}
                  </button>
                  <button @click="changeUserPage(userCurrentPage + 1)" :disabled="userCurrentPage === totalUserPages">下一页</button>
                  <button @click="changeUserPage(totalUserPages)" :disabled="userCurrentPage === totalUserPages">末页</button>
                </span>
              </div>
            </div>

            <!-- 图书分类管理 -->
            <div v-show="currentPage === 'booktype_admin'" class="page">
              <!-- 添加搜索表单 -->
              <form class="search-form">
                <select id="categorySearchType" class="search-select" v-model="categorySearchType">
                  <option value="_type_name">分类名称</option>
               </select>
               <input type="text" id="categorySearchInput" class="search-input" placeholder="请输入查询内容" v-model="categorySearchKeyword">
               <button type="button" class="search-button" @click="handleCategorySearch">查询</button>
               <button type="button" class="reset-button" @click="handleReset">重置</button>
               <button type="button" class="addCategoryButton" @click="showAddCategoryModal">添加分类</button>
              </form>
              <!-- 添加分类弹窗 -->
              <div id="addCategoryModal" class="modal" v-if="showAddCategoryModalFlag">
                <div class="modal-content">
                  <span class="close-button" @click="closeAddCategoryModal">&times;</span>
                  <h2 id="modalTitle">{{ isEditCategory ? '修改分类' : '添加分类' }}</h2>
                  <form id="categoryForm" @submit.prevent="submitCategoryForm">

                    <label for="categoryName">分类名称:</label>
                    <input type="text" id="categoryName" v-model="categoryForm.categoryName" required>
                    
                    <button type="submit" class="submit-button">提交</button>
                  </form>
                </div>
              </div>

              <!-- 图书分类表格 -->
              <table class="category_table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>图书分类名称</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="currentPageCategories.length === 0">
                    <td colspan="3">{{ filteredCategories.length === 0 ? '暂无分类数据' : '没有找到相关分类' }}</td>
                  </tr>
                  <tr v-for="cat in currentPageCategories" :key="cat._tid">
                    <td>{{ cat._tid }}</td>
                    <td>{{ cat._type_name }}</td>
                    <td>
                      <button class="edit-category" @click="editCategory(cat)">修改</button>
                      <button class="delete-category" @click="deleteCategory(cat._tid)">删除</button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- 分页功能 -->
              <div class="pagination">
                <span class="total-pages">共{{ totalCategoryPages }}页</span>
                <span class="page-numbers">
                  <button @click="changeCategoryPage(1)" :disabled="categoryCurrentPage === 1">首页</button>
                  <button @click="changeCategoryPage(categoryCurrentPage - 1)" :disabled="categoryCurrentPage === 1">上一页</button>
                  <button v-for="page in visibleCategoryPages" :key="page" 
                    @click="changeCategoryPage(page)" 
                    :class="{ 'active': categoryCurrentPage === page }">
                    {{ page }}
                  </button>
                  <button @click="changeCategoryPage(categoryCurrentPage + 1)" :disabled="categoryCurrentPage === totalCategoryPages">下一页</button>
                  <button @click="changeCategoryPage(totalCategoryPages)" :disabled="categoryCurrentPage === totalCategoryPages">末页</button>
                </span>
              </div>
            </div>

            <!-- 图书借阅归还 -->
            <div v-show="currentPage === 'booklend_message'" class="page">
              <!-- 添加搜索表单 -->
              <form class="search-form">
                <select id="lendSearchType" class="search-select" v-model="lendSearchType">
                  <option value="_hid">借阅ID</option>
                  <option value="_book_name">图书名称</option>
                  <option value="_uid">读者姓名</option>
                  <option value="status">借阅状态</option>
                </select>
                <input type="text" id="lendSearchInput" class="search-input" placeholder="请输入查询内容" v-model="lendSearchKeyword">
                <button type="button" class="search-button" @click="handleLendSearch">查询</button>
                <button type="button" class="reset-button" @click="handleReset">重置</button>
              </form>
              <!-- 图书借阅与归还表格 -->
              <table class="lend_table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>图书名称</th>
                    <th>ISBN</th>
                    <th>读者姓名</th>
                    <th>借阅日期</th>
                    <th>归还日期</th>
                    <th>借阅状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="currentPageLends.length === 0">
                    <td colspan="8">{{ lends.length === 0 ? '暂无借阅记录' : '没有找到相关借阅记录' }}</td>
                  </tr>
                  <tr v-for="lend in currentPageLends" :key="lend._hid">
                    <td>{{ lend._hid }}</td>
                    <td>{{ lend.book?._book_name || '未知图书' }}</td>
                    <td>{{ lend.book?._isbn || '-' }}</td>
                    <td>{{ lend.user?._name || '未知用户' }}</td>
                    <td>{{ formatDate(lend._begin_time) }}</td>
                    <td>{{ formatDate(lend._end_time) }}</td>
                    <td>{{ getLendStatusText(lend._status) }}</td>
                    <td>
                      <button 
                        class="lend-action delay-btn" 
                        @click="delayLend(lend._hid, lend._end_time)"
                        :disabled="lend._status !== 0 && lend._status !== 3"
                      >
                        延期
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- 延期归还弹窗 -->
              <div id="delayModal" class="modal" v-if="showDelayModal">
                <div class="modal-content">
                  <span class="close-button" @click="closeDelayModal">&times;</span>
                  <h2>延期归还</h2>
                  <form @submit.prevent="submitDelay">
                    <p>确认要为此借阅记录办理续借手续吗？系统将在原归还日期基础上自动延长30天。</p>
                    <div class="modal-buttons">
                      <button type="button" class="cancel-button" @click="closeDelayModal">取消</button>
                      <button type="submit" class="submit-button">确认续借</button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- 分页功能 -->
              <div class="pagination">
                <span class="total-pages">共{{ totalLendPages }}页</span>
                <span class="page-numbers">
                  <button @click="changeLendPage(1)" :disabled="lendCurrentPage === 1">首页</button>
                  <button @click="changeLendPage(lendCurrentPage - 1)" :disabled="lendCurrentPage === 1">上一页</button>
                  <button v-for="page in visibleLendPages" :key="page" 
                    @click="changeLendPage(page)" 
                    :class="{ 'active': lendCurrentPage === page }">
                    {{ page }}
                  </button>
                  <button @click="changeLendPage(lendCurrentPage + 1)" :disabled="lendCurrentPage === totalLendPages">下一页</button>
                  <button @click="changeLendPage(totalLendPages)" :disabled="lendCurrentPage === totalLendPages">末页</button>
                </span>
              </div>
            </div>

            <!-- 公告管理 -->
            <div v-show="currentPage === 'announcement_admin'" class="page">
              <!-- 添加搜索表单 -->
              <form class="search-form">
               <select id="announcementSearchType" class="search-select" v-model="announcementSearchType">
                  <option value="_aid">公告ID</option>
                  <option value="_title">公告标题</option>
                  <option value="_content">公告内容</option>
                  <option value="_status">公告状态</option>
                </select>
                <input type="text" id="announcementSearchInput" class="search-input" placeholder="请输入查询内容" v-model="announcementSearchKeyword">
                <button type="button" class="search-button" @click="handleAnnouncementSearch">查询</button>
                <button type="button" class="reset-button" @click="handleReset">重置</button>
                <button type="button" class="addAnnouncementButton" @click="showAddAnnouncementModal">发布公告</button>
              </form>

              <!-- 添加/编辑公告弹窗 -->
              <div id="addAnnouncementModal" class="modal" v-if="showAddAnnouncementModalFlag">
                <div class="modal-content">
                  <span class="close-button" @click="closeAddAnnouncementModal">&times;</span>
                  <h2>{{ isEditAnnouncement ? '编辑公告' : '发布公告' }}</h2>
                  <form @submit.prevent="submitAnnouncementForm">
                    <label for="announcementTitle">公告标题：</label>
                    <input type="text" id="announcementTitle" v-model="announcementForm.title" placeholder="请输入公告标题" required>
                    
                    <label for="announcementContent">公告内容：</label>
                    <textarea id="announcementContent" v-model="announcementForm.content" placeholder="请输入公告内容" rows="6" required></textarea>
                    
                    <label for="announcementPublisher">发布人：</label>
                    <input type="text" id="announcementPublisher" v-model="announcementForm.publisher" placeholder="请输入发布人" required>
                    
                    <label for="announcementStatus">公告状态：</label>
                    <select id="announcementStatus" v-model="announcementForm.status">
                      <option :value="1">已发布</option>
                      <option :value="0">草稿</option>
                    </select>
                    
                    <button type="submit" class="submit-button">提交</button>
                  </form>
                </div>
              </div>

              <!-- 公告管理表格 -->
              <table class="announcement_table">
                <thead>
                  <tr>
                    <th>公告ID</th>
                    <th>公告标题</th>
                    <th>公告内容</th>
                    <th>发布日期</th>
                    <th>发布人</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="currentPageAnnouncements.length === 0">
                    <td colspan="7">{{ filteredAnnouncements.length === 0 ? '暂无公告数据' : '没有找到相关公告' }}</td>
                  </tr>
                  <tr v-for="announcement in currentPageAnnouncements" :key="announcement._aid">
                    <td>{{ announcement._aid }}</td>
                    <td>{{ announcement._title }}</td>
                    <td class="announcement-content-cell">
                      <div class="content-preview">{{ getContentPreview(announcement._content) }}</div>
                    </td>
                    <td>{{ formatDate(announcement._date) }}</td>
                    <td>{{ announcement._publisher || '系统管理员' }}</td>
                    <td>
                      <span :class="announcement._status === 1 ? 'status-published' : 'status-draft'">
                        {{ announcement._status === 1 ? '已发布' : '草稿' }}
                      </span>
                    </td>
                    <td>
                      <button class="edit-button" @click="editAnnouncement(announcement)">编辑</button>
                      <button class="delete-button" @click="deleteAnnouncement(announcement._aid)">删除</button>
                      <button v-if="announcement._status === 0" class="publish-button" @click="publishAnnouncement(announcement._aid)">发布</button>
                      <button v-else class="unpublish-button" @click="unpublishAnnouncement(announcement._aid)">取消发布</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <!-- 分页功能 -->
              <div class="pagination">
                <span class="total-pages">共{{ totalAnnouncementPages }}页</span>
                <span class="page-numbers">
                  <button @click="changeAnnouncementPage(1)" :disabled="announcementCurrentPage === 1">首页</button>
                  <button @click="changeAnnouncementPage(announcementCurrentPage - 1)" :disabled="announcementCurrentPage === 1">上一页</button>
                  <button v-for="page in visibleAnnouncementPages" :key="page" 
                    @click="changeAnnouncementPage(page)" 
                    :class="{ 'active': announcementCurrentPage === page }">
                    {{ page }}
                  </button>
                  <button @click="changeAnnouncementPage(announcementCurrentPage + 1)" :disabled="announcementCurrentPage === totalAnnouncementPages">下一页</button>
                  <button @click="changeAnnouncementPage(totalAnnouncementPages)" :disabled="announcementCurrentPage === totalAnnouncementPages">末页</button>
                </span>
              </div>
            </div>
          </div>

          <!-- 意见建议回馈 -->
          <div v-show="currentPage === 'feedback_admin'" class="page">
            <h2 class="page-title">读者意见建议回馈</h2>

            <!-- 搜索表单 -->
            <form class="search-form">
              <select id="feedbackSearchType" class="search-select" v-model="feedbackSearchType">
                <option value="_fid">反馈ID</option>
                <option value="_uid">用户ID</option>
                <option value="_email">读者邮箱</option>
                <option value="_title">反馈标题</option>
                <option value="_status">处理状态</option>
              </select>
              <input type="text" id="feedbackSearchInput" class="search-input" placeholder="请输入查询内容" v-model="feedbackSearchKeyword">
              <button type="button" class="search-button" @click="handleFeedbackSearch">查询</button>
              <button type="button" class="reset-button" @click="handleFeedbackReset">重置</button>
            </form>

            <!-- 意见建议表格 -->
            <table class="feedback_table">
              <thead>
                <tr>
                  <th>反馈ID</th>
                  <th>用户ID</th>
                  <th>读者邮箱</th>
                  <th>反馈标题</th>
                  <th>反馈内容</th>
                  <th>提交时间</th>
                  <th>处理状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="currentPageFeedbacks.length === 0">
                  <td colspan="8">{{ filteredFeedbacks.length === 0 ? '暂无意见建议' : '没有找到相关反馈' }}</td>
                </tr>
                <tr v-for="feedback in currentPageFeedbacks" :key="feedback._fid">
                  <td>{{ feedback._fid }}</td>
                  <td>{{ feedback._uid }}</td>
                  <td>{{ feedback._email }}</td>
                  <td>{{ feedback._title }}</td>
                  <td class="feedback-content-cell">
                    <div class="content-preview">{{ getContentPreview(feedback._content) }}</div>
                  </td>
                  <td>{{ formatDate(feedback._create_time) }}</td>
                  <td>
                    <span :class="feedback._status === 1 ? 'status-published' : 'status-draft'">
                      {{ feedback._status === 1 ? '已处理' : '待处理' }}
                    </span>
                  </td>
                  <td>
                    <button class="view-details" @click="viewFeedbackDetail(feedback)">查看详情</button>
                    <button class="edit-button" @click="replyFeedback(feedback)">回复</button>
                    <button v-if="feedback._status === 0" class="publish-button" @click="markAsProcessed(feedback._fid)">标记已处理</button>
                    <button class="delete-button" @click="deleteFeedback(feedback._fid)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 分页功能 -->
            <div class="pagination">
              <span class="total-pages">共{{ totalFeedbackPages }}页</span>
              <span class="page-numbers">
                <button @click="changeFeedbackPage(1)" :disabled="feedbackCurrentPage === 1">首页</button>
                <button @click="changeFeedbackPage(feedbackCurrentPage - 1)" :disabled="feedbackCurrentPage === 1">上一页</button>
                <button v-for="page in visibleFeedbackPages" :key="page" 
                  @click="changeFeedbackPage(page)" 
                  :class="{ 'active': feedbackCurrentPage === page }">
                  {{ page }}
                </button>
                <button @click="changeFeedbackPage(feedbackCurrentPage + 1)" :disabled="feedbackCurrentPage === totalFeedbackPages">下一页</button>
                <button @click="changeFeedbackPage(totalFeedbackPages)" :disabled="feedbackCurrentPage === totalFeedbackPages">末页</button>
              </span>
            </div>
          </div>

          <!-- 查看反馈详情弹窗 -->
          <div id="feedbackDetailModal" class="modal" v-if="showFeedbackDetailModal">
            <div class="modal-content">
              <span class="close-button" @click="closeFeedbackDetailModal">&times;</span>
              <h2>反馈详情</h2>
              <div class="feedback-detail">
                <div class="detail-item">
                  <label>反馈ID：</label>
                  <span>{{ currentFeedback._fid }}</span>
                </div>
                <div class="detail-item">
                  <label>用户ID：</label>
                  <span>{{ currentFeedback._uid }}</span>
                </div>
                <div class="detail-item">
                  <label>读者邮箱：</label>
                  <span>{{ currentFeedback._email }}</span>
                </div>
                <div class="detail-item">
                  <label>反馈标题：</label>
                  <span>{{ currentFeedback._title }}</span>
                </div>
                <div class="detail-item">
                  <label>反馈内容：</label>
                  <div class="feedback-content">{{ currentFeedback._content }}</div>
                </div>
                <div class="detail-item">
                  <label>提交时间：</label>
                  <span>{{ formatDate(currentFeedback._create_time) }}</span>
                </div>
                <div class="detail-item">
                  <label>处理状态：</label>
                  <span :class="currentFeedback._status === 1 ? 'status-published' : 'status-draft'">
                    {{ currentFeedback._status === 1 ? '已处理' : '待处理' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 回复反馈弹窗 -->
          <div id="replyFeedbackModal" class="modal" v-if="showReplyFeedbackModal">
            <div class="modal-content">
              <span class="close-button" @click="closeReplyFeedbackModal">&times;</span>
              <h2>回复读者反馈</h2>
              <form @submit.prevent="submitReply">
                <div class="reply-info">
                  <div class="info-item">
                    <label>读者邮箱：</label>
                    <span>{{ currentFeedback._email }}</span>
                  </div>
                  <div class="info-item">
                    <label>原反馈标题：</label>
                    <span>{{ currentFeedback._title }}</span>
                  </div>
                </div>
                
                <label for="replySubject">回复主题：</label>
                <input type="text" id="replySubject" v-model="replyForm.subject" placeholder="请输入回复主题" required>
                
                <label for="replyContent">回复内容：</label>
                <textarea id="replyContent" v-model="replyForm.content" placeholder="请输入回复内容" rows="8" required></textarea>
                
                <div class="modal-buttons">
                  <button type="button" class="cancel-button" @click="closeReplyFeedbackModal">取消</button>
                  <button type="submit" class="submit-button">发送回复</button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
export default {
  // 添加用户类型变化处理函数
  onUserTypeChange() {
    // 清除之前可能填写的特定字段
    this.userForm.class = '';
    this.userForm.department = '';
    this.userForm.workDepartment = '';
  },
  name: 'BooksView',
  data() {
    return {

      // 添加管理员信息和弹窗状态
      showUserInfoModal: false,
      currentAdmin: {
        _uid: '',
        _username: '',
        _name: '',
        _type: '', // super: 终端管理员, book: 图书管理员, lend: 借阅管理员
        _email: '',
        _create_time: ''
      },

      // 页面状态
      currentPage: 'home',

      // 借阅趋势时间筛选
      lendTrendStartDate: '',
      lendTrendEndDate: '',
      
      // 借阅统计标签页
      borrowStatsTab: 'category', 

      // 图表实例
      bookCategoryChart: null,
      lendTrendChart: null,
      userTypeChart: null,
      borrowStatsChart: null, // 借阅统计图表
      
      // 图书管理相关
      books: [],
      filteredBooks: [],
      bookCurrentPage: 1,
      bookRowsPerPage: 10,
      searchType: '_bid',
      searchKeyword: '',
      showAddBookModalFlag: false,
      isEditBook: false,
      currentEditBookId: null,
      // 批量上传相关
      showBulkUploadModalFlag: false,
      selectedFile: null,
      bookForm: {
        bookTitle: '',
        author: '',
        isbn: '',
        bookType: '',
        publisher: '',
        totalQuantity: 0,
        coverUrl: ''  
      },
      
      // 分类管理相关
      categories: [],
      categoryCurrentPage: 1,
      categoryRowsPerPage: 5,
      categorySearchType: '_type_name',
      categorySearchKeyword: '',
      filteredCategories: [],
      showAddCategoryModalFlag: false,
      isEditCategory: false,
      currentEditCategoryId: null,
      categoryForm: {
        categoryId: '',
        categoryName: ''
      },
      
      // 借阅管理相关
      lends: [],
      lendCurrentPage: 1,
      lendRowsPerPage: 8,
      lendSearchType: '_bid',
      lendSearchKeyword: '',
      filteredLends: [],
      showDelayModal: false,
      currentDelayHid: null,
      newReturnDate: '',

      // 用户管理相关
      users: [],
      filteredUsers: [],
      userCurrentPage: 1,
      userRowsPerPage: 8,
      userSearchType: '_username',
      userSearchKeyword: '',
      showAddUserModalFlag: false,
      // 用户批量上传相关
      showBulkUserUploadModalFlag: false,
      selectedUserFile: null,
      isEditUser: false,
      currentEditUserId: null,
      userForm: {
        account: '',
        name: '',
        password: '',
        email: '',
        userType: 'student',// student: 学生, teacher: 教师, admin_t: 终端管理员, admin_n: 普通管理员
        class: '',        // 学生班级
        department: '',   // 教师院系
        workDepartment: '' // 临时工工作部门
      },

      // 公告管理相关
      announcements: [],
      announcementCurrentPage: 1,
      announcementRowsPerPage: 8,
      announcementSearchType: '_title',
      announcementSearchKeyword: '',
      filteredAnnouncements: [],
      showAddAnnouncementModalFlag: false,
      isEditAnnouncement: false,
      currentEditAnnouncementId: null,
      announcementForm: {
        title: '',
        content: '',
        publisher: '',
        status: 1  // 1: 已发布, 0: 草稿
      },
      // 意见建议相关数据
      feedbackSearchType: '_email',
      feedbackSearchKeyword: '',
      feedbacks: [],
      filteredFeedbacks: [],
      feedbackCurrentPage: 1,
      feedbackPageSize: 10,
      showFeedbackDetailModal: false,
      showReplyFeedbackModal: false,
      currentFeedback: {},
      replyForm: {
        subject: '',
        content: ''
      }
    };
  },
  
  computed: {
    // 图书分页计算
    totalBookPages() {
      const dataSource = this.filteredBooks.length > 0 ? this.filteredBooks : this.books;
      return Math.ceil(dataSource.length / this.bookRowsPerPage) || 1;
    },
    currentPageBooks() {
      const dataSource = this.filteredBooks.length > 0 ? this.filteredBooks : this.books;
      const start = (this.bookCurrentPage - 1) * this.bookRowsPerPage;
      const end = start + this.bookRowsPerPage;
      return dataSource.slice(start, end);
    },
    visibleBookPages() {
      return this.generateVisiblePages(this.bookCurrentPage, this.totalBookPages);
    },
    
    // 分类分页计算
    totalCategoryPages() {
      const dataSource = this.filteredCategories.length > 0 ? this.filteredCategories : this.categories;
      return Math.ceil(dataSource.length / this.categoryRowsPerPage) || 1;
    },
    currentPageCategories() {
      const dataSource = this.filteredCategories.length > 0 ? this.filteredCategories : this.categories;
      const start = (this.categoryCurrentPage - 1) * this.categoryRowsPerPage;
      const end = start + this.categoryRowsPerPage;
      return dataSource.slice(start, end);
    },
    visibleCategoryPages() {  
      return this.generateVisiblePages(this.categoryCurrentPage, this.totalCategoryPages);
    },
    
    // 借阅分页计算
    totalLendPages() {
      const dataSource = this.filteredLends.length > 0 ? this.filteredLends : this.lends;
      return Math.ceil(dataSource.length / this.lendRowsPerPage) || 1;
    },
    currentPageLends() {
      const dataSource = this.filteredLends.length > 0 ? this.filteredLends : this.lends;
      const start = (this.lendCurrentPage - 1) * this.lendRowsPerPage;
      const end = start + this.lendRowsPerPage;
      return dataSource.slice(start, end);
    },
    visibleLendPages() {  
      return this.generateVisiblePages(this.lendCurrentPage, this.totalLendPages);
    },

    // 用户分页计算
    totalUserPages() {
      const dataSource = this.filteredUsers.length > 0 ? this.filteredUsers : this.users;
      return Math.ceil(dataSource.length / this.userRowsPerPage) || 1;
    },
    currentPageUsers() {
      const dataSource = this.filteredUsers.length > 0 ? this.filteredUsers : this.users;
      const start = (this.userCurrentPage - 1) * this.userRowsPerPage;
      const end = start + this.userRowsPerPage;
      return dataSource.slice(start, end);
    },
    visibleUserPages() {
      return this.generateVisiblePages(this.userCurrentPage, this.totalUserPages);
    },

    // 公告分页计算
    totalAnnouncementPages() {
      const dataSource = this.filteredAnnouncements.length > 0 ? this.filteredAnnouncements : this.announcements;
      return Math.ceil(dataSource.length / this.announcementRowsPerPage) || 1;
    },
    currentPageAnnouncements() {
      const dataSource = this.filteredAnnouncements.length > 0 ? this.filteredAnnouncements : this.announcements;
      const start = (this.announcementCurrentPage - 1) * this.announcementRowsPerPage;
      const end = start + this.announcementRowsPerPage;
      return dataSource.slice(start, end);
    },
    visibleAnnouncementPages() { 
      return this.generateVisiblePages(this.announcementCurrentPage, this.totalAnnouncementPages);
    },
    // 意见建议分页计算
    totalFeedbackPages() {
      const dataSource = this.filteredFeedbacks.length > 0 ? this.filteredFeedbacks : this.feedbacks;
      return Math.ceil(dataSource.length / this.feedbackPageSize) || 1;
    },
    currentPageFeedbacks() {
      const dataSource = this.filteredFeedbacks.length > 0 ? this.filteredFeedbacks : this.feedbacks;
      const start = (this.feedbackCurrentPage - 1) * this.feedbackPageSize;
      const end = start + this.feedbackPageSize;
      return dataSource.slice(start, end);
    },
    visibleFeedbackPages() {
      return this.generateVisiblePages(this.feedbackCurrentPage, this.totalFeedbackPages);
    },
    
    // 统计数据 - 新增activeLends计算属性
    bookCount() {
      return this.books.length;
    },
    userCount() {
      return this.users.length;
    },
    announcementCount() {
      return this.announcements.length;
    },
    activeLends() {
      // 计算活跃借阅数量
      return this.lends.filter(lend => lend._status === 0).length;
    }
  },
  
 async mounted() {
    console.log('组件挂载开始');
    console.log('=== 管理员页面加载开始 ===');
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ 没有找到token，请先登录');
      return;
    } else {
      console.log('✅ token存在，开始初始化数据');
    }
    
    try {
       // 获取当前管理员信息
      await this.fetchCurrentAdminInfo();

      await Promise.all([
        this.fetchBooks(),
        this.fetchCategories(), 
        this.fetchLends(),
        this.fetchUsers(),
        this.fetchAnnouncements()
      ]);
      
      this.$nextTick(() => {
        this.initCharts();
        
        // 初始化日期范围（如果还没有设置）
        if (!this.lendTrendStartDate || !this.lendTrendEndDate) {
          this.initDateRange();
        } else {
          // 如果日期已设置，直接更新图表
          this.updateLendTrendChart();
        }
      });
    } catch (error) {
      console.error('初始化数据失败:', error);
    }
    
    // 监听窗口大小变化，调整图表大小
    window.addEventListener('resize', () => {
      if (this.bookCategoryChart) this.bookCategoryChart.resize();
      if (this.lendTrendChart) this.lendTrendChart.resize();
      if (this.userTypeChart) this.userTypeChart.resize();
      if (this.borrowStatsChart) this.borrowStatsChart.resize();
    });
  },
  // 验证并修正日期范围
  validateAndFixDateRange() {
    if (!this.lendTrendStartDate || !this.lendTrendEndDate) {
      return false;
    }
    
    const startDate = new Date(this.lendTrendStartDate);
    const endDate = new Date(this.lendTrendEndDate);
    
    // 确保开始日期不晚于结束日期
    if (startDate > endDate) {
      // 自动交换日期
      const temp = this.lendTrendStartDate;
      this.lendTrendStartDate = this.lendTrendEndDate;
      this.lendTrendEndDate = temp;
      this.$message.info('已自动调整日期范围');
      return true;
    }
    
    return true;
  },
 // 日期监听器
  watch: {
    // 监听日期变化，自动更新图表
    lendTrendStartDate: function(newVal, oldVal) {
      console.log('开始日期变化:', oldVal, '->', newVal);
      // 确保两个日期都已设置再更新图表
      if (newVal && this.lendTrendEndDate) {
        this.$nextTick(() => {
          this.updateLendTrendChart();
        });
      }
    },
    lendTrendEndDate: function(newVal, oldVal) {
      console.log('结束日期变化:', oldVal, '->', newVal);
      // 确保两个日期都已设置再更新图表
      if (newVal && this.lendTrendStartDate) {
        this.$nextTick(() => {
          this.updateLendTrendChart();
        });
      }
    }
  },
  
  methods: {
    // 页面切换 - 新增图表重新渲染逻辑
    changePage(page) {
      console.log('切换页面到:', page);
      this.currentPage = page;
      console.log("跳转页面：")
      // 当切换回主页时，重新渲染图表
      if (page === 'home') {
        this.$nextTick(() => {
          this.initCharts();
        });
      }
    },
    // 重置搜索条件
    handleReset() {
      // 重置所有模块的搜索条件
      this.searchKeyword = '';           // 图书管理
      this.searchType = '_bid';
      this.bookCurrentPage = 1;
      this.filteredBooks = [];
      
      this.userSearchKeyword = '';       // 用户管理
      this.userSearchType = '_username';
      this.userCurrentPage = 1;
      this.filteredUsers = [];
      
      this.categorySearchKeyword = '';   // 分类管理
      this.categorySearchType = '_type_name';
      this.categoryCurrentPage = 1;
      this.filteredCategories = [];
      
      this.lendSearchKeyword = '';       // 借阅管理
      this.lendSearchType = '_bid';
      this.lendCurrentPage = 1;
      this.filteredLends = [];
      
      this.announcementSearchKeyword = ''; // 公告管理
      this.announcementSearchType = '_title';
      this.announcementCurrentPage = 1;
      this.filteredAnnouncements = [];
      
      this.$message.success('所有搜索条件已重置');
    },
    // 切换管理员信息显示
    toggleUserInfo() {
      this.showUserInfoModal = !this.showUserInfoModal;
    },
    
    // 关闭管理员信息弹窗
    closeUserInfoModal() {
      this.showUserInfoModal = false;
    },
    
    // 获取管理员类型文本
    getAdminTypeText(type) {
      const typeMap = {
        'super': '终端管理员',
        'normal': '普通管理员'
      };
      return typeMap[type] || '未知类型';
    },

    // 退出登录
    logout() {
      if (confirm('确定要退出登录吗？')) {
        this.closeUserInfoModal();
        this.performLogout();
      }
    },
    
    // 生成可见页码
    generateVisiblePages(currentPage, totalPages) {
      const pages = [];
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, 5);
        } else if (currentPage >= totalPages - 2) {
          pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
        }
      }
      return pages;
    },

    // 切换借阅统计标签页
    switchBorrowStatsTab(tab) {
      this.borrowStatsTab = tab;
      this.updateBorrowStatsChart();
    },
    
    // 更新借阅统计图表
    async updateBorrowStatsChart() {
      if (this.borrowStatsTab === 'category') {
        await this.updateCategoryBorrowChart();
      } else {
        await this.updateBookBorrowChart();
      }
    },
    
    // 更新类别借阅统计图表
    async updateCategoryBorrowChart() {
      try {
        const res = await fetch('/api/categories/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (res.ok) {
          const result = await res.json();
          const categories = result.data || [];
          
          const labels = categories.map(item => item._type_name);
          const data = categories.map(item => item.count);
          
          if (this.borrowStatsChart) {
            this.borrowStatsChart.data.labels = labels;
            this.borrowStatsChart.data.datasets[0].data = data;
            this.borrowStatsChart.data.datasets[0].label = '借阅数量';
            this.borrowStatsChart.update();
          }
        }
      } catch (error) {
        console.error('获取类别借阅统计失败:', error);
      }
    },
    
    // 更新单本图书借阅统计图表
    async updateBookBorrowChart() {
      try {
        const res = await fetch('/api/books/rank?limit=10', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (res.ok) {
          const result = await res.json();
          const books = result.data.res_rank || [];
          
          const labels = books.map(book => book._book_name);
          const data = books.map(book => book._times);
          
          if (this.borrowStatsChart) {
            this.borrowStatsChart.data.labels = labels;
            this.borrowStatsChart.data.datasets[0].data = data;
            this.borrowStatsChart.data.datasets[0].label = '借阅次数';
            this.borrowStatsChart.update();
          }
        }
      } catch (error) {
        console.error('获取图书借阅排行失败:', error);
      }
    },
    
    // 初始化日期范围（最近30天）
    initDateRange() {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      // 确保格式为 YYYY-MM-DD
      this.lendTrendStartDate = this.formatDateForInput(thirtyDaysAgo);
      this.lendTrendEndDate = this.formatDateForInput(today);
      console.log('初始化日期范围:', this.lendTrendStartDate, '到', this.lendTrendEndDate);
      
      // 初始化后立即更新图表
      this.$nextTick(() => {
        this.updateLendTrendChart();
      });
    },
    
    // 格式化日期为input[type="date"]需要的格式(YYYY-MM-DD)
    formatDateForInput(date) {
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();

      if (month.length < 2) 
        month = '0' + month;
      if (day.length < 2) 
        day = '0' + day;

      return [year, month, day].join('-');
    },
    
    // 获取日期范围内的借阅数据
    async getLendDataInRange(startDate, endDate) {
      try {
        const response = await fetch(`/api/borrow-records/stats?start=${startDate}&end=${endDate}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.data;
        }
        return [];
      } catch (error) {
        console.error('获取借阅数据失败:', error);
        return [];
      }
    },
     // 验证日期范围
    validateDateRange() {
      if (!this.lendTrendStartDate || !this.lendTrendEndDate) {
        return true; // 如果日期未完全设置，则暂时认为有效
      }
      
      const startDate = new Date(this.lendTrendStartDate);
      const endDate = new Date(this.lendTrendEndDate);
      
      if (startDate >= endDate) {
        // 显示错误消息给用户
        this.$message.error('开始日期必须早于结束日期');
        return false;
      }
      
      return true;
    },
    // 更新借阅趋势图表
    async updateLendTrendChart() {
      console.log('更新借阅趋势图表，开始日期:', this.lendTrendStartDate, '结束日期:', this.lendTrendEndDate);
      
      // 检查日期有效性
      if (!this.lendTrendStartDate || !this.lendTrendEndDate) {
        console.log('日期未设置完整');
        return;
      }
      
      // 验证开始日期必须早于结束日期
      const startDateObj = new Date(this.lendTrendStartDate);
      const endDateObj = new Date(this.lendTrendEndDate);
      
      if (startDateObj >= endDateObj) {
        console.log('开始日期必须早于结束日期');
        // 显示错误提示给用户
        this.$message.warning('开始日期必须早于结束日期');
        
        // 清空图表数据
        if (this.lendTrendChart) {
          this.lendTrendChart.data.labels = [];
          this.lendTrendChart.data.datasets[0].data = [];
          this.lendTrendChart.update();
        }
        return;
      }
      
      try {
        // 调用API获取指定日期范围的数据
        const url = `/api/borrow-records/stats?start=${this.lendTrendStartDate}&end=${this.lendTrendEndDate}`;
        console.log('请求URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('API响应状态:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('API返回数据:', result);
          
          // 正确处理新的API响应格式
          const lendData = result.data || [];
          console.log('原始数据:', lendData);
          
          // 提取日期和数量
          const dates = lendData.map(item => {
            // 格式化日期显示，只显示月日
            const date = new Date(item.date);
            return `${date.getMonth() + 1}-${date.getDate()}`;
          });
          const counts = lendData.map(item => item.count);
          
          console.log('处理后的数据 - 日期:', dates, '数量:', counts);
          console.log('日期数量:', dates.length, '数据点数量:', counts.length);
          
          // 更新图表
          if (this.lendTrendChart) {
            this.lendTrendChart.data.labels = dates;
            this.lendTrendChart.data.datasets[0].data = counts;
            this.lendTrendChart.update();
            console.log('图表已更新');
            
            // 如果没有数据，显示提示信息
            if (dates.length === 0) {
              this.$message.info('选定日期范围内暂无借阅数据');
            }
          } else {
            console.log('图表实例不存在');
          }
        } else if (response.status === 400) {
          // 处理400错误（通常是日期范围错误）
          const errorResult = await response.json();
          console.error('API请求失败:', errorResult.message);
          this.$message.error(errorResult.message || '日期范围无效');
          
          // 清空图表数据
          if (this.lendTrendChart) {
            this.lendTrendChart.data.labels = [];
            this.lendTrendChart.data.datasets[0].data = [];
            this.lendTrendChart.update();
          }
        } else {
          console.error('API请求失败，状态码:', response.status);
          this.$message.error('获取数据失败，请稍后重试');
        }
      } catch (error) {
        console.error('获取借阅数据失败:', error);
        this.$message.error('网络错误，请检查网络连接');
      }
    },
    
    // 创建借阅统计图表
    createBorrowStatsChart() {
      const ctx = document.getElementById('borrowStatsChart').getContext('2d');
      this.borrowStatsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: '借阅数量',
            data: [],
            backgroundColor: 'rgba(25, 118, 210, 0.6)',
            borderColor: 'rgba(25, 118, 210, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '各类别图书借阅数量统计',
              font: {
                size: 16
              }
            },
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    },

    // 图表相关方法 
    initCharts() {
      // 销毁现有图表实例
      if (this.bookCategoryChart) this.bookCategoryChart.destroy();
      if (this.lendTrendChart) this.lendTrendChart.destroy();
      if (this.userTypeChart) this.userTypeChart.destroy();

      // 初始化日期范围
      this.initDateRange();
      
      // 图书分类分布图
      const bookCategoryCtx = document.getElementById('bookCategoryChart');
      if (bookCategoryCtx) {
        this.bookCategoryChart = new Chart(bookCategoryCtx, {
          type: 'doughnut',
          data: {
            labels: this.getCategoryNames(),
            datasets: [{
              data: this.getCategoryBookCounts(),
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#8AC926', '#1982C4'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'right',
              },
              title: {
                display: false
              }
            }
          }
        });
      }
      
      // 借阅趋势图
      const lendTrendCtx = document.getElementById('lendTrendChart');
      if (lendTrendCtx) {
        this.lendTrendChart = new Chart(lendTrendCtx, {
          type: 'line',
          data: {
            labels: this.getLast7Days(),
            datasets: [{
              label: '借阅数量',
              data: this.getLendTrendData(),
              borderColor: '#36A2EB',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              tension: 0.3,
              fill: true
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      }
      
      // 用户类型分布图
      const userTypeCtx = document.getElementById('userTypeChart');
      if (userTypeCtx) {
        this.userTypeChart = new Chart(userTypeCtx, {
          type: 'pie',
          data: {
            labels: ['学生', '教师', '终端管理员', '普通管理员', '临时工'],
            datasets: [{
              data: this.getUserTypeCounts(),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#8AC926'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
              }
            }
          }
        });
      }  

      // 创建借阅统计图表
      this.createBorrowStatsChart();
      
      // 初始加载数据
      this.updateLendTrendChart();
      this.updateBorrowStatsChart();
    },
    
    // 获取分类名称
    getCategoryNames() {
      return this.categories.map(cat => cat._type_name);
    },
    
    // 获取各分类图书数量
    getCategoryBookCounts() {
      return this.categories.map(cat => {
        return this.books.filter(book => book._tid === cat._tid).length;
      });
    },
    
    // 获取借阅趋势数据（基于真实数据）
    getLendTrendData() {
      // 获取最近7天的日期范围
      const last7Days = this.getLast7DaysDates(); // 需要新增这个方法
      
      // 统计每天借阅数量
      return last7Days.map(date => {
        return this.lends.filter(lend => {
          const lendDate = this.formatDate(lend._begin_time);
          return lendDate === date;
        }).length;
      });
    },

    // 新增方法：获取最近7天的日期字符串数组（YYYY-MM-DD格式）
    getLast7DaysDates() {
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
      return dates;
    },

    // 同时修改 getLast7Days 方法，确保日期格式一致
    getLast7Days() {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(`${date.getMonth()+1}/${date.getDate()}`);
      }
      return days;
    },
        
    // 获取用户类型数量
    getUserTypeCounts() {
      const studentCount = this.users.filter(u => u._utype === 'student').length;
      const teacherCount = this.users.filter(u => u._utype === 'teacher').length;
      const adminTCount = this.users.filter(u => u._utype === 'admin_t').length;
      const adminNCount = this.users.filter(u => u._utype === 'admin_n').length;
      const tempWorkerCount = this.users.filter(u => u._utype === 'tempworker').length;
      
      return [studentCount, teacherCount, adminTCount, adminNCount, tempWorkerCount];
    },

    // 获取公告状态数量
    getAnnouncementStatusCounts() {
      const publishedCount = this.announcements.filter(a => a._status === 1).length;
      const draftCount = this.announcements.length - publishedCount;
      return [publishedCount, draftCount];
    },
    

    // 获取当前管理员信息
    async fetchCurrentAdminInfo() {
      try {
        const token = localStorage.getItem('token');
        // 从token中解析出用户基本信息
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const tokenData = JSON.parse(jsonPayload);
        
        // 使用_uid获取完整用户信息
        const response = await fetch(`/api/readers?query=${tokenData._uid}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.readerlist && result.data.readerlist.length > 0) {
            const userInfo = result.data.readerlist[0];
            this.currentAdmin = {
              _uid: userInfo._uid || tokenData._uid || '',
              _username: userInfo._account || tokenData._account || '',
              _name: userInfo._name || '',
              _type: this.mapAdminType(userInfo._utype || tokenData._utype),
              _email: userInfo._email || '',
              _create_time: userInfo._create_time || ''
            };
          } else {
            // 如果获取不到用户信息，则使用token中的基本数据
            this.currentAdmin = {
              _uid: tokenData._uid || '',
              _username: tokenData._account || '',
              _name: tokenData._name || '',
              _type: this.mapAdminType(tokenData._utype),
              _email: '',
              _create_time: ''
            };
          }
        } else if (response.status === 401) {
          this.performLogout();
        }
      } catch (error) {
        console.error('获取管理员信息失败:', error);
      }
    },

     // 映射管理员类型
      mapAdminType(utype) {
        const typeMap = {
          'admin_t': 'super',
          'admin_n': 'normal'
        };
        return typeMap[utype] || utype;
      },

    // 图书管理相关方法
    async fetchBooks() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$message.error('请先登录');
        return;
      }
      try {
        const res = await fetch('/api/books', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // 只在这里处理401,token过期反馈
        if (res.status === 401) {
          this.performLogout();
          return;
        }

        const result = await res.json();
        if (res.status === 200) {
          console.log('✅ 图书数据获取成功:', result);
          this.books = result.data.booklist || [];
          this.filteredBooks = [];
        } else {
          console.log('❌ 图书数据获取失败:', result);
          this.books = [];
          this.filteredBooks = [];
          this.$message.error(result.message || '没有找到图书');
        }
      } catch (err) {
        console.log("❌ 获取图书数据时发生错误:");
        console.error(err);
        this.$message.error('无法获取图书数据，请稍后再试');
      }
    },
    
    handleBookSearch() {
      this.bookCurrentPage = 1;
      this.filteredBooks = this.getBookFilterData();
      if (this.filteredBooks.length === 0) {
        this.$message.error("没有找到相关图书");
      }
    },
    
    getBookFilterData() {
      const typeMap = {
        '_bid': '_bid', 
        '_book_name': '_book_name',
        '_author': '_author',
        '_isbn': '_isbn',
        '_type_name': '_type_name'
      };
      
      const actualField = typeMap[this.searchType] || '_book_name';
      const keyword = this.searchKeyword.trim();
      
      if (!keyword) return this.books;
      
      return this.books.filter(book => {
        const fieldValue = book[actualField] ? book[actualField].toString() : '';
        return fieldValue.includes(keyword);
      });
    },
    
    changeBookPage(page) {
      if (page < 1 || page > this.totalBookPages) return;
      this.bookCurrentPage = page;
    },
    
    showAddBookModal() {
      this.isEditBook = false;
      this.currentEditBookId = null;
      this.bookForm = {
        bookTitle: '',
        author: '',
        isbn: '',
        bookType: '',
        publisher: '',
        totalQuantity: 0
      };
      this.showAddBookModalFlag = true;
    },
    
    closeAddBookModal() {
      this.showAddBookModalFlag = false;
    },
    
    editBook(book) {
      this.isEditBook = true;
      this.currentEditBookId = book._bid;
      this.bookForm = {
        bookTitle: book._book_name,
        author: book._author,
        isbn: book._isbn,
        bookType: book._tid,
        publisher: book._press,
        totalQuantity: book._num
      };
      this.showAddBookModalFlag = true;
    },
    
    async submitBookForm() {
      const { bookTitle, author, isbn, bookType, publisher, totalQuantity,coverUrl } = this.bookForm;
      
      if (!bookTitle || !author || !isbn || !bookType || !publisher || !totalQuantity) {
        this.$message.error('请填写完整的图书信息！');
        return;
      }
      
      const bookData = {
        _book_name: bookTitle,
        _author: author,
        _isbn: isbn,
        _tid: bookType,
        _press: publisher,
        _num: Number(totalQuantity),
        _cover_url: coverUrl  
      };
      
      try {
        if (this.isEditBook) {
          await this.editBookApi(this.currentEditBookId, bookData);
        } else {
          await this.addBookApi(bookData);
        }
        this.closeAddBookModal();
        await this.fetchBooks();
      } catch (err) {
        console.error(err);
      }
    },
    
    async addBookApi(bookData) {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookData)
      });
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || '添加图书失败');
      }
      this.$message.success(result.message || '添加图书成功');
    },
    
    async editBookApi(id, bookData) {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookData)
      });
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || '编辑图书失败');
      }
      this.$message.success(result.message || '编辑图书成功');
    },
    
    async deleteBook(id) {
      if (!confirm('确定要删除这本图书吗？')) return;
      
      try {
        const res = await fetch(`/api/books/${id}`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await res.json()
        if (res.status === 200) {
          this.$message.success(result.message || '成功删除图书信息')
          await this.fetchBooks();
        } else {
          this.$message.error(result.message || '操作失败')
        }
      } catch (err) {
        console.error(err)
        this.$message.error('删除图书失败')
      }
    },
    // 显示批量上传弹窗
    showBulkUploadModal() {
      this.selectedFile = null;
      this.showBulkUploadModalFlag = true;
    },

    // 关闭批量上传弹窗
    closeBulkUploadModal() {
      this.showBulkUploadModalFlag = false;
      this.selectedFile = null;
    },

    // 处理文件选择
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
      }
    },

    // 处理拖拽上传
    handleDrop(event) {
      const file = event.dataTransfer.files[0];
      if (file) {
        // 检查文件类型
        const validTypes = ['text/csv', 'application/vnd.ms-excel', 
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (validTypes.includes(file.type)) {
          this.selectedFile = file;
        } else {
          this.$message.error('请上传 CSV 或 Excel 文件');
        }
      }
    },

    // 下载模板
    async downloadTemplate() {
      try {
        const response = await fetch('/api/books/bulk-upload/template', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = '图书批量上传模板.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          this.$message.error('模板下载失败');
        }
      } catch (error) {
        console.error('下载模板失败:', error);
        this.$message.error('模板下载失败: ' + error.message);
      }
    },

    // 提交批量上传
    async submitBulkUpload() {
      if (!this.selectedFile) {
        this.$message.error('请选择要上传的文件');
        return;
      }

      const formData = new FormData();
      formData.append('file', this.selectedFile);

      try {
        const response = await fetch('/api/books/bulk-upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          this.$message.success(`批量上传成功！共处理 ${result.data.total} 条记录`);
          this.closeBulkUploadModal();
          await this.fetchBooks(); // 重新加载图书列表
        } else {
          const errorMsg = result.message || '批量上传失败';
          this.$message.error(errorMsg);
          
          // 如果有详细错误信息，显示出来
          if (result.errors && result.errors.length > 0) {
            console.error('上传错误详情:', result.errors);
          }
        }
      } catch (error) {
        console.error('批量上传失败:', error);
        this.$message.error('批量上传失败: ' + error.message);
      }
    },
    
    // 分类管理相关方法
    async fetchCategories() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$message.error('请先登录');
        return;
      }
      try {
        const res = await fetch('/api/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // 只在这里处理401,token过期反馈
        if (res.status === 401) {
          this.performLogout();
          return;
        }

        const result = await res.json();
        if (res.status === 200) {
          this.categories = result.data.catlist || [];
          this.filteredCategories = [];
        } else {
          this.categories = [];
          this.filteredCategories = [];
          this.$message.error(result.message || '没有找到分类');
        }
      } catch (err) {
        this.$message.error('无法获取分类数据，请稍后再试');
        console.error(err);
      }
    },
    // 分类搜索方法
    handleCategorySearch() {
      this.categoryCurrentPage = 1;
      this.filteredCategories = this.getCategoryFilterData();
      if (this.filteredCategories.length === 0) {
        this.$message.error("没有找到相关分类");
      }
    },

    getCategoryFilterData() {
      const keyword = this.categorySearchKeyword.trim();
      
      if (!keyword) return this.categories;
      
      return this.categories.filter(category => {
        const categoryName = category._type_name ? category._type_name.toString() : '';
        return categoryName.includes(keyword);
      });
    },

    changeCategoryPage(page) {
      if (page < 1 || page > this.totalCategoryPages) return;
      this.categoryCurrentPage = page;
    },
    
    showAddCategoryModal() {
      this.isEditCategory = false;
      this.currentEditCategoryId = null;
      this.categoryForm = {
        categoryName: ''
      };
      this.showAddCategoryModalFlag = true;
    },
    
    closeAddCategoryModal() {
      this.showAddCategoryModalFlag = false;
    },
    
    editCategory(cat) {
      this.isEditCategory = true;
      this.currentEditCategoryId = cat._tid;
      this.categoryForm = {
        categoryName: cat._type_name
      };
      this.showAddCategoryModalFlag = true;
    },
    
    async submitCategoryForm() {
      const {categoryName } = this.categoryForm;
      
      if (!categoryName) {
        this.$message.error('请输入分类名称！');
        return;
      }
      
      try {
        if (this.isEditCategory) {
          await this.editCategoryApi(this.currentEditCategoryId, {
            _type_name: categoryName
          });
        } else {
          await this.addCategoryApi({
            _type_name: categoryName
          });
        }
        this.closeAddCategoryModal();
        await this.fetchCategories();
        // 刷新图书类型下拉框
        this.fetchBooks();
      } catch (err) {
        console.error(err);
      }
    },
    
    async addCategoryApi(categoryData) {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(categoryData)
      })
      const result = await res.json()
      if (res.status !== 200) {
        throw new Error(result.message || '添加分类失败')
      }
      this.$message.success(result.message || '添加分类成功')
    },
    
    async editCategoryApi(id, categoryData) {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(categoryData)
      });
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || '编辑分类失败')
      }
      this.$message.success(result.message || '编辑分类成功')
    },
    
    async deleteCategory(id) {
      if (!confirm('确定要删除该分类吗？')) return
      
      try {
        const res = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        const result = await res.json()
        if (res.status === 200) {
          this.$message.success(result.message || '删除成功')
          await this.fetchCategories()
        } else {
          this.$message.error(result.message || '删除失败')
        }
      } catch (err) {
        this.$message.error('删除分类失败')
        console.error(err)
      }
    },
    
    // 借阅管理相关方法
    // 状态映射方法
    getLendStatusText(statusCode) {
      const statusMap = {
        0: '借阅中',
        1: '已归还',
        2: '逾期未还',
        3: '续借中'
      };
      return statusMap[statusCode] || '未知状态';
    },
    async fetchLends() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$message.error('请先登录');
        return;
      }
      try {
        const res = await fetch('/api/borrow-records', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        // 只在这里处理401,token过期反馈
        if (res.status === 401) {
          this.performLogout();
          return;
        }

        const result = await res.json()
        if (res.status === 200) {
          this.lends = result.data.historylist || []
          this.filteredLends = []; // 重置搜索状态
        } else {
          this.lends = []
          this.filteredLends = [];
          this.$message.error(result.message || '没有找到借阅记录')
        }
      } catch (err) {
        this.$message.error('无法获取借阅记录，请稍后再试')
        console.error(err)
      }
    },
    
    // 借阅搜索方法
    handleLendSearch() {
      this.lendCurrentPage = 1;
      this.filteredLends = this.getLendFilterData();
      if (this.filteredLends.length === 0) {
        this.$message.error("没有找到相关借阅记录");
      }
    },

    getLendFilterData() {
      const keyword = this.lendSearchKeyword.trim();
      
      if (!keyword) return this.lends;
      
      return this.lends.filter(lend => {
        switch (this.lendSearchType) {
          case '_hid':
            return lend._hid.toString().includes(keyword);
          case '_book_name':
            return lend.book?._book_name.includes(keyword);
          case '_user_name':
            return lend.user?._name.includes(keyword);
          case 'status':{
            const statusText = this.getLendStatusText(lend._status);
            return statusText.includes(keyword);
          }
          default:
            return true;
        }
      });
    },

    changeLendPage(page) {
      if (page < 1 || page > this.totalLendPages) return
      this.lendCurrentPage = page
    },
    
    formatDate(dateString) {
  // 添加空值检查
  if (!dateString) return '-';
  
  try {
    // 将输入转换为 Date 对象
    const dateObj = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      console.warn('无效的日期值:', dateString);
      return '-';
    }
    
    // 使用 toISOString 之前确保日期有效
    return dateObj.toISOString().split('T')[0]; // 只返回日期部分
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
},
    
    delayLend(hid, endDate) {
      this.currentDelayHid = hid
      // 默认延期一个月
      const newDate = new Date(endDate)
      newDate.setMonth(newDate.getMonth() + 1)
      this.newReturnDate = this.formatDate(newDate)
      this.showDelayModal = true
    },
    closeDelayModal() {
      this.showDelayModal = false
      this.currentDelayHid = null
    },
    
    async submitDelay() {
      if (!this.currentDelayHid) {
        this.$message.error('未找到借阅记录');
        return;
      }
      
      try {
        await this.delayLendApi(this.currentDelayHid);
        this.closeDelayModal();
        await this.fetchLends();
      } catch (err) {
        console.error(err);
        this.$message.error(err.message || '延期失败');
      }
    }, 
    async delayLendApi(hid) {
      // 注意：根据API文档，续借是通过图书ID而不是借阅记录ID
      // 这里需要先获取借阅记录对应的图书ID
      const lendRecord = this.lends.find(lend => lend._hid === hid);
      if (!lendRecord) {
        this.$message.error('未找到借阅记录');
        return;
      }
      
      const res = await fetch(`/api/books/${hid}/renew`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || '延期失败');
      }
      
      this.$message.success(result.message || '图书续借成功');
    },

    // 用户管理相关方法

    // 获取用户类型文本
    getUserTypeText(utype) {
      const typeMap = {
        'student': '学生',
        'teacher': '教师', 
        'admin_t': '终端管理员',
        'admin_n': '普通管理员',
        'tempworker': '临时工'
      };
      return typeMap[utype] || '未知类型';
    },

    async fetchUsers() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$message.error('请先登录');
        return;
      }
      try {
        const res = await fetch('/api/readers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // 只在这里处理401
        if (res.status === 401) {
          this.performLogout();
          return;
        }
        const result = await res.json();
        if (res.status === 200) {
          this.users = result.data.readerlist || [];
          this.filteredUsers = [];
        } else {
          this.users = [];
          this.filteredUsers = [];
          this.$message.error(result.message || '没有找到用户');
        }
      } catch (err) {
        console.error(err);
        this.$message.error('无法获取用户数据，请稍后再试');
      }
    },

    handleUserSearch() {
      this.userCurrentPage = 1;
      this.filteredUsers = this.getUserFilterData();
      if (this.filteredUsers.length === 0) {
        this.$message.error("没有找到相关用户");
      }
    },

    getUserFilterData() {
      const typeMap = {
        '_uid': '_uid',
        '_account': '_account',
        '_name': '_name',
      };
      
      const actualField = typeMap[this.userSearchType] || '_name';
      const keyword = this.userSearchKeyword.trim();
      
      if (!keyword) return this.users;
      
      return this.users.filter(user => {
        const fieldValue = user[actualField] ? user[actualField].toString() : '';
        return fieldValue.includes(keyword);
      });
    },

    changeUserPage(page) {
      if (page < 1 || page > this.totalUserPages) return;
      this.userCurrentPage = page;
    },

    showAddUserModal() {
      this.isEditUser = false;
      this.currentEditUserId = null;
      this.userForm = {
        account: '',
        name: '',
        password: '',
        email: '',
        userType: 'student'
      };
      this.showAddUserModalFlag = true;
    },

    closeAddUserModal() {
      this.showAddUserModalFlag = false;
    },

    editUser(user) {
      this.isEditUser = true;
      this.currentEditUserId = user._uid;
      this.userForm = {
        account: user._account || '', // 显示原有账号
        name: user._name, // 编辑时显示原有用户名
        password: '', // 编辑时不显示密码
        email: user._email,
        userType: user._utype
      };
      this.showAddUserModalFlag = true;
    },

    async submitUserForm() {
      const { account, name, password,email, userType } = this.userForm;
      
      if (!account || !name || !email || !userType) {
        this.$message.error('请填写完整的用户信息！');
        return;
      }

      if (!this.isEditUser && !password) {
        this.$message.error('请设置用户密码！');
        return;
      }
      
      const userData = {
        _account: account,
        _name: name,
        _email: email,
        _utype: userType
      };

      if (password) {
        userData._password = password;
      }
      
      try {
        if (this.isEditUser) {
          await this.editUserApi(this.currentEditUserId, userData);
        } else {
          await this.addUserApi(userData);
        }
        this.closeAddUserModal();
        await this.fetchUsers();
      } catch (err) {
        console.error(err);
      }
    },

    async addUserApi(userData) {
      const res = await fetch('/api/readers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || '添加用户失败');
      }
      this.$message.success(result.message || '添加用户成功');
    },

    async editUserApi(id, userData) {
      const res = await fetch(`/api/readers/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || '编辑用户失败');
      }
      this.$message.success(result.message || '编辑用户成功');
    },

    async deleteUser(id) {
      if (!confirm('确定要删除这个用户吗？')) return;
      
      try {
        const res = await fetch(`/api/readers/${id}`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await res.json()
        if (res.status === 200) {
          this.$message.success(result.message || '成功删除用户信息')
          await this.fetchUsers();
        } else {
          this.$message.error(result.message || '操作失败')
        }
      } catch (err) {
        console.error(err)
        this.$message.error('删除用户失败')
      }
    },

    async resetPassword(id) {
      if (!confirm('确定要重置该用户的密码吗？')) return;
      
      try {
        // 根据API文档，重置密码需要验证码，这里简化处理
        // 实际应用中应该先获取验证码
        const res = await fetch('/api/auth/password', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            _uid: id,
            _password: 'Default123!', // 设置默认密码
            _captcha: '0000', // 简化处理，实际需要获取验证码
            _usertype: 'student' // 需要根据用户类型设置
          })
        });
        const result = await res.json()
        if (res.status === 200) {
          this.$message.success(result.message || '密码重置成功')
        } else {
          this.$message.error(result.message || '操作失败')
        }
      } catch (err) {
        console.error(err)
        this.$message.error('重置密码失败')
      }
    },
    // 显示用户批量上传弹窗
    showBulkUserUploadModal() {
      this.selectedUserFile = null;
      this.showBulkUserUploadModalFlag = true;
    },

    // 关闭用户批量上传弹窗
    closeBulkUserUploadModal() {
      this.showBulkUserUploadModalFlag = false;
      this.selectedUserFile = null;
    },

    // 处理用户文件选择
    handleUserFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedUserFile = file;
      }
    },

    // 处理用户拖拽上传
    handleUserDrop(event) {
      const file = event.dataTransfer.files[0];
      if (file) {
        // 检查文件类型
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) {
          this.selectedUserFile = file;
        } else {
          this.$message.error('请上传 CSV 或 Excel 文件');
        }
      }
    },

    // 下载用户模板
    async downloadUserTemplate() {
      try {
        // 创建一个包含所有用户类型模板的 ZIP 文件链接
        this.$message.info('请选择要下载的用户类型模板');
        
        // 创建选择对话框
        const userType = prompt('请输入要下载的用户类型模板 (student/teacher/tempworker):', 'student');
        
        if (!userType) return;
        
        let url = '';
        let filename = '';
        
        switch(userType.toLowerCase()) {
          case 'student':
            url = '/api/user-import/students/template';
            filename = '学生导入模板.csv';
            break;
          case 'teacher':
            url = '/api/user-import/teachers/template';
            filename = '教师导入模板.csv';
            break;
          case 'tempworker':
            url = '/api/user-import/tempworkers/template';
            filename = '临时工导入模板.csv';
            break;
          default:
            this.$message.error('无效的用户类型');
            return;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          this.$message.error('模板下载失败');
        }
      } catch (error) {
        console.error('下载模板失败:', error);
        this.$message.error('模板下载失败: ' + error.message);
      }
    },

    // 提交用户批量上传
    async submitBulkUserUpload() {
      if (!this.selectedUserFile) {
        this.$message.error('请选择要上传的文件');
        return;
      }

      // 根据文件名或用户选择确定用户类型
      const filename = this.selectedUserFile.name.toLowerCase();
      let uploadUrl = '';

      if (filename.includes('学生') || filename.includes('student')) {
        uploadUrl = '/api/user-import/students';
      } else if (filename.includes('教师') || filename.includes('teacher')) {
        uploadUrl = '/api/user-import/teachers';
      } else if (filename.includes('临时') || filename.includes('tempworker')) {
        uploadUrl = '/api/user-import/tempworkers';
      } else {
        // 如果无法从文件名判断，则让用户选择
        const userType = prompt('请输入用户类型 (student/teacher/tempworker):', 'student');
        if (!userType) return;
        
        switch(userType.toLowerCase()) {
          case 'student':
            uploadUrl = '/api/user-import/students';
            break;
          case 'teacher':
            uploadUrl = '/api/user-import/teachers';
            break;
          case 'tempworker':
            uploadUrl = '/api/user-import/tempworkers';
            break;
          default:
            this.$message.error('无效的用户类型');
            return;
        }
      }

      const formData = new FormData();
      formData.append('file', this.selectedUserFile);

      try {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          this.$message.success(`批量上传成功！${result.message}`);
          this.closeBulkUserUploadModal();
          await this.fetchUsers(); // 重新加载用户列表
        } else {
          const errorMsg = result.message || '批量上传失败';
          this.$message.error(errorMsg);
          
          // 如果有详细错误信息，显示出来
          if (result.errors && result.errors.length > 0) {
            console.error('上传错误详情:', result.errors);
          }
        }
      } catch (error) {
        console.error('批量上传失败:', error);
        this.$message.error('批量上传失败: ' + error.message);
      }
    },

    // 公告管理相关方法
    // 公告内容预览方法
    getContentPreview(content) {
      if (!content) return '';
      return content.length > 50 ? content.substring(0, 50) + '...' : content;
    },
    async fetchAnnouncements() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$message.error('请先登录');
        return;
      }
      try {
        const res = await fetch('/api/announcements', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // 只在这里处理401,token过期反馈
        if (res.status === 401) {
          this.performLogout();
          return;
        }

        const result = await res.json();
        if (res.status === 200) {
          this.announcements = result.data.annlist || [];
          this.filteredAnnouncements = []; 
        } else {
          this.announcements = [];
          this.filteredAnnouncements = [];
          this.$message.error(result.message || '没有找到公告');
        }
      } catch (err) {
        console.error(err);
        this.$message.error('无法获取公告数据，请稍后再试');
      }
    },
    // 公告搜索方法
    handleAnnouncementSearch() {
      this.announcementCurrentPage = 1;
      this.filteredAnnouncements = this.getAnnouncementFilterData();
      if (this.filteredAnnouncements.length === 0) {
        this.$message.error("没有找到相关公告");
      }
    },

    // 修改公告搜索方法
    getAnnouncementFilterData() {
      const keyword = this.announcementSearchKeyword.trim();
      
      if (!keyword) return this.announcements;
      
      return this.announcements.filter(announcement => {
        switch (this.announcementSearchType) {
          case '_aid':
            return announcement._aid.toString().includes(keyword);
          case '_title':
            return announcement._title.includes(keyword);
          case '_content':
            return announcement._content.includes(keyword);
          case '_status': {
            // 状态搜索需要转换 - 用大括号包裹这个case块
            const statusText = announcement._status === 1 ? '已发布' : '草稿';
            return statusText.includes(keyword);
          }
          default:
            return true;
        }
      });
    },

    changeAnnouncementPage(page) {
      if (page < 1 || page > this.totalAnnouncementPages) return;
      this.announcementCurrentPage = page;
    },

    showAddAnnouncementModal() {
      this.isEditAnnouncement = false;
      this.currentEditAnnouncementId = null;
      this.announcementForm = {
        title: '',
        content: '',
        status: 'published'
      };
      this.showAddAnnouncementModalFlag = true;
    },

    closeAddAnnouncementModal() {
      this.showAddAnnouncementModalFlag = false;
    },

    // 编辑公告方法
    editAnnouncement(announcement) {
      this.isEditAnnouncement = true;
      this.currentEditAnnouncementId = announcement._aid;
      this.announcementForm = {
        title: announcement._title,
        content: announcement._content,
        publisher: announcement._publisher,
        status: announcement._status
      };
      this.showAddAnnouncementModalFlag = true;
    },

    // 提交公告表单方法
    async submitAnnouncementForm() {
      const { title, content, publisher, status } = this.announcementForm;
      
      if (!title || !content || !publisher) {
        this.$message.error('请填写完整的公告信息！');
        return;
      }
      
      const announcementData = {
        _title: title,
        _content: content,
        _publisher: publisher,
        _status: status
      };
      
      try {
        if (this.isEditAnnouncement) {
          await this.editAnnouncementApi(this.currentEditAnnouncementId, announcementData);
        } else {
          await this.addAnnouncementApi(announcementData);
        }
        this.closeAddAnnouncementModal();
        await this.fetchAnnouncements();
      } catch (err) {
        console.error(err);
      }
    },

    // 添加公告API方法
    async addAnnouncementApi(announcementData) {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(announcementData)
      });
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || '发布公告失败');
      }
      this.$message.success(result.message || '发布公告成功');
    },

    // 修改编辑公告API方法
    async editAnnouncementApi(id, announcementData) {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(announcementData)
      });
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || '编辑公告失败');
      }
      this.$message.success(result.message || '编辑公告成功');
    },

    async deleteAnnouncement(id) {
      if (!confirm('确定要删除这个公告吗？')) return;
      
      try {
        const res = await fetch(`/api/announcements/${id}`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await res.json()
        if (res.status === 200) {
          this.$message.success(result.message || '成功删除公告')
          await this.fetchAnnouncements();
        } else {
          this.$message.error(result.message || '操作失败')
        }
      } catch (err) {
        console.error(err)
        this.$message.error('删除公告失败')
      }
    },

    // 发布公告方法
    async publishAnnouncement(id) {
      try {
        const announcement = this.announcements.find(a => a._aid === id);
        if (!announcement) {
          this.$message.error('未找到公告');
          return;
        }
        
        const res = await fetch(`/api/announcements/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            _status: 1  // 设置为已发布
          })
        });
        const result = await res.json();
        if (res.status === 200) {
          this.$message.success(result.message || '公告发布成功');
          await this.fetchAnnouncements();
        } else {
          this.$message.error(result.message || '操作失败');
        }
      } catch (err) {
        console.error(err);
        this.$message.error('发布公告失败');
      }
    },

    // 取消发布公告方法
    async unpublishAnnouncement(id) {
      try {
        const announcement = this.announcements.find(a => a._aid === id);
        if (!announcement) {
          this.$message.error('未找到公告');
          return;
        }
        
        const res = await fetch(`/api/announcements/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            _status: 0  // 设置为草稿
          })
        });
        const result = await res.json();
        if (res.status === 200) {
          this.$message.success(result.message || '公告取消发布成功');
          await this.fetchAnnouncements();
        } else {
          this.$message.error(result.message || '操作失败');
        }
      } catch (err) {
        console.error(err);
        this.$message.error('取消发布公告失败');
      }
    },
    // 意见建议搜索 
      handleFeedbackSearch() {
        if (this.feedbackSearchKeyword.trim() === '') {
          this.filteredFeedbacks = this.feedbacks;
        } else {
          this.filteredFeedbacks = this.feedbacks.filter(feedback => {
            const value = feedback[this.feedbackSearchType];
            return value && value.toString().toLowerCase().includes(this.feedbackSearchKeyword.toLowerCase());
          });
        }
        this.feedbackCurrentPage = 1; // 只需要重置页码，computed会自动更新
      },

      // 意见建议重置 
      handleFeedbackReset() {
        this.feedbackSearchType = '_email';
        this.feedbackSearchKeyword = '';
        this.filteredFeedbacks = this.feedbacks;
        this.feedbackCurrentPage = 1; // 只需要重置页码
      },

      // 标记为已处理 
      async markAsProcessed(feedbackId) {
        try {
          const response = await this.$http.put(`/api/feedback/${feedbackId}/process`);
          if (response.data.success) {
            // 更新本地数据 - computed会自动更新分页
            const index = this.feedbacks.findIndex(f => f._fid === feedbackId);
            if (index !== -1) {
              this.feedbacks[index]._status = 1;
              this.filteredFeedbacks = [...this.feedbacks]; // 更新过滤数据
            }
            alert('已标记为已处理');
          }
        } catch (error) {
          console.error('标记处理状态失败:', error);
          alert('操作失败，请重试');
        }
      },

      // 删除反馈 
      async deleteFeedback(feedbackId) {
        if (confirm('确定要删除这条反馈吗？')) {
          try {
            const response = await this.$http.delete(`/api/feedback/${feedbackId}`);
            if (response.data.success) {
              // 从本地数据中移除 - computed会自动更新分页
              this.feedbacks = this.feedbacks.filter(f => f._fid !== feedbackId);
              this.filteredFeedbacks = this.filteredFeedbacks.filter(f => f._fid !== feedbackId);
              alert('删除成功');
            }
          } catch (error) {
            console.error('删除反馈失败:', error);
            alert('删除失败，请重试');
          }
        }
      },

      // 初始化意见建议数据
      async loadFeedbacks() {
        try {
          const response = await this.$http.get('/api/feedbacks');
          this.feedbacks = response.data;
          this.filteredFeedbacks = this.feedbacks;
          this.feedbackCurrentPage = 1; // 重置到第一页
        } catch (error) {
          console.error('加载意见建议数据失败:', error);
        }
      },

      // 意见建议分页切换 
      changeFeedbackPage(page) {
        if (page < 1 || page > this.totalFeedbackPages) return;
        this.feedbackCurrentPage = page;
      },
    // 调用退出API再跳转
    async performLogout() {
      try {
        // 调用退出登录的API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      
        // 清除本地token
        localStorage.removeItem('token');
        
        // 跳转到登录页面
        window.location.href = '../';
      
      } catch (err) {
        console.error('退出登录失败:', err);
        // 即使API调用失败也清除token并跳转到登录页
        localStorage.removeItem('token');
        window.location.href = '../';
      }
    }
  }
}
</script>

<style>
/* 重置和基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  height: 100%;
}

#viewport {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 100vh;
}

/* 顶部导航栏样式 */
#top-navbar {
  width: 100%;
  background-color: #1194AE; /* 高级墨绿色 */
  color: white;
  height: 60px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  flex-shrink: 0;
}

.top-navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.system-title h1 {
  font-size: 22px;
  font-weight: 600;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item label {
  font-weight: 600;
  color: #333;
  min-width: 100px;
  margin-right: 10px;
}

.info-item span {
  color: #666;
}

.admin-type {
  color: #1194AE !important;
  font-weight: 600;
  padding: 4px 12px;
  background-color: #e8f4f8;
  border-radius: 4px;
}

.user-avatar {
  font-size: 24px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
}

.user-avatar:hover {
  transform: scale(1.1);
  color: #f0f0f0;
  background-color: rgba(255, 255, 255, 0.3);
}

.user-name {
  font-weight: 500;
}

/* 主容器 - 包含侧边栏和内容区域 */
.main-container {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  height: calc(100vh - 60px); /* 减去顶部导航栏高度 */
}

/* 侧边导航栏样式 */
#sidebar {
  width: 220px;
  background-color: #2691a6;
  color: white;
  overflow-y: auto;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

#sidebar .nav {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

#sidebar .nav li {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

#sidebar .nav li a {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.3s ease;
  height: 100%;
}

#sidebar .nav li a:hover {
  background-color: #3a9eb1;
  color: white;
}

#sidebar .nav li a i {
  margin-right: 10px;
  font-size: 18px;
  width: 20px;
  text-align: center;
}

#sidebar .nav li a span {
  font-size: 15px;
}

#sidebar .nav li.logout-item {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

#sidebar .nav li.logout-item a {
  color: #e74c3c;
}

#sidebar .nav li.logout-item a:hover {
  background-color: rgba(231, 76, 60, 0.1);
}

/* 可视化表样式优化 */

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eaeaea;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.date-filter label {
  font-weight: 500;
  color: #555;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-filter input[type="date"] {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: #fafafa;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}

.date-filter input[type="date"]:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  background-color: white;
}

.date-filter input[type="date"]:hover {
  border-color: #bdbdbd;
}

.chart-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 1px;
}

.chart-tabs button {
  background-color: transparent;
  color: #666;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 6px 6px 0 0;
  margin: 0 2px;
}

.chart-tabs button:hover {
  background-color: rgba(25, 118, 210, 0.08);
  color: #1976D2;
  transform: translateY(-1px);
}

.chart-tabs button.active {
  background-color: rgba(25, 118, 210, 0.1);
  color: #1976D2;
  border-bottom-color: #1976D2;
  font-weight: 600;
}

.chart-tabs button.active::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -4px;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background-color: #1976D2;
  border-radius: 2px;
}

/* 添加图表容器样式优化 */
.chart-container {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.chart-container h3 {
  margin-top: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 添加响应式设计 */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .date-filter {
    width: 100%;
    justify-content: space-between;
  }
  
  .chart-tabs {
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .chart-tabs button {
    padding: 8px 12px;
    font-size: 13px;
    flex: 1;
    min-width: 100px;
    text-align: center;
  }
  
  .chart-tabs button.active::before {
    display: none;
  }
}

/* 添加平滑过渡动画 */
.chart-content {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加加载状态样式 */
.chart-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #666;
  font-size: 14px;
}

.chart-loading::after {
  content: '';
  width: 20px;
  height: 20px;
  margin-left: 10px;
  border: 2px solid #e0e0e0;
  border-top-color: #1976D2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}


/* 内容区域样式 */
#content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  min-height: 0;
  margin: 0;
}

.container-fluid {
  max-width: none; /* 移除最大宽度限制 */
  margin: 0; /* 移除外边距 */
  padding: 0; /* 移除内边距 */
  width: 100%; /* 宽度100% */
}

/* 弹窗表单样式 */
.modal-content form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.modal-content label {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  font-size: 14px;
}

/* 用户名输入框组样式 */
.username-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username-input-group input {
  flex: 1;
}

.refresh-username-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
  font-size: 14px;
}

.refresh-username-btn:hover {
  background: #e0e0e0;
  color: #333;
  border-color: #999;
}

.refresh-username-btn:active {
  transform: translateY(1px);
}

input:disabled {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
  border: 1px solid #ddd;
}

small {
  color: #666;
  font-size: 12px;
  display: block;
  margin-top: 5px;
  margin-bottom: 15px;
  font-style: italic;
}

.modal-content input,
.modal-content select,
.modal-content textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
  width: 100%;
}

.modal-content input:focus,
.modal-content select:focus,
.modal-content textarea:focus {
  outline: none;
  border-color: #1194AE;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.modal-content textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.submit-button {
  background-color: #1194AE;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  margin-top: 10px;
}

.submit-button:hover {
  background-color: #067a97;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

/* 弹窗内按钮组样式 */
.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  margin-top: 10px;
}

.cancel-button:hover {
  background-color: #5a6268;
}

.logout-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  margin-top: 10px;
}

.logout-button:hover {
  background-color: #c0392b;
}

.reset-button {
  background-color: #1194AE;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.reset-button:hover {
  background-color: #067a97;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
}

.modal-content h2 {
  margin: 0 0 20px 0;
  font-size: 22px;
  color: #333;
  border-bottom: 2px solid #1194AE;
  padding-bottom: 10px;
}

.close-button {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}

.close-button:hover {
  color: #333;
}

.modal-content select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

/* 表格样式 */
.book_table, .category_table, .lend_table, .user_table, .announcement_table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px; /* 调整字体大小 */
}

.book_table th, .book_table td,
.category_table th, .category_table td,
.lend_table th, .lend_table td,
.user_table th, .user_table td,
.announcement_table th, .announcement_table td {
  padding: 12px 10px;
  border: 1px solid #e0e0e0;
  text-align: center;
  font-size: 13px;
}

.book_table th,
.category_table th,
.lend_table th,
.user_table th,
.announcement_table th {
  background-color: #eef2f4;
  color: black;
  font-weight: 600;
  font-size: 15px;
  padding: 16px 12px;
}
.book-cover {
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
}

/* 按钮样式 */
/* 编辑按钮 - 蓝色 */
.edit-button, .edit-category, .edit-user, .edit-announcement {
  background-color: #2196F3; /* 蓝色 */
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  min-width: 60px;
}
.edit-button:hover, .edit-category:hover, .edit-user:hover, .edit-announcement:hover {
  background-color: #1976D2;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(33, 150, 243, 0.3);
}

/* 删除按钮 - 红色 */
.delete-button, .delete-category, .delete-user, .delete-announcement {
  background-color: #f44336; /* 红色 */
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  min-width: 60px;
}

.delete-button:hover, .delete-category:hover, .delete-user:hover, .delete-announcement:hover {
  background-color: #d32f2f;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(244, 67, 54, 0.3);
}

/* 借阅操作按钮 - 绿色 */
.lend-action, .return-action, .confirm-action {
  background-color: #4CAF50; /* 绿色 */
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  min-width: 60px;
}

.lend-action:hover, .return-action:hover, .confirm-action:hover {
  background-color: #388E3C;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
}

/* 重置密码按钮 - 橙色 */
.reset-password {
  background-color: #FF9800; /* 橙色 */
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  min-width: 80px;
}

.reset-password:hover {
  background-color: #F57C00;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(255, 152, 0, 0.3);
}

/* 发布/取消发布按钮 - 紫色 */
.publish-button {
  background-color: #9C27B0; /* 紫色 */
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  min-width: 80px;
}

.publish-button:hover {
  background-color: #7B1FA2;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(156, 39, 176, 0.3);
}

.unpublish-button {
  background-color: #795548; /* 棕色 */
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  min-width: 80px;
}

.unpublish-button:hover {
  background-color: #5D4037;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(121, 85, 72, 0.3);
}

/* 查看详情按钮 - 青色 */
.view-details {
  background-color: #00BCD4; /* 青色 */
  color: white;
  border: none;
  padding: 8px 16px;
  margin: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  min-width: 80px;
}

.view-details:hover {
  background-color: #0097A7;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 188, 212, 0.3);
}

/* 新增按钮 - 使用主题色 */
.addBookModal, .addCategoryButton, .addUserModal, .addAnnouncementButton {
  background-color: #1194AE; /* 主题色 */
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  min-width: 120px;
}

.addBookModal:hover, .addCategoryButton:hover, .addUserModal:hover, .addAnnouncementButton:hover {
  background-color: #067a97;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

/* 搜索按钮 */
.search-button,.bulkUploadButton,
.downloadUserTemplateButton, .downloadTemplateButton  {
  background-color: #1194AE; /* 主题色 */
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  min-width: 100px;
}

.search-button:hover,.bulkUploadButton:hover,
.downloadUserTemplateButton:hover, .downloadTemplateButton:hover {
  background-color: #067a97;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}
/* 禁用状态按钮 */
button:disabled {
  background-color: #cccccc !important;
  color: #666666 !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

button:disabled:hover {
  background-color: #cccccc !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 分页样式 */
.pagination {
  margin-top: 30px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.pagination button {
  margin: 0 3px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
  min-width: 40px;
}

.pagination button:hover:not(:disabled) {
  background-color: #f5f5f5;
  border-color: #1194AE;
}

.pagination button.active {
  background-color: #1194AE;
  color: white;
  border-color: #1194AE;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background-color: #f5f5f5;
}

.total-pages {
  font-size: 14px;
  color: #666;
  margin-right: 15px;
}

/* 搜索栏样式 */
.search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.search-select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
  flex: 1;
  max-width: 300px;
  background-color: white;
  cursor: pointer;
  appearance: none; /* 移除默认箭头 */
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

.search-input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
  flex: 1;
  max-width: 300px;
  flex: 2;
  max-width: 400px;
}

.search-select:focus, .search-input:focus {
  outline: none;
  border-color: #1194AE;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}
.search-select:hover {
  border-color: #999;
}
.search-select option {
  padding: 8px;
  background: white;
  color: #333;
}

/* 统一的状态样式 - 可用于所有页面 */
.status-published, .status-active, .status-available {
  color: #52c41a;
  background: #f6ffed;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #b7eb8f;
}

.status-draft, .status-inactive, .status-unavailable {
  color: #faad14;
  background: #fffbe6;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #ffe58f;
}
/* 主页数据可视化样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.book-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.announcement-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.lend-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.stat-info p {
  margin: 5px 0 0;
  color: #666;
  font-size: 14px;
}

.charts-container {
  margin-bottom: 30px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-row .chart-card:first-child {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-row .chart-card:first-child h3 {
  width: 120%;
}

.chart-row .chart-card:first-child .chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}


.chart-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.chart-card h3 {
  margin: 0 0 15px;
  font-size: 18px;
  color: #333;
  text-align: center;
}

.chart-wrapper {
  position: relative;
  height: 250px;
  width: 100%;
}

.quick-actions {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.quick-actions h3 {
  margin: 0 0 15px;
  font-size: 18px;
  color: #333;
  text-align: center;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1194AE;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 20px 15px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
  font-weight: 600;
}

.action-btn:hover {
  background: #067a97;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.action-btn i {
  font-size: 24px;
  margin-bottom: 8px;
}

/* 意见建议页面样式 */
.page-title {
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
  text-align: center;
}

.feedback_table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feedback_table th,
.feedback_table td {
  padding: 12px 10px;
  border: 1px solid #e0e0e0;
  text-align: center;
  font-size: 13px;
}

.feedback_table th {
  background-color: #eef2f4;
  color: black;
  font-weight: 600;
  font-size: 15px;
  padding: 16px 12px;
}

.feedback-content-cell {
  max-width: 200px;
}

.content-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* 反馈详情样式 */
.feedback-detail {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item label {
  font-weight: 600;
  color: #333;
  min-width: 100px;
  margin-right: 10px;
}

.feedback-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

/* 回复信息样式 */
.reply-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.reply-info .info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.reply-info .info-item:last-child {
  margin-bottom: 0;
}

.reply-info label {
  font-weight: 600;
  color: #333;
  min-width: 120px;
  margin-right: 10px;
}

.reply-info span {
  color: #666;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
  
  #sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
  }
  
  #sidebar .nav {
    display: flex;
    overflow-x: auto;
  }
  
  #sidebar .nav li {
    flex-shrink: 0;
    border-bottom: none;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  #sidebar .nav li a span {
    display: none;
  }
  
  #sidebar .nav li a i {
    margin-right: 0;
    font-size: 20px;
  }
  
  #content {
    padding: 15px;
  }
}
/* 批量上传样式 */
.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #1194AE;
}

.upload-content {
  padding: 20px;
}

.upload-icon {
  font-size: 48px;
  color: #1194AE;
  margin-bottom: 15px;
}

.file-types {
  color: #666;
  font-size: 14px;
  margin: 10px 0;
}

.selected-file {

  font-weight: bold;
  margin-top: 10px;
}

.upload-info {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.upload-info ul {
  padding-left: 20px;
  margin: 10px 0;
}

.upload-info li {
  margin-bottom: 5px;
}

/* 可视化借阅--添加刷新按钮样式 */
.refresh-button {
  background-color: #1194AE;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  margin-left: 10px;
}

.refresh-button:hover {
  background-color: #067a97;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

</style>
