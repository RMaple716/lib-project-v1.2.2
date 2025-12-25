<template>
  <div id="app">
    <!-- 主系统页面 -->
    <div>

      <!-- 上侧导航导航栏 -->
      <nav class="navbar">
        <div class="logo">
          <img
            src="@/assets/logoo.png"
            alt="图书管理系统logo"
            class="logo-img"
          />
          图书管理系统
        </div>
        <ul class="nav-links">
          <li>
            <a href="#" @click.prevent="changePage('search')">图书大厅</a>
          </li>
          <li>
            <a href="#" @click.prevent="changePage('personal')">个人信息</a>
          </li>
          <li><a href="#" @click.prevent="changePage('aid')">公告信息</a></li>
          <li>
            <a href="#" @click.prevent="changePage('feedback')">意见建议</a>
          </li>
          <li>
            <a href="#" @click.prevent="changePage('visualization')">图书可视化</a>
          </li>
        </ul>

        <!-- 登录按钮 / 用户头像 -->
        <div class="auth-links">
          <!-- 消息面板触发器 -->
          <div class="message-trigger" @click="toggleMessagePanel">
            <i class="envelope-icon">✉️</i>
            <span v-if="unreadMessageCount > 0" class="unread-count">
              {{ unreadMessageCount }}
            </span>
          </div>
          <!-- 消息面板 -->
          <div v-show="showMessagePanel" class="message-panel" @click.stop>
            <div class="message-header">
              <h3>消息中心</h3>
              <button class="close-btn" @click="toggleMessagePanel">×</button>
            </div>
            
            <div class="message-list">
              <div v-if="messages.length === 0" class="no-messages">
                暂无消息
              </div>
              
              <div 
                v-else 
                v-for="message in messages" 
                :key="message._mid"
                class="message-item"
                :class="{ unread: !message._status }"
                @click="viewMessageDetail(message)"
              >
                <div class="message-title">
                  <strong>{{ message._title }}</strong>
                  <span class="message-time">{{ formatDate(message._create_time) }}</span>
                </div>
                <div class="message-preview">
                  {{ message._content.substring(0, 50) }}...
                </div>
                <div v-if="!message._status" class="unread-indicator">未读</div>
              </div>
            </div>
          </div>
          <!-- 消息详情模态框 -->
          <div v-if="showMessageDetail" class="message-detail-modal" @click="closeMessageDetail">
            <div class="message-detail-content" @click.stop>
              <div class="message-detail-header">
                <h3>{{ currentMessage?._title }}</h3>
                <button class="close-btn" @click="closeMessageDetail">×</button>
              </div>
              <div class="message-detail-body">
                <p><strong>发送者：</strong>{{ currentMessage?.sender?._name || '系统' }}</p>
                <p><strong>时间：</strong>{{ formatDate(currentMessage?._create_time) }}</p>
                <div class="message-content">
                  <pre>{{ currentMessage?._content }}</pre>
                </div>
              </div>
            </div>
          </div>
           <!-- 用户头像/登录按钮 -->
          <div v-if="isLoggedIn" class="user-menu" @click.stop="toggleUserMenu">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="用户头像"
              class="user-avatar"
            />
            <div v-else class="user-avatar-placeholder">
              {{ (userInfo?._name || userInfo?.name || "U").charAt(0).toUpperCase() }}
            </div>
           <!-- 用户下拉菜单 -->
            <div class="user-dropdown" v-show="showUserDropdown">
              <button @click.stop="openPersonal" class="auth-link">个人信息</button>
              <button @click.stop="handleLogout" class="auth-link">退出登录</button>
            </div>
          </div>
          <div v-else class="auth-links">
            <a href="#" @click.prevent="goToAuth('login')" class="auth-link">登录</a>
          </div>
        </div>
      </nav>

      <!-- 图书大厅区域 -->
      <main>
        <!-- 检索区块-->
        <div v-if="currentPage === 'search'">
          <div class="search-container">
            <div class="searchbar">
              <select v-model="searchType" class="search-select">
                <option value="book">按图书名称查询</option>
                <option value="author">按作者姓名查询</option>
              </select>
              <div class="search-input-wrapper" :class="searchInputClasses">
                <div class="selected-tags" v-if="selectedCategories.length > 0">
                  <span 
                    v-for="(category, index) in selectedCategories" 
                    :key="index"
                    class="tag"
                  >
                    {{ category.label }}
                    <span class="tag-close" @click.stop="removeCategory(index)">×</span>
                  </span>
                </div>
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="请输入查询内容"
                  @focus="handleInputFocus"
                />
              </div>
              <button @click="gotoSearchResult">检索</button>
            </div>
            <!-- 搜索状态显示 -->
            <div class="search-status" v-if="selectedCategories.length > 0 || searchQuery">
                当前筛选: {{ searchStatusText }}
                <button @click="clearAllFilters" class="clear-filters-btn">清除所有筛选</button>
              </div>

            <!-- 类别筛选 -->
            <div class="category-filter">
              <span class="filter-label">图书类别：</span>
              <button
                v-for="category in bookCategories"
                :key="category.value"
                @click="filterByCategory(category.value)"
                :class="{
                  'active-category': selectedCategories.some(cat => cat.value === category.value),
                }"
              >
                {{ category.label }}
              </button>
            </div>
          </div>

          <!-- 轮播 -->
          <div
            class="hero-carousel"
            @mouseenter="stopCarousel"
            @mouseleave="startCarousel"
          >
            <div
              class="hero-track"
              :style="{ transform: `translateX(-${carouselIndex * 100}%)` }"
            >
              <div
                class="hero-slide"
                v-for="(img, idx) in carouselImages"
                :key="idx"
              >
                <img :src="img" :alt="`slide-${idx}`" />
              </div>
            </div>
            <button
              class="hero-arrow hero-arrow--left"
              @click="prevSlide"
              aria-label="上一张"
              @mouseenter="stopCarousel"
              @mouseleave="startCarousel"
            >
              ‹
            </button>
            <button
              class="hero-arrow hero-arrow--right"
              @click="nextSlide"
              aria-label="下一张"
              @mouseenter="stopCarousel"
              @mouseleave="startCarousel"
            >
              ›
            </button>
          </div>

          <!-- 新书推荐 -->
          <div class="books-section">
            <div class="section-header">
              <h2>新书推荐</h2>
              <a
                href="#"
                @click.prevent="changePage('allBooks', 'new')"
                class="view-all"
                >查看全部</a
              >
            </div>
            <div class="books-grid">
              <div
                class="book-card"
                v-for="(book, index) in filteredNewBooks"
                :key="'new-' + index"
                @click="viewBookDetail(book)"
              >
                <div class="book-cover">
                  <div class="book-tag new-tag">新书</div>
                  <img
                    :src="getFullCoverUrl(book._cover_url)"
                    :alt="book._book_name"
                    class="book-img"
                    @error="handleImgError($event, book)"
                    referrerpolicy="no-referrer"
                  />
                  <div
                    class="cover-placeholder"
                    v-if="!book._cover_url || imgErrorMap[book._bid]"
                  >
                    {{ book._book_name.substring(0, 2) }}
                  </div>
                </div>
                <div class="book-info">
                  <h3 class="book-title">{{ book._book_name }}</h3>
                  <p class="book-author">{{ book._author }}</p>
                  <p class="book-category">{{ book._type_name }}</p> 
                </div>
              </div>
            </div>
          </div>

          <!-- 热门推荐 -->
          <div class="books-section">
            <div class="section-header">
              <h2>热门推荐</h2>
              <a
                href="#"
                @click.prevent="changePage('allBooks', 'hot')"
                class="view-all"
                >查看全部</a
              >
            </div>
            <div class="books-grid">
              <div
                class="book-card"
                v-for="(book, index) in filteredHotBooks"
                :key="'hot-' + index"
                @click="viewBookDetail(book)"
              >
                <div class="book-cover">
                  <div class="book-tag hot-tag">热门</div>
                  <img
                    :src="getFullCoverUrl(book._cover_url)"
                    :alt="book._book_name"
                    class="book-img"
                    @error="handleImgError($event, book)"
                    referrerpolicy="no-referrer"
                  />
                  <div
                    class="cover-placeholder"
                    v-if="!book._cover_url || imgErrorMap[book._bid]"
                  >
                    {{ book._book_name.substring(0, 2) }}
                  </div>
                </div>
                <div class="book-info">
                  <h3 class="book-title">{{ book._book_name }}</h3>
                  <p class="book-author">{{ book._author }}</p>
                  <p class="book-category">{{ book._type_name }}</p> 
                </div>
              </div>
            </div>
          </div>

          <!-- 全部图书 -->
          <div class="books-section">
            <div class="section-header">
              <h2>全部图书</h2>
              <a
                href="#"
                @click.prevent="changePage('allBooks', 'all')"
                class="view-all"
                >查看全部</a
              >
            </div>
            <div class="books-grid">
              <div
                class="book-card"
                v-for="(book, index) in currentPageItems"
                :key="'all-' + index"
                @click="viewBookDetail(book)"
              >
                <div class="book-cover">
                  <img
                    :src="getFullCoverUrl(book._cover_url)"
                    :alt="book._book_name"
                    class="book-img"
                    @error="handleImgError($event, book)"
                    referrerpolicy="no-referrer"
                  />
                  <div
                    class="cover-placeholder"
                    v-if="!book._cover_url || imgErrorMap[book._bid]"
                  >
                    {{ book._book_name.substring(0, 2) }}
                  </div>
                </div>
                <div class="book-info">
                  <h3 class="book-title">{{ book._book_name }}</h3>
                  <p class="book-author">{{ book._author }}</p>
                  <p class="book-category">{{ book._type_name }}</p>  
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-if="currentPage === 'searchResult'">
          <div class="search-container">
            <div class="searchbar">
              <select v-model="searchType" class="search-select">
                <option value="book">按图书名称查询</option>
                <option value="author">按作者姓名查询</option>
              </select>
              <input
                type="text"
                v-model="searchQuery"
                placeholder="请输入查询内容"
              />
              <button @click="gotoSearchResult">重新检索</button>
            </div>
            <div class="category-filter">
              <span class="filter-label">图书类别：</span>
              <button
                v-for="category in bookCategories"
                :key="category.value"
                @click="filterByCategory(category.value)"
                :class="{
                  'active-category': selectedCategories.some(cat => cat.value === category.value),
                }"
              >
                {{ category.label }}
              </button>
            </div>
          </div>
          <div class="all-books-container">
            <button @click="changePage('search')" class="back-btn">
              返回图书大厅
            </button>
            <h2>
              搜索结果:
              <span class="search-query-display">
                {{ searchType === "book" ? '图书名称包含 "' : '作者包含 "'
                }}{{ searchQuery }}"
                <span v-if="currentCategory"
                  >，类别: {{ currentCategory }}</span
                >
              </span>
              <span class="result-count"
                >共 {{ filteredSearchResults.length }} 条结果</span
              >
            </h2>

            <div v-if="filteredSearchResults.length === 0" class="no-results">
              没有找到符合条件的图书，请尝试其他搜索条件。
            </div>
            <div class="books-grid">
              <div
                class="book-card"
                v-for="(book, index) in currentSearchResultItems"
                :key="'search-' + index"
                @click="viewBookDetail(book)"
              >
                <div class="book-cover">
                  <img
                    :src="getFullCoverUrl(book._cover_url)"
                    :alt="book._book_name"
                    class="book-img"
                    @error="handleImgError($event, book)"
                    referrerpolicy="no-referrer"
                  />
                  <div
                    class="cover-placeholder"
                    v-if="!book._cover_url || imgErrorMap[book._bid]"
                  >
                    {{ book._book_name.substring(0, 2) }}
                  </div>
                </div>
                <div class="book-info">
                  <h3 class="book-title">{{ book._book_name }}</h3>
                  <p class="book-author">{{ book._author }}</p>
                  <p class="book-category">{{ book._type_name }}</p>
                </div>
              </div>
            </div>
            <div class="pagination" v-if="filteredSearchResults.length > 0">
              <span class="total-pages">共{{ totalSearchResultPages }}页</span>
              <span class="page-numbers">
                <button
                  @click="changeSearchResultPageNum(1)"
                  :disabled="currentSearchResultPageNum === 1"
                >
                  首页
                </button>
                <button
                  @click="
                    changeSearchResultPageNum(currentSearchResultPageNum - 1)
                  "
                  :disabled="currentSearchResultPageNum === 1"
                >
                  上一页
                </button>
                <button
                  v-for="page in visibleSearchResultPages"
                  :key="'search-page-' + page"
                  @click="changeSearchResultPageNum(page)"
                  :class="{ active: currentSearchResultPageNum === page }"
                >
                  {{ page }}
                </button>
                <button
                  @click="
                    changeSearchResultPageNum(currentSearchResultPageNum + 1)
                  "
                  :disabled="
                    currentSearchResultPageNum === totalSearchResultPages
                  "
                >
                  下一页
                </button>
                <button
                  @click="changeSearchResultPageNum(totalSearchResultPages)"
                  :disabled="
                    currentSearchResultPageNum === totalSearchResultPages
                  "
                >
                  末页
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- 图书详情 -->
        <div v-if="currentPage === 'bookDetail'">
          <div class="search-container">
            <div class="searchbar">
              <select v-model="searchType" class="search-select">
                <option value="book">按图书名称查询</option>
                <option value="author">按作者姓名查询</option>
              </select>
              <input
                type="text"
                v-model="searchQuery"
                placeholder="请输入查询内容"
              />
              <button @click="gotoSearchResult">检索</button>
            </div>
          </div>
          
          <div class="book-detail-container">
            <button @click="changePage('search')" class="back-btn">
              返回图书大厅
            </button>

            <!-- 顶部标题区 -->
            <div class="book-detail-header">
              <h1 class="book-detail-main-title">{{ currentBook._book_name }}</h1>
            </div>

            <!-- 主要内容区 -->
            <div class="book-detail-content">
              <!-- 左侧：图书封面占位区 -->
              <div class="book-cover-section">
                <div class="detail-cover">
                  <img
                    :src="getFullCoverUrl(currentBook._cover_url)"
                    :alt="currentBook._book_name"
                    class="detail-img"
                    @error="handleImgError($event, currentBook)"
                  />
                  <div
                    class="cover-placeholder"
                    v-if="!currentBook._cover_url || imgErrorMap[currentBook._bid]"
                  >
                    {{ currentBook._book_name.substring(0, 2) }}
                  </div>
                </div>
              </div>

              <!-- 右侧：图书详细信息与操作区 -->
              <div class="book-info-section">
                <!-- 元数据表格样式 -->
                <div class="metadata-table">
                  <div class="metadata-row">
                    <span class="metadata-label">作者</span>
                    <span class="metadata-value">{{ currentBook._author }}</span>
                  </div>
                  <div class="metadata-row">
                    <span class="metadata-label">ISBN</span>
                    <span class="metadata-value">{{ currentBook._isbn }}</span>
                  </div>
                  <div class="metadata-row">
                    <span class="metadata-label">出版社</span>
                    <span class="metadata-value">{{ currentBook._press }}</span>
                  </div>
                  <div class="metadata-row">
                    <span class="metadata-label">图书类别</span>
                    <span class="metadata-value">{{ currentBook._type_name || '未分类' }}</span>
                  </div>
                  <!-- 按钮区 -->
                  <div class="category-actions-section">
                    <div class="action-buttons">
                      <!-- 图书详情页面的预约按钮 -->
                      <button
                        v-if="isLoggedIn"
                        @click="handleOrder(currentBook._bid)"
                        :disabled="isBookOrdered || currentBook._available_copies > 0"
                        class="borrow-btn"
                      >
                        {{ currentBook._available_copies > 0 ? '借阅图书' : (isBookOrdered ? '已预约' : '预约图书') }}
                      </button>

                      <button
                        v-else
                        @click="goToAuth('login')"
                        class="borrow-btn"
                      >
                        登录后借阅
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部操作栏 -->
            <div class="book-detail-footer">
              <div class="footer-content">
                <div class="additional-info">
                  <span class="info-item">馆藏总数：{{ currentBook._total_copies }}</span>
                  <span class="info-item">可借数量：{{ currentBook._available_copies }}</span>
                </div>
                <div class="footer-actions">
                  <button @click="changePage('search')" class="secondary-btn">
                    继续浏览
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 查看全部图书 -->
        <div v-if="currentPage === 'allBooks'">
          <div class="search-container">
            <div class="searchbar">
              <select v-model="searchType" class="search-select">
                <option value="book">按图书名称查询</option>
                <option value="author">按作者姓名查询</option>
              </select>
              <div class="search-input-wrapper" :class="searchInputClasses">
                <div class="selected-tags" v-if="selectedCategories.length > 0">
                  <span 
                    v-for="(category, index) in selectedCategories" 
                    :key="index"
                    class="tag"
                  >
                    {{ category.label }}
                    <span class="tag-close" @click.stop="removeCategory(index)">×</span>
                  </span>
                </div>
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="请输入查询内容"
                  @focus="handleInputFocus"
                />
              </div>
              <button @click="gotoSearchResult">检索</button>
            </div>
            <!-- 搜索状态显示 -->
            <div class="search-status" v-if="selectedCategories.length > 0 || searchQuery">
                当前筛选: {{ searchStatusText }}
                <button @click="clearAllFilters" class="clear-filters-btn">清除所有筛选</button>
              </div>
            <div class="category-filter">
              <span class="filter-label">图书类别：</span>
              <button
                v-for="category in bookCategories"
                :key="category.value"
                @click="filterByCategory(category.value)"
                :class="{
                  'active-category': selectedCategories.some(cat => cat.value === category.value),
                }"
              >
                {{ category.label }}
              </button>
            </div>
          </div>
          <div class="all-books-container">
            <button @click="changePage('search')" class="back-btn">返回</button>
            <h2>
              {{
                pageType === "new"
                  ? "全部新书"
                  : pageType === "hot"
                  ? "全部热门图书"
                  : "所有图书"
              }}
            </h2>
            <div class="books-grid">
              <div
                class="book-card"
                v-for="(book, index) in currentPageItems"
                :key="'all-' + index"
                @click="viewBookDetail(book)"
              >
                <div class="book-cover">
                  <!-- 根据标志显示标签 -->
                  <div v-if="book.isNew" class="book-tag new-tag">新书</div>
                  <div v-else-if="book.isHot" class="book-tag hot-tag">热门</div>
    
                  <img
                    :src="getFullCoverUrl(book._cover_url)"
                    :alt="book._book_name"
                    class="book-img"
                    @error="handleImgError($event, book)"
                  />
                  <div
                    class="cover-placeholder"
                    v-if="!book._cover_url || imgErrorMap[book._bid]"
                  >
                    {{ book._book_name.substring(0, 2) }}
                  </div>
                </div>
                <div class="book-info">
                  <h3 class="book-title">{{ book._book_name }}</h3>
                  <p class="book-author">{{ book._author }}</p>
                  <p class="book-category">{{ book._type_name }}</p> 
                </div>
              </div>
            </div>
            <div class="pagination">
              <span class="total-pages">共{{ totalPages }}页</span>
              <span class="page-numbers">
                <button
                  @click="changePageNum(1)"
                  :disabled="currentPageNum === 1"
                >
                  首页
                </button>
                <button
                  @click="changePageNum(currentPageNum - 1)"
                  :disabled="currentPageNum === 1"
                >
                  上一页
                </button>
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="changePageNum(page)"
                  :class="{ active: currentPageNum === page }"
                >
                  {{ page }}
                </button>
                <button
                  @click="changePageNum(currentPageNum + 1)"
                  :disabled="currentPageNum === totalPages"
                >
                  下一页
                </button>
                <button
                  @click="changePageNum(totalPages)"
                  :disabled="currentPageNum === totalPages"
                >
                  末页
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- 个人信息 -->
        <div v-if="currentPage === 'personal'">
          <div class="personal-container">
            <div class="personal-sidebar">
              <ul class="sidebar-nav">
                <li
                  :class="{ active: personalTab === 'account' }"
                  @click="personalTab = 'account'"
                >
                  账户信息
                </li>
                <li
                  :class="{ active: personalTab === 'borrowing' }"
                  @click="personalTab = 'borrowing'"
                >
                  我的借阅
                </li>
                <li
                  :class="{ active: personalTab === 'borrowing_total' }"
                  @click="personalTab = 'borrowing_total'"
                >
                  借阅图谱
                </li>
                <li
                  :class="{ active: personalTab === 'violation_records' }"
                  @click="personalTab = 'violation_records'"
                >
                  违规记录
                </li>
              </ul>
            </div>
            <div class="personal-content">        
                <div v-if="personalTab === 'account'">
                  <h2>账户信息</h2>
                  <!-- 未登录提示 -->
                  <div v-if="!isLoggedIn" class="login-prompt">
                    <h2>请先登录</h2>
                    <p>您需要登录后才能查看个人信息</p>
                    <button @click="goToAuth('login')" class="login-btn">立即登录</button>
                  </div>
                  <!-- 已登录则显示原有内容 -->
                  <div v-else>
                    <div class="account-info">
                      <template v-if="!editMode">
                        <div class="info-item">
                          <label>姓名：</label>
                          <span>{{ userInfo?._name || userInfo?.name || "—" }}</span>
                        </div>
                        <div class="info-item">
                          <label>学号：</label>
                          <span>{{ userInfo?._account || userInfo?.account || "—" }}</span>
                        </div>
                        <div class="info-item">
                          <label>专业：</label>
                          <span>{{ userInfo?._major || userInfo?.major || "未填写" }}</span>
                        </div>
                        <div class="info-item">
                          <label>学院：</label>
                          <span>{{ userInfo?._department || userInfo?.department || "未填写" }}</span>
                        </div>
                        <div class="info-item">
                          <label>邮箱：</label>
                          <span>{{ userInfo?._email || userInfo?.email || "未填写" }}</span>
                        </div>
                        <div class="info-item">
                          <label>最大可借：</label>
                          <span>{{ userInfo?._max_num || userInfo?._max_num || "--" }}</span>
                        </div>
                        <div class="info-item">
                          <label>当前借阅：</label>
                          <span>{{ userInfo?.lend_num || userInfo?.lend_num || "--" }}</span>
                        </div>
                        <div class="info-actions">
                          <button @click="toggleEdit" class="edit-btn">更换邮箱</button>
                        </div>
                      </template>
                      <template v-else>
                        <!-- 编辑模式内容 -->
                        <form @submit.prevent="saveEdit">
                          <div class="info-item">
                            <label>邮箱：</label>
                            <input v-model="editUser._email" />
                          </div>
                          <div class="info-actions">
                            <button type="submit" class="save-btn">保存</button>
                            <button @click="toggleEdit" class="cancel-btn">取消</button>
                          </div>
                        </form>
                      </template>
                    </div>
                  </div>
              </div>
             <!-- 我的借阅 -->
              <div v-if="personalTab === 'borrowing'">
                <h2>我的借阅</h2>
                <!-- 未登录提示 -->
                <div v-if="!isLoggedIn" class="login-prompt">
                  <h2>请先登录</h2>
                  <p>您需要登录后才能查看借阅记录</p>
                  <button @click="goToAuth('login')" class="login-btn">立即登录</button>
                </div>
                <!-- 已登录才显示的内容 -->
                <div v-else>
                  <!-- 在这里添加调试按钮 -->
                  <button @click="forceRefreshBorrowingInfo" class="debug-btn" style="position: fixed; top: 100px; right: 20px; z-index: 1000; background: #ff6b6b; color: white; padding: 8px 12px; border-radius: 4px; font-size: 14px;">
                    强制刷新借阅信息
                  </button>
                  <div class="personal-search">
                    <select v-model="borrowingSearchType" class="search-select">
                      <option value="book">按图书名称查询</option>
                      <option value="author">按作者姓名查询</option>
                      <option value="date">按借阅时间查询</option>
                    </select>
                    <template v-if="borrowingSearchType !== 'date'">
                      <input
                        type="text"
                        v-model="borrowingSearchQuery"
                        placeholder="请输入查询内容"
                      />
                    </template>
                    <template v-else>
                      <div class="date-range-inputs">
                        <input
                          type="date"
                          v-model="borrowingStartDate"
                          class="date-input"
                          :max="borrowingEndDate || today"
                        />
                        <span class="date-separator">至</span>
                        <input
                          type="date"
                          v-model="borrowingEndDate"
                          class="date-input"
                          :min="borrowingStartDate"
                          :max="today"
                        />
                      </div>
                    </template>
                    <button @click="searchBorrowing">检索</button>
                  </div>
                  <div class="status-tabs">
                    <button
                      :class="{ active: borrowingStatus === 'borrowing' }"
                      @click="borrowingStatus = 'borrowing'"
                    >
                      借阅中 ({{ borrowingStats?.borrowing || 0 }})
                    </button>
                    <button
                      :class="{ active: borrowingStatus === 'returned' }"
                      @click="borrowingStatus = 'returned'"
                    >
                      已归还 ({{ borrowingStats?.returned || 0 }})
                    </button>
                    <button
                      :class="{ active: borrowingStatus === 'ordering' }"
                      @click="borrowingStatus = 'ordering'"
                    >
                      预约中 ({{ borrowingStats?.ordering || 0 }})
                    </button>
                  </div>
                  <table id="borrowing-table">
                    <thead>
                      <tr>
                        <th>序号</th>
                        <th>ISBN</th>
                        <th>图书名称</th>
                        <!-- 借阅中和已归还状态 -->
                        <template v-if="borrowingStatus !== 'ordering'">
                          <th>借阅日期</th>
                          <th>截止日期</th>
                          <th v-if="borrowingStatus === 'returned'">归还日期</th>
                          <th>状态</th>
                          <th v-if="borrowingStatus === 'borrowing'">操作</th>
                        </template>
                        <!-- 预约中状态 -->
                        <template v-else>
                          <th>预约日期</th>
                          <th>预约状态</th>
                          <th>操作</th>
                        </template>
                      </tr>
                    </thead>

                    <tbody>
  <tr v-if="filteredBorrowingList.length === 0">
    <td
      :colspan="borrowingStatus === 'ordering' ? 7 : (borrowingStatus === 'returned' ? 8 : 7)"
      style="text-align: center; padding: 20px"
    >
      暂无{{ borrowingStatus === 'ordering' ? '预约' : '借阅' }}记录
    </td>
  </tr>
  <tr
    v-for="(record, index) in filteredBorrowingList"
    :key="record.id"
  >
    <td>{{ index + 1 }}</td>
    <td>{{ record.isbn }}</td>
    <td>{{ record.bookName }}</td>
    
    <!-- 借阅中和已归还状态的内容 -->
    <template v-if="record.type === 'borrowing'">
      <td>{{ record.borrowDate }}</td>
      <td>{{ record.dueDate }}</td>
      <td v-if="borrowingStatus === 'returned'">{{ record.returnDate }}</td>
      <td>
        <span
          class="status-tag"
          :class="record.status === 'borrowing' ? 'borrowing' : 'returned'"
        >
          {{ record.status === "borrowing" ? "借阅中" : "已归还" }}
        </span>
      </td>
      <td v-if="borrowingStatus === 'borrowing'">
        <button
          v-if="record.status === 'borrowing'"
          class="return-btn"
          @click="returnBook(record.id)"
        >
          还书
        </button>
        <button
          v-if="record.status === 'borrowing'"
          class="delay-btn"
          @click="renewBook(record.id)"
        >
          续借
        </button>
      </td>
    </template>
    
    <!-- 预约中状态的内容 -->
    <template v-else-if="record.type === 'ordering'">
      <td>{{ record.borrowDate }}</td>
      <td>
        <span class="status-tag ordering">
          {{ record.status }}
        </span>
      </td>
      <td>
        <button
          v-if="record.reserveStatus === 'ready'"
          class="confirm-btn"
          @click="convertOrderToBorrow(record.id)"
        >
          确认取书
        </button>
        <button
          v-else-if="record.reserveStatus === 'pending'"
          class="cancel-btn"
          @click="cancelOrder(record.id)"
        >
          取消预约
        </button>
      </td>
    </template>
  </tr>
