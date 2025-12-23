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
          <!-- 小助手机器人 -->
          <div class="ai-assistant" @click="handleAIAssistant">
            <el-tooltip 
              :content="isLoggedIn ? '点击打开消息列表' : '请先登录后查看消息列表'"
              placement="bottom"
            >
              <div 
                class="ai-icon"
                :class="{ 'disabled': !isLoggedIn }"
              >
                🤖
              </div>
            </el-tooltip>
          </div>

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
                      <button
                        v-if="isLoggedIn"
                        @click="currentBook._available_copies > 0 ? borrowBook(currentBook._bid) : reserveBook(currentBook)"
                        class="borrow-btn"
                      >
                        {{ currentBook._available_copies > 0 ? '借阅图书' : '预约图书' }}
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
                  <span class="info-item">剩余数量：{{ currentBook._available_copies }}</span>
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
                          <span>{{ userInfo?._lend_num || userInfo?.lend_num || "--" }}</span>
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
                      :class="{ active: borrowingStatus === '_' }"
                      @click="borrowingStatus = '_'"
                    >
                      预约中 ({{ borrowingStats?.returned || 0 }})
                    </button>
                  </div>
                  <table id="borrowing-table">
                    <thead>
                      <tr>
                        <th>序号</th>
                        <th>ISBN</th>
                        <th>图书名称</th>
                        <!-- 借阅中和已归还状态 -->
                        <template v-if="borrowingStatus !== '_'">
                          <th>借阅日期</th>
                          <th>截止日期</th>
                          <th v-if="borrowingStatus === 'returned'">归还日期</th>
                          <th>状态</th>
                        </template>
                        <!-- 预约中状态 -->
                        <template v-else>
                          <th>预约日期</th>
                          <th>预约状态</th>
                          <th>通知方式</th>
                        </template>
                        <th v-if="borrowingStatus === 'borrowing'">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="borrowingList.length === 0">
                        <td
                          :colspan="borrowingStatus === '_' ? 7 : (borrowingStatus === 'returned' ? 8 : 7)"
                          style="text-align: center; padding: 20px"
                        >
                          暂无{{ borrowingStatus === '_' ? '预约' : '借阅' }}记录
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
                        <template v-if="borrowingStatus !== '_'">
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
                        <template v-else>
                          <td>{{ record.reserveDate }}</td>
                          <td>
                            <span
                              class="status-tag"
                              :class="{
                                'waiting': record.reserveStatus === 'waiting',
                                'available': record.reserveStatus === 'available',
                                'expired': record.reserveStatus === 'expired',
                                'cancelled': record.reserveStatus === 'cancelled',
                                'received': record.reserveStatus === 'received'
                              }"
                            >
                              {{ getReserveStatusText(record.reserveStatus) }}
                            </span>
                          </td>
                          <td>{{ record.notificationMethod }}</td>
                          <td>
                            <button
                              v-if="record.reserveStatus === 'waiting'"
                              class="cancel-btn"
                              @click="cancelReservation(record.id)"
                            >
                              取消预约
                            </button>
                            <button
                              v-if="record.reserveStatus === 'available'"
                              class="confirm-btn"
                              @click="confirmReceive(record.id)"
                            >
                              确认取书
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
                  <div class="visualization-container">
                    <!-- 个人借阅趋势总览 -->
                    <div class="chart-section">
                      <h3>📈 个人借阅趋势总览</h3>
                      <div class="chart-controls">
                        <select v-model="trendTimeUnit" @change="loadBorrowingTrendData">
                          <option value="month">按月查看</option>
                          <option value="semester">按学期查看</option>
                        </select>
                        <input type="number" v-model="trendYear" @change="loadBorrowingTrendData" min="2020" :max="new Date().getFullYear()" placeholder="年份">
                      </div>
                      <div class="chart-wrapper">
                        <v-chart 
                          :option="borrowingTrendOption" 
                          style="height: 400px" 
                          v-if="borrowingTrendOption.series && borrowingTrendOption.series.length > 0"
                        ></v-chart>
                        <div v-else class="chart-placeholder">
                          <p>📊 借阅趋势图表</p>
                          <p>暂无数据可显示</p>
                        </div>
                      </div>
                    </div>

                    <!-- 阅读领域分布演化 -->
                    <div class="chart-section">
                      <h3>📚 阅读领域分布演化</h3>
                      <div class="chart-controls">
                        <select v-model="categoryEvolutionView" @change="loadCategoryEvolutionData">
                          <option value="stacked">堆叠面积图</option>
                          <option value="pie">饼图序列</option>
                        </select>
                      </div>
                      <div class="chart-wrapper">
                       <v-chart 
                          v-if="categoryEvolutionView === 'stacked' && categoryEvolutionStackedOption.series && categoryEvolutionStackedOption.series.length > 0"
                          :option="categoryEvolutionStackedOption" 
                          style="height: 400px"
                        ></v-chart>
                        <div v-if="categoryEvolutionView === 'stacked'" class="chart-placeholder">
                          <p>📚 领域分布堆叠图</p>
                          <p>请安装ECharts库以查看图表：npm install echarts vue-echarts</p>
                        </div>
                        <div v-else class="pie-charts-container">
                          
                            <div class="chart-placeholder">
                              <p>📈 {{ chart.period }} 饼图</p>
                            </div>
                        </div>
                      </div>
                    </div>

                    <!-- 阅读习惯日历 -->
                    <div class="chart-section">
                      <h3>📅 阅读习惯日历</h3>
                      <div class="chart-controls">
                        <input type="number" v-model="calendarYear" @change="loadReadingCalendarData" min="2020" :max="new Date().getFullYear()" placeholder="年份">
                      </div>
                      <div class="chart-wrapper">
                        <v-chart 
                          :option="readingCalendarOption" 
                          style="height: 500px" 
                          v-if="readingCalendarOption.series && readingCalendarOption.series.length > 0"
                        ></v-chart>
                        <div class="chart-placeholder">
                          <p>📅 阅读习惯日历</p>
                          
                        </div>
                      </div>
                    </div>
                  </div>
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
                    <option value="投诉">投诉</option>
                    <option value="荐购">荐购</option>
                    <option value="其他">其他</option>
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
                <!-- 图书可视化页面 -->
        <div v-if="currentPage === 'visualization'">
          <div class="dashboard-container">
            <!-- 标题区域 -->
            <div class="dashboard-header">
              <p class="subtitle">实时洞察图书馆动态，发现阅读新趋势</p>
            </div>

            <!-- 最佳读者榜单 -->
            <div class="dashboard-section">
              <h2 class="section-title">
                <span class="icon">🏆</span>
                最佳读者榜单
              </h2>
              <div class="leaderboard-container">
                <!-- 月度借阅量Top 10 -->
                <div class="leaderboard-card">
                  <h3>阅读先锋</h3>
                  <div class="leaderboard-list">
                    <div v-for="(reader, index) in topReaders" :key="index" class="leaderboard-item">
                      <div class="rank">{{ index + 1 }}</div>
                      <div class="reader-info">
                        <div class="reader-id">学号: {{ reader.studentId }}</div>
                        <div class="reader-dept">{{ reader.department }}</div>
                      </div>
                      <div class="reader-stats">
                        <div class="borrow-count">本月借阅 {{ reader.borrowCount }} 本</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 博览群书 -->
                <div class="leaderboard-card">
                  <h3>博览群书</h3>
                  <div class="leaderboard-list">
                    <div v-for="(reader, index) in diverseReaders" :key="index" class="leaderboard-item">
                      <div class="rank">{{ index + 1 }}</div>
                      <div class="reader-info">
                        <div class="reader-id">学号: {{ reader.studentId }}</div>
                        <div class="reader-dept">{{ reader.department }}</div>
                      </div>
                      <div class="reader-stats">
                        <div class="category-count">涉猎 {{ reader.categoryCount }} 个类别</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 院系/专业借阅活力榜 -->
            <div class="dashboard-section">
              
              <h2 class="section-title">
                <span class="icon">📊</span>
                院系借阅活力榜
              </h2>
              <div class="chart-container">
                <v-chart 
                :option="departmentChartOption" 
                style="height: 400px"
                v-if="departmentChartOption.series && departmentChartOption.series.length > 0"
              ></v-chart>

                <div class="date-filter">
                  <input type="date" v-model="startDate" class="date-input">
                  <span>至</span>
                  <input type="date" v-model="endDate" class="date-input">
                  <button @click="updateDepartmentData" class="update-btn">更新</button>
                </div>
                
              </div>
            </div>

            <!-- 馆藏热门星球 -->
            <div class="dashboard-section">
              <h2 class="section-title">
                <span class="icon">🌟</span>
                馆藏热门星球
              </h2>
              <div class="chart-container">
                
              </div>
            </div>

            <!-- 实时动态流动 -->
            <div class="dashboard-section">
             
              <h2 class="section-title">
                <span class="icon">📚</span>
                实时动态
              </h2>
              <div class="realtime-stream">
                 <v-chart 
                :option="wordCloudOption" 
                style="height: 400px"
                v-if="wordCloudOption.series && wordCloudOption.series.length > 0"
              ></v-chart>
                <transition-group name="fade">
                  <div 
                    v-for="activity in realtimeActivities" 
                    :key="activity.id"
                    class="activity-item"
                  >
                    <span class="activity-time">{{ activity.time }}</span>
                    <span class="activity-content">{{ activity.content }}</span>
                  </div>
                </transition-group>
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
          '/api/books',
          '/api/categories',
          '/api/announcements'
        ];
        
        // 如果是公开接口的401错误，不弹出提示
        const isPublicEndpoint = publicEndpoints.some(endpoint => url.includes(endpoint));
        
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
  data() {
    return {
      // 可视化相关数据
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      // 最佳读者数据
      topReaders: [],
      diverseReaders: [],
      // 院系数据
      departmentChartOption: { series: [] },
      // 词云数据
      wordCloudOption: { series: [] },
      // 实时动态数据
      realtimeActivities: [],
      activityId: 0,

      clickedSearch: false, // 添加这个标志位来跟踪是否点击了检索按钮或选择了分类
      showUserDropdown: false, // 控制用户下拉菜单显示状态
      selectedCategories: [], // 存储已选择的类别
      lastToken: null,      // 存储上次的token
      lastUserInfo: null,    // 存储上次的userInfo
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
      feedbackName: "",
      feedbackEmail: "",
      feedbackType: "建议",
      feedbackMessage: "",
      feedbackError: "",
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

      // 逾期提醒消息
      overdueMessages: [],

      // 意见建议页面相关数据
      feedbackTab: "new", // new 或 history
      feedbackHistory: [],
      currentFeedbackPage: 1,
      feedbacksPerPage: 5,

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
      // 逾期检测相关
      overdueBooks: [],
      upcomingDueBooks: [],
      reminderFlags: {},
      overdueCheckTimer: null,

      // 借阅图谱相关数据
      trendTimeUnit: "month", // 'month' 或 'semester'
      trendYear: new Date().getFullYear(),
      borrowingTrendOption: {},
      categoryEvolutionView: "stacked",
      categoryEvolutionStackedOption: {},
      categoryEvolutionPieOptions: [],
      calendarYear: new Date().getFullYear(),
      readingCalendarOption: {},
    };
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem("token") && !!this.user;
    },
    searchInputClasses() {
      return {
        'has-tags': this.selectedCategories.length > 0
      };
    },
    searchStatusText() {
      const parts = [];
      if (this.selectedCategories.length > 0) {
        parts.push(`类别: ${this.selectedCategories.map(cat => cat.label).join(', ')}`);
      }
      if (this.searchQuery) {
        parts.push(`${this.searchType === 'book' ? '书名' : '作者'}: ${this.searchQuery}`);
      }
      return parts.length > 0 ? parts.join(' | ') : '全部图书';
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

      //if (
        //this.currentCategory !== "" &&
        //this.currentCategory !== null &&
        //this.currentCategory !== undefined
     // ) {
       // result = result.filter((book) => {
         // const bookTid = book._tid || (book.category && book.category._tid);
          //return String(bookTid) === String(this.currentCategory);
        //});
      //}
      // 分类筛选 - 支持多分类
      if (this.selectedCategories.length > 0) {
        result = result.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return this.selectedCategories.some(cat => String(cat.value) === String(bookTid));
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
          return this.selectedCategories.some(cat => String(cat.value) === String(bookTid));
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
          return this.selectedCategories.some(cat => String(cat.value) === String(bookTid));
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
          return this.selectedCategories.some(cat => String(cat.value) === String(bookTid));
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
    // 我的借阅：基于当前过滤状态返回要显示的借阅记录
    filteredBorrowingList() {
      if (!Array.isArray(this.borrowingList)) return [];
      if (this.borrowingStatus === "borrowing") {
        return this.borrowingList.filter((r) => r.status === "borrowing");
      }
      if (this.borrowingStatus === "returned") {
        return this.borrowingList.filter((r) => r.status === "returned");
      } else if (this.borrowingSearchType === "date") {
        // 按日期范围筛选
        if (this.borrowingStartDate) {
          result = result.filter(
            (record) => record.borrowDate >= this.borrowingStartDate
          );
        }
        if (this.borrowingEndDate) {
          result = result.filter(
            (record) => record.borrowDate <= this.borrowingEndDate
          );
        }
      }
      // 默认返回全部
      return this.borrowingList;
    },
    
    // 当前借阅数量（按借阅记录计数，同一本书借两本计2）
    currentBorrowCount() {
      if (!Array.isArray(this.allBorrowingRecords)) return 0;
      return this.allBorrowingRecords.filter((r) => r.status === "borrowing")
        .length;
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
  watch: {
    personalTab(newTab) {
      if (newTab === 'borrowing_total' && this.isLoggedIn) {
        this.loadBorrowingTrendData();
        this.loadCategoryEvolutionData();
        this.loadReadingCalendarData();
      }
    }
  },
  methods: {
  // 加载可视化数据
  async loadVisualizationData() {
    try {
      // 并行加载所有数据
      const [statsRes, recordsRes, rankRes] = await Promise.all([
        axios.get('/api/borrow-records/stats', {
          params: {
            start: this.startDate,
            end: this.endDate
          }
        }),
        axios.get('/api/borrow-records'),
        axios.get('/api/readers/rank')
      ]);

      // 更新院系借阅活力榜
      if (statsRes.data.success) {
        this.updateDepartmentChart(statsRes.data.data || []);
      }

      // 处理最佳读者榜单
      if (rankRes.data.success) {
        this.processTopReaders(rankRes.data.data.res_rank || []);
      }

      // 处理读者数据（用于多样化阅读统计）
      if (recordsRes.data.success) {
        this.processReaderData(recordsRes.data.data.historylist || []);
        // 加载词云数据
        this.updateWordCloud(recordsRes.data.data.historylist || []);
      }

      // 加载实时动态
      this.startRealtimeUpdate();
    } catch (error) {
      console.error('加载可视化数据失败:', error);
      // 确保即使出错也初始化图表
      this.updateDepartmentChart([]);
      this.topReaders = [];
      this.diverseReaders = [];
      this.updateWordCloud([]);
    }
  },

  // 处理最佳读者榜单数据
  processTopReaders(readers) {
    if (!Array.isArray(readers) || readers.length === 0) {
      this.topReaders = [];
      this.diverseReaders = [];
      return;
    }

    // 阅读先锋 - 按借阅数量排序
    this.topReaders = readers.slice(0, 10).map((reader, index) => ({
      rank: index + 1,
      studentId: reader._account || '',
      department: reader.department ? reader.department._dname : '未知院系',
      borrowCount: reader.lend_num || 0
    }));

    // 博览群书 - 这里需要通过借阅记录计算
    // 由于缺乏专门的接口，我们可以通过现有数据估算
    const readerCategoryMap = {};
    // 这部分需要从借阅记录中统计，暂时简化处理
    this.diverseReaders = readers.slice(0, 10).map((reader, index) => ({
      rank: index + 1,
      studentId: reader._account || '',
      department: reader.department ? reader.department._dname : '未知院系',
      categoryCount: Math.floor(Math.random() * 10) + 1 // 临时模拟数据
    }));
  },

  // 处理读者数据（用于多样化阅读统计）
  processReaderData(records) {
    if (!Array.isArray(records) || records.length === 0) {
      this.diverseReaders = [];
      return;
    }

    // 统计每个读者涉及的图书类别数量
    const readerCategoryStats = {};
    
    records.forEach(record => {
      const userId = record._uid;
      const categoryId = record.book?._tid;
      
      if (userId && categoryId) {
        if (!readerCategoryStats[userId]) {
          readerCategoryStats[userId] = {
            userId: userId,
            userName: record.user?._name || '未知用户',
            account: record.user?._account || '',
            department: record.user?.department?._dname || '未知院系',
            categories: new Set()
          };
        }
        readerCategoryStats[userId].categories.add(categoryId);
      }
    });

    // 转换为数组并排序
    const diverseReaderList = Object.values(readerCategoryStats)
      .map(reader => ({
        studentId: reader.account || reader.userId,
        department: reader.department,
        categoryCount: reader.categories.size
      }))
      .sort((a, b) => b.categoryCount - a.categoryCount)
      .slice(0, 10)
      .map((reader, index) => ({
        ...reader,
        rank: index + 1
      }));

    this.diverseReaders = diverseReaderList;
  },

  // 个人借阅趋势数据
  async loadBorrowingTrendData() {
    try {
      const params = {
        year: this.trendYear,
        unit: this.trendTimeUnit,
        userId: this.user?._uid || this.user?.id
      };
      
      // 使用现有的借阅记录接口
      const response = await axios.get('/api/borrow-records/my');
      
      if (response.data.success) {
        this.processBorrowingTrendData(response.data.data.ownlist || [], params);
      } else {
        this.borrowingTrendOption = {};
      }
    } catch (error) {
      console.error('加载借阅趋势数据失败:', error);
      this.borrowingTrendOption = {};
    }
  },

  // 处理借阅趋势数据
  processBorrowingTrendData(records, params) {
    if (!Array.isArray(records) || records.length === 0) {
      this.borrowingTrendOption = {};
      return;
    }

    // 按月份或学期分组统计
    const trendData = {};
    
    records.forEach(record => {
      if (record._status === 1 && record._begin_time) { // 已归还的记录
        const date = new Date(record._begin_time);
        let periodKey;
        
        if (params.unit === 'month') {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          // 按学期分组 (春季学期: 3-8月, 秋季学期: 9-2月)
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          periodKey = month >= 3 && month <= 8 ? `${year}-春` : `${year}-秋`;
        }
        
        if (!trendData[periodKey]) {
          trendData[periodKey] = 0;
        }
        trendData[periodKey]++;
      }
    });

    // 转换为图表数据
    const periods = Object.keys(trendData).sort();
    const myData = periods.map(period => trendData[period]);
    
    // 为了演示，平均数据使用我的数据的平均值
    const avgValue = myData.reduce((sum, val) => sum + val, 0) / myData.length || 0;
    const avgData = myData.map(() => avgValue);

    this.updateBorrowingTrendChart({
      periods: periods,
      myData: myData,
      avgData: avgData
    });
  },

  // 更新借阅趋势图表
  updateBorrowingTrendChart(data) {
    if (!data || !Array.isArray(data.periods) || data.periods.length === 0) {
      this.borrowingTrendOption = {};
      return;
    }

    this.borrowingTrendOption = {
      title: {
        text: '个人借阅趋势对比',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['我的借阅量', '全馆平均借阅量'],
        top: '30px'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.periods
      },
      yAxis: {
        type: 'value',
        name: '借阅数量'
      },
      series: [
        {
          name: '我的借阅量',
          type: 'line',
          stack: 'Total',
          data: data.myData,
          itemStyle: { color: '#5470c6' }
        },
        {
          name: '全馆平均借阅量',
          type: 'line',
          stack: 'Total',
          data: data.avgData,
          itemStyle: { color: '#91cc75' }
        }
      ]
    };
  },

  // 阅读领域分布数据
  async loadCategoryEvolutionData() {
    try {
      // 使用现有的借阅记录接口
      const response = await axios.get('/api/borrow-records/my');
      
      if (response.data.success) {
        this.processCategoryEvolutionData(response.data.data.ownlist || []);
      } else {
        this.categoryEvolutionStackedOption = {};
        this.categoryEvolutionPieOptions = [];
      }
    } catch (error) {
      console.error('加载类别演化数据失败:', error);
      this.categoryEvolutionStackedOption = {};
      this.categoryEvolutionPieOptions = [];
    }
  },

  // 处理阅读领域分布数据
  processCategoryEvolutionData(records) {
    if (!Array.isArray(records) || records.length === 0) {
      this.categoryEvolutionStackedOption = {};
      this.categoryEvolutionPieOptions = [];
      return;
    }

    // 按时间和类别分组统计
    const categoryEvolution = {};
    
    records.forEach(record => {
      if (record._begin_time && record.book?._tid) {
        const date = new Date(record._begin_time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const period = `${year}-${month}`;
        const categoryName = record.book.category?._type_name || '未知分类';
        
        if (!categoryEvolution[period]) {
          categoryEvolution[period] = {};
        }
        
        if (!categoryEvolution[period][categoryName]) {
          categoryEvolution[period][categoryName] = 0;
        }
        
        categoryEvolution[period][categoryName]++;
      }
    });

    // 转换为图表数据
    const dataForChart = [];
    Object.keys(categoryEvolution).forEach(period => {
      Object.keys(categoryEvolution[period]).forEach(category => {
        dataForChart.push({
          period: period,
          category: category,
          count: categoryEvolution[period][category]
        });
      });
    });

    this.updateCategoryEvolutionChart(dataForChart);
  },

  // 阅读日历数据
  async loadReadingCalendarData() {
    try {
      const params = {
        year: this.calendarYear,
        userId: this.user?._uid || this.user?.id
      };
      
      // 使用现有的借阅记录接口
      const response = await axios.get('/api/borrow-records/my');
      
      if (response.data.success) {
        this.processReadingCalendarData(response.data.data.ownlist || [], params);
      } else {
        this.readingCalendarOption = {};
      }
    } catch (error) {
      console.error('加载阅读日历数据失败:', error);
      this.readingCalendarOption = {};
    }
  },

  // 处理阅读日历数据
  processReadingCalendarData(records, params) {
    if (!Array.isArray(records) || records.length === 0) {
      this.readingCalendarOption = {};
      return;
    }

    // 按日期统计阅读强度
    const calendarData = {};
    
    records.forEach(record => {
      if (record._begin_time) {
        const date = new Date(record._begin_time);
        if (date.getFullYear() == params.year) {
          const dateStr = date.toISOString().split('T')[0];
          
          if (!calendarData[dateStr]) {
            calendarData[dateStr] = 0;
          }
          calendarData[dateStr]++;
        }
      }
    });

    // 转换为热力图数据
    const heatmapData = Object.keys(calendarData).map(date => {
      return [new Date(date).getTime(), calendarData[date]];
    });

    this.updateReadingCalendarChart(heatmapData);
  },

  // 更新阅读日历图表
  updateReadingCalendarChart(data) {
    if (!Array.isArray(data)) {
      this.readingCalendarOption = {};
      return;
    }

    this.readingCalendarOption = {
      title: {
        text: `${this.calendarYear}年阅读习惯日历`,
        left: 'center'
      },
      tooltip: {
        position: 'top',
        formatter: function (params) {
          if (!params.data) return '';
          const date = new Date(params.data[0]);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}<br/>阅读强度: ${params.data[1]}`;
        }
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map(item => item[1]), 4),
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        top: 65,
        pieces: [
          { min: 4, color: '#d73027' },
          { min: 3, max: 3, color: '#f46d43' },
          { min: 2, max: 2, color: '#fdae61' },
          { min: 1, max: 1, color: '#fee08b' },
          { value: 0, color: '#d9d9d9' }
        ]
      },
      calendar: {
        top: 120,
        left: 30,
        right: 30,
        cellSize: ['auto', 13],
        range: this.calendarYear,
        itemStyle: {
          borderWidth: 0.5
        },
        yearLabel: { show: false }
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data
      }
    };
  },

  // 更新院系图表
  updateDepartmentChart(data) {
    // 安全检查
    if (!Array.isArray(data) || data.length === 0) {
      this.departmentChartOption = {};
      return;
    }

    this.departmentChartOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: data.map(item => item.name || item.department || '未知') || []
      },
      series: [{
        name: '借阅量',
        type: 'bar',
        data: data.map(item => item.value || item.count || 0),
        itemStyle: {
          color: '#1194ae'
        }
      }]
    };
  },
  
  // 更新词云
  updateWordCloud(records) {
    // 安全检查
    if (!Array.isArray(records) || records.length === 0) {
      this.wordCloudOption = {};
      return;
    }

    // 统计图书借阅次数
    const bookStats = {};
    records.forEach(record => {
      const bookName = record.book?._book_name;
      if (bookName) {
        if (!bookStats[bookName]) {
          bookStats[bookName] = 0;
        }
        bookStats[bookName]++;
      }
    });

    // 转换为词云数据格式
    const wordCloudData = Object.entries(bookStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50); // 只显示前50本热门书

    this.wordCloudOption = {
      tooltip: {
        show: true
      },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        sizeRange: [12, 50],
        rotationRange: [-90, 90],
        rotationStep: 45,
        gridSize: 8,
        drawOutOfBound: false,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold'
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            shadowBlur: 10,
            shadowColor: '#333'
          }
        },
        data: wordCloudData || []
      }]
    };
  },
    

   
    // 原有方法保持不变

    async updateDepartmentData() {
    try {
      const params = {
        start: this.startDate,
        end: this.endDate
      };
      const response = await axios.get('/api/borrow-records/stats', { params });
      this.updateDepartmentChart(response.data.data);
    } catch (error) {
      console.error('更新院系数据失败:', error);
      this.$message.error('更新数据失败');
    }
  },
    

  

  
  
  handleAIAssistant() {
    if (!this.isLoggedIn) {
      this.$message.warning('请先登录后使用AI助手');
      return;
    }
    // 显示逾期提醒消息
    if (this.overdueMessages.length > 0) {
      let message = '📢 逾期提醒：\n\n';
      this.overdueMessages.forEach((msg, index) => {
        message += `${index + 1}. ${msg}\n`;
      });
      alert(message);
    } else {
      alert('🎉 暂无逾期提醒，您当前没有逾期的图书。');
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
      'waiting': '等待中',
      'available': '可领取',
      'expired': '已过期',
      'cancelled': '已取消',
      'received': '已领取'
    };
    return statusMap[status] || status;
  },
  // 在这里添加 clearAllFilters 方法
    clearAllFilters() {
      this.selectedCategories = [];
      this.searchQuery = '';
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
      this.currentCategory = this.selectedCategories.map(cat => cat.value).join(',');
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
      window.location.href = `/HomeView?view=${type}&redirect=${encodeURIComponent(redirect)}`;
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
    
        console.log('loadUserFromStorage - token:', token);
        console.log('loadUserFromStorage - userInfo:', userInfo);
        
        if (!token) {
          this.user = null;
          this.userInfo = null;
          return;
        }
        
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          this.user = parsed;
          this.userInfo = parsed;
          
          // 如果是新登录，检查逾期图书
          if (!this.lastUserInfo && token) {
            this.checkOverdueBooks();
          }
          
          // 强制触发视图更新
          this.$nextTick(() => {
            this.$forceUpdate();
          });
          
          console.log('loadUserFromStorage - 用户信息已加载:', parsed);
        }
      } catch (e) {
        console.error('loadUserFromStorage - 错误:', e);
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
      if (confirm('确定要退出登录吗？')) {
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
        if (['personal', 'feedback'].includes(this.currentPage)) {
          this.currentPage = 'search';
        }
        
        // 显示退出成功提示
        alert('已成功退出登录');
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
      if (['personal', 'feedback'].includes(this.currentPage)) {
        this.currentPage = 'search';
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
      const userMenu = this.$el.querySelector('.user-menu');
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

    async changePage(page ,type = "all" ) {
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
            // 可以在这里加载反馈相关数据
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

  const categoryObj = this.bookCategories.find(cat => cat.value === category);
  if (!categoryObj) return;

  // 查找是否已经选中
  const existingIndex = this.selectedCategories.findIndex(cat => cat.value === category);
  
  if (existingIndex === -1) {
    // 如果未选中，添加到数组
    this.selectedCategories.push(categoryObj);
  } else {
    // 如果已选中，从数组中移除
    this.selectedCategories.splice(existingIndex, 1);
  }
  
  // 更新当前类别为所有选中类别的组合
  this.currentCategory = this.selectedCategories.map(cat => cat.value).join(',');
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
        console.log('loadPersonalData - 开始加载个人数据');
        const response = await axios.get("/api/auth/current-user");
        const payload = response?.data?.data || response?.data || null;
        
        console.log('loadPersonalData - 服务器响应:', payload);
        
        if (payload) {
          this.userInfo = payload;
          this.user = payload;
          localStorage.setItem("userInfo", JSON.stringify(payload));
          
          console.log('loadPersonalData - 个人数据已更新:', payload);
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
          params.categories = this.selectedCategories.map(cat => cat.value).join(',');
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
        alert("搜索图书失败: " + (error.response?.data?.message || error.message));
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
        .map(book => ({ ...book, isNew: true, isHot: false }));  // 标记为新书

      // 热门推荐：按借阅次数排序，取借阅次数最多的30本
      this.hotBooks = [...this.books]
        .sort((a, b) => b._times - a._times)
        .slice(0, 30)
        .map(book => ({ ...book, isNew: false, isHot: true }));  // 标记为热门

      // 为其他图书添加标志
      this.books = this.books.map(book => {
        // 检查是否在新书或热门列表中
        const inNewList = this.newBooks.some(nb => nb._bid === book._bid);
        const inHotList = this.hotBooks.some(hb => hb._bid === book._bid);
        
        return {
          ...book,
          isNew: inNewList,
          isHot: inHotList
        };
      });
    },

    async borrowBook(bookId) {
      if (!bookId) return;

      try {
        const response = await axios.post(`/api/books/${bookId}/borrow`);
        if (response && response.data && response.data.success) {
          alert("借阅成功");
          await this.loadSearchPage();
          // 更新当前图书详情页的图书信息
          if (
            this.currentPage === "bookDetail" &&
            this.currentBook?._bid === bookId
          ) {
            // 重新获取图书详情以更新剩余数量
            const detailResponse = await axios.get(`/api/books/${bookId}`);
            if (detailResponse.data.success) {
              this.currentBook = detailResponse.data.data;
            }
          }
          // 更新借阅记录
          if (
            this.currentPage === "personal" &&
            this.personalTab === "borrowing"
          ) {
            await this.loadBorrowingInfo();
          }
        } else {
          alert("借阅失败: " + response.data.message);
        }
      } catch (error) {
        console.error("借阅失败:", error);
        const errorMessage = error.response?.data?.message || error.message || '请求失败';
        alert("借阅失败: " + (typeof errorMessage === 'string' ? errorMessage : '未知错误'));
      }
    },

    async reserveBook(book) {
      if (!book) return;
      alert("预约功能暂未实现，图书库存为0时无法借阅");
    },

    async returnBook(hid) {
      if (!hid) return;
      try {
        const response = await axios.put(`/api/books/${hid}/return`);
        if (response && response.data && response.data.success) {
          alert("还书成功");
          await Promise.all([
            this.loadBorrowingInfo(),
            this.loadBorrowingHistory(),
          ]);
          await this.loadSearchPage();
        } else {
          alert(
            "还书失败: " +
              ((response && response.data && response.data.message) || "")
          );
        }
      } catch (error) {
        console.error("还书失败:", error.response?.data || error.message);
        alert("还书失败: " + (error.response?.data?.message || error.message));
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
        // 实际项目中替换为真实接口
        const newFeedback = {
          name: this.feedbackName,
          email: this.feedbackEmail,
          type: this.feedbackType,
          message: this.feedbackMessage,
          date: new Date().toISOString().split("T")[0],
          status: "处理中",
          reply: "",
        };

        this.feedbackHistory.unshift(newFeedback);
        alert("感谢您的反馈，已提交！");
        this.clearFeedbackForm();

        this.feedbackTab = "history";
      } catch (error) {
        this.feedbackError = "提交失败，请重试";
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
        // 实际项目中替换为真实接口
        // const response = await axios.get('/api/feedbacks/history');
        // this.feedbackHistory = response.data.data;
      } catch (error) {
        console.error(
          "加载意见建议历史失败:",
          error.response?.data || error.message
        );
      }
    },

    async loadSearchPage() {
      try {
        const response = await axios.get("/api/books");
        this.books = response.data.data.booklist;
        this.filterNewAndHotBooks();
        this.currentPageNum = 1;
      } catch (error) {
        alert(
          "加载图书失败: " + (error.response?.data?.message || error.message)
        );
      }
    },

    async loadBorrowingInfo() {
      try {
        // 获取我的借阅记录
        const response = await axios.get("/api/borrow-records/my");
        const records =
          (response &&
            response.data &&
            response.data.data &&
            response.data.data.ownlist) ||
          [];

        this.borrowingList = records.map((record) => ({
          id: record._hid,
          bookId: record._bid,
          bookName:
            (record.book && (record.book._book_name || record.book._name)) ||
            record._book_name ||
            "",
          isbn: (record.book && record.book._isbn) || record._isbn || "",
          coverUrl:
            (record.book && record.book._cover_url) || record._cover_url || "",
          author: (record.book && record.book._author) || record._author || "",
          borrowDate: record._begin_time
            ? new Date(record._begin_time).toISOString().split("T")[0]
            : "",
          dueDate: record._end_date
            ? new Date(record._end_date).toISOString().split("T")[0]
            : "",
          returnDate: record._status === 1 ? (record._end_date ? new Date(record._end_date).toISOString().split("T")[0] : "") : "",
          // _status: 0 -> borrowing, 1 -> returned
          status: record._status === 1 ? "returned" : "borrowing",
        }));

        // 保存完整副本以供检索使用
        this.allBorrowingRecords = Array.isArray(this.borrowingList)
          ? [...this.borrowingList]
          : [];

        // 统计借阅状态（基于已映射的 borrowingList）
        this.borrowingStats = {
          total: this.borrowingList.length,
          borrowing: this.borrowingList.filter((r) => r.status === "borrowing")
            .length,
          returned: this.borrowingList.filter((r) => r.status === "returned")
            .length,
        };

        // 检查逾期
        this.overdueMessages = [];
        const today = new Date().toISOString().split('T')[0];
        this.borrowingList.forEach(record => {
          if (record.status === 'borrowing' && record.dueDate < today) {
            this.overdueMessages.push(`图书《${record.bookName}》已逾期，请尽快归还。`);
          }
        });
      } catch (error) {
        alert(
          "加载借阅信息失败: " +
            (error.response?.data?.message || error.message)
        );
      }
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

    // 获取验证码
    async getCaptcha() {
      try {
        const response = await axios.get("/api/auth/captcha");
        this.captchaImage = response.data.data.image;
        return response.data.data.token;
      } catch (error) {
        console.error("获取验证码失败:", error.response?.data || error.message);
        alert("获取验证码失败，请重试");
        return null;
      }
    },

    // 跳转到重置密码流程
    async gotoResetPassword() {
      try {
        // 获取验证码
        const captchaToken = await this.getCaptcha();
        if (!captchaToken) return;

        // 这里可以显示验证码输入框
        const newPassword = prompt("请输入新密码:");
        if (!newPassword) return;

        const confirmPassword = prompt("请确认新密码:");
        if (newPassword !== confirmPassword) {
          alert("两次输入的密码不一致");
          return;
        }

        const captchaInput = prompt("请输入验证码:");
        if (!captchaInput) return;

        // 调用重置密码API
        await axios.put("/api/auth/password", {
          account: this.userInfo?.studentId,
          password: newPassword,
          captcha: captchaInput,
          captchaToken: captchaToken,
        });

        alert("密码重置成功，请重新登录");
        // 这里可以跳转到登录页
      } catch (error) {
        console.error("重置密码失败:", error.response?.data || error.message);
        alert(
          "重置密码失败: " + (error.response?.data?.message || error.message)
        );
      }
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

    // 逾期检测方法
    async checkOverdueBooks() {
      if (!this.isLoggedIn) return;
      
      try {
        console.log('开始检查逾期图书...');
        const response = await axios.get("/api/borrow-records/my");
        console.log('借阅记录响应:', response.data);
        
        const records = (response && response.data && response.data.data && response.data.data.ownlist) || [];
        console.log('借阅记录列表:', records);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const overdue = [];
        const upcoming = [];
        
        records.forEach(record => {
          console.log('处理记录:', record._hid, record._status, record._end_date);
          if (record._status === 0) { // 0 means borrowing
            const dueDate = new Date(record._end_date);
            dueDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            console.log('到期日期:', dueDate, '天数差:', daysDiff);
            
            if (daysDiff < 0) {
              // 逾期
              overdue.push({
                ...record,
                daysOverdue: Math.abs(daysDiff)
              });
            } else if (daysDiff <= 3) {
              // 即将到期（包括当天）
              upcoming.push({
                ...record,
                daysLeft: daysDiff
              });
            }
          }
        });
        
        this.overdueBooks = overdue;
        this.upcomingDueBooks = upcoming;
        console.log('逾期图书:', overdue.length, '即将到期:', upcoming.length);
        
        // 检查提醒
        this.checkReminders();
      } catch (error) {
        console.error("检查逾期图书失败:", error);
        console.error("错误详情:", error.response?.data || error.message);
      }
    },

    // 检查并显示提醒
    checkReminders() {
      const userId = this.user?._uid || this.user?.id;
      if (!userId) return;
      
      const reminderKey = `reminders_${userId}`;
      const shownReminders = JSON.parse(localStorage.getItem(reminderKey) || '{}');
      
      // 逾期提醒（每次登录都显示）
      if (this.overdueBooks.length > 0) {
        const overdueBooksText = this.overdueBooks.map(book => 
          `${book._book_name || book.bookName} (逾期 ${book.daysOverdue} 天)`
        ).join('\n');
        alert(`您有逾期的图书，请尽快归还：\n${overdueBooksText}`);
      }
      
      // 即将到期提醒（只显示一次）
      this.upcomingDueBooks.forEach(book => {
        const reminderType = book.daysLeft === 0 ? 'due_today' : 'due_soon';
        const key = `${book._hid}_${reminderType}`;
        
        if (!shownReminders[key]) {
          let message = '';
          if (book.daysLeft === 0) {
            message = `图书 "${book._book_name || book.bookName}" 今天到期，请及时归还。`;
          } else {
            const timeText = book.daysLeft === 1 ? '明天' : `${book.daysLeft}天后`;
            message = `图书 "${book._book_name || book.bookName}" ${timeText}到期，请及时归还。`;
          }
          
          alert(message);
          shownReminders[key] = true;
        }
      });
      
      // 保存提醒状态
      localStorage.setItem(reminderKey, JSON.stringify(shownReminders));
    },

    // 显示提醒详情
    showReminders() {
      let message = '';
      
      if (this.overdueBooks.length > 0) {
        message += '逾期图书：\n';
        this.overdueBooks.forEach(book => {
          message += `- ${book._book_name || book.bookName} (逾期 ${book.daysOverdue} 天)\n`;
        });
        message += '\n';
      }
      
      if (this.upcomingDueBooks.length > 0) {
        message += '即将到期图书：\n';
        this.upcomingDueBooks.forEach(book => {
          let dueText = '';
          if (book.daysLeft === 0) {
            dueText = '今天到期';
          } else if (book.daysLeft === 1) {
            dueText = '明天到期';
          } else {
            dueText = `${book.daysLeft}天后到期`;
          }
          message += `- ${book._book_name || book.bookName} (${dueText})\n`;
        });
      }
      
      if (message) {
        alert(message);
      } else {
        alert('暂无提醒');
      }
    },

    // 公告分页切换方法
    changeAnnouncementPage(page) {
      if (page === "...") return;
      if (page < 1 || page > this.totalAnnouncementPages) return;
      this.currentAnnouncementPage = page;
    },
  },
  async mounted() {

if (this.currentPage === 'visualization') {
    
      await this.loadVisualizationData();
      // 加载词云数据
      const recordsRes = await axios.get('/api/borrow-records');
      this.updateWordCloud(recordsRes.data.data.historylist);
    }

    // 添加全局点击监听器来关闭用户菜单
    document.addEventListener('click', this.handleClickOutside);
    
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
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    // 只有在已登录时才加载需要登录的数据
    if (this.isLoggedIn) {
      await this.loadPersonalData();
      //await this.loadFavorites();
      // 启动逾期检查
      await this.checkOverdueBooks();
      this.overdueCheckTimer = setInterval(() => {
        this.checkOverdueBooks();
      }, 60000); // 每分钟检查一次
    }
    
    // 添加定时检查登录状态 - 改为更短的时间间隔
    this.checkLoginStatus = setInterval(() => {
      this.loadUserFromStorage();
    }, 30000); // 减少到500毫秒
  },



  beforeDestroy() {
    this.stopCarousel();
    document.removeEventListener('click', this.handleClickOutside);
    if (typeof window !== "undefined" && window.removeEventListener) {
      window.removeEventListener("storage", this.onStorageChange);
    }
    
    // 移除页面可见性监听
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    // 清除逾期检查定时器
    if (this.overdueCheckTimer) {
      clearInterval(this.overdueCheckTimer);
    }
    
    // 清除登录状态检查定时器
    if (this.checkLoginStatus) {
      clearInterval(this.checkLoginStatus);
    }
  },
};

</script>

<style>

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
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
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
  content: '';
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

/* 逾期提醒助手样式 */
.ai-assistant {
  margin-right: 15px;
  display: flex;
  align-items: center;
}

.ai-icon {
  font-size: 24px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.ai-icon.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-icon:hover:not(.disabled) {
  transform: scale(1.1);
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
  background-color: #4CAF50;
}

/* 热门标志样式 */
.hot-tag {
  background-color: #FF5722;
}

/* 调整封面容器样式以支持标志定位 */
.book-cover {
  position: relative;  /* 添加这行以支持绝对定位的标志 */
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

/* 可视化页面样式 */
.visualization-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.visualization-header {
  text-align: center;
  margin-bottom: 40px;
}

.visualization-header h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 10px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.2em;
}

.dashboard-section {
  background: white;
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  color: #2c3e50;
}

.section-title .icon {
  margin-right: 10px;
  font-size: 1.5em;
}

/* 榜单样式 */
.leaderboard-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.leaderboard-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.leaderboard-card h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #2c3e50;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.rank {
  width: 30px;
  height: 30px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-weight: bold;
}

.reader-info {
  flex: 1;
}

.reader-id {
  font-weight: bold;
  margin-bottom: 5px;
}

.reader-dept {
  color: #7f8c8d;
  font-size: 0.9em;
}

.reader-stats {
  text-align: right;
}

/* 图表容器样式 */
.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.date-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.update-btn {
  padding: 8px 16px;
  background: #1194ae;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 实时动态样式 */
.realtime-stream {
  height: 200px;
  overflow: hidden;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.activity-time {
  margin-right: 15px;
  color: #7f8c8d;
  font-size: 0.9em;
}

.activity-content {
  flex: 1;
}

/* 动画效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* 借阅图谱样式 */
.visualization-container {
  padding: 20px;
}

.chart-section {
  margin-bottom: 40px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-section h3 {
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 18px;
  display: flex;
  align-items: center;
}

.chart-section h3::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  background: #3498db;
  margin-right: 10px;
  border-radius: 2px;
}

.chart-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.chart-controls select,
.chart-controls input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.chart-controls button {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.chart-controls button:hover {
  background: #2980b9;
}

.chart-wrapper {
  width: 100%;
  min-height: 400px;
}

.pie-charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.pie-chart-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.pie-chart-item h4 {
  text-align: center;
  margin-bottom: 10px;
  color: #34495e;
  font-size: 16px;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  color: #6c757d;
  text-align: center;
}

.chart-placeholder p {
  margin: 10px 0;
  font-size: 16px;
}

.chart-placeholder p:first-child {
  font-size: 24px;
  margin-bottom: 20px;
}

</style>