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
        </ul>

        <!-- 登录注册按钮 / 用户头像 -->
        <div class="auth-links">
          <div v-if="isLoggedIn" class="user-menu">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="avatar"
              class="user-avatar"
              @click.prevent="openPersonal"
            />
            <div
              v-else
              class="user-avatar-placeholder"
              @click.prevent="openPersonal"
            >
              {{
                (user && (user._name || user.name || user._account)) || "用户"
              }}
            </div>

            <div class="user-dropdown">
              <button class="auth-link" @click.prevent="logout">
                退出登录
              </button>
            </div>
          </div>
          <div v-else>
            <a href="#" class="auth-link" @click.prevent="goToAuth('login')"
              >登录</a
            >
            <span class="auth-divider">|</span>
            <a href="#" class="auth-link" @click.prevent="goToAuth('register')"
              >注册</a
            >
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
              <input
                type="text"
                v-model="searchQuery"
                placeholder="请输入查询内容"
              />
              <button @click="gotoSearchResult">检索</button>
            </div>

            <!-- 类别筛选 -->
            <div class="category-filter">
              <span class="filter-label">图书类别：</span>
              <button
                v-for="category in bookCategories"
                :key="category.value"
                @click="filterByCategory(category.value)"
                :class="{
                  'active-category': currentCategory === category.value,
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
                @click="filterByCategoryInResult(category.value)"
                :class="{
                  'active-category': currentCategory === category.value,
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
            
            <div class="book-detail">
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
              
              <div class="detail-info">
                <h2 class="detail-title">{{ currentBook._book_name }}</h2>
                <p><strong>作者：</strong>{{ currentBook._author }}</p>
                <p><strong>ISBN：</strong>{{ currentBook._isbn }}</p>
                <p><strong>出版社：</strong>{{ currentBook._press }}</p>
                <p><strong>出版时间：</strong>{{ currentBook._publish_date }}</p>
                <p><strong>馆藏总数：</strong>{{ currentBook._storage_count }}</p>
                <p><strong>剩余数量：</strong>{{ currentBook._available_count }}</p>
                <p><strong>分类：</strong>{{ currentBook._tid }}</p>
                
                <div class="book-actions">
                  <button 
                    v-if="isLoggedIn" 
                    @click="borrowBook(currentBook)" 
                    class="borrow-btn"
                  >
                    借阅图书
                  </button>
                  <button 
                    v-else 
                    @click="goToAuth('login')" 
                    class="borrow-btn"
                  >
                    登录后借阅
                  </button>
                  <button 
                    v-if="isLoggedIn"
                    @click="toggleFavorite(currentBook._bid)"
                    :class="['favorite-btn', { favorited: isFavorite(currentBook._bid) }]"
                  >
                    {{ isFavorite(currentBook._bid) ? '已收藏' : '收藏图书' }}
                  </button>
                  <button 
                    v-else
                    @click="goToAuth('login')"
                    class="favorite-btn"
                  >
                    登录后收藏
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
              <input
                type="text"
                v-model="searchQuery"
                placeholder="请输入查询内容"
              />
              <button @click="gotoSearchResult">检索</button>
            </div>
            <div class="category-filter">
              <span class="filter-label">图书类别：</span>
              <button
                v-for="category in bookCategories"
                :key="category.value"
                @click="filterByCategory(category.value)"
                :class="{
                  'active-category': currentCategory === category.value,
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
                  :class="{ active: personalTab === 'collection' }"
                  @click="personalTab = 'collection'"
                >
                  我的收藏
                </li>
              </ul>
            </div>
            <div class="personal-content">
              <!-- 未登录提示 -->
              <div v-if="!isLoggedIn" class="login-prompt">
                <h2>请先登录</h2>
                <p>您需要登录后才能查看个人信息</p>
                <button @click="goToAuth('login')" class="login-btn">立即登录</button>
              </div>
              
              <!-- 已登录则显示原有内容 -->
              <div v-else>
                <div v-if="personalTab === 'account'">
                  <h2>账户信息</h2>
                  <div class="account-info">
                    <template v-if="!editMode">
                      <div class="info-item">
                        <label>姓名：</label>
                        <span>{{ userInfo?._account || userInfo?.account || "—" }}</span>
                      </div>
                      <div class="info-item">
                        <label>学号：</label>
                        <span>{{ userInfo?._name || userInfo?.name || "—" }}</span>
                      </div>
                      <div class="info-item">
                        <label>专业：</label>
                        <span>{{ userInfo?._phone || userInfo?.phone || "未填写" }}</span>
                      </div>
                      <div class="info-actions">
                        <button @click="toggleEdit" class="edit-btn">编辑信息</button>
                      </div>
                    </template>
                    <template v-else>
                      <!-- 编辑模式内容 -->
                      <form @submit.prevent="saveEdit">
                        <div class="info-item">
                          <label>姓名：</label>
                          <input v-model="editUser._name" />
                        </div>
                        <div class="info-item">
                          <label>学号：</label>
                          <input v-model="editUser._account" disabled />
                        </div>
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
                </div>
                <table id="borrowing-table">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>ISBN</th>
                      <th>图书名称</th>
                      <th>借阅日期</th>
                      <th>截止日期</th>
                      <th>归还日期</th>
                      <th>状态</th>
                      <th v-if="borrowingStatus === 'borrowing'">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="borrowingList.length === 0">
                      <td
                        :colspan="borrowingStatus === 'borrowing' ? 9 : 8"
                        style="text-align: center; padding: 20px"
                      >
                        暂无借阅记录
                      </td>
                    </tr>
                    <tr
                      v-for="(record, index) in filteredBorrowingList"
                      :key="record.id"
                    >
                      <td>{{ index + 1 }}</td>
                      <td>
                        <div class="table-cover">
                          <img
                            :src="getFullCoverUrl(record.coverUrl)"
                            :alt="record.bookName"
                            class="book-img"
                            @error="handleImgError($event, record)"
                          />
                          <div
                            class="cover-placeholder"
                            v-if="
                              !record.coverUrl || imgErrorMap[record.bookId]
                            "
                          >
                            {{ record.bookName.substring(0, 2) }}
                          </div>
                        </div>
                      </td>
                      <td>{{ record.bookName }}</td>
                      <td>{{ record.author }}</td>
                      <td>{{ record.borrowDate }}</td>
                      <td>{{ record.dueDate }}</td>
                      <td>
                        <span
                          class="status-tag"
                          :class="
                            record.status === 'borrowing'
                              ? 'borrowing'
                              : 'returned'
                          "
                        >
                          {{
                            record.status === "borrowing" ? "借阅中" : "已归还"
                          }}
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
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- 我的收藏 -->
              <div v-if="personalTab === 'collection'">
                <h2>我的收藏</h2>
                <div class="personal-search">
                  <select v-model="collectionSearchType" class="search-select">
                    <option value="book">按图书名称查询</option>
                    <option value="author">按作者姓名查询</option>
                    <option value="date">按收藏时间查询</option>
                  </select>
                  <template v-if="collectionSearchType !== 'date'">
                    <input
                      type="text"
                      v-model="collectionSearchQuery"
                      placeholder="请输入查询内容"
                    />
                  </template>
                  <template v-else>
                    <div class="date-range-inputs">
                      <input
                        type="date"
                        v-model="collectionStartDate"
                        class="date-input"
                        :max="collectionEndDate || today"
                      />
                      <span class="date-separator">至</span>
                      <input
                        type="date"
                        v-model="collectionEndDate"
                        class="date-input"
                        :min="collectionStartDate"
                        :max="today"
                      />
                    </div>
                  </template>
                  <button @click="searchCollection">检索</button>
                </div>
                <div class="collection-grid">
                  <div
                    v-if="collectionList.length === 0"
                    style="
                      grid-column: 1 / -1;
                      text-align: center;
                      padding: 40px;
                    "
                  >
                    暂无收藏记录
                  </div>
                  <div
                    class="collection-item"
                    v-for="item in filteredCollectionList"
                    :key="item.id"
                  >
                    <div class="book-cover">
                      <img
                        :src="getFullCoverUrl(item.coverUrl)"
                        :alt="item.bookName"
                        class="book-img"
                        @error="handleImgError($event, item)"
                      />
                      <div
                        class="cover-placeholder"
                        v-if="!item.coverUrl || imgErrorMap[item.bookId]"
                      >
                        {{ item.bookName.substring(0, 2) }}
                      </div>
                    </div>
                    <div class="collection-info">
                      <h3 class="book-title">{{ item.bookName }}</h3>
                      <p class="book-author">{{ item.author }}</p>
                      <p class="collect-date">
                        收藏时间: {{ item.collectDate }}
                      </p>
                      <div class="collection-actions">
                        <button
                          class="borrow-btn"
                          @click="borrowBook(item.bookId)"
                        >
                          借阅
                        </button>
                        <button class="cancel-collect-btn">取消收藏</button>
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
      clickedSearch: false, // 添加这个标志位来跟踪是否点击了检索按钮或选择了分类
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
      favorites: [], // 添加收藏列表
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
      bookCategories: [],
      currentCategory: "",

      // 个人信息页面相关数据
      personalTab: "account",
      userInfo: null,
      borrowingList: [],
      // 用于保存未过滤的借阅记录，用作检索基准
      allBorrowingRecords: [],
      borrowingStats: { total: 0, borrowing: 0, returned: 0 },
      //collectionList: [],
      borrowingSearchType: "book",
      borrowingSearchQuery: "",
      borrowingStatus: "all",
      collectionSearchType: "book",
      collectionSearchQuery: "",

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
      // 我的收藏搜索新增日期范围字段
      collectionStartDate: "",
      collectionEndDate: "",
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
    // 原有计算属性保持不变
    filteredBooks() {
      let result = [...this.books];

      if (this.currentPage === "allBooks") {
        if (this.pageType === "new") {
          result = [...this.newBooks];
        } else if (this.pageType === "hot") {
          result = [...this.hotBooks];
        }
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

      if (
        this.currentCategory !== "" &&
        this.currentCategory !== null &&
        this.currentCategory !== undefined
      ) {
        result = result.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return String(bookTid) === String(this.currentCategory);
        });
      }

      return result;
    },

    filteredNewBooks() {
      let result = [...this.newBooks];

      // 分类筛选
      if (
        this.currentCategory !== "" &&
        this.currentCategory !== null &&
        this.currentCategory !== undefined
      ) {
        result = result.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return String(bookTid) === String(this.currentCategory);
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

      return result;
    },

    filteredHotBooks() {
      let result = [...this.hotBooks];

      // 分类筛选
      if (
        this.currentCategory !== "" &&
        this.currentCategory !== null &&
        this.currentCategory !== undefined
      ) {
        result = result.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return String(bookTid) === String(this.currentCategory);
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

      return result;
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
      const dataSource =
        this.filteredBooks.length > 0 ? this.filteredBooks : this.books;
      const perPage =
        this.currentPage === "allBooks"
          ? this.allBooksRowsPerPage
          : this.rowsPerPage;
      return Math.ceil(dataSource.length / perPage) || 1;
    },
    currentPageItems() {
      const dataSource =
        this.filteredBooks.length > 0 ? this.filteredBooks : this.books;
      const perPage =
        this.currentPage === "allBooks"
          ? this.allBooksRowsPerPage
          : this.rowsPerPage;
      const start = (this.currentPageNum - 1) * perPage;
      const end = start + perPage;
      return dataSource.slice(start, end);
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

      // 分类筛选
      if (
        this.currentCategory !== "" &&
        this.currentCategory !== null &&
        this.currentCategory !== undefined
      ) {
        allBooks = allBooks.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return String(bookTid) === String(this.currentCategory);
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
    //收藏检索
    filteredCollectionList() {
      let result = [...this.collectionList];

      // 根据搜索类型筛选
      if (this.collectionSearchType === "book" && this.collectionSearchQuery) {
        result = result.filter((item) =>
          item.bookName
            .toLowerCase()
            .includes(this.collectionSearchQuery.toLowerCase())
        );
      } else if (
        this.collectionSearchType === "author" &&
        this.collectionSearchQuery
      ) {
        result = result.filter((item) =>
          item.author
            .toLowerCase()
            .includes(this.collectionSearchQuery.toLowerCase())
        );
      } else if (this.collectionSearchType === "date") {
        // 按日期范围筛选
        if (this.collectionStartDate) {
          result = result.filter(
            (item) => item.collectDate >= this.collectionStartDate
          );
        }
        if (this.collectionEndDate) {
          result = result.filter(
            (item) => item.collectDate <= this.collectionEndDate
          );
        }
      }

      return result;
    },
    // 当前借阅数量（按借阅记录计数，同一本书借两本计2）
    currentBorrowCount() {
      if (!Array.isArray(this.allBorrowingRecords)) return 0;
      return this.allBorrowingRecords.filter((r) => r.status === "borrowing")
        .length;
    },
    isLoggedIn() {
      return !!(localStorage.getItem("token") || this.user);
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
    // 原有方法保持不变

    // 切换收藏状态
    async toggleFavorite(bookId) {
      if (!bookId) return;
      
      try {
        // 检查是否已收藏
        const isFavorited = this.isFavorite(bookId);
        
        if (isFavorited) {
          // 取消收藏
          await axios.delete(`/api/books/${bookId}/favorite`);
          this.favorites = this.favorites.filter(id => id !== bookId);
          alert("已取消收藏");
        } else {
          // 添加收藏
          await axios.post(`/api/books/${bookId}/favorite`);
          this.favorites.push(bookId);
          alert("收藏成功");
        }
      } catch (error) {
        console.error("收藏操作失败:", error);
        alert("操作失败: " + (error.response?.data?.message || error.message));
      }
    },
    
    // 检查是否已收藏
    isFavorite(bookId) {
      return this.favorites.includes(bookId);
    },
    
    // 获取用户的收藏列表
    async loadFavorites() {
      try {
        const response = await axios.get("/api/books/favorites");
        this.favorites = response.data.data.map(book => book._bid);
      } catch (error) {
        console.error("加载收藏列表失败:", error);
      }
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

    // 导航到登录/注册页，保留当前页面用于登录后重定向
    goToAuth(type) {
      const redirect = window.location.pathname || "/readers";
      window.location.href = `/HomeView?view=${type}&redirect=${encodeURIComponent(redirect)}`;
    },

    // 从 localStorage 加载用户信息
    loadUserFromStorage() {
      try {
        const raw = localStorage.getItem("userInfo");
        if (raw) {
          const parsed = JSON.parse(raw);
          this.user = parsed;
          this.userInfo = parsed;
        } else {
          this.user = null;
        }
      } catch (e) {
        this.user = null;
      }
    },

    // 注销
    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      this.user = null;
      // 重新加载当前页面的数据
      this.loadSearchPage();
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

    async changePage(page) {
      this.currentPage = page;
      
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

      if (!this.searchQuery.trim() && !this.currentCategory) {
        alert("请输入搜索内容或选择图书类别");
        return;
      }

      this.currentPage = "searchResult";
      this.currentSearchResultPageNum = 1;

      // 如果还没有加载过图书数据，则先加载
      if (this.books.length === 0) {
        this.loadSearchPage();
      }
    },

    // 在搜索结果页面中按类别筛选
    filterByCategory(category) {
      this.currentCategory = category;
      this.currentPageNum = 1;
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
        // 获取当前用户信息
        const response = await axios.get("/api/auth/current-user");
        const payload =
          (response &&
            response.data &&
            (response.data.data || response.data)) ||
          null;
        this.userInfo = payload;
        // 同步到本地存储，便于刷新或其他页面使用
        if (payload) {
          try {
            localStorage.setItem("userInfo", JSON.stringify(payload));
            this.user = payload;
          } catch (e) {}
        }
      } catch (error) {
        console.error(
          "加载个人数据失败:",
          (error && error.response && error.response.data) || error.message
        );
        alert("加载个人信息失败，请重新登录");
        // 可以在这里跳转到登录页
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
        } else {
          this.userInfo = null;
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
        if (this.searchQuery) {
          params.query = this.searchQuery;
        }
        if (this.currentCategory) {
          // 假设类别筛选使用 category 参数，currentCategory 存储的是 category.value
          params.category = this.currentCategory;
        }

        const response = await axios.get("/api/books", { params });
        // 兼容后端返回结构：data.booklist 或 data
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

    searchCollection() {
      console.log(
        "搜索收藏记录:",
        this.collectionSearchType,
        this.collectionSearchQuery
      );
      // 这里可以实现收藏记录的搜索逻辑
    },

    filterNewAndHotBooks() {
      // 新书推荐：按添加时间排序，取最新的30本
      this.newBooks = [...this.books]
        .sort((a, b) => new Date(b._add_time) - new Date(a._add_time))
        .slice(0, 30);

      // 热门推荐：按借阅次数排序，取借阅次数最多的30本
      this.hotBooks = [...this.books]
        .sort((a, b) => b._times - a._times)
        .slice(0, 30);
    },

    filterByCategory(category) {
      this.currentCategory = category;
      this.currentPageNum = 1;
      // 如果当前在搜索页面，执行搜索
      if (this.currentPage === "search") {
        this.searchAndRenderBooks();
      }
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
            this.currentBook = this.books.find((book) => book._bid === bookId);
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
        console.error("借阅失败:", error.response?.data || error.message);
        alert("借阅失败: " + (error.response?.data?.message || error.message));
      }
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
          coverUrl:
            (record.book && record.book._cover_url) || record._cover_url || "",
          author: (record.book && record.book._author) || record._author || "",
          borrowDate: record._begin_time
            ? new Date(record._begin_time).toISOString().split("T")[0]
            : "",
          dueDate: record._end_date
            ? new Date(record._end_date).toISOString().split("T")[0]
            : "",
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

    // 公告分页切换方法
    changeAnnouncementPage(page) {
      if (page === "...") return;
      if (page < 1 || page > this.totalAnnouncementPages) return;
      this.currentAnnouncementPage = page;
    },
  },
  async mounted() {
    this.startCarousel();
    // 先加载分类以便筛选控件显示正确
    await this.loadBookCategories();
    await this.loadSearchPage();
    // 加载本地用户信息以显示头像
    this.loadUserFromStorage();
    // 如果已登录，尝试从后端拉取最新个人信息
    if (localStorage.getItem("token")) {
      this.loadPersonalData();
    }
    // 监听 storage 事件以在其它标签/窗口登录时同步
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("storage", this.onStorageChange);
    }
    // 加载收藏列表
    if (localStorage.getItem('token')) {
      await this.loadFavorites();
    }
  },
  beforeDestroy() {
    this.stopCarousel();
    if (typeof window !== "undefined" && window.removeEventListener) {
      window.removeEventListener("storage", this.onStorageChange);
    }
  },
};
</script>

<style>

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

/* 登录注册 */
/* 登录注册链接容器样式 - 设置弹性布局和对齐 */
.auth-links {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-right: 20px;
}

/* 登录注册链接样式 - 设置颜色、装饰线和过渡效果 */
.auth-link {
  color: white;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  transition: color 0.2s;
  padding: 3px 6px;
}

/* 登录注册链接悬停效果 */
.auth-link:hover {
  color: #f0f0f0;
  text-decoration: underline;
}

/* 登录注册分割线样式 - 设置颜色和字体大小 */
.auth-divider {
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
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

/* 用户菜单样式 - 设置相对定位 */
.user-menu {
  position: relative;
}

/* 用户下拉菜单样式 - 设置隐藏、定位和阴影 */
.user-dropdown {
  display: none;
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: #fff;
  color: #333;
  padding: 8px;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  min-width: 100px;
  z-index: 300;
}

/* 用户下拉菜单悬停显示 */
.user-menu:hover .user-dropdown {
  display: block;
}

/* 用户下拉菜单链接样式 - 设置颜色、背景色和光标 */
.user-dropdown .auth-link {
  color: #333;
  background: transparent;
  border: none;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 14px;
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

/* 图书详情容器样式 - 设置背景色、圆角和阴影 */
.book-detail-container {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  margin-top: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

/* 详情内容样式 - 设置弹性布局和间距 */
.detail-content {
  display: flex;
  gap: 30px;
}

/* 详情封面样式 - 设置尺寸、背景色和对齐方式 */
.detail-cover {
  width: 250px;
  height: 350px;
  background-color: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 详情占位符样式 - 设置字体大小和颜色 */
.detail-placeholder {
  font-size: 48px;
  color: #999;
  font-weight: bold;
}

/* 详情信息样式 - 设置弹性增长 */
.detail-info {
  flex: 1;
}

/* 详情标题样式 - 设置字体大小、下边距和颜色 */
.detail-title {
  font-size: 28px;
  margin-bottom: 20px;
  color: #2c3e50;
}

/* 详情信息段落样式 - 设置字体大小和下边距 */
.detail-info p {
  font-size: 16px;
  margin-bottom: 10px;
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

/* 收藏 */
/* 收藏按钮默认样式 */
.favorite-btn {
    background-color: #f39c12;
    padding: 10px 20px;
    font-size: 16px;
  }
  
/* 收藏按钮悬停效果 */
.favorite-btn:hover {
    background-color: #e67e22;
  }
  
/* 已收藏按钮样式 */
.favorited-btn {
    background-color: #f1c40f;
    padding: 10px 20px;
    font-size: 16px;
  }
  
/* 已收藏按钮悬停效果 */
.favorited-btn:hover {
    background-color: #f39c12;
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

/* 我的收藏样式 */
/* 收藏网格样式 - 设置网格布局和间距 */
.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

/* 收藏项样式 - 设置弹性布局和过渡效果 */
.collection-item {
  display: flex;
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

/* 收藏项悬停效果 */
.collection-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* 收藏项图书封面样式 - 设置尺寸 */
.collection-item .book-cover {
  width: 100px;
  height: 150px;
  margin-bottom: 0;
}

/* 收藏信息样式 - 设置弹性增长和对齐 */
.collection-info {
  flex: 1;
  padding: 15px;
  text-align: left;
}

/* 收藏日期样式 - 设置字体大小和颜色 */
.collect-date {
  font-size: 12px;
  color: #888;
  margin: 5px 0;
}

/* 收藏操作样式 - 设置上边距和弹性布局 */
.collection-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

/* 取消收藏按钮样式 - 设置背景色 */
.cancel-collect-btn {
  background-color: #e74c3c;
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