</tbody>




                    
                  </table>
                </div>
              </div>
              <!-- 借阅图谱 -->
              <div v-if="personalTab === 'borrowing_total'">
                <h2>借阅图谱</h2>
                <!-- 未登录提示 -->
                <div v-if="!isLoggedIn" class="login-prompt">
                  <h2>请先登录</h2>
                  <p>您需要登录后才能查看借阅图谱</p>
                  <button @click="goToAuth('login')" class="login-btn">立即登录</button>
                </div>
                <!-- 已登录才显示的内容 -->
                <div v-else>
                  <VisualizationCharts :user="user" />
                </div>
              </div>
            </div>
          </div>
        </div> 

        <!-- 公告信息 -->
        <div v-if="currentPage === 'aid'">
          <div class="search-container">
            <div class="searchbar announcement-search-bar">
              <select v-model="announcementSearchType" class="search-select">
                <option value="title">按标题查询</option>
                <option value="content">按内容查询</option>
                <option value="date">按日期查询</option>
              </select>
              <template v-if="announcementSearchType !== 'date'">
                <input
                  type="text"
                  v-model="announcementSearchQuery"
                  placeholder="请输入查询内容"
                />
              </template>
              <template v-else>
                <div class="date-range-inputs">
                  <input
                    type="date"
                    v-model="announcementStartDate"
                    class="date-input"
                    :max="announcementEndDate || today"
                  />
                  <span class="date-separator">至</span>
                  <input
                    type="date"
                    v-model="announcementEndDate"
                    class="date-input"
                    :min="announcementStartDate"
                    :max="today"
                  />
                </div>
              </template>
              <button @click="applyAnnouncementFilter">检索</button>
              <button @click="clearAnnouncementFilter" class="date-clear-btn">
                清空
              </button>
            </div>
          </div>
          <h1>公告信息</h1>
          <ul id="announcement-list" class="announcement-list">
            <li
              v-for="announcement in currentAnnouncementItems"
              :key="announcement._id"
            >
              <div class="announcement-title">{{ announcement._title }}</div>
              <div class="announcement-date">{{ announcement._date }}</div>
              <div class="announcement-content">
                {{ announcement._content }}
              </div>
            </li>
          </ul>
          <!-- 公告信息分页 -->
          <div class="pagination" v-if="filteredAnnouncements.length > 0">
            <span class="total-pages">共{{ totalAnnouncementPages }}页</span>
            <span class="page-numbers">
              <button
                @click="changeAnnouncementPage(1)"
                :disabled="currentAnnouncementPage === 1"
              >
                首页
              </button>
              <button
                @click="changeAnnouncementPage(currentAnnouncementPage - 1)"
                :disabled="currentAnnouncementPage === 1"
              >
                上一页
              </button>
              <button
                v-for="page in visibleAnnouncementPages"
                :key="'announcement-page-' + page"
                @click="changeAnnouncementPage(page)"
                :class="{ active: currentAnnouncementPage === page }"
              >
                {{ page }}
              </button>
              <button
                @click="changeAnnouncementPage(currentAnnouncementPage + 1)"
                :disabled="currentAnnouncementPage === totalAnnouncementPages"
              >
                下一页
              </button>
              <button
                @click="changeAnnouncementPage(totalAnnouncementPages)"
                :disabled="currentAnnouncementPage === totalAnnouncementPages"
              >
                末页
              </button>
            </span>
          </div>
          <div v-if="filteredAnnouncements.length === 0" class="no-results">
            暂无公告信息
          </div>
        </div>
          <!-- 意见建议 -->
      <div v-if="currentPage === 'feedback'">
        <div class="search-container">
          <div class="searchbar">
            <select v-model="searchType" class="search-select">
              <option value="book">按图书名称查询</option>
              <option value="author">按作者姓名查询</option>
            </select>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="请输入查询内容"
            />
            <button @click="gotoSearchResult">检索</button>
          </div>
        </div>

        <div class="feedback-container">
          <button @click="changePage('search')" class="back-btn">返回</button>
          <h2>意见建议</h2>
          <!-- 未登录提示 -->
          <div v-if="!isLoggedIn" class="login-prompt">
            <h2>请先登录</h2>
            <p>您需要登录后才能提交意见建议</p>
            <button @click="goToAuth('login')" class="login-btn">立即登录</button>
          </div>
          <!-- 已登录才显示的内容 -->
          <div v-else>
            <div class="feedback-tabs">
              <button
                :class="{ active: feedbackTab === 'new' }"
                @click="feedbackTab = 'new'"
              >
                提交新意见
              </button>
              <button
                :class="{ active: feedbackTab === 'history' }"
                @click="feedbackTab = 'history'"
              >
                历史记录
              </button>
            </div>
            <!-- 提交新意见表单 -->
            <div v-if="feedbackTab === 'new'" class="feedback-form-container">
              <form
                @submit.prevent="handleFeedbackSubmit"
                class="feedback-form"
              >
                <div class="form-row">
                  <label>姓名 <span class="required">*</span></label>
                  <input
                    type="text"
                    v-model.trim="feedbackName"
                    placeholder="请输入姓名"
                    required
                  />
                </div>
                <div class="form-row">
                  <label>邮箱</label>
                  <input
                    type="email"
                    v-model.trim="feedbackEmail"
                    placeholder="选填：example@mail.com"
                  />
                </div>
                <div class="form-row">
                  <label>类别</label>
                  <select v-model="feedbackType">
                     <option v-for="type in messageTypes" :key="type._mtid" :value="type._mtname">{{ type._mtname }}</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>意见内容 <span class="required">*</span></label>
                  <textarea
                    v-model="feedbackMessage"
                    rows="6"
                    placeholder="请填写您的投诉或荐购"
                    required
                  ></textarea>
                </div>
                <div class="form-row form-actions">
                  <span class="error-message" v-if="feedbackError">{{
                    feedbackError
                  }}</span>
                  <button type="submit">提交</button>
                </div>
              </form>
            </div>
            <!-- 意见建议历史记录 -->
            <div v-if="feedbackTab === 'history'" class="feedback-history">
              <div v-if="feedbackHistory.length === 0" class="no-history">
                暂无意见建议记录
              </div>
              <div class="history-list">
                <div
                  class="history-item"
                  v-for="(item, index) in feedbackHistory"
                  :key="index"
                >
                  <div class="history-header">
                    <div class="history-title">
                      {{ item.type }}：{{ item.message.substring(0, 30)
                      }}{{ item.message.length > 30 ? "..." : "" }}
                    </div>
                    <div class="history-date">{{ item.date }}</div>
                  </div>
                  <div class="history-content">
                    <p><strong>姓名：</strong>{{ item.name }}</p>
                    <p><strong>邮箱：</strong>{{ item.email || "未提供" }}</p>
                    <p><strong>内容：</strong>{{ item.message }}</p>
                  </div>
                </div>
              </div>
            </div>
              <!-- 历史记录分页 -->
              <div class="pagination" v-if="feedbackHistory.length > 0">
                <span class="total-pages">共{{ totalFeedbackPages }}页</span>
                <span class="page-numbers">
                  <button
                    @click="changeFeedbackPage(1)"
                    :disabled="currentFeedbackPage === 1"
                  >
                    首页
                  </button>
                  <button
                    @click="changeFeedbackPage(currentFeedbackPage - 1)"
                    :disabled="currentFeedbackPage === 1"
                  >
                    上一页
                  </button>
                  <button
                    v-for="page in visibleFeedbackPages"
                    :key="'feedback-page-' + page"
                    @click="changeFeedbackPage(page)"
                    :class="{ active: currentFeedbackPage === page }"
                  >
                    {{ page }}
                  </button>
                  <button
                    @click="changeFeedbackPage(currentFeedbackPage + 1)"
                    :disabled="currentFeedbackPage === totalFeedbackPages"
                  >
                    下一页
                  </button>
                  <button
                    @click="changeFeedbackPage(totalFeedbackPages)"
                    :disabled="currentFeedbackPage === totalFeedbackPages"
                  >
                    末页
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- 回到顶部按钮 -->
      <button class="back-to-top" @click="scrollToTop" aria-label="回到顶部">
        <img :src="topIcon" alt="top" />
      </button>
    </div>
  </div>
