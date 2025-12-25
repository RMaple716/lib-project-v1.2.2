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
            <li class="has-submenu">
              <a href="#" @click.prevent="toggleUserMenu">
                <i class="fas fa-users"></i>
                <span>用户管理</span>
              </a>
              <ul class="sub-menu" :class="{ show: showUserSubMenu }">
                <li>
                  <a href="#" @click.stop.prevent="changePage('user_reader')">
                    <i class="fas fa-user-graduate"></i>
                    <span>读者管理</span>
                  </a>
                </li>
                <li>
                  <a href="#" @click.stop.prevent="changePage('user_admin')">
                    <i class="fas fa-user-cog"></i>
                    <span>管理员管理</span>
                  </a>
                </li>
                <li>
                  <a href="#" @click.stop.prevent="changePage('role_management')">
                    <i class="fas fa-user-tag"></i>
                    <span>角色管理</span>
                  </a>
                </li>               
              </ul>
            </li>
            <li>
              <a href="#" @click.prevent="changePage('booktype_admin')">
                <i class="fas fa-tags"></i>
                <span>分类管理</span>
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
                <span>消息管理</span>
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
                  <button class="action-btn" @click="changePage('feedback_admin')">
                    <i class="fas fa-comments"></i>
                    <span>消息管理</span>
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
                    <label for="totalQuantity">馆藏数量：</label>
                    <input type="number" id="totalQuantity" v-model="bookForm.totalQuantity" placeholder="请输入馆藏数量">
                    <label for="availableQuantity">可借副本：</label>
                    <input type="number" id="availableQuantity" v-model="bookForm.availableQuantity" placeholder="请输入可借副本数量">
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
                        <li>学生模板支持直接导入学院、专业和班级信息</li>  <!-- 添加说明 -->
                        <li>系统会自动跳过已存在的账号</li>
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
                    <th>ISBN号</th>
                    <th>出版社</th>
                    <th>馆藏数量</th>
                    <th>可借副本</th>           
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="currentPageBooks.length === 0">
                    <td colspan="8">{{ filteredBooks.length === 0 ? '暂无图书数据' : '没有找到相关图书' }}</td>
                  </tr>
                  <tr v-for="book in currentPageBooks" :key="book._bid">
                    <td>{{ book._bid }}</td>
                    <td>{{ book._type_name}}</td>
                    <td>{{ book._book_name }}</td>
                    <td>{{ book._isbn }}</td>
                    <td>{{ book._press }}</td>
                    <td>{{ book._total_copies }}</td>
                    <td>{{ book._available_copies !== undefined ? book._available_copies : 'N/A' }}</td>
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

        
            <!-- 读者管理 -->
            <div v-show="currentPage === 'user_reader'" class="page">
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
                    <th>所属单位</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="currentPageUsers.length === 0">
                    <td colspan="8">{{ filteredUsers.length === 0 ? '暂无用户数据' : '没有找到相关用户' }}</td>
                  </tr>
                  <tr v-for="user in currentPageUsers" :key="user._uid">
                    <td>{{ user._uid }}</td>
                    <td>{{ user._account || '-' }}</td>
                    <td>{{ user._name }}</td>
                    <td>{{ user._email }}</td>
                    <td>{{ getUserTypeText(user._utype) }}</td>
                    <td>
                      <!-- 根据用户类型显示不同的信息 -->
                      <span v-if="user._utype === 'student' && user.class && user.class._cname">{{ user.class._cname }}</span>
                      <span v-else-if="user._utype === 'teacher' && user.department && user.department._dname">{{ user.department._dname }}</span>
                      <span v-else-if="user._utype === 'tempworker' && user.workDepartment && user.workDepartment._wdname">{{ user.workDepartment._wdname }}</span>
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

             <!-- 管理员管理页面 -->
            <div v-show="currentPage === 'user_admin'" class="page">
              <form class="search-form">
                <select id="adminSearchType" class="search-select" v-model="adminSearchType">
                  <option value="_uid">管理员ID</option>
                  <option value="_account">账号</option>
                  <option value="_name">用户名</option>
                </select>
                <input 
                  type="text" 
                  id="adminSearchInput" 
                  class="search-input" 
                  placeholder="请输入查询内容" 
                  v-model="adminSearchKeyword"
                >
                <button type="button" class="search-button" @click="handleAdminSearch">
                  <i class="fas fa-search"></i> 查询
                </button>
                <button type="button" class="reset-button" @click="handleAdminReset">
                  <i class="fas fa-sync"></i> 重置
                </button>
                <button type="button" class="addAdminModal" @click="showAddAdminModal">添加管理员</button>
              </form>


              <!-- 添加/编辑管理员弹窗 -->
              <div id="addAdminModal" class="modal" v-if="showAddAdminModalFlag">
                <div class="modal-content">
                  <span class="close-button" @click="closeAddAdminModal">&times;</span>
                  <h2>{{ isEditAdmin ? '编辑管理员' : '添加管理员' }}</h2>
                  <form @submit.prevent="submitAdminForm">
                    <label for="adminAccount">账号：</label>
                    <input type="text" id="adminAccount" v-model="adminForm.account" :placeholder="isEditAdmin ? '请输入账号' : '请输入账号'" required>

                    <label for="adminName">姓名：</label>
                    <input type="text" id="adminName" v-model="adminForm.name" :placeholder="isEditAdmin ? '请输入姓名' : '请输入姓名'" required>

                    <label for="adminPassword">密码：</label>
                    <input type="password" id="adminPassword" v-model="adminForm.password" :placeholder="isEditAdmin ? '留空则不修改密码' : '请输入密码'" :required="!isEditAdmin">

                    <label for="adminEmail">邮箱：</label>
                    <input type="email" id="adminEmail" v-model="adminForm.email" placeholder="请输入邮箱" required>
                    
                    <label for="adminType">管理员类型：</label>
                    <select id="adminType" v-model="adminForm.userType">
                      <option value="admin_t">终端管理员</option>
                      <option value="admin_n">普通管理员</option>
                    </select>

                    <button type="submit" class="submit-button">提交</button>
                  </form>
                </div>
              </div>

              <!-- 分配角色弹窗 -->
              <div id="assignRoleModal" class="modal" v-if="showAssignRoleModalFlag">
                <div class="modal-content large">
                  <span class="close-button" @click="closeAssignRoleModal">&times;</span>
                  <h2>为 "{{ currentAssignAdminName }}" 分配角色</h2>
                  <form @submit.prevent="submitRoleAssignment">
                    <div class="role-selection">
                      <!-- 使用表格形式展示角色列表 -->
                      <table class="role-table">
                        <thead>
                          <tr>
                            <th width="5%">选择</th>
                            <th width="15%">角色编码</th>
                            <th width="20%">角色名称</th>
                            <th width="40%">角色描述</th>
                            <th width="20%">权限数量</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="role in roles" :key="role._rid">
                            <td>
                              <input 
                                type="checkbox" 
                                :value="role._rid"
                                v-model="selectedRoleIds"
                              />
                            </td>
                            <td>{{ role._rcode }}</td>
                            <td>{{ role._rname }}</td>
                            <td>{{ role._rdesc || '-' }}</td>
                            <td>{{ role.permissions ? role.permissions.length : 0 }} 个权限</td>
                          </tr>
                          <tr v-if="roles.length === 0">
                            <td colspan="5" class="no-data">暂无角色数据</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div class="modal-buttons">
                      <button type="button" class="cancel-button" @click="closeAssignRoleModal">取消</button>
                      <button type="submit" class="submit-button">保存分配</button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- 管理员表格 -->
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>账号</th>
                      <th>用户名</th>
                      <th>管理员类型</th>
                      <th>角色</th>
                      <th>邮箱</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="admin in currentPageAdmins" :key="admin._uid">
                      <td>{{ admin._uid }}</td>
                      <td>{{ admin._account }}</td>
                      <td>{{ admin._name }}</td>
                      <td>
                        <span :class="'type-' + admin._utype">
                          {{ getAdminTypeText(admin._utype) }}
                        </span>
                      </td>
                      <td>
                        <div v-if="admin.roles && admin.roles.length > 0">
                          <span 
                            v-for="role in admin.roles" 
                            :key="role._rid"
                            class="role-tag"
                          >
                            {{ role._rname }}
                          </span>
                        </div>
                        <div v-else>-</div>
                      </td>
                      <td>{{ admin._email }}</td>
                      <td>{{ formatDate(admin._create_time) }}</td>
                      <td>
                        <button class="edit-button" @click="editAdmin(admin)">
                          <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="assign-role-button" @click="showAssignRoleModal(admin)" v-if="admin._utype === 'admin_n'">
                          <i class="fas fa-user-tag"></i> 分配角色
                        </button>
                        <button class="delete-button" @click="deleteAdmin(admin._uid)">
                          <i class="fas fa-trash"></i> 删除
                        </button>
                      </td>
                    </tr>
                    <tr v-if="filteredAdmins.length === 0">
                      <td colspan="8" class="no-data">暂无管理员数据</td>
                    </tr>
                  </tbody>
                </table>
              </div>


              <!-- 分页控件 -->
              <div class="pagination" v-if="totalAdminPages > 1">
                <button 
                  class="page-button" 
                  :disabled="adminCurrentPage === 1" 
                  @click="changeAdminPage(adminCurrentPage - 1)"
                >
                  <i class="fas fa-chevron-left"></i> 上一页
                </button>
                
                <button 
                  v-for="page in visibleAdminPages"
                  :key="page"
                  class="page-button" 
                  :class="{ active: adminCurrentPage === page }"
                  @click="changeAdminPage(page)"
                >
                  {{ page }}
                </button>
                
                <button 
                  class="page-button" 
                  :disabled="adminCurrentPage === totalAdminPages" 
                  @click="changeAdminPage(adminCurrentPage + 1)"
                >
                  下一页 <i class="fas fa-chevron-right"></i>
                </button>
                
                <span class="page-info">
                  第 {{ adminCurrentPage }} 页，共 {{ totalAdminPages }} 页
                </span>
              </div>
            </div>

            <!-- 角色管理页面 -->
            <div v-show="currentPage === 'role_management'" class="page">
              
              <!-- 搜索和操作区域 -->
              <form class="search-form">
                <select id="roleSearchType" class="search-select" v-model="roleSearchType">
                  <option value="_name">角色名称</option>
                  <option value="_code">角色代码</option>
                  <option value="_desc">角色描述</option>
                </select>
                <input 
                  type="text" 
                  id="roleSearchInput" 
                  class="search-input" 
                  placeholder="请输入查询内容" 
                  v-model="roleSearchKeyword"
                >
                <button type="button" class="search-button" @click="handleRoleSearch">
                  <i class="fas fa-search"></i> 查询
                </button>
                <button type="button" class="reset-button" @click="handleRoleReset">
                  <i class="fas fa-sync"></i> 重置
                </button>
                <button type="button" class="addRoleModal" @click="showAddRoleModal">添加角色</button>
              </form>

              <!-- 添加/编辑角色弹窗 -->
              <div id="addRoleModal" class="modal" v-if="showAddRoleModalFlag">
                <div class="modal-content large">
                  <span class="close-button" @click="closeAddRoleModal">&times;</span>
                  <h2>{{ isEditRole ? '编辑角色' : '添加角色' }}</h2>
                  <form @submit.prevent="submitRoleForm">
                    <div class="form-group">
                      <label for="roleName">角色名称 *</label>
                      <input 
                        type="text" 
                        id="roleName" 
                        v-model="roleForm.roleName" 
                        placeholder="请输入角色名称"
                        required
                      />
                    </div>
                    
                    <div class="form-group">
                      <label for="roleCode">角色代码 *</label>
                      <input 
                        type="text" 
                        id="roleCode" 
                        v-model="roleForm.roleCode" 
                        placeholder="请输入角色代码"
                        required
                      />
                    </div>
                    
                    <div class="form-group">
                      <label for="roleDesc">角色描述</label>
                      <textarea 
                        id="roleDesc" 
                        v-model="roleForm.roleDesc" 
                        placeholder="请输入角色描述"
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <div class="form-group">
                      <label>权限分配</label>
                      <div class="permission-list">
                        <div 
                          v-for="permission in permissions" 
                          :key="permission._pid" 
                          class="permission-item"
                        >
                          <label class="checkbox-label">
                            <input 
                              type="checkbox" 
                              :value="permission._pid"
                              v-model="roleForm.permissionIds"
                            />
                            <span class="permission-name">{{ permission._pname }}</span>
                            <span class="permission-code">({{ permission._pcode }})</span>
                            <span class="permission-desc">{{ permission._pdesc }}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div class="modal-buttons">
                      <button type="button" class="cancel-button" @click="closeAddRoleModal">取消</button>
                      <button type="submit" class="submit-button">{{ isEditRole ? '更新' : '添加' }}</button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- 角色表格 -->
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>角色名称</th>
                      <th>角色代码</th>
                      <th>角色描述</th>
                      <th>权限数量</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="role in currentPageRoles" :key="role._id">
                      <td>{{ role._rid }}</td>
                      <td>{{ role._rname }}</td>
                      <td>{{ role._rcode }}</td>
                      <td>{{ role._rdesc }}</td>
                      <td>{{ role.permissions ? role.permissions.length : 0 }}</td>
                      <td>{{ formatDate(role._create_time) }}</td>
                      <td>
                        <button class="edit-button" @click="editRole(role)">
                          <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="delete-button" @click="deleteRole(role._id)">
                          <i class="fas fa-trash"></i> 删除
                        </button>
                      </td>
                    </tr>
                    <tr v-if="filteredRoles.length === 0">
                      <td colspan="7" class="no-data">暂无角色数据</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 分页控件 -->
              <div class="pagination" v-if="totalRolePages > 1">
                <button 
                  class="page-button" 
                  :disabled="roleCurrentPage === 1" 
                  @click="changeRolePage(roleCurrentPage - 1)"
                >
                  <i class="fas fa-chevron-left"></i> 上一页
                </button>
                
                <button 
                  v-for="page in visibleRolePages"
                  :key="page"
                  class="page-button" 
                  :class="{ active: roleCurrentPage === page }"
                  @click="changeRolePage(page)"
                >
                  {{ page }}
                </button>
                
                <button 
                  class="page-button" 
                  :disabled="roleCurrentPage === totalRolePages" 
                  @click="changeRolePage(roleCurrentPage + 1)"
                >
                  下一页 <i class="fas fa-chevron-right"></i>
                </button>
                
                <span class="page-info">
                  第 {{ roleCurrentPage }} 页，共 {{ totalRolePages }} 页
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
                    <td>{{ formatDate(lend._end_date) }}</td>
                    <td>{{ getLendStatusText(lend._status) }}</td>
                    <td>
                      <button 
                        class="lend-action delay-btn" 
                        @click="delayLend(lend._hid, lend._end_date)"
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
                  <h2>图书续借</h2>
                  <form @submit.prevent="submitDelay">
                    <p>确认要为此借阅记录办理续借手续吗？</p>
                    <p>当前归还日期：{{ formatDate(currentDelayEndDate) }}</p>
                    <p>预计新归还日期：{{ newReturnDate }}</p>
                    <p>系统将在原归还日期基础上自动延长30天。</p>
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

            <!-- 搜索表单 -->
            <form class="search-form">
              <select id="feedbackSearchType" class="search-select" v-model="feedbackSearchType">
                <option value="_fid">反馈ID</option>
                <option value="_uid">用户ID</option>
                <option value="_email">读者邮箱</option>
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
                  <th>读者姓名</th>
                  <th>反馈类型</th>
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
                  <td>{{ feedback._name }}</td>
                  <td>{{ feedback._type || '未分类' }}</td>
                  <td class="feedback-content-cell">
                    <div class="content-preview">{{ getContentPreview(getFeedbackContentOnly(feedback._content)) }}</div>
                  </td>
                  <td>{{ formatDate(feedback._create_time) }}</td>
                  <td>
                    <span :class="feedback._status === 1 ? 'status-published' : 'status-draft'">
                      {{ feedback._status === 1 ? '已处理' : '待处理' }}
                    </span>
                  </td>
                  <td>
                    <button 
                      @click="viewFeedbackDetail(feedback)" 
                      class="action-button view-button"
                    >
                      查看
                    </button>
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

          <!-- 反馈详情模态框 -->
          <div v-if="showFeedbackDetailModal" class="feedback-detail-modal">
            <div class="feedback-detail-modal-content">
              <span class="feedback-detail-close" @click="closeFeedbackDetailModal">&times;</span>
              <h3>反馈详情</h3>
              <div class="detail-item">
                <label>反馈ID：</label>
                <span>{{ currentFeedback._fid }}</span>
              </div>
              <div class="detail-item">
                <label>读者姓名：</label>
                <span>{{ currentFeedback._name }}</span>
              </div>
              <div class="detail-item">
                <label>反馈内容：</label>
                <div class="feedback-content">{{ getFeedbackContentOnly(currentFeedback._content) }}</div>
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

              <!-- 显示回复 -->
              <div v-if="currentFeedback.replies && currentFeedback.replies.length > 0">
                <h3 style="margin-top: 20px;">管理员回复</h3>
                <table class="feedback_table">
                  <thead>
                    <tr>
                      <th>回复ID</th>
                      <th>回复内容</th>
                      <th>回复时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="reply in currentFeedback.replies" :key="reply._mid">
                      <td>{{ reply._mid }}</td>
                      <td class="feedback-content-cell">
                        <div class="content-preview">{{ reply._content }}</div>
                      </td>
                      <td>{{ formatDate(reply._create_time) }}</td>
                      <td>
                        <button 
                          @click="editReply(reply)" 
                          class="action-button edit-button"
                        >
                          修改
                        </button>
                        <button 
                          @click="deleteReply(reply._mid)" 
                          class="action-button delete-button"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 回复表单 -->
              <form v-if="currentFeedback._status !== 1" class="reply-form" @submit.prevent="submitReply">
                <h3>回复反馈</h3>
                <div class="form-group">
                  <label for="replySubject">回复主题：</label>
                  <input 
                    type="text" 
                    id="replySubject" 
                    v-model="replyForm.subject" 
                    placeholder="回复主题"
                  >
                </div>
                <div class="form-group">
                  <label for="replyContent">回复内容：</label>
                  <textarea 
                    id="replyContent" 
                    v-model="replyForm.content" 
                    placeholder="请输入回复内容"
                  ></textarea>
                </div>
                <div class="modal-buttons">
                  <button type="button" class="cancel-button" @click="closeReplyFeedbackModal">取消</button>
                  <button type="submit" class="submit-button">发送回复</button>
                </div>
              </form>
            </div>
          </div>

          <!-- 回复反馈弹窗 -->
          <div v-if="showReplyFeedbackModal" class="modal">
            <div class="modal-content">
              <span class="close" @click="closeReplyFeedbackModal">&times;</span>
              <h2>回复反馈</h2>
              <form @submit.prevent="submitReply">
                <div class="form-group">
                  <label for="replySubject">回复主题：</label>
                  <input 
                    type="text" 
                    id="replySubject" 
                    v-model="replyForm.subject" 
                    required
                  >
                </div>
                <div class="form-group">
                  <label for="replyContent">回复内容：</label>
                  <textarea 
                    id="replyContent" 
                    v-model="replyForm.content" 
                    required
                    placeholder="请输入回复内容"
                  ></textarea>
                </div>
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
        _create_time: '',
        roles: [],
        permissions: []
      },

      // 页面状态
      currentPage: 'home',
      showUserSubMenu: false, // 控制用户管理子菜单显示

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
      categoryRowsPerPage: 10,
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
      lendRowsPerPage: 10,
      lendSearchType: '_bid',
      lendSearchKeyword: '',
      filteredLends: [],
      showDelayModal: false,
      currentDelayHid: null,
      currentDelayEndDate: null, // 添加当前归还日期
      newReturnDate: '',

      // 用户管理相关
      users: [],
      filteredUsers: [],
      userCurrentPage: 1,
      userRowsPerPage: 10,
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

        
      // 管理员管理相关
      admins: [],
      filteredAdmins: [],
      adminCurrentPage: 1,
      adminRowsPerPage: 10,
      adminSearchType: '_username',
      adminSearchKeyword: '',
      showAddAdminModalFlag: false,
      isEditAdmin: false,
      currentEditAdminId: null,
      adminForm: {
        account: '',
        name: '',
        password: '',
        email: '',
        userType: 'admin_n'
      },
      
      // 角色和权限相关
      roles: [],
      permissions: [],
      showAssignRoleModalFlag: false,
      currentAssignAdminId: null,
      currentAssignAdminName: '',
      selectedRoleIds: [],

      // 角色管理相关
      showAddRoleModalFlag: false,
      isEditRole: false,
      currentEditRoleId: null,
      roleForm: {
        roleName: '',
        roleCode: '',
        roleDesc: '',
        permissionIds: []
      },
      roleCurrentPage: 1,
      roleRowsPerPage: 10,
      roleSearchType: '_rname',
      roleSearchKeyword: '',
      filteredRoles: [],

      // 公告管理相关
      announcements: [],
      announcementCurrentPage: 1,
      announcementRowsPerPage: 10,
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
      feedbackSearchType: '_fid',
      feedbackSearchKeyword: '',
      feedbacks: [],
      filteredFeedbacks: [],
      feedbackCurrentPage: 1,
      feedbackPageSize: 10,
      showFeedbackDetailModal: false,
      showReplyFeedbackModal: false,
      currentFeedback: {},
      currentReply: null, // 当前正在编辑的回复
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

    // 用户分页数据
    paginatedUsers() {
      // 只显示读者（学生和教师）
      const readers = this.filteredUsers.length > 0 ? 
        this.filteredUsers.filter(u => u._utype === 'student' || u._utype === 'teacher') : 
        this.users.filter(u => u._utype === 'student' || u._utype === 'teacher');
      
      const start = (this.userCurrentPage - 1) * this.userRowsPerPage;
      const end = start + this.userRowsPerPage;
      return readers.slice(start, end);
    },
    
   
    
    
    // 当前页用户数据
    currentPageUsers() {
      const dataSource = this.filteredUsers.length > 0 ? this.filteredUsers : this.users;
      const start = (this.userCurrentPage - 1) * this.userRowsPerPage;
      const end = start + this.userRowsPerPage;
      return dataSource.slice(start, end);
    },

    totalUserPages() {
      const totalUsers = (this.filteredUsers && this.filteredUsers.length > 0) ? this.filteredUsers.length : (this.users ? this.users.length : 0);
      return Math.max(1, Math.ceil(totalUsers / this.userRowsPerPage));
    },
    
    visibleUserPages() {
      return this.generateVisiblePages(this.userCurrentPage, this.totalUserPages);
    },
    
    // 当前页管理员数据
    currentPageAdmins() {
      const dataSource = (this.filteredAdmins && Array.isArray(this.filteredAdmins) && this.filteredAdmins.length > 0) 
        ? this.filteredAdmins 
        : (this.admins && Array.isArray(this.admins) ? this.admins : []);
      const start = (this.adminCurrentPage - 1) * this.adminRowsPerPage;
      const end = start + this.adminRowsPerPage;
      return Array.isArray(dataSource) ? dataSource.slice(start, end) : [];
    },

    // 管理员分页总数
    totalAdminPages() {
      const dataSource = (this.filteredAdmins && Array.isArray(this.filteredAdmins) && this.filteredAdmins.length > 0) 
        ? this.filteredAdmins 
        : (this.admins && Array.isArray(this.admins) ? this.admins : []);
      return Math.ceil((Array.isArray(dataSource) ? dataSource.length : 0) / this.adminRowsPerPage) || 1;
    },

    // 可见的管理员分页页码
    visibleAdminPages() {  
      const total = this.totalAdminPages;
      const current = this.adminCurrentPage;
      return this.generateVisiblePages(current, total);
    },

    // 角色分页计算
    totalRolePages() {
      const dataSource = (this.filteredRoles && Array.isArray(this.filteredRoles) && this.filteredRoles.length > 0) 
        ? this.filteredRoles 
        : (this.roles && Array.isArray(this.roles) ? this.roles : []);
      return Math.ceil((Array.isArray(dataSource) ? dataSource.length : 0) / this.roleRowsPerPage) || 1;
    },
    currentPageRoles() {
      const dataSource = (this.filteredRoles && Array.isArray(this.filteredRoles) && this.filteredRoles.length > 0) 
        ? this.filteredRoles 
        : (this.roles && Array.isArray(this.roles) ? this.roles : []);
      const start = (this.roleCurrentPage - 1) * this.roleRowsPerPage;
      const end = start + this.roleRowsPerPage;
      return Array.isArray(dataSource) ? dataSource.slice(start, end) : [];
    },
    visibleRolePages() {
      const total = this.totalRolePages;
      const current = this.roleCurrentPage;
      return this.generateVisiblePages(current, total);
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
      // 用户总数应包括普通用户和管理员
      return this.users.length + this.admins.length;
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
        this.fetchAdmins(),      // 获取管理员数据
        this.fetchRoles(),       // 获取角色数据
        this.fetchPermissions(), // 获取权限数据
        this.fetchAnnouncements(),
        this.loadFeedbacks()     // 加载消息列表
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

    // 添加用户类型变化处理函数
    onUserTypeChange() {
      // 清除之前可能填写的特定字段
      this.userForm.class = '';
      this.userForm.department = '';
      this.userForm.workDepartment = '';
    },
    
    // 控制用户管理子菜单显示
    toggleUserMenu() {
      this.showUserSubMenu = !this.showUserSubMenu;
    },
    
    // 页面切换方法
    changePage(page) {
      console.log('切换页面到:', page);
      this.currentPage = page;
      
      // 如果切换到用户相关的子页面，展开用户菜单
      if (page.startsWith('user_')) {
        this.showUserSubMenu = true;
      } else {
        // 如果切换到其他页面，可以考虑关闭用户子菜单（可选）
        // this.showUserSubMenu = false;
      }
      
      console.log("跳转页面：")
      // 当切换回主页时，重新渲染图表
      if (page === 'home') {
        this.$nextTick(() => {
          this.initCharts();
        });
      }

      // 当切换到消息管理页面时，加载消息列表
      if (page === 'feedback_admin') {
        this.loadFeedbacks();
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

      this.adminSearchKeyword = '';       // 管理员管理
      this.adminSearchType = '_username';
      this.adminCurrentPage = 1;
      this.filteredAdmins = [];

      this.roleSearchKeyword = '';        // 角色管理
      this.filteredRoles = [];
      this.roleCurrentPage = 1;
      
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
    getAdminTypeText(utype) {
      const typeMap = {
        'admin_t': '终端管理员',
        'admin_n': '普通管理员'
      };
      return typeMap[utype] || '未知类型';
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
      
      // 页面初始化时不主动触发图表更新，避免显示不必要的提示信息
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
            
            // 只有在用户主动操作时才显示"无数据"提示
            // 避免在初始化时显示不必要的提示
            if (dates.length === 0) {
              // 检查是否是用户主动触发的操作
              const isUserAction = document.activeElement === document.getElementById('startDate') || 
                                  document.activeElement === document.getElementById('endDate') ||
                                  (event && event.type === 'click' && event.target.classList.contains('refresh-button'));
              
              if (isUserAction) {
                this.$message.info('选定日期范围内暂无借阅数据');
              }
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
      if (this.borrowStatsChart) this.borrowStatsChart.destroy();

      // 初始化日期范围
      this.initDateRange();
      
       // 图书分类分布图
      this.$nextTick(() => {
        const bookCategoryCtx = document.getElementById('bookCategoryChart');
        if (bookCategoryCtx) {
          const ctx = bookCategoryCtx.getContext('2d');
          if (ctx) {
            this.bookCategoryChart = new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: this.getCategoryNames(),
                datasets: [{
                  data: this.getCategoryBookCounts(),
                  backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#8AC926',
                    '#1976D2',
                    '#E91E63',
                    '#00BCD4'
                  ],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      // 限制标签长度，过长的标签截断并加省略号
                      generateLabels: function(chart) {
                        const labels = chart.data.labels;
                        const data = chart.data.datasets[0].data;
                        
                        return labels.map((label, i) => {
                          // 限制标签长度，过长的标签截断并加省略号
                          let truncatedLabel = label;
                          if (label.length > 15) {
                            truncatedLabel = label.substring(0, 12) + '...';
                          }
                          
                          return {
                            text: truncatedLabel + ' (' + data[i] + ')',
                            fillStyle: chart.data.datasets[0].backgroundColor[i],
                            strokeStyle: chart.data.datasets[0].borderColor || '#000',
                            lineWidth: 1,
                            hidden: isNaN(data[i]) || data[i] === 0,
                            index: i
                          };
                        });
                      },
                      // 设置字体大小和间距
                      font: {
                        size: 11
                      },
                      padding: 15
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        return label + ': ' + value;
                      }
                    }
                  }
                },
                interaction: {
                  intersect: false,
                  mode: 'index'
                }
              }
            });
          }
        }
      
      // 借阅趋势图
        const lendTrendCtx = document.getElementById('lendTrendChart');
        if (lendTrendCtx) {
          const ctx = lendTrendCtx.getContext('2d');
          if (ctx) {
            this.lendTrendChart = new Chart(ctx, {
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
        }
      
      // 用户类型分布图
      const userTypeCtx = document.getElementById('userTypeChart');
      if (userTypeCtx) {
        const ctx = userTypeCtx.getContext('2d');
        if (ctx) {
          this.userTypeChart = new Chart(ctx, {
            type: 'pie',
            data: {
              labels: ['学生', '教师', '管理员', '临时工'],
              datasets: [{
                data: this.getUserTypeCounts(),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8AC926'],
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
      } 

      // 创建借阅统计图表
        this.createBorrowStatsChart();
      });
      
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
      const tempWorkerCount = this.users.filter(u => u._utype === 'tempworker').length;
      
      // 将所有管理员归为一类
      const adminCount = this.admins.length;

      return [studentCount, teacherCount, adminCount, tempWorkerCount];
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
    
        //  使用专门的接口获取当前用户信息
        const response = await fetch(`/api/auth/current-user`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const adminInfo = result.data;
            this.currentAdmin = {
              _uid: adminInfo._uid || tokenData._uid || '',
              _username: adminInfo._account || tokenData._account || '',
              _name: adminInfo._name || tokenData._name || '',
              _type: this.mapAdminType(adminInfo._utype || tokenData._utype),
              _email: adminInfo._email || '',
              _create_time: adminInfo._create_time || '',
              roles: adminInfo.roles || []
            };

            // 提取权限代码
            if (adminInfo.roles && Array.isArray(adminInfo.roles)) {
              const permissions = new Set();
              adminInfo.roles.forEach(role => {
                if (role.permissions && Array.isArray(role.permissions)) {
                  role.permissions.forEach(permission => {
                    permissions.add(permission._pcode);
                  });
                }
              });
              this.currentAdmin.permissions = Array.from(permissions);
            }
          } else {
            // 如果获取不到管理员信息，则使用token中的基本数据
            this.currentAdmin = {
              _uid: tokenData._uid || '',
              _username: tokenData._account || '',
              _name: tokenData._name || '',
              _type: this.mapAdminType(tokenData._utype),
              _email: '',
              _create_time: '',
              roles: [],
              permissions: []
            };
          }
        } else if (response.status === 401) {
          this.performLogout();
        }
      } catch (error) {
        console.error('获取管理员信息失败:', error);
        // 出错时仍然使用token中的基本数据
        try {
          const token = localStorage.getItem('token');
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const tokenData = JSON.parse(jsonPayload);
          
          this.currentAdmin = {
            _uid: tokenData._uid || '',
            _username: tokenData._account || '',
            _name: tokenData._name || '',
            _type: this.mapAdminType(tokenData._utype),
            _email: '',
            _create_time: '',
            roles: [],
            permissions: []
          };
        } catch (e) {
          console.error('解析token失败:', e);
        }
      }
    },

      // 映射管理员类型
    mapAdminType(utype) {
      const typeMap = {
        'admin_t': 'admin_t',
        'admin_n': 'admin_n'
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
        totalQuantity: book._total_copies
      };
      this.showAddBookModalFlag = true;
    },
    
    async submitBookForm() {
      const { bookTitle, author, isbn, bookType, publisher, totalQuantity, coverUrl, availableQuantity } = this.bookForm;
      
      if (!bookTitle || !author || !isbn || !bookType || !publisher || totalQuantity === null || totalQuantity === undefined || totalQuantity === '') {
        this.$message.error('请填写完整的图书信息！');
        return;
      }

      // 添加验证：可借副本数量不能大于馆藏数量
      if (availableQuantity !== null && availableQuantity !== undefined && availableQuantity !== '') {
        if (Number(availableQuantity) > Number(totalQuantity)) {
          this.$message.error('可借副本数量不能大于馆藏数量！');
          return;
        }
      }
      
      const bookData = {
        _book_name: bookTitle,
        _author: author,
        _isbn: isbn,
        _tid: bookType,
        _press: publisher,
        _total_copies: Number(totalQuantity),
        _cover_url: coverUrl
      };

      // 如果可借副本数量不为空，则添加到请求数据中
      if (availableQuantity !== null && availableQuantity !== undefined && availableQuantity !== '') {
        bookData._available_copies = Number(availableQuantity);
      }
      
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
          
          this.$message.success('模板下载成功，请按照模板格式填写数据');
        } else {
          this.$message.error('模板下载失败');
        }
      } catch (error) {
        console.error('下载模板失败:', error);
        this.$message.error('模板下载失败: ' + error.message);
      }
    },

    // 提交批量上传 - 增强版本
    async submitBulkUpload() {
      if (!this.selectedFile) {
        this.$message.error('请选择要上传的文件');
        return;
      }

      // 检查文件扩展名
      const fileName = this.selectedFile.name.toLowerCase();
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValidExtension) {
        this.$message.error('请上传 CSV 或 Excel 文件');
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
        console.log('批量上传响应:', response.status, result);
        
        if (response.ok && result.success) {
          // 显示更详细的成功信息
          if (result.data && result.data.total === 0) {
            this.$message.warning('文件上传成功，但没有处理任何记录。请检查文件内容格式是否正确。');
            this.$message.info('请确保文件包含数据行，且列名与模板一致');
          } else {
            this.$message.success(`批量上传成功！共处理 ${result.data.total} 条记录，其中新增 ${result.data.inserted} 条，更新 ${result.data.updated} 条`);
          }
          this.closeBulkUploadModal();
          await this.fetchBooks(); // 重新加载图书列表

          // 如果响应中有更新的分类数据，直接使用它；否则重新获取分类列表
          if (result.data && result.data.categories) {
            this.categories = result.data.categories || [];
            this.filteredCategories = [];
          } else {
            await this.fetchCategories(); // 重新加载分类列表
          }
        } else {
          const errorMsg = result.message || '批量上传失败';
          this.$message.error(errorMsg);
          
          // 显示详细错误信息
          if (result.errors && result.errors.length > 0) {
            console.error('上传错误详情:', result.errors);
            this.$message.error(`详细错误: ${JSON.stringify(result.errors)}`);
          }
        }
      } catch (error) {
        console.error('批量上传失败:', error);
        
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          this.$message.error('网络连接失败，请检查服务器是否运行正常');
        } else {
          this.$message.error('批量上传失败: ' + error.message);
        }
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
      this.currentDelayHid = hid;
      this.currentDelayEndDate = endDate; // 添加当前归还日期
      // 默认延期一个月（30天）
      const newDate = new Date(endDate);
      newDate.setDate(newDate.getDate() + 30); // 修改为增加30天，而不是一个月
      this.newReturnDate = this.formatDate(newDate);
      this.showDelayModal = true;
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
      
      // 检查借阅状态
      if (lendRecord._status !== 0) {
        this.$message.error('只有状态为"借阅中"的记录才能续借');
        return;
      }

      // 检查是否是当前用户的记录
      const token = localStorage.getItem('token');
      if (!token) {
        this.$message.error('请先登录');
        return;
      }

      try {
        const res = await fetch(`/api/books/${hid}/renew`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const result = await res.json();
        if (res.status !== 200) {
          throw new Error(result.message || '续借失败');
        }
        
        this.$message.success(result.message || '图书续借成功');
      } catch (err) {
        console.error(err);
        this.$message.error(err.message || '续借失败');
      }
    },

    // 用户管理相关方法

    // 获取用户类型文本
    getUserTypeText(utype) {
      const typeMap = {
        'student': '学生',
        'teacher': '教师',      
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
        console.log('用户数据响应:', result); // 添加调试日志
        if (res.status === 200) {
          this.users = result.data?.readerlist || result.data || [];
          this.filteredUsers = [];
          console.log('用户数据:', this.users); // 添加调试日志
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
        if (actualField === '_uid') {
          return String(user._uid).includes(keyword);
        }
        return user[actualField] && user[actualField].toLowerCase().includes(keyword.toLowerCase());
      });
    },
    // 用户分页方法
    changeUserPage(page) {
      const totalPages = this.totalUserPages;
      if (page >= 1 && page <= totalPages) {
        this.userCurrentPage = page;
      }
    },
    
    // 管理员分页切换
    changeAdminPage(page) {
      if (page < 1 || page > this.totalAdminPages) return;
      this.adminCurrentPage = page;
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
      const { account, name, password, email, userType, class: userClass, department, workDepartment } = this.userForm;
      
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

      // 根据用户类型添加特定字段
      if (userType === 'student' && userClass) {
        userData._cname = userClass;
      } else if (userType === 'teacher' && department) {
        userData._dname = department;
      } else if (userType === 'tempworker' && workDepartment) {
        userData._wdname = workDepartment;
      }

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
        this.$message.error(err.message || '添加用户失败');
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
      
      // 先获取用户信息，以获得正确的用户类型
      const user = this.users.find(u => u._uid === id);
      if (!user) {
        this.$message.error('未找到用户信息');
        return;
      }
      
      try {
         const res = await fetch('/api/auth/admin/reset-password', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            _uid: id
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
        this.$message.error('重置密码失败: ' + err.message)
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
            url = '/api/user-import/students/template';  // 学生模板已更新，支持学院、专业、班级
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

      const filename = this.selectedUserFile.name.toLowerCase();
      let uploadUrl = '';

      if (filename.includes('学生') || filename.includes('student')) {
        uploadUrl = '/api/user-import/students/optimized';  // 使用优化后的接口
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
            uploadUrl = '/api/user-import/students/optimized';  // 使用优化后的接口
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


    // 获取管理员列表
    async fetchAdmins() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$message.error('请先登录');
        return;
      }
      
      try {
        console.log('正在请求管理员列表...');
        const res = await fetch('/api/admins?includeRoles=true', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('管理员API响应状态:', res.status);
        console.log('管理员API响应头:', [...res.headers.entries()]);
        
        if (res.status === 401) {
          console.log('认证失败，token可能已过期');
          this.performLogout();
          return;
        }
        
        if (!res.ok) {
          console.log('API请求失败，状态码:', res.status);
          this.$message.error(`API请求失败，状态码: ${res.status}`);
          this.admins = [];
          this.filteredAdmins = [];
          return;
        }
        
        const result = await res.json();
        console.log('管理员API完整响应数据:', result);
        
        // 根据API文档，正确的响应格式应该是 { success: true, message: "...", data: { adminlist: [...] } }
        if (result && result.success && result.data && Array.isArray(result.data.adminlist)) {
          this.admins = result.data.adminlist;
          this.filteredAdmins = [...this.admins];
          console.log('成功获取管理员列表，数量:', this.admins.length);
        } else if (result && result.success && Array.isArray(result.data)) {
          // 备用方案：如果data本身就是数组
          this.admins = result.data;
          this.filteredAdmins = [...this.admins];
          console.log('成功获取管理员列表(备用方案)，数量:', this.admins.length);
        } else {
          console.log('API返回格式不正确或没有数据:', result);
          // 检查是否有错误信息
          if (result && result.message) {
            this.$message.error(result.message);
          } else {
            this.$message.error('获取管理员列表失败：响应格式不正确');
          }
          this.admins = [];
          this.filteredAdmins = [];
        }
      } catch (error) {
        console.error('获取管理员信息失败:', error);
        this.$message.error('网络错误，获取管理员列表失败: ' + error.message);
        this.admins = [];
        this.filteredAdmins = [];
      }
    },

    handleAdminSearch() {
      this.adminCurrentPage = 1;
      this.filteredAdmins = this.getAdminFilterData();
      if (this.filteredAdmins.length === 0) {
        this.$message.error("没有找到相关管理员");
      }
    },

    getAdminFilterData() {
      const typeMap = {
        '_uid': '_uid',
        '_account': '_account',
        '_name': '_name',
      };
      
      const actualField = typeMap[this.adminSearchType] || '_name';
      const keyword = this.adminSearchKeyword.trim().toLowerCase();

      if (!keyword) {
        return this.admins;
      }

      return this.admins.filter(admin => {
        if (actualField === '_uid') {
          return String(admin[actualField]).includes(keyword);
        } else {
          return admin[actualField] && admin[actualField].toLowerCase().includes(keyword);
        }
      });
    },

    // 重置管理员搜索
    handleAdminReset() {
      this.adminSearchKeyword = '';
      this.filteredAdmins = this.admins;
      this.adminCurrentPage = 1;
    },

    // 添加/编辑管理员模态框相关方法
    showAddAdminModal() {
      this.isEditAdmin = false;
      this.currentEditAdminId = null;
      this.adminForm = {
        account: '',
        name: '',
        password: '',
        email: '',
        userType: 'admin_n'
      };
      this.showAddAdminModalFlag = true;
    },

    closeAddAdminModal() {
      this.showAddAdminModalFlag = false;
      this.adminForm = {
        account: '',
        name: '',
        password: '',
        email: '',
        userType: 'admin_n'
      };
    },

    editAdmin(admin) {
      this.isEditAdmin = true;
      this.currentEditAdminId = admin._uid;
      this.adminForm = {
        account: admin._account,
        name: admin._name,
        password: '', // 编辑时不显示密码
        email: admin._email,
        userType: admin._utype
      };
      this.showAddAdminModalFlag = true;
    },

    async submitAdminForm() {
      const { account, name, password, email, userType } = this.adminForm;
      
      if (!account || !name || !email || !userType) {
        this.$message.error('请填写完整的管理员信息！');
        return;
      }

      if (!this.isEditAdmin && !password) {
        this.$message.error('请设置管理员密码！');
        return;
      }
      
      const adminData = {
        _account: account,
        _name: name,
        _email: email,
        _utype: userType
      };

      // 只在创建时或明确提供了密码时才传递密码
      if (password) {
        adminData._password = password;
      }

       try {
        let res;
        let apiEndpoint = '/api/admins';
        let apiMethod = 'POST';
        
        if (this.isEditAdmin) {
          // 更新管理员
          apiEndpoint = `/api/admins/${this.currentEditAdminId}`;
          apiMethod = 'PUT';
        }
        
        console.log('发送管理员请求:', apiMethod, apiEndpoint, adminData);
        
        res = await fetch(apiEndpoint, {
          method: apiMethod,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(adminData)
        });

        const result = await res.json();
        console.log('管理员API响应:', result);
        
        if (res.status === 200 || (result && result.success)) {
          this.$message.success(result.message || (this.isEditAdmin ? '更新' : '添加') + '管理员成功');
          this.closeAddAdminModal();
          // 关键：刷新管理员列表
          await this.fetchAdmins();
        } else {
          this.$message.error(result.message || (this.isEditAdmin ? '更新' : '添加') + '管理员失败');
        }
      } catch (err) {
        console.error(err);
        this.$message.error((this.isEditAdmin ? '更新' : '添加') + '管理员失败: ' + err.message);
      }
    },

    async deleteAdmin(id) {
      if (!confirm('确定要删除该管理员吗？')) return;
      
      try {
        const res = await fetch(`/api/admins/${id}`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await res.json();
        if (res.status === 200) {
          this.$message.success(result.message || '成功删除管理员信息');
          await this.fetchAdmins();
        } else {
          this.$message.error(result.message || '操作失败');
        }
      } catch (err) {
        console.error(err);
        this.$message.error('删除管理员失败');
      }
    },

   
   // 获取角色列表
    async fetchRoles() {
      try {
        const res = await fetch('/api/roles', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await res.json();
        if (res.status === 200) {
          this.roles = (result.data && Array.isArray(result.data)) ? result.data : [];
          this.filteredRoles = [...this.roles];
        } else {
          this.$message.error(result.message || '获取角色列表失败');
          this.roles = [];
          this.filteredRoles = [];
        }
      } catch (err) {
        console.error(err);
        this.$message.error('获取角色列表失败');
        this.roles = [];
        this.filteredRoles = [];
      }
    },

    // 获取权限列表
    async fetchPermissions() {
      try {
        const res = await fetch('/api/permissions', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await res.json();
        if (res.status === 200) {
          this.permissions = (result.data && Array.isArray(result.data)) ? result.data : [];
        } else {
          this.$message.error(result.message || '获取权限列表失败');
          this.permissions = [];
        }
      } catch (err) {
        console.error(err);
        this.$message.error('获取权限列表失败');
        this.permissions = [];
      }
    },

    // 显示添加角色弹窗
    showAddRoleModal() {
      this.isEditRole = false;
      this.currentEditRoleId = null;
      this.roleForm = {
        roleName: '',
        roleCode: '',
        roleDesc: '',
        permissionIds: []
      };
      this.showAddRoleModalFlag = true;
    },

    // 关闭添加角色弹窗
    closeAddRoleModal() {
      this.showAddRoleModalFlag = false;
    },

    // 编辑角色
    editRole(role) {
      this.isEditRole = true;
      this.currentEditRoleId = role._id || role.id || role._rid;
      this.roleForm = {
        roleName: role._rname,
        roleCode: role._rcode,
        roleDesc: role._rdesc,
        permissionIds: role.permissions ? role.permissions.map(p => p._pid) : []
      };
      this.showAddRoleModalFlag = true;
    },

    // 提交角色表单
    async submitRoleForm() {
      const { roleName, roleCode, roleDesc, permissionIds } = this.roleForm;

      if (!roleName) {
        this.$message.error('请输入角色名称！');
        return;
      }

      if (!roleCode) {
        this.$message.error('请输入角色代码！');
        return;
      }

      try {
        if (this.isEditRole) {
          await this.editRoleApi(this.currentEditRoleId, {
            _rname: roleName,
            _rcode: roleCode,
            _rdesc: roleDesc,
            permissionIds: permissionIds
          });
        } else {
          await this.addRoleApi({
            _rname: roleName,
            _rcode: roleCode,
            _rdesc: roleDesc,
            permissionIds: permissionIds
          });
        }
        this.closeAddRoleModal();
        await this.fetchRoles();
      } catch (err) {
        console.error(err);
        this.$message.error('操作失败');
      }
    },

    // 添加角色API
    async addRoleApi(roleData) {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(roleData)
      });
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || '添加角色失败');
      }
      this.$message.success(result.message || '添加角色成功');
    },

    // 编辑角色API
    async editRoleApi(id, roleData) {

      // 检查ID是否有效
      if (!id) {
        throw new Error('角色ID无效');
      }

      const res = await fetch(`/api/roles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(roleData)
      });
      const result = await res.json();
      if (res.status !== 200) {
        throw new Error(result.message || '编辑角色失败');
      }
      this.$message.success(result.message || '编辑角色成功');
    },

    // 删除角色
    async deleteRole(id) {

      // 检查ID是否有效
      const roleId = id || this.currentEditRoleId;

      if (!confirm('确定要删除该角色吗？')) return;

      try {
        const res = await fetch(`/api/roles/${roleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await res.json();
        if (res.status === 200) {
          this.$message.success(result.message || '删除角色成功');
          await this.fetchRoles();
        } else {
          this.$message.error(result.message || '删除角色失败');
        }
      } catch (err) {
        console.error(err);
        this.$message.error('删除角色失败');
      }
    },

    // 角色搜索方法
    handleRoleSearch() {
      this.roleCurrentPage = 1;
      const keyword = this.roleSearchKeyword.trim().toLowerCase();
      
      if (!keyword) {
        this.filteredRoles = this.roles;
        return;
      }
      
      this.filteredRoles = this.roles.filter(role => {
        return (
          (role._rname && role._rname.toLowerCase().includes(keyword)) ||
          (role._rcode && role._rcode.toLowerCase().includes(keyword)) ||
          (role._rdesc && role._rdesc.toLowerCase().includes(keyword))
        );
      });
    },

    // 重置角色搜索
    handleRoleReset() {
      this.roleSearchKeyword = '';
      this.filteredRoles = this.roles;
      this.roleCurrentPage = 1;
    },

    // 切换角色页面
    changeRolePage(page) {
      if (page < 1 || page > this.totalRolePages) return;
      this.roleCurrentPage = page;
    },

    // 为用户分配角色的方法
    async assignRolesToUser(userId, roleIds) {
      try {
        console.log('准备分配角色:', { userId, roleIds }); // 添加调试日志
        // 确保 roleIds 是数组且不为空
        if (!Array.isArray(roleIds)) {
          this.$message.error('角色ID格式错误');
          return false;
        }
        
        if (roleIds.length === 0) {
          this.$message.warning('未选择任何角色');
          // 如果要清空角色，也应该发送空数组而不是不发送
          // 这里我们允许发送空数组来清空角色
        }
        const response = await fetch(`/api/user-roles/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ roleIds }) // 确保参数名称正确
        });
        
        const result = await response.json();
        console.log('API响应:', result); // 添加响应日志
        
        if (response.ok) {
          this.$message.success('角色分配成功');
          return true;
        } else {
          this.$message.error(result.message || '角色分配失败');
          return false;
        }
      } catch (error) {
        console.error('网络错误:', error);
        this.$message.error('网络错误: ' + error.message);
        return false;
      }
    },

    // 授权普通管理员的方法
    async grantAdminPermission(userId) {
      try {
        const response = await fetch('/api/admin-auth/grant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ userId })
        });
        
        const result = await response.json();
        if (response.ok) {
          this.$message.success('管理员授权成功');
          return true;
        } else {
          this.$message.error(result.message || '管理员授权失败');
          return false;
        }
      } catch (error) {
        this.$message.error('网络错误: ' + error.message);
        return false;
      }
    },

    // 显示分配角色模态框
    showAssignRoleModal(admin) {
      this.currentAssignAdminId = admin._uid;
      this.currentAssignAdminName = admin._name;
      // 获取该管理员当前拥有的角色
      this.selectedRoleIds = admin.roles ? admin.roles.map(role => role._rid) : [];
      this.showAssignRoleModalFlag = true;
    },

    // 关闭分配角色模态框
    closeAssignRoleModal() {
      this.showAssignRoleModalFlag = false;
      this.currentAssignAdminId = null;
      this.currentAssignAdminName = '';
      this.selectedRoleIds = [];
    },

    // 切换角色选择
    toggleRoleSelection(roleId) {
      const index = this.selectedRoleIds.indexOf(roleId);
      if (index > -1) {
        // 如果已经选中，则取消选择
        this.selectedRoleIds.splice(index, 1);
      } else {
        // 如果未选中，则添加选择
        this.selectedRoleIds.push(roleId);
      }
    },

    // 提交角色分配
    async submitRoleAssignment() {
      try {
        const res = await fetch(`/api/user-roles/${this.currentAssignAdminId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            roleIds: this.selectedRoleIds
          })
        });

        const result = await res.json();
        if (res.status === 200) {
          this.$message.success(result.message || '角色分配成功');
          this.closeAssignRoleModal();
          // 重新获取管理员列表以更新显示
          await this.fetchAdmins();
        } else {
          this.$message.error(result.message || '角色分配失败');
        }
      } catch (err) {
        console.error(err);
        this.$message.error('角色分配失败');
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
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/messages/${feedbackId}/read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          const result = await response.json();
          if (response.ok) {
            // 更新本地数据状态
            const index = this.feedbacks.findIndex(f => f._fid === feedbackId);
            if (index !== -1) {
              this.feedbacks[index]._status = 1;
              this.filteredFeedbacks = [...this.feedbacks]; // 更新过滤数据
            }
            this.$message.success('已标记为已处理');
          } else {
            this.$message.error(result.message || '操作失败');
          }
        } catch (error) {
          console.error('标记处理状态失败:', error);
          this.$message.error('操作失败，请重试');
        }
      },

      // 删除反馈 
      async deleteFeedback(feedbackId) {
        if (confirm('确定要删除这条反馈吗？')) {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/messages/${feedbackId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            const result = await response.json();
            if (response.ok) {
              // 从本地数据中移除 - computed会自动更新分页
              this.feedbacks = this.feedbacks.filter(f => f._fid !== feedbackId);
              this.filteredFeedbacks = this.filteredFeedbacks.filter(f => f._fid !== feedbackId);
              this.$message.success('删除成功');
            } else {
              this.$message.error(result.message || '删除失败');
            }
          } catch (error) {
            console.error('删除反馈失败:', error);
            this.$message.error('删除失败，请重试');
          }
        }
      },

      // 初始化意见建议数据
      async loadFeedbacks() {
        try {
          // 管理员获取所有类型为"意见建议"的消息 (类型3)和相关的回复消息
          const token = localStorage.getItem('token');
          const response = await fetch('/api/messages/all', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const result = await response.json();
          if (response.ok) {
            // 分离原始反馈和回复消息
            const allMessages = result.data.messages;
            
            // 过滤出原始反馈消息（类型为3）
            this.feedbacks = allMessages
              .filter(msg => {
                // 只显示原始反馈消息 (类型3)
                return msg._mtid === 3;
              })
              .map(msg => {
                // 从标题中提取类型（标题格式为 "类型: 标题"）
                const titleParts = msg._title ? msg._title.split(': ') : [];
                let type = titleParts.length > 0 ? titleParts[0] : '未分类';
                
                // 防止类型重复，例如"意见建议 - 意见建议"，只保留第一部分
                if (type.includes(' - ')) {
                  type = type.split(' - ')[0];
                }
                
                return {
                  ...msg,
                  _fid: msg._mid,  // 将消息ID映射为反馈ID
                  _uid: msg.sender ? msg.sender._uid : msg._sender_id,  // 优先使用sender._uid
                  _sender_id: msg._sender_id || (msg.sender ? msg.sender._uid : undefined),
                  _email: msg._email || (msg.sender && msg.sender._email) || '',
                  _name: (msg.sender && msg.sender._name) ? msg.sender._name : (msg.sender && msg.sender._account) || '未知用户',  // 添加用户姓名
                  _type: type, // 添加类型字段
                  // 查找该反馈的回复
                  replies: allMessages.filter(reply => 
                    reply._mtid === 4 && 
                    reply._title.includes(`回复: ${msg._mid}`) // 回复标题包含原始反馈ID
                  )
                };
              });
              
            // 检查是否有对应的回复消息来更新状态
            this.feedbacks.forEach(feedback => {
              const replyMessages = allMessages.filter(reply => 
                reply._mtid === 4 && 
                reply._title.includes(`回复: ${feedback._mid}`)
              );
              
              // 如果有回复消息，则原始反馈的状态设置为已处理
              if (replyMessages.length > 0) {
                feedback._status = 1; // 已处理
              }
            });
            
            this.filteredFeedbacks = this.feedbacks;
            this.feedbackCurrentPage = 1; // 重置到第一页
          } else {
            this.$message.error(result.message || '获取消息列表失败');
          }
        } catch (error) {
          console.error('加载意见建议数据失败:', error);
          this.$message.error('加载消息列表失败，请稍后再试');
        }
      },

      // 提交回复
      async submitReply() {
        if (!this.replyForm.subject || !this.replyForm.content) {
          this.$message.error('请填写回复主题和内容');
          return;
        }

        try {
          const token = localStorage.getItem('token');

          // 检查接收者ID是否存在
          if (!this.currentFeedback._uid) {
            this.$message.error('无法获取接收者信息');
            return;
          }
          
          // 使用现有的消息API发送回复，类型为4（回复）
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              _receiver_id: this.currentFeedback._uid, // 回复给原始反馈的发送者（即读者）
              _title: `回复: ${this.currentFeedback._fid} - ${this.currentFeedback._title}`,
              _content: this.replyForm.content,
              _mtid: 4,  // 使用类型4（回复类型）
            })
          });

          const result = await response.json();
          console.log('回复API响应:', result); // 调试信息
          
          if (response.ok) {
            this.$message.success('回复提交成功');
            
            // 更新本地反馈的状态为已处理
            const feedbackIndex = this.feedbacks.findIndex(f => f._fid === this.currentFeedback._fid);
            if (feedbackIndex !== -1) {
              this.feedbacks[feedbackIndex]._status = 1;
              
              // 从API响应创建新的回复对象，确保所有字段都有默认值
              let newReply;
              if (result.data && result.data.message) {
                // API返回格式为 { success: true, message: "...", data: { message: { ... } } }
                newReply = {
                  _mid: result.data.message._mid || Date.now(),
                  _title: result.data.message._title || this.replyForm.subject,
                  _content: result.data.message._content || this.replyForm.content,
                  _create_time: result.data.message._create_time || new Date().toISOString(),
                  _name: result.data.message.sender && result.data.message.sender._name ? 
                         result.data.message.sender._name : '管理员'
                };
              } else if (result.data && result.data._mid) {
                // API直接返回消息对象
                newReply = {
                  _mid: result.data._mid || Date.now(),
                  _title: result.data._title || this.replyForm.subject,
                  _content: result.data._content || this.replyForm.content,
                  _create_time: result.data._create_time || new Date().toISOString(),
                  _name: result.data.sender && result.data.sender._name ? 
                         result.data.sender._name : '管理员'
                };
              } else {
                // 未知响应格式，使用表单数据和当前时间
                newReply = {
                  _mid: Date.now(), // 使用时间戳作为临时ID
                  _title: this.replyForm.subject,
                  _content: this.replyForm.content,
                  _create_time: new Date().toISOString(),
                  _name: '管理员'
                };
              }
              
              if (!this.feedbacks[feedbackIndex].replies) {
                this.feedbacks[feedbackIndex].replies = [];
              }
              this.feedbacks[feedbackIndex].replies.push(newReply);
            }
            
            const filteredIndex = this.filteredFeedbacks.findIndex(f => f._fid === this.currentFeedback._fid);
            if (filteredIndex !== -1) {
              this.filteredFeedbacks[filteredIndex]._status = 1;
            }
            
            this.closeReplyFeedbackModal();
          } else {
            this.$message.error(result.message || '回复失败');
          }
        } catch (error) {
          console.error('提交回复失败:', error);
          this.$message.error('回复失败，请重试');
        }
      },

      // 删除回复
      async deleteReply(replyId) {
        if (confirm('确定要删除这条回复吗？删除后，对应的原始反馈将恢复为待处理状态。')) {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/messages/${replyId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            const result = await response.json();
            if (response.ok) {
              // 从本地数据中移除回复
              // 遍历所有反馈，找到包含此回复的反馈
              for (let i = 0; i < this.feedbacks.length; i++) {
                const feedback = this.feedbacks[i];
                if (feedback.replies) {
                  // 查找并移除指定的回复
                  const replyIndex = feedback.replies.findIndex(r => r._mid === replyId);
                  if (replyIndex !== -1) {
                    // 从反馈的回复列表中移除该回复
                    feedback.replies.splice(replyIndex, 1);
                    
                    // 检查是否还有其他回复，如果没有则将状态改为待处理
                    if (feedback.replies.length === 0) {
                      feedback._status = 0; // 待处理
                      
                      // 更新过滤后的数据
                      const filteredIndex = this.filteredFeedbacks.findIndex(f => 
                        f._fid === feedback._fid
                      );
                      if (filteredIndex !== -1) {
                        this.filteredFeedbacks[filteredIndex]._status = 0;
                      }
                    }
                    break; // 找到并处理后退出循环
                  }
                }
              }
              
              this.$message.success('回复删除成功');
            } else if (response.status === 404) {
              this.$message.error('消息不存在或已被删除');
            } else if (response.status === 403) {
              this.$message.error('没有权限删除此消息');
            } else {
              this.$message.error(result.message || '删除失败');
            }
          } catch (error) {
            console.error('删除回复失败:', error);
            this.$message.error('删除失败，请重试');
          }
        }
      },

      // 修改回复
      editReply(reply) {
        this.replyForm.subject = reply._title;
        this.replyForm.content = reply._content;
        this.currentReply = reply;
        this.showReplyFeedbackModal = true;
      },

      // 关闭回复反馈弹窗
      closeReplyFeedbackModal() {
        this.showReplyFeedbackModal = false;
        this.showFeedbackDetailModal = false; // 同时关闭详情模态框
        this.replyForm = {
          subject: '',
          content: ''
        };
        this.currentReply = null;
      },

      async handleFeedbackSubmit() {
      this.feedbackError = "";
      if (!this.feedbackName || !this.feedbackName.trim()) {
        this.feedbackError = "请填写姓名";
        return;
      }

      if (!this.feedbackMessage || !this.feedbackMessage.trim()) {
        this.feedbackError = "请填写意见内容";
        return;
      }

      try {
        // 使用现有的消息API提交反馈，使用类型2（意见建议）
        const response = await this.$http.post('/api/messages', {
          _receiver_id: 1,  // 发送给管理员（ID为1）
          _title: this.feedbackName,  // 只使用反馈名称，不包含类型
          _content: this.feedbackType + ': ' + this.feedbackMessage,  // 在内容中包含类型信息
          _mtid: 2,  // 类型2表示"意见建议"
          _email: this.feedbackEmail  // 保存用户邮箱
        });


        if (response.data.success) {
          alert("感谢您的反馈，已提交！");
          this.clearFeedbackForm();
          this.feedbackTab = "history";
          
          // 重新加载反馈历史
          await this.loadFeedbackHistory();
        } else {
          this.feedbackError = response.data.message || "提交失败";
        }
      } catch (error) {
        console.error("提交反馈失败:", error);
        this.feedbackError = error.response?.data?.message || "提交失败，请重试";
      }
    },

    clearFeedbackForm() {
      this.feedbackName = "";
      this.feedbackEmail = "";
      this.feedbackType = "建议";
      this.feedbackMessage = "";
      this.feedbackError = "";
    },

    async loadFeedbackHistory() {
      try {
        // 获取发送给当前用户的反馈回复消息
        const response = await this.$http.get('/api/messages', {
          params: {
            type: 4  // 获取类型为"其他"的消息
          }
        });
        
        if (response.data.success) {
          // 格式化数据以匹配前端显示需求
          this.feedbackHistory = response.data.data.messages.map(msg => ({
              name: msg._title,
              email: msg._email || (msg.sender && msg.sender._email) || '',
              // 从标题中提取类型（标题格式为 "类型: 标题"），防止重复
              type: (() => {
                const titleParts = msg._title ? msg._title.split(': ') : [];
                let type = titleParts.length > 0 ? titleParts[0] : '未分类';
                
                // 防止类型重复，例如"意见建议 - 意见建议"，只保留第一部分
                if (type.includes(' - ')) {
                  type = type.split(' - ')[0];
                }
                
                return type;
              })(),
              message: msg._content,
              date: new Date(msg._create_time).toISOString().split("T")[0],
              status: msg._status === 1 ? "已读" : "未读",
              reply: "",
              _fid: msg._mid,
              _uid: msg._sender_id,
              _status: msg._status,
              _create_time: msg._create_time
            }));
        }
      } catch (error) {
        console.error(
          "加载意见建议历史失败:",
          error.response?.data || error.message
        );
      }
    },

      // 意见建议分页切换 
      changeFeedbackPage(page) {
        if (page < 1 || page > this.totalFeedbackPages) return;
        this.feedbackCurrentPage = page;
      },

      viewFeedbackDetail(feedback) {
        this.currentFeedback = { ...feedback };
        this.showFeedbackDetailModal = true;
      },
      
      // 关闭反馈详情弹窗
      closeFeedbackDetailModal() {
        this.showFeedbackDetailModal = false;
        this.currentFeedback = {};
      },
      
      // 回复反馈
      replyFeedback(feedback) {
        this.currentFeedback = { ...feedback };
        this.replyForm.subject = `回复: ${feedback._title}`;
        this.showReplyFeedbackModal = true;
      },

      // 提取反馈内容中仅意见内容部分
      getFeedbackContentOnly(content) {
        if (!content) return '';
        
        // 匹配 "意见内容：" 后面的内容
        const match = content.match(/意见内容：(.*)/);
        if (match && match[1]) {
          return match[1];
        }
        
        // 如果没有匹配到格式化内容，返回原始内容
        return content;
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

/* 子菜单样式 */
.has-submenu {
  position: relative;
}

.sub-menu {
  list-style: none;
  padding-left: 0;
  background-color: #1f7a8c;
  display: none;
  position: relative;
  z-index: 1000;
}

.sub-menu.show {
  display: block;
}

.sub-menu li {
  width: 100%;
}

.sub-menu li a {
  padding: 0.5rem 1rem 0.5rem 2rem;
  color: #e0f7fa;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  text-decoration: none;
  width: 100%;
  box-sizing: border-box;
}

.sub-menu li a:hover,
.sub-menu li a.active {
  background-color: #004d40;
  color: white;
}

.sub-menu li a i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
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
  height: 100%;
}

.modal-content form .form-group:last-child {
  margin-bottom: 15px;
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
  margin-top: auto;
  padding-top: 20px;
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
  min-height: 400px;
  overflow: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  flex-direction: column;
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
.reset-password,.reset-password-button {
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

.reset-password:hover, .reset-password-button:hover {
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
.addBookModal, .addCategoryButton, .addUserModal, .addAnnouncementButton,.addAdminModal,.addRoleModal {
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

.addBookModal:hover, .addCategoryButton:hover, .addUserModal:hover, .addAnnouncementButton:hover, .addAdminModal:hover,.addRoleModal:hover {
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
/* 分页容器样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 5px;
}

/* 分页按钮基础样式 */
.pagination button {
  padding: 8px 12px;
  margin: 0 2px;
  background-color: #2691a6;
  color: white;
  border: 1px solid #2691a6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 分页按钮悬停效果 */
.pagination button:hover {
  background-color: #1f7a8c;
  border-color: #1f7a8c;
}

/* 当前页按钮样式 */
.pagination button.active {
  background-color: #1f7a8c;
  border-color: #1f7a8c;
  font-weight: bold;
}

/* 禁用按钮样式 */
.pagination button:disabled {
  background-color: #cccccc;
  border-color: #cccccc;
  color: #666666;
  cursor: not-allowed;
  opacity: 1; /* 防止按钮变透明 */
}

/* 分页按钮焦点样式 */
.pagination button:focus {
  outline: 2px solid #227586;
  opacity: 1; /* 确保获得焦点时不透明 */
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

/* 角色标签样式 */
.role-tag {
  display: inline-block;
  background-color: #1194AE;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin: 2px;
}

/* 分配角色模态框样式 */
.role-selection {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.role-checkbox {
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.role-checkbox label {
  display: block;
  font-weight: bold;
  cursor: pointer;
}

.role-description {
  margin: 5px 0 0 20px;
  font-size: 0.9em;
  color: #666;
}

.role-permissions {
  margin: 10px 0 0 20px;
  font-size: 0.85em;
}

.role-permissions ul {
  padding-left: 20px;
  margin: 5px 0 0 0;
}

.role-permissions li {
  margin-bottom: 3px;
}

.assign-role-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  margin: 0 5px;
}

.assign-role-button:hover {
  background-color: #218838;
}

.assign-role-button i {
  margin-right: 5px;
}

/* 角色分配表格样式 */
.role-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.role-table th,
.role-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.role-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.role-table tbody tr:last-child td {
  border-bottom: none;
}

.role-table tbody tr:hover {
  background-color: #f8f9fa;
}

.role-table .no-data {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 20px;
}

/* 表格内复选框样式 */
.role-table input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 角色管理样式 */
.permission-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0;
  background: #f8fafc;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
  margin-bottom: 15px;
}

.permission-list::-webkit-scrollbar {
  width: 6px;
}

.permission-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.permission-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.permission-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.permission-item {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  background: white;
}

.permission-item:hover {
  background: #f1f5f9;
  transform: translateX(2px);
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-item .checkbox-label {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  gap: 12px;
}

/* 美化复选框 */
.permission-item input[type="checkbox"] {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  margin: 2px 0 0 0;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.permission-item input[type="checkbox"]:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.permission-item input[type="checkbox"]:checked::after {
  content: "✓";
  position: absolute;
  color: white;
  font-size: 14px;
  font-weight: bold;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.permission-item input[type="checkbox"]:hover:not(:checked) {
  border-color: #94a3b8;
}

.permission-content {
  flex: 1;
}

.permission-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.permission-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.permission-code {
  color: #64748b;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 12px;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.permission-desc {
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
  margin-top: 4px;
}

/* 选中状态 */
.permission-item.selected {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  margin-left: -3px;
}

/* 分类标题（如果需要分组） */
.permission-category {
  padding: 12px 20px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;
}

/* 搜索框样式 */
.permission-search {
  padding: 12px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 头部统计信息 */
.permission-stats {
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-text {
  color: #64748b;
  font-size: 14px;
}

.stats-count {
  color: #3b82f6;
  font-weight: 600;
}

/* 模态框样式优化 */
.modal-content.large {
  width: 700px;
  max-width: 90vw;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

/* 空状态 */
.permission-empty {
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
}

.permission-empty svg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .permission-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .permission-item {
    padding: 14px 16px;
  }
  
  .modal-content.large {
    margin: 10px;
    max-width: calc(100vw - 20px);
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.permission-item {
  animation: fadeIn 0.3s ease-out;
}

/* 批量操作栏 */
.permission-batch-actions {
  padding: 12px 20px;
  background: #f1f5f9;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.batch-btn {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 4px;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.batch-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.batch-btn.primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.batch-btn.primary:hover {
  background: #2563eb;
}

/* 权限图标 */
.permission-icon {
  width: 20px;
  height: 20px;
  background: #e0f2fe;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0369a1;
  font-size: 12px;
  flex-shrink: 0;
}

/* 延期归还弹窗按钮样式 */
#delayModal .modal-content {
  display: flex;
  flex-direction: column;
  width: 450px;
}
#delayModal .modal-buttons {
  display: flex;
  justify-content: flex-end; /* 按钮靠右对齐 */
  gap: 10px;
  margin-top: 100px; /* 将按钮推到底部 */
  padding-top: 15px; /* 添加一些顶部间距 */
}

#delayModal .modal-buttons {
  display: flex;
  justify-content: flex-end; /* 按钮靠右对齐 */
  gap: 10px;
  margin-top: 100px; /* 将按钮推到底部 */
  padding-top: 15px; /* 添加一些顶部间距 */
}

/* 意见建议表格样式 */
.feedback_table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
}

.feedback_table th,
.feedback_table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.feedback_table th {
  background-color: #2691a6;
  color: white;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.feedback_table tr:nth-child(even) {
  background-color: #f8f9fa;
}

.feedback_table tr:hover {
  background-color: #e9f7fe;
}

.feedback-content-cell {
  max-width: 200px;
  word-wrap: break-word;
}

.content-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-button {
  padding: 6px 12px;
  margin: 0 3px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.status-text {
  color: #6c757d;
  font-style: italic;
}

/* 详情模态框样式 */
.feedback-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.feedback-detail-modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.feedback-detail-close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #aaa;
}

.feedback-detail-close:hover {
  color: black;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item label {
  font-weight: bold;
  display: inline-block;
  width: 100px;
}

.detail-item span {
  display: inline-block;
  max-width: calc(100% - 110px);
  word-wrap: break-word;
}

.feedback-content {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #2691a6;
  white-space: pre-wrap;
  line-height: 1.5;
}

/* 回复表单样式 */
.reply-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.reply-form h3 {
  margin-bottom: 15px;
  color: #2691a6;
}

.reply-form .form-group {
  margin-bottom: 15px;
}

.reply-form label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.reply-form input,
.reply-form textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.reply-form textarea {
  height: 100px;
  resize: vertical;
}

</style>