</template>

<script>

import VisualizationCharts from '@/components/VisualizationCharts.vue';

/* eslint-disable */
import axios from "axios";
import slide1 from "@/assets/slide1.jpg";
import slide2 from "@/assets/slide2.jpg";
import slide3 from "@/assets/slide3.jpg";
import slide4 from "@/assets/slide4.jpg";
import slide5 from "@/assets/slide5.jpg";
import topIcon from "@/assets/top.jpg";

// 设置axios默认配置
axios.defaults.baseURL = "";

// 请求拦截器添加token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const msg = error?.response?.data?.message || error?.message || "";
      const status = error?.response?.status;
      if (status === 401 || /token/i.test(msg)) {
        // 对于公开接口（如图书列表、公告等）不弹出登录提示
        // 只对需要认证的操作（借阅、收藏等）进行处理
        const url = error?.response?.config?.url || "";
        const publicEndpoints = [
          "/api/books",
          "/api/categories",
          "/api/announcements",
        ];

        // 如果是公开接口的401错误，不弹出提示
        const isPublicEndpoint = publicEndpoints.some((endpoint) =>
          url.includes(endpoint)
        );

        if (!isPublicEndpoint) {
          // 使用更友好的提示替换后端原始提示
          try {
            window.alert("登录状态已过期或未登录，请先登录。");
          } catch (e) {
            /* ignore */
          }
          // 重定向到首页登录表单，并保留当前页面用于登录后跳回
          const redirect = window.location.pathname || "/readers";
          window.location.href = `/?redirect=${encodeURIComponent(
            redirect
          )}&view=login`;
        }
      }
    } catch (e) {
      // ignore interceptor errors
    }
    return Promise.reject(error);
  }
);

export default {
  name: "UserPortal",
  components: {
    // ... 其他组件
    VisualizationCharts
  },
  data() {
    return {
      // 消息系统相关
      showMessagePanel: false,
      messages: [], // 消息列表
      currentMessage: null, // 当前查看的消息详情
      showMessageDetail: false, // 是否显示消息详情
      // 意见建议相关
      feedbackTab: "new", // new 或 history
      feedbackHistory: [],
      currentFeedbackPage: 1,
      feedbacksPerPage: 5,
      
      // 意见建议表单数据
      feedbackName: "",
      feedbackEmail: "",
      feedbackType: "建议",
      feedbackMessage: "",
      feedbackError: "",
   
      messageTypes:[], // 消息类型列表
      // 登录提醒相关
      hasShownLoginReminder: false, // 是否已显示登录提醒
      clickedSearch: false, // 添加这个标志位来跟踪是否点击了检索按钮或选择了分类
      showUserDropdown: false, // 控制用户下拉菜单显示状态
      selectedCategories: [], // 存储已选择的类别
      lastToken: null, // 存储上次的token
      lastUserInfo: null, // 存储上次的userInfo
      currentPage: "search",
      pageType: "",
      searchType: "book",
      searchQuery: "",
      books: [],
      newBooks: [],
      hotBooks: [],
      borrowingInfo: [],
      borrowingHistory: [],
      announcements: [],
      currentBook: null,
      carouselImages: [slide1, slide2, slide3, slide4, slide5],
      topIcon: topIcon,
      carouselIndex: 0,
      carouselTimer: null,
      currentPageNum: 1,
      rowsPerPage: 10,
      // 在全部图书页面使用每页 16 本（2 行 x 8 列）
      allBooksRowsPerPage: 16,
      // 控制新书和热门推荐的显示数量
      newBooksPerPage: 10,
      hotBooksPerPage: 10,
      bookCategories: [],
      currentCategory: "",

      // 个人信息页面相关数据
      personalTab: "account",
      userInfo: null,
      borrowingList: [],
      // 用于保存未过滤的借阅记录，用作检索基准
      allBorrowingRecords: [],
      borrowingStats: { total: 0, borrowing: 0, returned: 0 },
      borrowingSearchType: "book",
      borrowingSearchQuery: "",
      borrowingStatus: "all",

      // 搜索结果页面相关数据
      currentSearchResultPageNum: 1,

      // 验证码相关
      captchaCode: "",
      captchaImage: "",
      // 我的借阅搜索新增日期范围字段
      borrowingStartDate: "",
      borrowingEndDate: "",
      // 公共日期字段
      today: new Date().toISOString().split("T")[0],
      // 公告检索相关
      announcementSearchType: "title", // 'date' | 'title' | 'content'
      announcementSearchQuery: "",
      // 公告日期筛选相关
      announcementStartDate: "",
      announcementEndDate: "",
      today: new Date().toISOString().split("T")[0], // 获取今天的日期，格式为 YYYY-MM-DD
      // 图片加载错误记录（按图书id标记）
      imgErrorMap: {},
      // 当前登录用户信息（从 localStorage 读取）
      user: null,
      // 编辑模式与编辑表单数据
      editMode: false,
      editUser: {
        _name: "",
        _account: "",
        _email: "",
      },
      // 公告分页相关状态（每页显示3个公告）
      currentAnnouncementPage: 1,
      announcementsPerPage: 3,
    };
  },
  computed: {
    isBookOrdered() {
    if (!this.currentBook || !this.currentBook._bid) return false;
    return this.allBorrowingRecords.some(record => 
      record.type === 'ordering' && 
      record.bookId === this.currentBook._bid && 
      ['pending', 'ready'].includes(record.reserveStatus)
    );
  },
    unreadMessageCount() {
      return this.messages.filter(msg => !msg.status).length;
    },
    isLoggedIn() {
      return !!localStorage.getItem("token") && !!this.user;
    },
    searchInputClasses() {
      return {
        "has-tags": this.selectedCategories.length > 0,
      };
    },
    searchStatusText() {
      const parts = [];
      if (this.selectedCategories.length > 0) {
        parts.push(
          `类别: ${this.selectedCategories.map((cat) => cat.label).join(", ")}`
        );
      }
      if (this.searchQuery) {
        parts.push(
          `${this.searchType === "book" ? "书名" : "作者"}: ${this.searchQuery}`
        );
      }
      return parts.length > 0 ? parts.join(" | ") : "全部图书";
    },
    avatarUrl() {
      const u = this.user || this.userInfo;
      if (!u) return "";
      return u.avatar || u._avatar || u.avatar_url || u._cover_url || "";
    },
    hasReminders() {
      return this.overdueBooks.length > 0 || this.upcomingDueBooks.length > 0;
    },
    // 原有计算属性保持不变
    filteredBooks() {
      let result = [...this.books];

      // 根据pageType选择正确的数据源
      if (this.pageType === "new") {
        result = [...this.newBooks];
      } else if (this.pageType === "hot") {
        result = [...this.hotBooks];
      } else {
        // "all" 类型显示所有图书
        result = [...this.books];
      }

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter((book) => {
          if (this.searchType === "book") {
            return book._book_name.toLowerCase().includes(query);
          } else {
            return book._author.toLowerCase().includes(query);
          }
        });
      }
      // 分类筛选 - 支持多分类
      if (this.selectedCategories.length > 0) {
        result = result.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return this.selectedCategories.some(
            (cat) => String(cat.value) === String(bookTid)
          );
        });
      }

      return result;
    },

    filteredNewBooks() {
      let result = [...this.newBooks];

      // 分类筛选 - 支持多分类
      if (this.selectedCategories.length > 0) {
        result = result.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return this.selectedCategories.some(
            (cat) => String(cat.value) === String(bookTid)
          );
        });
      }

      // 搜索筛选（只有点击检索按钮或分类后才生效）
      if (this.searchQuery && this.clickedSearch) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter((book) => {
          // 检查书名、作者或分类名称是否匹配搜索词
          const bookTid = book._tid || (book.category && book.category._tid);
          const categoryName =
            this.bookCategories.find(
              (cat) => String(cat.value) === String(bookTid)
            )?.label || "";

          if (this.searchType === "book") {
            return (
              book._book_name.toLowerCase().includes(query) ||
              categoryName.toLowerCase().includes(query)
            );
          } else {
            return book._author.toLowerCase().includes(query);
          }
        });
      }

      return result.slice(0, this.newBooksPerPage);
    },

    filteredHotBooks() {
      let result = [...this.hotBooks];

      // 分类筛选 - 支持多分类
      if (this.selectedCategories.length > 0) {
        result = result.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return this.selectedCategories.some(
            (cat) => String(cat.value) === String(bookTid)
          );
        });
      }

      // 搜索筛选（只有点击检索按钮或分类后才生效）
      if (this.searchQuery && this.clickedSearch) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter((book) => {
          // 检查书名、作者或分类名称是否匹配搜索词
          const bookTid = book._tid || (book.category && book.category._tid);
          const categoryName =
            this.bookCategories.find(
              (cat) => String(cat.value) === String(bookTid)
            )?.label || "";

          if (this.searchType === "book") {
            return (
              book._book_name.toLowerCase().includes(query) ||
              categoryName.toLowerCase().includes(query)
            );
          } else {
            return book._author.toLowerCase().includes(query);
          }
        });
      }

      return result.slice(0, this.newBooksPerPage);
    },

    // 公告过滤：按发布时间(_date)、标题(_title)、内容(_content)模糊匹配
    filteredAnnouncements() {
      if (!Array.isArray(this.announcements)) return [];

      // 先进行原始筛选（标题、内容等）
      const q = (this.announcementSearchQuery || "").trim().toLowerCase();
      let filtered = this.announcements;

      if (q) {
        if (this.announcementSearchType === "content") {
          filtered = this.announcements.filter((a) =>
            (a._content || "").toLowerCase().includes(q)
          );
        } else {
          // 默认按标题
          filtered = this.announcements.filter((a) =>
            (a._title || "").toLowerCase().includes(q)
          );
        }
      }

      // 再进行日期范围筛选
      if (this.announcementStartDate || this.announcementEndDate) {
        filtered = filtered.filter((announcement) => {
          const announcementDate = new Date(announcement._date);

          if (this.announcementStartDate && this.announcementEndDate) {
            const startDate = new Date(this.announcementStartDate);
            const endDate = new Date(this.announcementEndDate);
            // 将结束日期设为当天的最后一刻以包含整个结束日
            endDate.setHours(23, 59, 59, 999);
            return announcementDate >= startDate && announcementDate <= endDate;
          } else if (this.announcementStartDate) {
            const startDate = new Date(this.announcementStartDate);
            return announcementDate >= startDate;
          } else if (this.announcementEndDate) {
            const endDate = new Date(this.announcementEndDate);
            // 将结束日期设为当天的最后一刻以包含整个结束日
            endDate.setHours(23, 59, 59, 999);
            return announcementDate <= endDate;
          }

          return true;
        });
      }

      return filtered;
    },

    totalPages() {
      // 直接使用 filteredBooks 的结果
      const result = this.filteredBooks;
      const perPage =
        this.currentPage === "allBooks"
          ? this.allBooksRowsPerPage
          : this.rowsPerPage;
      return Math.ceil(result.length / perPage) || 1;
    },

    currentPageItems() {
      // 直接使用 filteredBooks 的结果
      const result = this.filteredBooks;
      const perPage =
        this.currentPage === "allBooks"
          ? this.allBooksRowsPerPage
          : this.rowsPerPage;
      const start = (this.currentPageNum - 1) * perPage;
      const end = start + perPage;
      return result.slice(start, end);
    },
    // 新增：公告分页相关计算属性
    totalAnnouncementPages() {
      return (
        Math.ceil(
          this.filteredAnnouncements.length / this.announcementsPerPage
        ) || 1
      );
    },
    currentAnnouncementItems() {
      const start =
        (this.currentAnnouncementPage - 1) * this.announcementsPerPage;
      const end = start + this.announcementsPerPage;
      return this.filteredAnnouncements.slice(start, end);
    },
    visibleAnnouncementPages() {
      return this.generateVisiblePages(
        this.currentAnnouncementPage,
        this.totalAnnouncementPages
      );
    },
    // 首页“全部图书”预览：只显示第一行 8 本
    previewAllBooks() {
      const dataSource =
        this.filteredBooks.length > 0 ? this.filteredBooks : this.books;
      return dataSource.slice(0, 8);
    },
    visiblePages() {
      return this.generateVisiblePages(this.currentPageNum, this.totalPages);
    },

    // 意见建议分页计算属性
    currentFeedbackItems() {
      const start = (this.currentFeedbackPage - 1) * this.feedbacksPerPage;
      const end = start + this.feedbacksPerPage;
      return this.feedbackHistory.slice(start, end);
    },
    totalFeedbackPages() {
      return (
        Math.ceil(this.feedbackHistory.length / this.feedbacksPerPage) || 1
      );
    },
    visibleFeedbackPages() {
      return this.generateVisiblePages(
        this.currentFeedbackPage,
        this.totalFeedbackPages
      );
    },

    // 搜索结果相关计算属性
    // ... existing code ...
    filteredSearchResults() {
      let allBooks = [...this.books];

      // 分类筛选 - 支持多分类
      if (this.selectedCategories.length > 0) {
        allBooks = allBooks.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return this.selectedCategories.some(
            (cat) => String(cat.value) === String(bookTid)
          );
        });
      }

      // 搜索筛选（只有点击检索按钮或分类后才生效）
      if (this.searchQuery && this.clickedSearch) {
        const query = this.searchQuery.toLowerCase();
        allBooks = allBooks.filter((book) => {
          // 检查书名、作者或分类名称是否匹配搜索词
          const bookTid = book._tid || (book.category && book.category._tid);
          const categoryName =
            this.bookCategories.find(
              (cat) => String(cat.value) === String(bookTid)
            )?.label || "";

          if (this.searchType === "book") {
            return (
              book._book_name.toLowerCase().includes(query) ||
              categoryName.toLowerCase().includes(query)
            );
          } else {
            return book._author.toLowerCase().includes(query);
          }
        });
      }

      return allBooks;
    },

    totalSearchResultPages() {
      return (
        Math.ceil(this.filteredSearchResults.length / this.rowsPerPage) || 1
      );
    },

    currentSearchResultItems() {
      const start = (this.currentSearchResultPageNum - 1) * this.rowsPerPage;
      const end = start + this.rowsPerPage;
      return this.filteredSearchResults.slice(start, end);
    },

    visibleSearchResultPages() {
      return this.generateVisiblePages(
        this.currentSearchResultPageNum,
        this.totalSearchResultPages
      );
    },
    filteredBorrowingList() {
    if (!Array.isArray(this.allBorrowingRecords)) return [];
    
    let result = [...this.allBorrowingRecords];
    
    // 根据状态筛选
    if (this.borrowingStatus === "borrowing") {
      result = result.filter(r => r.type === 'borrowing' && r.status === "borrowing");
    } else if (this.borrowingStatus === "returned") {
      result = result.filter(r => r.type === 'borrowing' && r.status === "returned");
    } else if (this.borrowingStatus === 'ordering') { // 预约状态
      result = result.filter(r => r.type === 'ordering');
    }

    // 搜索筛选
    if (this.borrowingSearchQuery) {
      const query = this.borrowingSearchQuery.toLowerCase();
      result = result.filter(record => {
        if (this.borrowingSearchType === "book") {
          return (record.bookName || '').toLowerCase().includes(query);
        } else if (this.borrowingSearchType === "author") {
          return (record.author || '').toLowerCase().includes(query);
        }
        return false;
      });
    }

    return result;
  },

    // 当前借阅数量（按借阅记录计数，同一本书借两本计2）
    currentBorrowCount() {
  // 直接使用用户信息中的借阅数量，这应该是最准确的
  return this.user?.lend_num || this.userInfo?.lend_num || 0;
},

    avatarUrl() {
      // 优先使用 user.avatar 或 user._avatar 或 user.avatar_url 等常见字段
      const u =
        this.user ||
        (localStorage.getItem("userInfo")
          ? JSON.parse(localStorage.getItem("userInfo"))
          : null);
      if (!u) return "";
      return u.avatar || u._avatar || u.avatar_url || u._cover_url || "";
    },
  },
  methods: {
    // 添加强制刷新借阅信息的方法
    async forceRefreshBorrowingInfo() {
    try {
    console.log('强制刷新借阅信息...');
    await this.loadBorrowingInfo();
    console.log('强制刷新完成');
    } catch (error) {
    console.error('强制刷新失败:', error);
    }
    },
    checkDataConsistency() {
    // 检查是否有重复的预约记录
    const bookOrders = {};
    const duplicates = [];
    
    this.allBorrowingRecords.forEach(record => {
      if (record.type === 'ordering') {
        const key = `${record.bookId}_${record.reserveStatus}`;
        if (bookOrders[key]) {
          duplicates.push({
            bookId: record.bookId,
            status: record.reserveStatus,
            records: [bookOrders[key], record]
          });
        } else {
          bookOrders[key] = record;
        }
      }
    });
    
    if (duplicates.length > 0) {
      console.warn('发现重复的预约记录:', duplicates);
      // 可以选择自动清理或提示用户
    }
  },
     // 从后端加载图书类别列表并映射为 {label,value} 格式
    async loadBookCategories() {
      try {
        const res = await axios.get("/api/categories");
        const list =
          (res && res.data && res.data.data && res.data.data.catlist) || [];
        const mapped = [{ label: "全部", value: "" }].concat(
          list.map((c) => ({
            label: c._type_name || c._typeName || String(c),
            value:
              c._tid !== undefined && c._tid !== null
                ? c._tid
                : c._type_name || "",
          }))
        );
        this.bookCategories = mapped;
      } catch (e) {
        console.warn(
          "加载分类失败，使用默认分类列表",
          e && e.response ? e.response.data : e
        );
        // 回退到默认静态分类，保证页面不空
        this.bookCategories = [
          { label: "全部", value: "" },
          { label: "科技", value: "科技" },
          { label: "小说", value: "小说" },
          { label: "金融", value: "金融" },
          { label: "教育", value: "教育" },
          { label: "生活", value: "生活" },
          { label: "历史", value: "历史" },
          { label: "童书", value: "童书" },
          { label: "励志", value: "励志" },
        ];
      }
    },

    searchBorrowing() {
      try {
        const q = (this.borrowingSearchQuery || "").trim().toLowerCase();
        // 如果查询为空，恢复完整列表
        if (!q) {
          this.borrowingList = Array.isArray(this.allBorrowingRecords)
            ? [...this.allBorrowingRecords]
            : [];
          this.borrowingStats = {
            total: this.borrowingList.length,
            borrowing: this.borrowingList.filter(
              (r) => r.status === "borrowing"
            ).length,
            returned: this.borrowingList.filter((r) => r.status === "returned")
              .length,
          };
          return;
        }

        let filtered = [];
        if (this.borrowingSearchType === "book") {
          filtered = this.allBorrowingRecords.filter((r) =>
            (r.bookName || "").toLowerCase().includes(q)
          );
        } else if (this.borrowingSearchType === "author") {
          filtered = this.allBorrowingRecords.filter((r) =>
            (r.author || "").toLowerCase().includes(q)
          );
        } else if (this.borrowingSearchType === "date") {
          filtered = this.allBorrowingRecords.filter((r) => {
            const borrowDate = (r.borrowDate || "").toLowerCase();
            const dueDate = (r.dueDate || "").toLowerCase();
            return borrowDate.includes(q) || dueDate.includes(q);
          });
        } else {
          // 全字段模糊匹配
          filtered = this.allBorrowingRecords.filter((r) => {
            const hay = `${r.bookName || ""} ${r.author || ""} ${
              r.borrowDate || ""
            } ${r.dueDate || ""}`.toLowerCase();
            return hay.includes(q);
          });
        }

        this.borrowingList = filtered;
        this.borrowingStats = {
          total: this.borrowingList.length,
          borrowing: this.borrowingList.filter((r) => r.status === "borrowing")
            .length,
          returned: this.borrowingList.filter((r) => r.status === "returned")
            .length,
        };
      } catch (e) {
        console.warn("searchBorrowing error", e);
      }
    },

    filterNewAndHotBooks() {
      // 新书推荐：按添加时间排序，取最新的30本
      this.newBooks = [...this.books]
        .sort((a, b) => new Date(b._add_time) - new Date(a._add_time))
        .slice(0, 30)
        .map((book) => ({ ...book, isNew: true, isHot: false })); // 标记为新书

      // 热门推荐：按借阅次数排序，取借阅次数最多的30本
      this.hotBooks = [...this.books]
        .sort((a, b) => b._times - a._times)
        .slice(0, 30)
        .map((book) => ({ ...book, isNew: false, isHot: true })); // 标记为热门

      // 为其他图书添加标志
      this.books = this.books.map((book) => {
        // 检查是否在新书或热门列表中
        const inNewList = this.newBooks.some((nb) => nb._bid === book._bid);
        const inHotList = this.hotBooks.some((hb) => hb._bid === book._bid);

        return {
          ...book,
          isNew: inNewList,
          isHot: inHotList,
        };
      });
    },

    // 图片加载错误处理，recordOrBook 可以是包含 id/ _bid / bookId 的对象
    handleImgError(event, recordOrBook) {
      try {
        const key =
          recordOrBook &&
          (recordOrBook._bid || recordOrBook.bookId || recordOrBook.id);
        if (key) {
          this.$set(this.imgErrorMap, key, true);
        }
        if (event && event.target) {
          event.target.style.display = "none";
        }
      } catch (e) {
        console.warn("handleImgError error", e);
      }
    },

    // 处理相对路径或非http的封面地址，返回可用于<img>的完整URL或空字符串
    getFullCoverUrl(src) {
      if (!src) return "";
      try {
        if (/^https?:\/\//i.test(src)) return src;
        if (src.startsWith("/")) return window.location.origin + src;
        return src;
      } catch (e) {
        return src;
      }
    },

    // 加载消息类型
    async loadMessageTypes() {
        try {
          console.log("开始获取消息类型")
        const response = await axios.get('/api/messages/types');
        console.log("成功获取消息类型数据：",response.data)
        if (response.data.success) {
          this.messageTypes = response.data.data;
          // 如果当前选中的类型不在列表中，则设置为默认值
          if (!this.messageTypes.find(type => type._mtname === this.feedbackType)) {
            this.feedbackType = this.messageTypes.length > 0 ? this.messageTypes[0]._mtname : '';
         }
        }
      } catch (error) {
        console.error('加载消息类型失败:', error);
      }
    },



    async loadAnnouncements() {
      try {
        const response = await axios.get("/api/announcements");
        const res = response && response.data ? response.data : {};
        const payload = res.data || {};

        // 后端返回格式示例: { success: true, message: '...', data: { annlist: [...] } }
        // 兼容多种可能的返回结构，优先取 payload.annlist
        let list = [];
        if (Array.isArray(payload)) {
          list = payload;
        } else if (Array.isArray(payload.annlist)) {
          list = payload.annlist;
        } else if (Array.isArray(res.annlist)) {
          list = res.annlist;
        } else if (Array.isArray(res.data)) {
          list = res.data;
        }

        // 归一化字段以匹配模板中使用的字段（例如模板中使用 _id、_title、_date、_content）
        this.announcements = list.map((a) => ({
          _id: a._aid || a._id || a.id || null,
          _title: a._title || a.title || "",
          _date: a._date || a.date || "",
          _content: a._content || a.content || "",
          _publisher: a._publisher || a.publisher || "",
        }));
      } catch (error) {
        alert(
          "加载公告失败: " + (error.response?.data?.message || error.message)
        );
      }
    },

    async loadBorrowingHistory() {
      try {
        // 获取我的借阅记录（全部，包括已归还）
        const response = await axios.get("/api/borrow-records/my");
        const records =
          (response &&
            response.data &&
            response.data.data &&
            response.data.data.ownlist) ||
          [];

        this.borrowingHistory = records.map((record) => ({
          _hid: record._hid,
          bookId: record._bid,
          bookName:
            (record.book && (record.book._book_name || record.book._name)) ||
            record._book_name ||
            "",
          borrowDate: record._begin_time
            ? new Date(record._begin_time).toISOString().split("T")[0]
            : "",
          returnDate:
            record._status === 1
              ? record._end_date
                ? new Date(record._end_date).toISOString().split("T")[0]
                : ""
              : "",
          status: record._status === 1 ? "已还" : "借阅中",
        }));
      } catch (error) {
        alert(
          "加载借阅历史失败: " +
            (error.response?.data?.message || error.message)
        );
      }
    },
    async loadBorrowingInfo() {
  try {
    // 获取借阅记录
    const borrowResponse = await axios.get("/api/borrow-records/my");
    const borrowRecords = borrowResponse.data.data?.ownlist || [];

    // 获取预约记录
    const orderResponse = await axios.get("/api/book-order/my-orders");
    const orderRecords = orderResponse.data.data?.rows || [];

    // 处理借阅记录
    this.borrowingList = borrowRecords.map((record) => ({
      id: record._hid,
      bookId: record._bid,
      bookName: (record.book && (record.book._book_name || record.book._name)) || record._book_name || "",
      isbn: (record.book && record.book._isbn) || record._isbn || "",
      author: (record.book && record.book._author) || record._author || "",
      borrowDate: record._begin_time ? new Date(record._begin_time).toISOString().split("T")[0] : "",
      dueDate: record._end_date ? new Date(record._end_date).toISOString().split("T")[0] : "",
      returnDate: record._status === 1 ? (record._end_date ? new Date(record._end_date).toISOString().split("T")[0] : "") : "",
      status: record._status === 1 ? "returned" : "borrowing",
      type: 'borrowing'
    }));

    // 处理预约记录
    this.orderingList = orderRecords.map((order) => ({
      id: order._oid,
      bookId: order._bid,
      bookName: order.book ? (order.book._book_name || order.book._name) : '未知图书',
      isbn: order.book ? order.book._isbn : '',
      author: order.book ? order.book._author : '未知作者',
      borrowDate: order._otime ? new Date(order._otime).toISOString().split("T")[0] : '', // 预约日期
      dueDate: '', // 预约记录不需要截止日期
      status: this.getReserveStatusText(order._ostatus), // 使用预约状态
      reserveStatus: order._ostatus, // 保留原始状态用于判断
      type: 'ordering'
    }));

    // 保存完整副本以供检索使用
    this.allBorrowingRecords = [
      ...this.borrowingList,
      ...this.orderingList
    ];

    // 统计借阅状态
    this.borrowingStats = {
      total: this.borrowingList.length + this.orderingList.length,
      borrowing: this.borrowingList.filter(r => r.status === "borrowing").length,
      returned: this.borrowingList.filter(r => r.status === "returned").length,
      ordering: this.orderingList.length
    };
    
    console.log('加载的借阅记录:', this.borrowingList);
    console.log('加载的预约记录:', this.orderingList);
    console.log('所有记录:', this.allBorrowingRecords);
  } catch (error) {
    console.error("加载借阅信息失败:", error);
    alert("加载借阅信息失败: " + (error.response?.data?.message || error.message));
  }
},

    async loadSearchPage() {
    try {
      const response = await axios.get("/api/books");
      if (response.data.success) {
        this.books = response.data.data.booklist;
        this.filterNewAndHotBooks();
        this.currentPageNum = 1;
      }
    } catch (error) {
      this.$message.error("加载图书失败: " + (error.response?.data?.message || error.message));
    }
  },
    async renewBook(hid) {
      if (!hid) return;
      try {
        const response = await axios.put(`/api/books/${hid}/renew`);
        if (response && response.data && response.data.success) {
          alert("续借成功");
          await Promise.all([
            this.loadBorrowingInfo(),
            this.loadBorrowingHistory(),
          ]);
        } else {
          alert(
            "续借失败: " +
              ((response && response.data && response.data.message) || "")
          );
        }
      } catch (error) {
        console.error("续借失败:", error.response?.data || error.message);
        alert("续借失败: " + (error.response?.data?.message || error.message));
      }
    },

    async returnBook(hid) {
  if (!hid) return;
  
  try {
    const response = await axios.put(`/api/books/${hid}/return`);
    if (response.data.success) {
      this.$message.success("还书成功");
      
      // 重新获取最新的用户信息，而不是手动减一
      if (this.isLoggedIn) {
        await this.loadPersonalData(); // 这会从后端获取最新的用户信息
      }
      
      // 重新加载借阅信息
      await Promise.all([
        this.loadBorrowingInfo(),
        this.loadBorrowingHistory(),
      ]);
      
      // 重新加载图书数据
      await this.loadSearchPage();
    } else {
      this.$message.error("还书失败: " + response.data.message);
    }
  } catch (error) {
    console.error("还书失败:", error);
    this.$message.error("还书失败: " + (error.response?.data?.message || error.message));
  }
},
    async refreshCurrentPage() {
    // 保存当前页面状态
    const currentPage = this.currentPage;
    const currentBook = this.currentBook;
    const searchQuery = this.searchQuery;
    const currentPageNum = this.currentPageNum;
    
    try {
      this.loading = true;
      
      // 根据当前页面类型重新加载数据
      if (currentPage === "search") {
        await this.loadSearchPage();
        // 恢复搜索状态
        this.searchQuery = searchQuery;
        this.currentPageNum = currentPageNum;
      } else if (currentPage === "bookDetail" && currentBook) {
        const response = await axios.get(`/api/books/${currentBook._bid}?t=${Date.now()}`);
        if (response.data.success) {
          this.currentBook = response.data.data;
        }
      }
    } catch (error) {
      console.error("刷新页面失败:", error);
      this.$message.error("刷新失败: " + error.message);
    } finally {
      this.loading = false;
    }
  },
    // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
// 处理意见建议提交
async handleFeedbackSubmit() {
  // 验证必填字段
  if (!this.feedbackName || !this.feedbackName.trim()) {
    this.feedbackError = "请填写姓名";
    return;
  }

  if (!this.feedbackMessage || !this.feedbackMessage.trim()) {
    this.feedbackError = "请填写意见内容";
    return;
  }

  try {
    // 构建提交内容
    const feedbackContent = `
      意见建议类型：${this.feedbackType}
      提交者姓名：${this.feedbackName}
      联系邮箱：${this.feedbackEmail || '未提供'}
      意见内容：${this.feedbackMessage}
    `;

    // 发送请求
    const response = await axios.post('/api/messages', {
      _receiver_id: 1, // 管理员ID
      _title: `意见建议 - ${this.feedbackType}`,
      _content: feedbackContent,
      _mtid: 3 // 意见建议类型的消息
    });

    if (response.data.success) {
      alert("感谢您的反馈，已提交！");
      this.clearFeedbackForm();
      this.feedbackTab = "history";
      
      // 重新加载消息列表和历史记录
      await this.loadMessages();
      await this.loadFeedbackHistory();
    } else {
      this.feedbackError = response.data.message || "提交失败，请重试";
    }
  } catch (error) {
    console.error('提交意见建议失败:', error);
    this.feedbackError = "提交失败，请重试";
  }
},
//意见建议历史
async loadFeedbackHistory() {
  if (!this.isLoggedIn) return;
  
  console.log('=== 开始加载意见建议历史 ===');
  console.log('当前用户ID:', this.user._uid);
  
  try {
    // 获取当前用户发送的意见建议类型的消息（_mtid = 3）
    const response = await axios.get('/api/messages', {
      params: {
        page: 1,
        limit: 100,
        _mtid: 3, // 意见建议类型
        _sender_id: this.user._uid // 发送者是当前用户
      }
    });

    console.log('获取消息的响应:', response.data);

    if (response.data.success) {
      const messages = response.data.data.messages || [];
      console.log('获取到的消息数量:', messages.length);
      console.log('消息详情:', messages);

      // 转换消息数据为历史记录格式
      this.feedbackHistory = messages.map(msg => ({
        _mid: msg._mid,
        name: msg._content.match(/提交者姓名：(.*)/)?.[1] || '未知',
        email: msg._content.match(/联系邮箱：(.*)/)?.[1] || '',
        type: msg._content.match(/意见建议类型：(.*)/)?.[1] || '其他',
        message: msg._content.match(/意见内容：(.*)/)?.[1] || '',
        date: msg._create_time,
        status: msg._status === 0 ? '未读' : '已读',
        reply: msg._reply || '',
        // 保留原始消息内容和ID用于调试
        originalContent: msg._content,
        sender_id: msg._sender_id,
        receiver_id: msg._receiver_id
      }));
      
      console.log('解析后的意见建议历史:', this.feedbackHistory);
    }
  } catch (error) {
    console.error('加载意见建议历史失败:', error);
  }
},
    // 获取消息列表
  async loadMessages() {
    if (!this.isLoggedIn) return;
    
    try {
      const response = await axios.get('/api/messages', {
        params: {
          page: 1,
          limit: 10,
          type: 3 // 意见建议类型
        }
      });
      
      if (response.data.success) {
        this.messages = response.data.data.messages;
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  },
  // // 获取未读消息数量
  // async loadUnreadMessageCount() {
  //   if (!this.isLoggedIn) return;
    
  //   try {
  //     const response = await axios.get('/api/messages/unread/count');
  //     if (response.data.success) {
  //       this.unreadMessageCount = response.data.data.unreadCount;
  //     }
  //   } catch (error) {
  //     console.error('获取未读消息数量失败:', error);
  //   }
  // },
  // 标记消息为已读
  async markMessageAsRead(messageId) {
    try {
      const response = await axios.put(`/api/messages/${messageId}/read`);
      if (response.data.success) {
        // 更新本地消息状态
        const message = this.messages.find(msg => msg._mid === messageId);
        if (message) {
          message._status = 1;
        }
        //await this.loadUnreadMessageCount();
      }
    } catch (error) {
      console.error('标记消息为已读失败:', error);
    }
  },
   // 获取消息详情
  async getMessageDetail(messageId) {
    try {
      const response = await axios.get(`/api/messages/${messageId}`);
      if (response.data.success) {
        this.currentMessage = response.data.data;
        await this.markMessageAsRead(messageId);
        return response.data.data;
      }
    } catch (error) {
      console.error('获取消息详情失败:', error);
    }
  },
  // 标记所有消息为已读
  async markAllMessagesAsRead() {
    try {
      const response = await axios.put('/api/messages/read-all');
      if (response.data.success) {
        this.messages.forEach(msg => {
          msg._status = 1;
        });
        //this.unreadMessageCount = 0;
      }
    } catch (error) {
      console.error('标记所有消息为已读失败:', error);
    }
  },

  // 发送意见建议（使用消息接口）
  async submitFeedback() {
    if (!this.feedbackName || !this.feedbackName.trim()) {
      this.feedbackError = "请填写姓名";
      return;
    }

    if (!this.feedbackMessage || !this.feedbackMessage.trim()) {
      this.feedbackError = "请填写意见内容";
      return;
    }

    try {
      const feedbackContent = `
        意见建议类型：${this.feedbackType}
        提交者姓名：${this.feedbackName}
        联系邮箱：${this.feedbackEmail || '未提供'}
        意见内容：${this.feedbackMessage}
      `;

      // 查找用户选择的反馈类型对应的_mtid
      const selectedType = this.messageTypes.find(type => type._mtname === this.feedbackType);
      const mtid = selectedType ? selectedType._mtid : 3; // 默认使用3作为备选值

      const response = await axios.post('/api/messages', {
        _receiver_id: 1, // 管理员ID，实际项目中可能需要获取管理员ID
        _title: `意见建议 - ${this.feedbackType}`,
        _content: feedbackContent,
        _mtid: mtid // 使用用户选择的反馈类型对应的_mtid
      });

      if (response.data.success) {
        // 添加到本地历史记录
        const newFeedback = {
          _mid: response.data.data._mid,
          name: this.feedbackName,
          email: this.feedbackEmail,
          type: this.feedbackType,
          message: this.feedbackMessage,
          date: new Date().toISOString().split("T")[0],
          status: "已提交",
          reply: "",
        };

        this.feedbackHistory.unshift(newFeedback);
        alert("感谢您的反馈，已提交！");
        this.clearFeedbackForm();
        this.feedbackTab = "history";
        
        // 重新加载消息列表
        await this.loadMessages();
        await this.loadUnreadMessageCount();
      } else {
        this.feedbackError = response.data.message || "提交失败，请重试";
      }
    } catch (error) {
      console.error('提交意见建议失败:', error);
      this.feedbackError = "提交失败，请重试";
    }
  },
   // 清空意见建议表单
  clearFeedbackForm() {
    this.feedbackName = "";
    this.feedbackEmail = "";
    this.feedbackType = "建议";
    this.feedbackMessage = "";
    this.feedbackError = "";
  },
  // 切换消息面板
  toggleMessagePanel() {
    if (!this.isLoggedIn) {
      this.$message.warning('请先登录');
      return;
    }
    
    this.showMessagePanel = !this.showMessagePanel;
    
    // 标记所有消息为已读
    if (this.showMessagePanel) {
      this.markAllMessagesAsRead();
    }
  },
  // 查看消息详情
  async viewMessageDetail(message) {
    this.currentMessage = await this.getMessageDetail(message._mid);
    this.showMessageDetail = true;
    this.showMessagePanel = false; // 关闭消息列表
  },
  // 关闭消息详情
  closeMessageDetail() {
    this.showMessageDetail = false;
    this.currentMessage = null;
  },
getReserveStatusClass(status) {
  const classMap = {
    pending: 'waiting',
    ready: 'available', 
    expired: 'expired',
    cancelled: 'cancelled',
    completed: 'received'
  };
  return classMap[status] || 'waiting';
},

getReserveStatusText(status) {
  const statusMap = {
    pending: "等待中",
    ready: "可领取",
    expired: "已过期", 
    cancelled: "已取消",
    completed: "已完成"
  };
  return statusMap[status] || status;
},
    // 处理借阅逻辑
  async handleBorrow(bookId) {
    if (!bookId) return;

    try {
      // 发送借阅请求
      const response = await axios.post(`/api/books/${bookId}/borrow`);
      
      if (response.data.success) {
        this.$message.success("借阅成功");
        
        if (this.isLoggedIn) {
        await this.loadPersonalData(); // 这会从后端获取最新的用户信息
      }

        // 根据当前页面类型刷新数据
        if (this.currentPage === "bookDetail") {
          // 如果在图书详情页，重新获取当前图书信息
          const bookResponse = await axios.get(`/api/books/${bookId}`);
          if (bookResponse.data.success) {
            this.currentBook = bookResponse.data.data;
          }
        } else {
          // 如果在其他页面，重新加载图书列表
          await this.loadSearchPage();
        }
        
        // 如果用户已登录，更新借阅信息
        if (this.isLoggedIn) {
          await this.loadBorrowingInfo();
        }
      } else {
        this.$message.error("借阅失败: " + response.data.message);
      }
    } catch (error) {
      console.error("借阅失败:", error);
      this.$message.error("借阅失败: " + (error.response?.data?.message || error.message));
    }
  },

   // 处理预约逻辑
  async handleOrder(bookId) {
  try {
    // 使用最新的数据进行检查
    const hasExistingOrder = this.allBorrowingRecords.some(record => 
      record.type === 'ordering' && 
      record.bookId === bookId && 
      ['pending', 'ready'].includes(record.reserveStatus)
    );
    
    console.log('检查预约状态:', {
      bookId,
      hasExistingOrder,
      allRecords: this.allBorrowingRecords.filter(r => r.type === 'ordering' && r.bookId === bookId)
    });
    
    if (hasExistingOrder) {
      alert('您已经预约过这本书了，请勿重复预约');
      return;
    }
    
    console.log('发送预约请求，bookId:', bookId);
    const response = await axios.post('/api/book-order/order', { bookId });
    console.log('预约响应:', response);
    
    if (response.data.success) {
      alert("预约成功");
      
      // 立即重新从服务器加载最新数据
      await this.loadBorrowingInfo();
      
      // 重新加载图书数据
      await this.loadSearchPage();
    } else {
      alert("预约失败: " + response.data.message);
    }
  } catch (error) {
    console.error("预约失败:", error);
    alert("预约失败: " + (error.response?.data?.message || error.message));
  }
},

  // 取消预约
  // 
  async cancelOrder(orderId) {
  if (!confirm("确定要取消预约吗？")) {
    return;
  }
  
  try {
    console.log('取消预约，orderId:', orderId);
    
    const response = await axios.put(`/api/book-order/cancel/${orderId}`);
    console.log('取消预约响应:', response);
    
    if (response && response.data && response.data.success) {
      alert("取消预约成功");
      
      // 立即从本地数据中移除这个预约记录
      this.allBorrowingRecords = this.allBorrowingRecords.filter(
        record => !(record.type === 'ordering' && record.id === orderId)
      );
      
      // 更新预约列表
      this.orderingList = this.orderingList.filter(
        record => record.id !== orderId
      );
      
      // 重新计算统计
      this.borrowingStats = {
        total: this.borrowingList.length + this.orderingList.length,
        borrowing: this.borrowingList.filter(r => r.status === "borrowing").length,
        returned: this.borrowingList.filter(r => r.status === "returned").length,
        ordering: this.orderingList.length
      };
      
      console.log('取消后的预约列表:', this.orderingList);
      console.log('取消后的统计:', this.borrowingStats);
      
      // 重新加载图书数据（更新可借数量）
      await this.loadSearchPage();
      
      // 可选：重新从服务器加载最新数据以确保一致性
      // await this.loadBorrowingInfo();
    } else {
      const errorMsg = response?.data?.message || "取消预约失败";
      console.error('取消预约失败:', errorMsg);
      alert(errorMsg);
    }
  } catch (error) {
    console.error("取消预约失败:", error);
    alert("取消预约失败: " + (error.response?.data?.message || error.message));
  }
},


   // 将预约转换为借阅
  async convertOrderToBorrow(orderId) {
    try {
      const response = await axios.post(`/api/book-order/convert/${orderId}`);
      if (response.data.success) {
        alert("借阅成功");
        // 重新加载借阅信息
        await this.loadBorrowingInfo();
        // 重新加载图书数据
        await this.loadSearchPage();
      } else {
        alert("借阅失败: " + response.data.message);
      }
    } catch (error) {
      console.error("借阅失败:", error);
      alert("借阅失败: " + (error.response?.data?.message || error.message));
    }
  },
    // 原有方法保持不变
    toggleMessagePanel() {
      if (!this.isLoggedIn) {
        this.$message.warning('请先登录');
        return;
      }
      
      this.showMessagePanel = !this.showMessagePanel;
      
      // 标记所有消息为已读
      if (this.showMessagePanel) {
        this.markAllMessagesAsRead();
      }
    },
    handleInputFocus() {
      // 当输入框获得焦点时，不清空输入框内容，因为我们要保留搜索词
      // 但是可以添加一些视觉提示，表明当前有类别筛选
      if (this.selectedCategories.length > 0) {
        // 可以在这里添加一些视觉提示
      }
    },
    getReserveStatusText(status) {
      const statusMap = {
        waiting: "等待中",
        available: "可领取",
        expired: "已过期",
        cancelled: "已取消",
        received: "已领取",
      };
      return statusMap[status] || status;
    },
    // 在这里添加 clearAllFilters 方法
    clearAllFilters() {
      this.selectedCategories = [];
      this.searchQuery = "";
      this.searchAndRenderBooks();
    },
    handleVisibilityChange() {
      if (!document.hidden) {
        // 页面变为可见时，重新检查登录状态
        this.loadUserFromStorage();
      }
    },
    removeCategory(index) {
      this.selectedCategories.splice(index, 1);
      // 更新搜索结果
      this.searchAndRenderBooks();
    },

    updateSearchResults() {
      // 根据选中的类别更新搜索结果
      this.currentCategory = this.selectedCategories
        .map((cat) => cat.value)
        .join(",");
      this.searchAndRenderBooks();
    },
    // 清除公告筛选条件
    clearAnnouncementFilter() {
      this.announcementSearchQuery = "";
      this.announcementStartDate = "";
      this.announcementEndDate = "";
      this.currentAnnouncementPage = 1;
      // 触发滚动到顶部
      try {
        const el = document.getElementById("announcement-list");
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth" });
      } catch (e) {}
    },
    // 应用公告日期筛选
    applyAnnouncementDateFilter() {
      // 重置到第一页
      this.currentAnnouncementPage = 1;
      try {
        // 简单聚焦到公告列表顶部以便用户看到结果
        const el = document.getElementById("announcement-list");
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth" });
      } catch (e) {}
    },

    // 清空公告日期筛选
    clearAnnouncementDateFilter() {
      this.announcementStartDate = "";
      this.announcementEndDate = "";
      // 重置到第一页
      this.currentAnnouncementPage = 1;
    },
    scrollToTop() {
      if (typeof window !== "undefined" && window.scrollTo) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    },

    // 导航到登录页，保留当前页面用于登录后重定向
    goToAuth(type) {
      const redirect = window.location.pathname || "/readers";
      window.location.href = `/HomeView?view=${type}&redirect=${encodeURIComponent(
        redirect
      )}`;
    },

    // 从 localStorage 加载用户信息
    loadUserFromStorage() {
      try {
        const token = localStorage.getItem("token");
        const userInfo = localStorage.getItem("userInfo");

        // 如果token和userInfo都没有变化，直接返回
        if (token === this.lastToken && userInfo === this.lastUserInfo) {
          return;
        }

        // 记录当前值用于下次比较
        this.lastToken = token;
        this.lastUserInfo = userInfo;

        console.log("loadUserFromStorage - token:", token);
        console.log("loadUserFromStorage - userInfo:", userInfo);

        if (!token) {
          this.user = null;
          this.userInfo = null;
          return;
        }

        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          this.user = parsed;
          this.userInfo = parsed;


          // 强制触发视图更新
          this.$nextTick(() => {
            this.$forceUpdate();
          });

          console.log("loadUserFromStorage - 用户信息已加载:", parsed);
        }
      } catch (e) {
        console.error("loadUserFromStorage - 错误:", e);
        this.user = null;
        this.userInfo = null;
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
      }
    },

    // 注销
    handleLogout() {
      // 先隐藏下拉菜单
      this.showUserDropdown = false;

      // 显示确认对话框
      if (confirm("确定要退出登录吗？")) {
        // 清除本地存储
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");

        // 清除内存中的用户信息
        this.user = null;
        this.userInfo = null;

        // 更新登录状态
        this.isLoggedIn = false;

        // 清除收藏列表
        this.favorites = [];

        // 如果当前在需要登录的页面，则跳转到首页
        if (["personal", "feedback"].includes(this.currentPage)) {
          this.currentPage = "search";
        }

        // 显示退出成功提示
        alert("已成功退出登录");
      }
    },

    performLogout() {
      // 清除本地存储的用户信息
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");

      // 清除内存中的用户信息
      this.user = null;
      this.userInfo = null;

      // 如果当前在需要登录的页面，则跳转到首页
      if (["personal", "feedback"].includes(this.currentPage)) {
        this.currentPage = "search";
      }
      // 重新加载当前页面数据
      this.loadSearchPage();

      // 显示登出成功的提示消息（可选）
      // this.$message.success('您已成功退出登录'); // 如果使用了element-ui的消息组件

      // 或者使用简单的提示
      console.log("您已成功退出登录");
    },
    toggleUserMenu() {
      this.showUserDropdown = !this.showUserDropdown;
    },

    // 点击其他地方隐藏用户菜单
    handleClickOutside(event) {
      const userMenu = this.$el.querySelector(".user-menu");
      if (userMenu && !userMenu.contains(event.target)) {
        this.showUserDropdown = false;
      }
    },

    // 点击头像打开个人信息页
    openPersonal() {
      // 切换到个人页并确保选中账户信息
      this.personalTab = "account";
      this.changePage("personal");
    },

    nextSlide() {
      this.carouselIndex =
        (this.carouselIndex + 1) % this.carouselImages.length;
    },
    prevSlide() {
      this.carouselIndex =
        (this.carouselIndex - 1 + this.carouselImages.length) %
        this.carouselImages.length;
    },
    startCarousel() {
      this.stopCarousel();
      this.carouselTimer = setInterval(() => {
        this.nextSlide();
      }, 4000);
    },
    stopCarousel() {
      if (this.carouselTimer) {
        clearInterval(this.carouselTimer);
        this.carouselTimer = null;
      }
    },

    async changePage(page, type = "all") {
      this.currentPage = page;
      this.pageType = type;

      switch (page) {
        case "personal":
          this.personalTab = "account";
          // 不再检查登录状态，允许访问但显示提示
          if (this.isLoggedIn) {
            await Promise.all([
              this.loadBorrowingInfo(),
              this.loadBorrowingHistory(),
            ]);
          }
          break;
        case "allBooks":
          // 确保进入全部图书时已加载图书数据
          if (!Array.isArray(this.books) || this.books.length === 0) {
            await this.loadSearchPage();
          }
          // 重置页码
          this.currentPageNum = 1;
          break;
        case "aid":
          await this.loadAnnouncements();
          break;
        case "feedback":
          // 不再检查登录状态，允许访问但显示提示
          if (this.isLoggedIn) {
            // 加载消息类型，确保意见建议表单中的类别选项可用
            if (this.messageTypes.length === 0) {
              await this.loadMessageTypes();
            }
            // 加载反馈历史记录
            await this.loadFeedbackHistory();
          }
          break;
        case "allBooks":
          // 确保进入全部图书时已加载图书数据（可能之前未加载）
          if (!Array.isArray(this.books) || this.books.length === 0) {
            await this.loadSearchPage();
          }
          // 如果需要根据 pageType（new/hot/all）刷新筛选结果
          this.filterNewAndHotBooks();
          this.currentPageNum = 1;
          break;
      }
    },

    // 跳转到搜索结果页面
    gotoSearchResult() {
      // 设置标志位表示用户已点击检索按钮
      this.clickedSearch = true;

      // 如果没有搜索词且没有选中的类别，提示用户
      if (!this.searchQuery.trim() && this.selectedCategories.length === 0) {
        alert("请输入搜索内容或选择图书类别");
        return;
      }

      this.currentPage = "searchResult";
      this.currentSearchResultPageNum = 1;

      // 执行搜索
      this.searchAndRenderBooks();
    },

    // 在搜索结果页面中按类别筛选
    filterByCategory(category) {
      if (category === "") {
        this.selectedCategories = [];
        this.currentCategory = "";
        this.searchAndRenderBooks();
        return;
      }

      const categoryObj = this.bookCategories.find(
        (cat) => cat.value === category
      );
      if (!categoryObj) return;

      // 查找是否已经选中
      const existingIndex = this.selectedCategories.findIndex(
        (cat) => cat.value === category
      );

      if (existingIndex === -1) {
        // 如果未选中，添加到数组
        this.selectedCategories.push(categoryObj);
      } else {
        // 如果已选中，从数组中移除
        this.selectedCategories.splice(existingIndex, 1);
      }

      // 更新当前类别为所有选中类别的组合
      this.currentCategory = this.selectedCategories
        .map((cat) => cat.value)
        .join(",");
      this.currentPageNum = 1;

      // 触发搜索
      this.searchAndRenderBooks();
    },

    filterByCategoryInResult(category) {
      this.currentCategory = category;
      this.currentSearchResultPageNum = 1;
      // 将分类名称添加到搜索框中
      if (category) {
        const categoryLabel =
          this.bookCategories.find((cat) => cat.value === category)?.label ||
          category;
        this.searchQuery = categoryLabel;
      }
      // 设置标志位表示用户已通过分类进行了筛选
      this.clickedSearch = true;
    },

    // 搜索结果分页
    changeSearchResultPageNum(page) {
      if (page === "...") return;
      if (page < 1 || page > this.totalSearchResultPages) return;
      this.currentSearchResultPageNum = page;
    },

    async loadPersonalData() {
      try {
        console.log("loadPersonalData - 开始加载个人数据");
        const response = await axios.get("/api/auth/current-user");
        const payload = response?.data?.data || response?.data || null;

        console.log("loadPersonalData - 服务器响应:", payload);

        if (payload) {
        // 统一使用 lend_num 字段
        this.userInfo = {
          ...payload,
          lend_num: payload.lend_num || payload._lend_num || 0
        };
        this.user = this.userInfo;
        localStorage.setItem("userInfo", JSON.stringify(this.userInfo));
      }
    } catch (error) {
      console.error("加载个人数据失败:", error);
      this.handleLogout();
    }
    },

    // 切换编辑模式
    toggleEdit() {
      this.editMode = !this.editMode;
      if (this.editMode && this.userInfo) {
        // 填充编辑表单
        this.editUser = {
          _name: this.userInfo._name || this.userInfo.name || "",
          _account: this.userInfo._account || this.userInfo.account || "",
          _email: this.userInfo._email || this.userInfo.email || "",
        };
      }
    },

    // 保存编辑信息
    async saveEdit() {
      if (!this.userInfo || !this.userInfo._uid) {
        alert("无法保存：找不到用户 ID");
        return;
      }
      const payload = {
        _name: (this.editUser._name || "").trim(),
        _account: (this.editUser._account || "").trim(),
        _email: (this.editUser._email || "").trim(),
      };
      try {
        const res = await axios.put(
          `/api/readers/${this.userInfo._uid}`,
          payload
        );
        if (res && res.data && res.data.success) {
          // 更新本地数据
          this.userInfo = Object.assign({}, this.userInfo, payload);
          this.user = this.userInfo;
          try {
            localStorage.setItem("userInfo", JSON.stringify(this.userInfo));
          } catch (e) {}
          this.editMode = false;
          alert("保存成功");
        } else {
          alert((res && res.data && res.data.message) || "保存失败");
        }
      } catch (err) {
        const status = err && err.response && err.response.status;
        if (status === 403) {
          alert("没有权限更新用户信息（服务器限制）。");
        } else {
          alert("更新失败，请稍后重试。");
        }
        console.warn(
          "saveEdit error",
          err && err.response ? err.response.data : err
        );
      }
    },

    // 存储事件回调：当其它窗口/标签修改 localStorage（如登录）时，同步更新
    onStorageChange(e) {
      if (!e) return;
      if (e.key === "token" || e.key === "userInfo") {
        this.loadUserFromStorage();
        if (localStorage.getItem("token")) {
          this.loadPersonalData();
        }
      }
    },

    viewBookDetail(book) {
      this.currentBook = book;
      this.currentPage = "bookDetail";
    },

    // 修改：原搜索方法改为只更新数据不跳转
    async searchAndRenderBooks() {
      try {
        // 构建查询参数
        const params = {};

        // 如果有选中的类别，添加到参数中
        if (this.selectedCategories.length > 0) {
          params.categories = this.selectedCategories
            .map((cat) => cat.value)
            .join(",");
        }

        // 如果有搜索词，添加到参数中
        if (this.searchQuery) {
          params.query = this.searchQuery;
          params.type = this.searchType; // book 或 author
        }

        const response = await axios.get("/api/books", { params });
        const payload = response && response.data && response.data.data;
        this.books = Array.isArray(payload && payload.booklist)
          ? payload.booklist
          : Array.isArray(payload)
          ? payload
          : [];

        this.filterNewAndHotBooks();
        this.currentPageNum = 1;
      } catch (error) {
        console.error("搜索图书失败:", error.response?.data || error.message);
        alert(
          "搜索图书失败: " + (error.response?.data?.message || error.message)
        );
      }
    },
    
  

  async borrowBook(bookId) {
    if (!bookId) return;

    try {
      const response = await axios.post(`/api/books/${bookId}/borrow`);
      
      if (response && response.data && response.data.success) {
        this.$message.success("借阅成功");
        // 借阅成功后刷新当前页面
        await this.refreshCurrentPage();
      } else {
        this.$message.error("借阅失败: " + response.data.message);
      }
    } catch (error) {
      console.error("借阅失败:", error);
      this.$message.error("借阅失败: " + (error.response?.data?.message || error.message));
    }
  },
// 应用公告过滤（按钮触发）——计算属性会自动生效，此方法用于防止默认行为或做额外操作
    applyAnnouncementFilter() {
      // 目前不需要做额外处理，计算属性 `filteredAnnouncements` 会根据 query 实时更新
      // 这里保留以便将来需要触发远程搜索或统计时使用
      try {
        // 简单聚焦到公告列表顶部以便用户看到结果
        const el = document.getElementById("announcement-list");
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth" });
      } catch (e) {}
    },
    generateVisiblePages(currentPage, totalPages) {
      const visiblePages = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          visiblePages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            visiblePages.push(i);
          }
          visiblePages.push("...", totalPages);
        } else if (currentPage >= totalPages - 2) {
          visiblePages.push(1, "...");
          for (let i = totalPages - 3; i <= totalPages; i++) {
            visiblePages.push(i);
          }
        } else {
          visiblePages.push(1, "...");
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            visiblePages.push(i);
          }
          visiblePages.push("...", totalPages);
        }
      }
      return visiblePages;
    },
    changePageNum(page) {
      if (page === "...") return;
      if (page < 1 || page > this.totalPages) return;
      this.currentPageNum = page;
    },

    changeFeedbackPage(page) {
      if (page === "...") return;
      if (page < 1 || page > this.totalFeedbackPages) return;
      this.currentFeedbackPage = page;
    },  
    // 公告分页切换方法
    changeAnnouncementPage(page) {
      if (page === "...") return;
      if (page < 1 || page > this.totalAnnouncementPages) return;
      this.currentAnnouncementPage = page;
    },
  },
   
    

    

    
   

    

    
    
    

    
    
    
  async mounted() {
    // 检查数据一致性
  this.checkDataConsistency();
    // 加载消息相关数据
  if (this.isLoggedIn) {
    console.log("用户已登录，开始加载消息列表和未读计数");
    await this.loadMessages();
    await this.loadUnreadMessageCount();
    console.log("开始加载消息类型")
    await this.loadMessageTypes(); // 加载消息类型
    await this.loadFeedbackHistory();
  }
  // 添加页面切换监听，确保切换到历史记录标签时重新加载
  this.$watch('feedbackTab', async (newTab) => {
    if (newTab === 'history' && this.isLoggedIn) {
      await this.loadFeedbackHistory();
    }
  });
  // 添加全局点击监听器来关闭消息面板
  document.addEventListener('click', (event) => {
    if (this.showMessagePanel && 
        !event.target.closest('.message-trigger') && 
        !event.target.closest('.message-panel')) {
      this.showMessagePanel = false;
    }
    
    if (this.showMessageDetail && 
        !event.target.closest('.message-detail-content') &&
        !event.target.closest('.message-detail-modal')) {
      this.closeMessageDetail();
    }
  });
    // 添加全局点击监听器来关闭用户菜单
    document.addEventListener("click", this.handleClickOutside);

    // 启动轮播
    this.startCarousel();

    // 加载分类信息
    await this.loadBookCategories();

    // 加载图书数据
    await this.loadSearchPage();

    // 加载本地用户信息
    this.loadUserFromStorage();

    // 监听 storage 事件
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("storage", this.onStorageChange);
    }

    // 添加页面可见性监听
    if (typeof document !== "undefined") {
      document.addEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
    }
// 添加全局点击监听器来关闭消息面板
  document.addEventListener("click", (event) => {
    if (this.showMessagePanel && !event.target.closest('.ai-assistant')) {
      this.showMessagePanel = false;
    }
  });
    // 只有在已登录时才加载需要登录的数据
    if (this.isLoggedIn) {
      await this.loadPersonalData();
    }

    // 添加定时检查登录状态 - 改为更短的时间间隔
    this.checkLoginStatus = setInterval(() => {
      this.loadUserFromStorage();
    }, 30000); // 减少到500毫秒
  },

  beforeDestroy() {
    this.stopCarousel();
      document.removeEventListener("click", this.handleDocumentClick);//1219日
    document.removeEventListener("click", this.handleClickOutside);
    if (typeof window !== "undefined" && window.removeEventListener) {
      window.removeEventListener("storage", this.onStorageChange);
    }

    // 移除页面可见性监听
    if (typeof document !== "undefined") {
      document.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
    }

    // 清除登录状态检查定时器
    if (this.checkLoginStatus) {
      clearInterval(this.checkLoginStatus);
    }
  },
};
</script>

<style>
/* 调试按钮样式 */
.debug-btn {
  background: #ff6b6b !important;
  color: white !important;
  border: none !important;
  padding: 8px 12px !important;
  border-radius: 4px !important;
  font-size: 14px !important;
  cursor: pointer !important;
  transition: background-color 0.3s !important;
  z-index: 1000 !important;
}

.debug-btn:hover {
  background: #ff5252 !important;
}

/* 如果按钮是固定定位的，确保它显示在最前面 */
.debug-btn.fixed {
  position: fixed !important;
  top: 100px !important;
  right: 20px !important;
  z-index: 9999 !important;
}

.status-tag.ordering {
  background-color: #fff3cd;
  color: #856404;
}

/* 消息触发器样式 */
.message-trigger {
  position: relative;
  cursor: pointer;
  margin-right: 20px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
}

.envelope-icon {
  transition: transform 0.2s;
}

.envelope-icon:hover {
  transform: scale(1.1);
}

.unread-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 消息面板样式 */
.message-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 350px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.message-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.message-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.no-messages {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.message-item {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.message-item:hover {
  background-color: #f8f9fa;
}

.message-item.unread {
  background-color: #e8f4fd;
}

.message-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.message-title strong {
  font-size: 14px;
  color: #333;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-preview {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.unread-indicator {
  position: absolute;
  top: 12px;
  right: 15px;
  background-color: #3498db;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

/* 消息详情模态框样式 */
.message-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.message-detail-content {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.message-detail-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
}

.message-detail-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.message-detail-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.message-detail-body p {
  margin: 8px 0;
  font-size: 14px;
  color: #555;
}

.message-content {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #3498db;
}

.message-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: inherit;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}
/* 以上为消息面板样式 */
/* 在CSS中添加预约状态标签样式 */
.status-tag.waiting {
  background-color: #fff3cd;
  color: #856404;
}

.status-tag.available {
  background-color: #d4edda;
  color: #155724;
}

.status-tag.expired {
  background-color: #f8d7da;
  color: #721c24;
}

.status-tag.cancelled {
  background-color: #e2e3e5;
  color: #6c757d;
}

.status-tag.received {
  background-color: #cce5ff;
  color: #004085;
}
/*以上为预约 */
.search-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.selected-tags {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 8px;
  z-index: 1;
  pointer-events: none;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 16px;
  font-size: 14px;
  pointer-events: auto;
}

.tag-close {
  cursor: pointer;
  font-weight: bold;
  margin-left: 4px;
}

.tag-close:hover {
  color: #0d47a1;
}

.searchbar input {
  padding: 16px 20px;
  flex: 1;
  border: none;
  font-size: 16px;
  outline: none;
}

/* 当有标签时，调整输入框的左边距 */
.search-input-wrapper:has(.selected-tags) input {
  padding-left: 120px;
}
/* 搜索状态 */
.search-status {
  margin: 10px 0;
  padding: 8px 16px;
  background-color: #f0f7ff;
  border-radius: 4px;
  color: #1976d2;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-filters-btn {
  background: none;
  border: none;
  color: #1976d2;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}

.clear-filters-btn:hover {
  color: #0d47a1;
}

/* 重置默认样式 - 统一页面元素的外边距、内边距和盒模型 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Arial", sans-serif;
}

/* 页面主体背景设置 - 设置背景图片、颜色和文字行高 */
body {
  background-image: url("../../public/images.jpg");
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-color: #f4f4f4;
  color: #333;
  line-height: 1.6;
}

/* 图书大厅区块 */
/* 图书大厅 - 设置上边距和最小高度 */
main {
  margin-top: 80px;
  padding: 20px;
  min-height: calc(100vh - 84px);
}

/* 标题样式 - 设置居中对齐和底部边框 */
h1 {
  text-align: center;
  margin: 20px 0;
}

/* 二级标题样式 - 设置颜色、底部边框和内边距 */
h2 {
  margin: 30px 0 15px;
  color: #2c3e50;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

/* 导航栏 */
/* 导航栏样式 - 固定在页面顶部，设置高度、颜色和布局 */
.navbar {
  width: 100%;
  background: #1194ae;
  color: white;
  height: 64px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

/* 导航链接容器 - 居中显示导航项 */
.nav-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
}

/* 单个导航项 - 设置右边距 */
.nav-links li {
  margin-right: 20px;
}

/* 导航链接样式 - 设置颜色、过渡效果和字体样式 */
.nav-links a {
  color: white;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.15s, transform 0.15s;
  display: inline-block;
  font-size: 22px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 500;
  text-align: center;
}

/* 导航链接悬停效果 - 背景色变化和轻微上移 */
.nav-links a:hover {
  background: #34495e;
  transform: translateY(-1px);
}

/* Logo */
/* Logo样式 - 设置字体大小、粗细和间距 */
.logo {
  font-size: 22px;
  font-weight: bold;
  margin-right: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Logo图片样式 - 设置高度和垂直对齐方式 */
.logo-img {
  height: 40px;
  width: auto;
  vertical-align: middle;
}

/* 登录 */
/* 登录链接容器样式 - 设置弹性布局和对齐 */
.auth-links {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-right: 20px;
}

/* 登录链接样式 - 设置颜色、装饰线和过渡效果 */
.auth-link {
  color: white;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  transition: color 0.2s;
  padding: 3px 6px;
}

/* 登录链接悬停效果 */
.auth-link:hover {
  color: #f0f0f0;
  text-decoration: underline;
}

/* 用户头像样式 - 设置尺寸、圆角和边框 */
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
  vertical-align: middle;
  border: 2px solid rgba(255, 255, 255, 0.9);
}

/* 用户头像占位符样式 - 设置尺寸、背景色和光标 */
.user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  cursor: pointer;
  margin-right: 8px;
}

/* 用户菜单样式 */
.user-menu {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.reminder-icon {
  font-size: 24px;
  margin-right: 8px;
  cursor: pointer;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 用户下拉菜单样式 */
.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  min-width: 120px;
  z-index: 1000;
  margin-top: 5px;
}

.user-dropdown::before {
  content: "";
  position: absolute;
  top: -6px;
  right: 20px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid white;
}

.user-dropdown .auth-link {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 16px;
  color: #333;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
}

.user-dropdown .auth-link:hover {
  background-color: #f5f5f5;
}



/* 搜索框 */
/* 搜索容器样式 - 设置居中对齐和内边距 */
.search-container {
  text-align: center;
  margin: 30px 0;
  padding: 0 20px;
}

/* 搜索栏样式 - 设置弹性布局、背景色和圆角 */
.searchbar {
  display: inline-flex;
  align-items: center;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  overflow: hidden;
}

/* 搜索选择框样式 - 设置内边距、背景色和光标 */
.search-select {
  padding: 16px 20px;
  border: none;
  background-color: #f9f9f9;
  font-size: 16px;
  width: 180px;
  cursor: pointer;
  border-right: 1px solid #eee;
}

/* 搜索输入框样式 - 设置内边距和轮廓 */
.searchbar input {
  padding: 16px 20px;
  flex: 1;
  border: none;
  font-size: 16px;
  outline: none;
}

/* 搜索按钮样式 - 设置内边距、背景色和过渡效果 */
.searchbar button {
  padding: 16px 30px;
  background-color: #1194ae;
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

/* 搜索按钮悬停效果 */
.searchbar button:hover {
  background-color: #2980b9;
}

/* 轮播图 */
/* 轮播图容器样式 - 设置宽度、高度和阴影 */
.hero-carousel {
  width: 100%;
  max-width: 1200px;
  height: 450px;
  margin: 0 auto 20px;
  overflow: hidden;
  position: relative;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* 轮播轨道样式 - 设置弹性布局和过渡效果 */
.hero-track {
  display: flex;
  height: 100%;
  transition: transform 0.6s ease;
}

/* 轮播幻灯片样式 - 设置弹性布局和对齐方式 */
.hero-slide {
  flex: 0 0 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 轮播图片样式 - 设置宽度、高度和显示方式 */
.hero-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 轮播箭头样式 - 设置定位、背景色和尺寸 */
.hero-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  transition: background 0.15s, transform 0.15s;
  z-index: 2;
  display: none;
}

/* 轮播箭头悬停显示 */
.hero-carousel:hover .hero-arrow {
  display: flex;
}

/* 轮播箭头悬停效果 */
.hero-arrow:hover {
  background: rgba(0, 0, 0, 0.6);
  transform: translateY(-50%) scale(1.05);
}

/* 左箭头定位 */
.hero-arrow--left {
  left: 20px;
}

/* 右箭头定位 */
.hero-arrow--right {
  right: 20px;
}

/* 分类筛选 */
/* 分类筛选容器 - 设置上边距和弹性布局 */
.category-filter {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  padding: 10px 0;
}

/* 分类标签样式 - 设置颜色和字体大小 */
.filter-label {
  color: #666;
  font-size: 15px;
  align-self: center;
}

/* 分类筛选按钮样式 - 设置背景色、边框和圆角 */
.category-filter button {
  background-color: #f0f0f0;
  color: #333;
  border: none;
  padding: 6px 14px;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

/* 分类筛选按钮悬停效果 */
.category-filter button:hover {
  background-color: #e0e0e0;
}

/* 激活的分类筛选按钮样式 */
.category-filter button.active-category {
  background-color: #1194ae;
  color: white;
}

/* 图书部分 */
/* 图书标志样式 */
.book-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  z-index: 1;
}

/* 新书标志样式 */
.new-tag {
  background-color: #4caf50;
}

/* 热门标志样式 */
.hot-tag {
  background-color: #ff5722;
}

/* 调整封面容器样式以支持标志定位 */
.book-cover {
  position: relative; /* 添加这行以支持绝对定位的标志 */
  width: 100%;
  height: 200px;
  margin-bottom: 10px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
}

/* 图书区域样式 - 设置边距、背景色和阴影 */
.books-section {
  margin: 40px 0;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

/* 区域头部样式 - 设置弹性布局和对齐方式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 查看全部链接样式 - 设置颜色、装饰线和过渡效果 */
.view-all {
  color: #1194ae;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

/* 查看全部链接悬停效果 */
.view-all:hover {
  color: #2980b9;
  text-decoration: underline;
}

/* 图书网格样式 - 设置网格布局和间距 */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

/* 图书卡片样式 - 设置光标和过渡效果 */
.book-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-align: center;
}

/* 图书卡片悬停效果 */
.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* 图书封面样式 - 设置尺寸、背景色和圆角 */
.book-cover {
  width: 100%;
  height: 200px;
  margin-bottom: 10px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
}

/* 封面占位符样式 - 设置字体大小和颜色 */
.cover-placeholder {
  font-size: 32px;
  color: #999;
  font-weight: bold;
}

/* 图书标题样式 - 设置字体大小和文本溢出处理 */
.book-title {
  font-size: 16px;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 图书作者样式 - 设置字体大小和颜色 */
.book-author {
  font-size: 14px;
  color: #666;
}

/* 图书详情容器样式 - 设置最大宽度、居中对齐、背景色、圆角和阴影 */
.book-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  margin-top: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* 图书详情头部样式 - 设置文本居中对齐 */
.book-detail-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

/* 图书详情主标题样式 - 设置字体大小、字重和颜色 */
.book-detail-main-title {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
  line-height: 1.2;
}

/* 图书详情内容样式 - 设置弹性布局 */
.book-detail-content {
  display: flex;
  gap: 40px;
  align-items: flex-start;
  margin-bottom: 40px;
}

/* 图书封面区域样式 */
.book-cover-section {
  flex-shrink: 0;
  width: 280px;
}

/* 图书封面样式 - 设置尺寸、背景色、圆角和阴影 */
.detail-cover {
  width: 100%;
  height: 400px;
  background-color: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 封面占位符样式 - 设置字体大小和颜色 */
.cover-placeholder {
  font-size: 48px;
  color: #adb5bd;
  font-weight: bold;
}

/* 详情图片样式 - 设置宽度和高度为100%，对象适应 */
.detail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 图书信息区域样式 */
.book-info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* 元数据表格样式 */
.metadata-table {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 25px;
  border: 1px solid #e9ecef;
}

/* 元数据行样式 - 设置弹性布局和边框 */
.metadata-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
}

/* 最后一行去掉边框 */
.metadata-row:last-child {
  border-bottom: none;
}

/* 元数据标签样式 - 设置字体大小、颜色和字重 */
.metadata-label {
  font-size: 16px;
  color: #495057;
  font-weight: 500;
  flex: 0 0 120px;
}

/* 元数据值样式 - 设置字体大小、颜色和文本对齐 */
.metadata-value {
  font-size: 16px;
  color: #6c757d;
  text-align: right;
  flex: 1;
  font-weight: 400;
}

/* 分类标签与按钮区域样式 - 设置弹性布局 */
.category-actions-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

/* 分类标签样式 - 设置背景色、颜色、圆角和内边距 */
.category-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
}

/* 操作按钮区域样式 */
.action-buttons {
  display: flex;
  gap: 15px;
  margin-left: auto;
}

/* 借阅按钮样式 - 设置背景色、内边距、字体大小和圆角 */
.borrow-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* 借阅按钮悬停效果 */
.borrow-btn:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

/* 图书详情底部样式 */
.book-detail-footer {
  border-top: 1px solid #eee;
  padding-top: 25px;
  margin-top: 30px;
}

/* 底部内容样式 - 设置弹性布局 */
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 额外信息样式 */
.additional-info {
  display: flex;
  gap: 30px;
}

/* 信息项样式 - 设置字体大小和颜色 */
.info-item {
  font-size: 14px;
  color: #6c757d;
}

/* 底部操作样式 */
.footer-actions {
  display: flex;
  gap: 15px;
}

/* 次要按钮样式 - 设置背景色、颜色和边框 */
.secondary-btn {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 次要按钮悬停效果 */
.secondary-btn:hover {
  background-color: #e9ecef;
  color: #495057;
}

/* 全部图书容器样式 - 设置背景色、圆角和阴影 */
.all-books-container {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  margin-top: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

/* 按钮 */
/* 图书操作按钮容器样式 */
.book-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
/* 通用按钮样式 - 设置背景色、边框和过渡效果 */
button {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
  padding: 6px 12px;
}

/* 通用按钮悬停效果 */
button:hover {
  background: #2980b9;
}

/* 借阅 */
/* 借阅按钮样式 - 设置上边距、内边距和字体大小 */
.borrow-btn {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #27ae60;
}

/* 借阅按钮悬停效果 */
.borrow-btn:hover {
  background-color: #219653;
}

/* 禁用的借阅按钮样式 - 设置背景色和光标 */
.borrow-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* 归还 */
/* 归还按钮样式 - 设置背景色 */
.return-btn {
  background-color: #e74c3c;
}

/* 归还按钮悬停效果 */
.return-btn:hover {
  background-color: #c0392b;
}

/* 续借 */
/* 续借按钮样式 - 设置背景色和左边距 */
.delay-btn {
  background-color: #3498db;
  margin-left: 5px;
}

/* 续借按钮悬停效果 */
.delay-btn:hover {
  background-color: #2980b9;
}

/* 返回 */
/* 返回按钮样式 - 设置下边距和背景色 */
.back-btn {
  margin-bottom: 20px;
  background-color: #34495e;
}

/* 返回按钮悬停效果 */
.back-btn:hover {
  background-color: #2c3e50;
}

/* 个人信息 */
/* 个人信息区块 - 设置背景色、圆角和阴影 */
.personal-section {
  background: white;
  border-radius: 5px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* 个人信息页面容器样式 - 设置弹性布局和间距 */
.personal-container {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* 个人信息内容区域样式 - 设置弹性增长、背景色和阴影 */
.personal-content {
  flex: 1;
  background: #ffffff;
  padding: 22px;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
}

/* 侧边栏 */
/* 个人信息侧边栏样式 - 设置宽度、背景色和定位 */
.personal-sidebar {
  width: 260px;
  min-width: 200px;
  background: #ffffff;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 6px 20px rgba(17, 148, 174, 0.08);
  position: sticky;
  top: 100px;
  height: fit-content;
}

/* 侧边栏导航样式 - 设置列表样式和弹性布局 */
.sidebar-nav {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 侧边栏导航项样式 - 设置内边距、圆角和过渡效果 */
.sidebar-nav li {
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  color: #2c3e50;
  font-weight: 600;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 侧边栏导航项悬停效果 */
.sidebar-nav li:hover {
  background: #f5fbfc;
  transform: translateX(2px);
}

/* 激活的侧边栏导航项样式 */
.sidebar-nav li.active {
  background: linear-gradient(90deg, #1194ae, #0e8aa0);
  color: #fff;
  box-shadow: 0 6px 18px rgba(17, 148, 174, 0.16);
}

/* 小屏幕适配 - 调整侧边栏布局 */
@media (max-width: 900px) {
  .personal-container {
    flex-direction: column;
  }
  .personal-sidebar {
    width: 100%;
    position: relative;
    top: auto;
    box-shadow: none;
    padding: 12px;
    margin-bottom: 12px;
  }
}

/* 账户信息 */
/* 账户信息样式 - 设置上边距 */
.account-info {
  margin-top: 20px;
}

/* 信息项样式 - 设置下边距和底部边框 */
.info-item {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #eee;
}

/* 信息项标签样式 - 设置显示方式、宽度和颜色 */
.info-item label {
  display: inline-block;
  width: 120px;
  color: #666;
  font-weight: 500;
}

/* 信息操作样式 - 设置上边距 */
.info-actions {
  margin-top: 30px;
}

/* 编辑按钮样式 - 设置背景色和右边距 */
.edit-btn {
  background-color: #3498db;
  margin-right: 10px;
}

/* 修改密码按钮样式 - 设置背景色 */
.change-pwd-btn {
  background-color: #9b59b6;
}

/* 我的借阅 */
/* 表格 */
/* 表格样式 - 设置宽度、边框合并和阴影效果 */
table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

/* 表格单元格样式 - 设置内边距、对齐方式和底部边框 */
th,
td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

/* 表头样式 - 设置背景色和字体粗细 */
th {
  background: #f8f9fa;
  font-weight: bold;
}

/* 页脚样式 - 设置背景色、文字颜色和定位 */
footer {
  background-color: transparent;
  color: #666;
  text-align: center;
  padding: 16px 0;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 借阅表格表头对齐 */
#borrowing-table th {
  text-align: center;
}

/* 借阅表格单元格对齐 */
#borrowing-table td {
  text-align: center;
  vertical-align: middle;
}

/* 表格封面样式 - 设置尺寸、对齐方式和边框 */
.table-cover {
  /* 表格中图书封面容器，固定为书籍封面常见比例并居中裁剪 */
  width: 64px;
  height: 88px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #f0f0f0;
}

/* 表格封面占位符样式 - 设置字体大小和颜色 */
.table-cover .cover-placeholder {
  font-size: 16px;
  font-weight: 700;
  color: #777;
}

/* 针对借阅表格的覆盖规则 - 确保图片铺满容器并裁切 */
#borrowing-table .table-cover {
  width: 64px;
  height: 88px;
}

/* 借阅表格图片样式 - 设置尺寸和对象适应 */
#borrowing-table .book-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 借阅表格封面占位符样式 - 设置尺寸和背景色 */
#borrowing-table .cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7f9;
}

/* 移动端适配 - 缩小表格封面 */
@media (max-width: 700px) {
  /* 移动端表格列更窄时，缩小封面 */
  .table-cover {
    width: 48px;
    height: 66px;
  }
  #borrowing-table .table-cover {
    width: 48px;
    height: 66px;
  }
}

/* 搜索框 */
/* 个人搜索样式 - 设置弹性布局、背景色和阴影 */
.personal-search {
  display: inline-flex;
  align-items: center;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  overflow: hidden;
  margin: 0 auto 20px;
}

/* 个人搜索选择框样式 - 设置内边距、背景色和光标 */
.personal-search .search-select {
  padding: 16px 20px;
  border: none;
  background-color: #f9f9f9;
  font-size: 16px;
  width: 180px;
  cursor: pointer;
  border-right: 1px solid #eee;
}

/* 个人搜索输入框样式 - 设置内边距和轮廓 */
.personal-search input {
  padding: 16px 20px;
  flex: 1;
  border: none;
  font-size: 16px;
  outline: none;
}

/* 个人搜索按钮样式 - 设置内边距、背景色和过渡效果 */
.personal-search button {
  padding: 16px 30px;
  background-color: #1194ae;
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

/* 个人搜索按钮悬停效果 */
.personal-search button:hover {
  background-color: #2980b9;
}

/* 按日期搜索 */
/* 日期范围选择器样式 - 设置弹性布局和对齐方式 */
.date-range-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  flex: 1;
}

/* 日期输入框样式 - 设置内边距、边框和过渡效果 */
.date-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

/* 日期输入框焦点效果 */
.date-input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

/* 日期分隔符样式 - 设置颜色和字体粗细 */
.date-separator {
  color: #666;
  font-weight: 500;
}

/* 日期清除按钮样式 - 设置内边距、背景色和过渡效果 */
.date-clear-btn {
  padding: 16px 30px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

/* 日期清除按钮悬停效果 */
.date-clear-btn:hover {
  background-color: #e0e0e0;
}

/* 按钮 */
/* 状态标签样式 - 设置弹性布局和间距 */
.status-tabs {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

/* 状态标签按钮样式 - 设置背景色、颜色和内边距 */
.status-tabs button {
  background-color: #f0f0f0;
  color: #333;
  padding: 8px 16px;
  border-radius: 4px;
}

/* 状态标签样式 - 设置显示方式、内边距和字体样式 */
.status-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* 激活的状态标签按钮样式 */
.status-tabs button.active {
  background-color: #1194ae;
  color: white;
}

/* 借阅中状态标签样式 - 设置背景色和颜色 */
.status-tag.borrowing {
  background-color: #ffeeba;
  color: #856404;
}

/* 已归还状态标签样式 - 设置背景色和颜色 */
.status-tag.returned {
  background-color: #c3e6cb;
  color: #155724;
}

/* 成功文本样式 - 设置绿色 */
.text-success {
  color: green;
}

/* 警告文本样式 - 设置橙色 */
.text-warning {
  color: orange;
}

/* 公告 */
/* 公告列表样式 - 设置列表样式和内边距 */
.announcement-list {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

/* 公告列表项样式 - 设置背景色、边框和阴影 */
.announcement-list li {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;
}

/* 公告标题样式 - 设置字体大小、字体粗细和颜色 */
.announcement-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

/* 公告列表项悬停效果 */
.announcement-list li:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 公告内容样式 - 设置字体大小、颜色和行高 */
.announcement-content {
  font-size: 15px;
  color: #555;
  line-height: 1.6;
}

/* 无结果样式 - 设置居中对齐、内边距和字体大小 */
.no-results {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

/* 公告日期样式 - 设置字体大小和颜色 */
.announcement-date {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

/* 图书类别样式 - 设置字体大小和颜色 */
.book-category {
  font-size: 12px;
  color: #888;
}

/* 日期筛选 */
/* 日期范围选择器样式 - 设置弹性布局和阴影 */
.date-range-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f9fa;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

/* 日期范围选择器标签样式 - 设置字体粗细和颜色 */
.date-range-picker label {
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

/* 日期输入框样式 - 设置内边距、边框和过渡效果 */
.date-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

/* 日期分隔符样式 - 设置颜色和字体粗细 */
.date-separator {
  color: #666;
  font-weight: 500;
}

/* 日期筛选按钮样式 - 设置背景色和颜色 */
.date-filter-btn {
  background-color: #1976d2;
  color: white;
}

/* 日期筛选按钮悬停效果 */
.date-filter-btn:hover {
  background-color: #1565c0;
}

/* 日期清除按钮样式 - 设置内边距、背景色和过渡效果 */
.date-clear-btn {
  padding: 16px 30px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

/* 日期清除按钮悬停效果 */
.date-clear-btn:hover {
  background-color: #e0e0e0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  /* 日期范围选择器适配 - 设置换行和间距 */
  .date-range-picker {
    flex-wrap: wrap;
    gap: 8px;
  }

  /* 日期筛选和清除按钮适配 - 设置内边距和字体大小 */
  .date-filter-btn,
  .date-clear-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  /* 公告列表项适配 - 设置内边距 */
  .announcement-list li {
    padding: 15px;
  }

  /* 公告标题适配 - 设置字体大小 */
  .announcement-title {
    font-size: 16px;
  }

  /* 公告内容适配 - 设置字体大小 */
  .announcement-content {
    font-size: 14px;
  }
}

/* 公告搜索栏样式 */
/* 公告搜索栏样式 - 设置弹性布局、背景色和阴影 */
.announcement-search-bar {
  display: flex;
  justify-content: center;
  padding: 0;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  overflow: hidden;
  margin: 0 auto 20px;
}

/* 公告搜索选择框样式 - 设置内边距、背景色和光标 */
.announcement-search-bar .search-select {
  padding: 16px 20px;
  border: none;
  background-color: #f9f9f9;
  font-size: 16px;
  width: 180px;
  cursor: pointer;
  border-right: 1px solid #eee;
}

/* 公告搜索输入框样式 - 设置内边距和轮廓 */
.announcement-search-bar input {
  padding: 16px 20px;
  flex: 1;
  border: none;
  font-size: 16px;
  outline: none;
}

/* 公告搜索按钮样式 - 设置内边距、背景色和过渡效果 */
.announcement-search-bar button {
  padding: 16px 30px;
  background-color: #1194ae;
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

/* 公告搜索按钮悬停效果 */
.announcement-search-bar button:hover {
  background-color: #2980b9;
}

/* 意见建议 */
/* 意见建议页面样式 */
/* 意见建议容器样式 - 设置背景色、圆角和阴影 */
.feedback-container {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  margin-top: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

/* 意见建议标签样式 - 设置弹性布局和底部边框 */
.feedback-tabs {
  display: flex;
  margin: 20px 0;
  gap: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

/* 意见建议标签按钮样式 - 设置背景色、颜色和内边距 */
.feedback-tabs button {
  background-color: #f0f0f0;
  color: #333;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
}

/* 激活的意见建议标签按钮样式 */
.feedback-tabs button.active {
  background-color: #1194ae;
  color: white;
}

/* 表单 */
/* 意见建议表单容器样式 - 设置最大宽度和居中对齐 */
.feedback-form-container {
  max-width: 800px;
  margin: 0 auto;
}

/* 意见建议表单样式 - 设置背景色和内边距 */
.feedback-form {
  background-color: #f9f9f9;
  padding: 25px;
  border-radius: 8px;
}

/* 表单行样式 - 设置下边距 */
.feedback-form .form-row {
  margin-bottom: 15px;
}

/* 表单标签样式 - 设置显示方式、字体大小和字体粗细 */
.feedback-form label {
  display: block;
  font-size: 15px;
  margin-bottom: 8px;
  font-weight: 500;
}

/* 表单输入框样式 - 设置宽度、内边距和边框 */
.feedback-form input,
.feedback-form select,
.feedback-form textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 15px;
  box-sizing: border-box;
}

/* 必填项样式 - 设置颜色 */
.required {
  color: #e74c3c;
}

/* 表单文本域样式 - 设置调整方式 */
.feedback-form textarea {
  resize: vertical;
}

/* 表单操作样式 - 设置弹性布局和对齐方式 */
.feedback-form .form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 表单操作按钮样式 - 设置内边距、字体大小和背景色 */
.feedback-form .form-actions button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #1194ae;
}

/* 意见建议表单错误信息样式 - 设置颜色和字体大小 */
.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

/* 历史 */
/* 意见建议历史样式 - 设置上边距 */
.feedback-history {
  margin-top: 20px;
}

/* 无历史记录样式 - 设置居中对齐和背景色 */
.no-history {
  text-align: center;
  padding: 60px 0;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
}

/* 历史列表样式 - 设置弹性布局和间距 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 历史项样式 - 设置背景色、圆角和阴影 */
.history-item {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #1194ae;
}

/* 历史头部样式 - 设置弹性布局和对齐方式 */
.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  align-items: center;
}

/* 历史标题样式 - 设置字体粗细和字体大小 */
.history-title {
  font-weight: 600;
  font-size: 16px;
}

/* 历史日期样式 - 设置字体大小和颜色 */
.history-date {
  font-size: 14px;
  color: #666;
}

/* 历史内容样式 - 设置下边距和行高 */
.history-content {
  margin-bottom: 15px;
  line-height: 1.8;
}

/* 历史状态样式 - 设置上边距和顶部边框 */
.history-status {
  padding-top: 10px;
  border-top: 1px dashed #ddd;
  font-size: 14px;
}

/* 已回复历史状态样式 - 设置颜色 */
.history-status.replied {
  color: #27ae60;
}

/* 待处理历史状态样式 - 设置颜色 */
.history-status.pending {
  color: #e67e22;
}

/* 历史回复样式 - 设置上边距、背景色和圆角 */
.history-reply {
  margin-top: 8px;
  padding: 10px;
  background-color: rgba(39, 174, 96, 0.1);
  border-radius: 4px;
  color: #333;
}

/* 搜索 */
/* 搜索查询显示样式 - 设置字体大小和颜色 */
.search-query-display {
  font-size: 18px;
  color: #666;
  font-weight: normal;
  margin-left: 15px;
}

/* 结果计数样式 - 设置字体大小、颜色和字体粗细 */
.result-count {
  font-size: 16px;
  color: #1194ae;
  margin-left: 15px;
  font-weight: normal;
}

/* 回到顶部区块 */
/* 回到顶部按钮样式 - 设置定位、尺寸和阴影 */
.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 28px;
  width: 64px;
  height: 64px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(17, 148, 174, 0.12),
    rgba(14, 138, 160, 0.06)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 400;
  box-shadow: 0 10px 24px rgba(17, 148, 174, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(6px);
  transition: transform 0.18s, box-shadow 0.18s;
}

/* 回到顶部按钮悬停效果 */
.back-to-top:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 18px 36px rgba(17, 148, 174, 0.22),
    0 6px 12px rgba(0, 0, 0, 0.12);
}

/* 回到顶部按钮焦点效果 */
.back-to-top:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(17, 148, 174, 0.12);
}

/* 回到顶部按钮图片样式 */
.back-to-top img {
  width: 46px;
  height: 46px;
  object-fit: cover;
  border-radius: 10px;
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) inset;
}

/* 回到顶部按钮提示文字 - 使用伪元素创建 */
.back-to-top::after {
  content: "回到顶部";
  position: absolute;
  right: 100%;
  bottom: 50%;
  transform: translateY(50%) translateX(-8px);
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

/* 回到顶部按钮提示文字悬停效果 */
.back-to-top:hover::after {
  opacity: 1;
  transform: translateY(50%) translateX(-12px);
}

/* 分页 */
/* 分页样式 - 设置上边距和对齐方式 */
.pagination {
  margin-top: 30px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

/* 分页按钮样式 - 设置内边距、边框和过渡效果 */
.pagination button {
  margin: 0 3px;
  padding: 8px 16px;
  border: 1px solid #181616;
  background-color: #82b7ec;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
  min-width: 40px;
}

/* 分页按钮悬停效果（非禁用状态） */
.pagination button:hover:not(:disabled) {
  background-color: #1976d2;
  border-color: #1976d2;
}

/* 激活的分页按钮样式 */
.pagination button.active {
  background-color: #1976d2;
  color: white;
  border-color: #1976d2;
}

/* 禁用的分页按钮样式 */
.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background-color: #f5f5f5;
}

/* 总页数样式 - 设置字体大小和颜色 */
.total-pages {
  font-size: 14px;
  color: #666;
  margin-right: 15px;
}

/* 登录提示样式 */
.login-prompt {
  text-align: center;
  padding: 60px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.login-prompt h2 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 24px;
}

.login-prompt p {
  color: #666;
  font-size: 16px;
  margin-bottom: 25px;
}

.login-btn {
  background-color: #1194ae;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-btn:hover {
  background-color: #0d7a8f;
}
</style>