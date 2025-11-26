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
              {{ (user && (user._name || user.name || user._account)) || '用户' }}
            </div>

            <div class="user-dropdown">
              <button class="auth-link" @click.prevent="logout">登出</button>
            </div>
          </div>
          <div v-else>
            <a href="#" class="auth-link" @click.prevent="goToAuth('login')">登录</a>
            <span class="auth-divider">|</span>
            <a href="#" class="auth-link" @click.prevent="goToAuth('register')">注册</a>
          </div>
        </div>
      </nav>

      <!-- 主内容区域 -->
      <main>
        <!-- 图书查询页面 -->
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

            <!-- 图书类别筛选 -->
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
            <!-- 左右箭头 -->
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

          <!-- 新书推荐区块 -->
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

          <!-- 热门推荐区块 -->
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

          <!-- 查看全部图书区块 -->
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

        <!-- 搜索结果页面 -->
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

        <!-- 图书详情页面 -->
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

          <div class="book-detail-container">
            <button @click="changePage('search')" class="back-btn">返回</button>
            <div class="detail-content">
              <div class="detail-cover">
                <img
                  :src="getFullCoverUrl(currentBook?._cover_url)"
                  :alt="currentBook?._book_name"
                  class="book-img"
                  @error="handleImgError($event, currentBook)"
                  referrerpolicy="no-referrer"
                />
                <div
                  class="detail-placeholder"
                  v-if="
                    !currentBook?._cover_url || imgErrorMap[currentBook?._bid]
                  "
                >
                  {{ currentBook?._book_name?.substring(0, 2) }}
                </div>
              </div>
              <div class="detail-info">
                <h1 class="detail-title">{{ currentBook?._book_name }}</h1>
                <p><strong>作者：</strong>{{ currentBook?._author }}</p>
                <p><strong>出版社：</strong>{{ currentBook?._press }}</p>
                <p><strong>图书类型：</strong>{{ currentBook?._type_name }}</p>
                <p><strong>库存数量：</strong>{{ currentBook?._num }}</p>
                <p><strong>借阅次数：</strong>{{ currentBook?._times || 0 }}</p>
                <button
                  @click="borrowBook(currentBook?._bid)"
                  :disabled="currentBook?._num <= 0"
                  class="borrow-btn"
                >
                  {{ currentBook?._num > 0 ? "借阅" : "无库存" }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 全部图书页面 -->
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

        <!-- 个人信息页面 -->
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
              <div v-if="personalTab === 'account'">
                <h2>账户信息</h2>
                <div class="account-info">
                  <template v-if="!editMode">
                    <div class="info-item">
                      <label>账号：</label>
                      <span>{{ userInfo?._account || userInfo?.account || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <label>用户名：</label>
                      <span>{{ userInfo?._name || userInfo?.name || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <label>联系电话：</label>
                      <span>{{ userInfo?._phone || userInfo?.phone || '未填写' }}</span>
                    </div>
                    <div class="info-item">
                      <label>邮箱：</label>
                      <span>{{ userInfo?._email || userInfo?.email || '未填写' }}</span>
                    </div>
                    <div class="info-item">
                      <label>最大可借：</label>
                      <span>{{ userInfo?._max_num || userInfo?.max_num || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <label>当前借阅：</label>
                      <span>{{ currentBorrowCount }}</span>
                    </div>
                    <div class="info-actions">
                      <button class="edit-btn" @click="toggleEdit">编辑信息</button>
                      <button class="change-pwd-btn" @click="gotoResetPassword">修改密码</button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="info-item">
                      <label>账号：</label>
                      <input type="text" v-model.trim="editUser._account" />
                    </div>
                    <div class="info-item">
                      <label>用户名：</label>
                      <input type="text" v-model.trim="editUser._name" />
                    </div>
                    <div class="info-item">
                      <label>邮箱：</label>
                      <input type="email" v-model.trim="editUser._email" />
                    </div>
                    <div class="info-actions">
                      <button class="edit-btn" @click="saveEdit">保存</button>
                      <button class="change-pwd-btn" @click="toggleEdit">取消</button>
                    </div>
                  </template>
                </div>
              </div>

              <div v-if="personalTab === 'borrowing'">
                <h2>我的借阅</h2>

                <div class="personal-search">
                  <select v-model="borrowingSearchType" class="search-select">
                    <option value="book">按图书名称查询</option>
                    <option value="author">按作者姓名查询</option>
                    <option value="date">按借阅时间查询</option>
                  </select>
                  <input
                    type="text"
                    v-model="borrowingSearchQuery"
                    placeholder="请输入查询内容"
                  />
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
                      <th>图书封面</th>
                      <th>图书名称</th>
                      <th>作者</th>
                      <th>借阅日期</th>
                      <th>截止日期</th>
                      <th>状态</th>
                      <!-- 操作列仅在“借阅中”视图显示 -->
                      <th v-if="borrowingStatus === 'borrowing'">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="borrowingList.length === 0">
                      <td :colspan="borrowingStatus === 'borrowing' ? 9 : 8" style="text-align: center; padding: 20px">
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
                        <button
                          v-if="record.status === 'returned'"
                          class="reborrow-btn"
                          @click="borrowBook(record.bookId)"
                        >
                          再次借阅
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="personalTab === 'collection'">
                <h2>我的收藏</h2>

                <div class="personal-search">
                  <select v-model="collectionSearchType" class="search-select">
                    <option value="book">按图书名称查询</option>
                    <option value="author">按作者姓名查询</option>
                    <option value="date">按收藏时间查询</option>
                  </select>
                  <input
                    type="text"
                    v-model="collectionSearchQuery"
                    placeholder="请输入查询内容"
                  />
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
                    v-for="item in collectionList"
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

        <!-- 公告信息页面 -->
        <div v-if="currentPage === 'aid'">
            <div class="search-container">
              <div class="searchbar">
                <select v-model="announcementSearchType" class="search-select">
                  <option value="title">按标题</option>
                  <option value="content">按内容</option>
                  <option value="date">按发布时间</option>
                </select>
                <input
                  type="text"
                  v-model="announcementSearchQuery"
                  placeholder="请输入检索关键词（支持模糊匹配）"
                />
                <button @click.prevent="applyAnnouncementFilter">检索</button>
              </div>
            </div>

          <h1>公告信息</h1>
          <ul id="announcement-list" class="announcement-list">
            <li v-for="announcement in filteredAnnouncements" :key="announcement._id">
              <div class="announcement-title">{{ announcement._title }}</div>
              <div class="announcement-date">{{ announcement._date }}</div>
              <div class="announcement-content">
                {{ announcement._content }}
              </div>
            </li>
          </ul>
        </div>

        <!-- 意见建议页面 -->
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
                    <option value="建议">建议</option>
                    <option value="问题">问题</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>意见内容 <span class="required">*</span></label>
                  <textarea
                    v-model="feedbackMessage"
                    rows="6"
                    placeholder="请填写您的意见或问题"
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

            <!-- 历史记录列表 -->
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
                  <div
                    class="history-status"
                    :class="item.status === '已回复' ? 'replied' : 'pending'"
                  >
                    {{ item.status }}
                    <div v-if="item.reply" class="history-reply">
                      <strong>回复：</strong>{{ item.reply }}
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

// 响应拦截器：统一处理 401 / token 相关错误，给出友好提示并跳转到登录
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const msg = error?.response?.data?.message || error?.message || '';
      const status = error?.response?.status;
      if (status === 401 || /token/i.test(msg)) {
        // 使用更友好的提示替换后端原始提示
        try { window.alert('登录状态已过期或未登录，请先登录。'); } catch (e) { /* ignore */ }
        // 重定向到首页登录表单，并保留当前页面用于登录后跳回
        const redirect = window.location.pathname || '/readers';
        window.location.href = `/?redirect=${encodeURIComponent(redirect)}&view=login`;
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
      bookCategories: [],
      currentCategory: "",

      // 个人信息页面相关数据
      personalTab: "account",
      userInfo: null,
      borrowingList: [],
      // 用于保存未过滤的借阅记录，用作检索基准
      allBorrowingRecords: [],
      borrowingStats: { total: 0, borrowing: 0, returned: 0 },
      collectionList: [],
      borrowingSearchType: "book",
      borrowingSearchQuery: "",
      borrowingStatus: "all",
      collectionSearchType: "book",
      collectionSearchQuery: "",

      // 意见建议页面相关数据
      feedbackTab: "new", // new 或 history
      feedbackHistory: [
        {
          name: "张三",
          email: "zhangsan@example.com",
          type: "建议",
          message:
            "希望增加更多计算机类的书籍，特别是人工智能和机器学习方面的最新著作。目前这方面的藏书比较陈旧，不能满足学习需求。",
          date: "2025-10-15",
          status: "已回复",
          reply:
            "感谢您的建议，我们已计划采购一批最新的人工智能相关书籍，预计下个月到货。",
        },
        {
          name: "李四",
          email: "",
          type: "问题",
          message:
            "图书馆的自助借还设备经常出现故障，希望能尽快维修或更换新设备。",
          date: "2025-10-20",
          status: "已回复",
          reply: "我们已联系技术人员进行检修，目前设备已恢复正常使用。",
        },
        {
          name: "王五",
          email: "wangwu@example.com",
          type: "其他",
          message: "建议延长周末的开放时间，方便学生利用周末时间学习。",
          date: "2025-11-05",
          status: "处理中",
          reply: "",
        },
        {
          name: "王五",
          email: "wangwu@example.com",
          type: "其他",
          message: "建议延长周末的开放时间，方便学生利用周末时间学习。",
          date: "2025-11-05",
          status: "处理中",
          reply: "",
        },
        {
          name: "王五",
          email: "wangwu@example.com",
          type: "其他",
          message: "建议延长周末的开放时间，方便学生利用周末时间学习。",
          date: "2025-11-05",
          status: "处理中",
          reply: "",
        },
        {
          name: "王五",
          email: "wangwu@example.com",
          type: "其他",
          message: "建议延长周末的开放时间，方便学生利用周末时间学习。",
          date: "2025-11-05",
          status: "处理中",
          reply: "",
        },
        {
          name: "王五",
          email: "wangwu@example.com",
          type: "其他",
          message: "建议延长周末的开放时间，方便学生利用周末时间学习。",
          date: "2025-11-05",
          status: "处理中",
          reply: "",
        },
        {
          name: "王五",
          email: "wangwu@example.com",
          type: "其他",
          message: "建议延长周末的开放时间，方便学生利用周末时间学习。",
          date: "2025-11-05",
          status: "处理中",
          reply: "",
        },
      ],
      currentFeedbackPage: 1,
      feedbacksPerPage: 5,

      // 搜索结果页面相关数据
      currentSearchResultPageNum: 1,

      // 验证码相关
      captchaCode: "",
      captchaImage: "",
      // 公告检索相关
      announcementSearchType: 'title', // 'date' | 'title' | 'content'
      announcementSearchQuery: '',
      // 图片加载错误记录（按图书id标记）
      imgErrorMap: {},
      // 当前登录用户信息（从 localStorage 读取）
      user: null,
      // 编辑模式与编辑表单数据
      editMode: false,
      editUser: {
        _name: '',
        _account: '',
        _email: ''
      }
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

      if (this.currentCategory !== '' && this.currentCategory !== null && this.currentCategory !== undefined) {
        result = result.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return String(bookTid) === String(this.currentCategory);
        });
      }

      return result;
    },
    // 公告过滤：按发布时间(_date)、标题(_title)、内容(_content)模糊匹配
    filteredAnnouncements() {
      if (!Array.isArray(this.announcements)) return [];
      const q = (this.announcementSearchQuery || '').trim().toLowerCase();
      if (!q) return this.announcements;

      if (this.announcementSearchType === 'date') {
        return this.announcements.filter((a) => (a._date || '').toLowerCase().includes(q));
      }

      if (this.announcementSearchType === 'content') {
        return this.announcements.filter((a) => (a._content || '').toLowerCase().includes(q));
      }

      // 默认按标题
      return this.announcements.filter((a) => (a._title || '').toLowerCase().includes(q));
    },

    filteredNewBooks() {
      return this.newBooks.filter((book) => {
        if (this.currentCategory !== '' && this.currentCategory !== null && this.currentCategory !== undefined) {
          const bookTid = book._tid || (book.category && book.category._tid);
          if (String(bookTid) !== String(this.currentCategory)) return false;
        }
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          if (this.searchType === "book") {
            return book._book_name.toLowerCase().includes(query);
          } else {
            return book._author.toLowerCase().includes(query);
          }
        }
        return true;
      });
    },

    filteredHotBooks() {
      return this.hotBooks.filter((book) => {
        if (this.currentCategory !== '' && this.currentCategory !== null && this.currentCategory !== undefined) {
          const bookTid = book._tid || (book.category && book.category._tid);
          if (String(bookTid) !== String(this.currentCategory)) return false;
        }
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          if (this.searchType === "book") {
            return book._book_name.toLowerCase().includes(query);
          } else {
            return book._author.toLowerCase().includes(query);
          }
        }
        return true;
      });
    },

    totalPages() {
      const dataSource = this.filteredBooks.length > 0 ? this.filteredBooks : this.books;
      const perPage = this.currentPage === 'allBooks' ? this.allBooksRowsPerPage : this.rowsPerPage;
      return Math.ceil(dataSource.length / perPage) || 1;
    },
    currentPageItems() {
      const dataSource = this.filteredBooks.length > 0 ? this.filteredBooks : this.books;
      const perPage = this.currentPage === 'allBooks' ? this.allBooksRowsPerPage : this.rowsPerPage;
      const start = (this.currentPageNum - 1) * perPage;
      const end = start + perPage;
      return dataSource.slice(start, end);
    },
    // 首页“全部图书”预览：只显示第一行 8 本
    previewAllBooks() {
      const dataSource = this.filteredBooks.length > 0 ? this.filteredBooks : this.books;
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
    filteredSearchResults() {
      let allBooks = [...this.books];

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        allBooks = allBooks.filter((book) => {
          if (this.searchType === "book") {
            return book._book_name.toLowerCase().includes(query);
          } else {
            return book._author.toLowerCase().includes(query);
          }
        });
      }

      if (this.currentCategory !== '' && this.currentCategory !== null && this.currentCategory !== undefined) {
        allBooks = allBooks.filter((book) => {
          const bookTid = book._tid || (book.category && book.category._tid);
          return String(bookTid) === String(this.currentCategory);
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
      if (this.borrowingStatus === 'borrowing') {
        return this.borrowingList.filter((r) => r.status === 'borrowing');
      }
      if (this.borrowingStatus === 'returned') {
        return this.borrowingList.filter((r) => r.status === 'returned');
      }
      // 默认返回全部
      return this.borrowingList;
    },
    // 当前借阅数量（按借阅记录计数，同一本书借两本计2）
    currentBorrowCount() {
      if (!Array.isArray(this.allBorrowingRecords)) return 0;
      return this.allBorrowingRecords.filter((r) => r.status === 'borrowing').length;
    },
    isLoggedIn() {
      return !!(localStorage.getItem('token') || this.user);
    },
    avatarUrl() {
      // 优先使用 user.avatar 或 user._avatar 或 user.avatar_url 等常见字段
      const u = this.user || (localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null);
      if (!u) return '';
      return u.avatar || u._avatar || u.avatar_url || u._cover_url || '';
    },
  },
  methods: {
    // 原有方法保持不变
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
      const redirect = this.$route.fullPath || '/readers';
      this.$router.push({ path: '/', query: { redirect, view: type } });
    },

    // 从 localStorage 加载用户信息
    loadUserFromStorage() {
      try {
        const raw = localStorage.getItem('userInfo');
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
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      this.user = null;
      // 重新加载当前页面的数据
      this.loadSearchPage();
    },

    // 点击头像打开个人信息页
    openPersonal() {
      // 切换到个人页并确保选中账户信息
      this.personalTab = 'account';
      this.changePage('personal');
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

    async changePage(page, type = "") {
      this.currentPage = page;
      this.pageType = type;
      this.currentPageNum = 1;
      this.currentFeedbackPage = 1;
      this.currentSearchResultPageNum = 1; // 重置搜索结果页码
      this.currentCategory = "";

      if (page === "personal") {
        this.personalTab = "account";
        await this.loadPersonalData();
      }

      if (page === "feedback") {
        await this.loadFeedbackHistory();
      }

      switch (page) {
        case "search":
          await this.loadSearchPage();
          break;
        case "personal":
          await Promise.all([
            this.loadBorrowingInfo(),
            this.loadBorrowingHistory(),
          ]);
          break;
        case "aid":
          await this.loadAnnouncements();
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
    async gotoSearchResult() {
      if (!this.searchQuery.trim() && !this.currentCategory) {
        alert("请输入搜索内容或选择图书类别");
        return;
      }

      this.currentPage = "searchResult";
      this.currentSearchResultPageNum = 1;

      // 如果还没有加载过图书数据，则先加载
      if (this.books.length === 0) {
        await this.loadSearchPage();
      }
    },

    // 在搜索结果页面中按类别筛选
    filterByCategoryInResult(category) {
      this.currentCategory = category;
      this.currentSearchResultPageNum = 1;
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
        const payload = (response && response.data && (response.data.data || response.data)) || null;
        this.userInfo = payload;
        // 同步到本地存储，便于刷新或其他页面使用
        if (payload) {
          try {
            localStorage.setItem('userInfo', JSON.stringify(payload));
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
          _name: this.userInfo._name || this.userInfo.name || '',
          _account: this.userInfo._account || this.userInfo.account || '',
          _email: this.userInfo._email || this.userInfo.email || ''
        };
      }
    },

    // 保存编辑信息
    async saveEdit() {
      if (!this.userInfo || !this.userInfo._uid) {
        alert('无法保存：找不到用户 ID');
        return;
      }
      const payload = {
        _name: (this.editUser._name || '').trim(),
        _account: (this.editUser._account || '').trim(),
        _email: (this.editUser._email || '').trim()
      };
      try {
        const res = await axios.put(`/api/readers/${this.userInfo._uid}`, payload);
        if (res && res.data && res.data.success) {
          // 更新本地数据
          this.userInfo = Object.assign({}, this.userInfo, payload);
          this.user = this.userInfo;
          try { localStorage.setItem('userInfo', JSON.stringify(this.userInfo)); } catch (e) {}
          this.editMode = false;
          alert('保存成功');
        } else {
          alert((res && res.data && res.data.message) || '保存失败');
        }
      } catch (err) {
        const status = err && err.response && err.response.status;
        if (status === 403) {
          alert('没有权限更新用户信息（服务器限制）。');
        } else {
          alert('更新失败，请稍后重试。');
        }
        console.warn('saveEdit error', err && err.response ? err.response.data : err);
      }
    },

    // 存储事件回调：当其它窗口/标签修改 localStorage（如登录）时，同步更新
    onStorageChange(e) {
      if (!e) return;
      if (e.key === 'token' || e.key === 'userInfo') {
        this.loadUserFromStorage();
        if (localStorage.getItem('token')) {
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
        const res = await axios.get('/api/categories');
        const list = (res && res.data && res.data.data && res.data.data.catlist) || [];
        const mapped = [{ label: '全部', value: '' }].concat(
          list.map((c) => ({ label: c._type_name || c._typeName || String(c), value: (c._tid !== undefined && c._tid !== null) ? c._tid : (c._type_name || '') }))
        );
        this.bookCategories = mapped;
      } catch (e) {
        console.warn('加载分类失败，使用默认分类列表', e && e.response ? e.response.data : e);
        // 回退到默认静态分类，保证页面不空
        this.bookCategories = [
          { label: '全部', value: '' },
          { label: '科技', value: '科技' },
          { label: '小说', value: '小说' },
          { label: '金融', value: '金融' },
          { label: '教育', value: '教育' },
          { label: '生活', value: '生活' },
          { label: '历史', value: '历史' },
          { label: '童书', value: '童书' },
          { label: '励志', value: '励志' },
        ];
      }
    },

    searchBorrowing() {
      try {
        const q = (this.borrowingSearchQuery || '').trim().toLowerCase();
        // 如果查询为空，恢复完整列表
        if (!q) {
          this.borrowingList = Array.isArray(this.allBorrowingRecords) ? [...this.allBorrowingRecords] : [];
          this.borrowingStats = {
            total: this.borrowingList.length,
            borrowing: this.borrowingList.filter((r) => r.status === 'borrowing').length,
            returned: this.borrowingList.filter((r) => r.status === 'returned').length,
          };
          return;
        }

        let filtered = [];
        if (this.borrowingSearchType === 'book') {
          filtered = this.allBorrowingRecords.filter((r) => (r.bookName || '').toLowerCase().includes(q));
        } else if (this.borrowingSearchType === 'author') {
          filtered = this.allBorrowingRecords.filter((r) => (r.author || '').toLowerCase().includes(q));
        } else if (this.borrowingSearchType === 'date') {
          filtered = this.allBorrowingRecords.filter((r) => {
            const borrowDate = (r.borrowDate || '').toLowerCase();
            const dueDate = (r.dueDate || '').toLowerCase();
            return borrowDate.includes(q) || dueDate.includes(q);
          });
        } else {
          // 全字段模糊匹配
          filtered = this.allBorrowingRecords.filter((r) => {
            const hay = `${r.bookName || ''} ${r.author || ''} ${r.borrowDate || ''} ${r.dueDate || ''}`.toLowerCase();
            return hay.includes(q);
          });
        }

        this.borrowingList = filtered;
        this.borrowingStats = {
          total: this.borrowingList.length,
          borrowing: this.borrowingList.filter((r) => r.status === 'borrowing').length,
          returned: this.borrowingList.filter((r) => r.status === 'returned').length,
        };
      } catch (e) {
        console.warn('searchBorrowing error', e);
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
      this.newBooks = [...this.books]
        .sort((a, b) => new Date(b._add_time) - new Date(a._add_time))
        .slice(0, 8);

      this.hotBooks = [...this.books]
        .sort((a, b) => b._times - a._times)
        .slice(0, 8);
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
          alert('还书成功');
          await Promise.all([this.loadBorrowingInfo(), this.loadBorrowingHistory()]);
          await this.loadSearchPage();
        } else {
          alert('还书失败: ' + ((response && response.data && response.data.message) || ''));
        }
      } catch (error) {
        console.error('还书失败:', error.response?.data || error.message);
        alert('还书失败: ' + (error.response?.data?.message || error.message));
      }
    },

    async renewBook(hid) {
      if (!hid) return;
      try {
        const response = await axios.put(`/api/books/${hid}/renew`);
        if (response && response.data && response.data.success) {
          alert('续借成功');
          await Promise.all([this.loadBorrowingInfo(), this.loadBorrowingHistory()]);
        } else {
          alert('续借失败: ' + ((response && response.data && response.data.message) || ''));
        }
      } catch (error) {
        console.error('续借失败:', error.response?.data || error.message);
        alert('续借失败: ' + (error.response?.data?.message || error.message));
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
        const response = await axios.get('/api/borrow-records/my');
        const records = (response && response.data && response.data.data && response.data.data.ownlist) || [];

        this.borrowingList = records.map((record) => ({
          id: record._hid,
          bookId: record._bid,
          bookName: (record.book && (record.book._book_name || record.book._name)) || record._book_name || '',
          coverUrl: (record.book && record.book._cover_url) || record._cover_url || '',
          author: (record.book && record.book._author) || record._author || '',
          borrowDate: record._begin_time ? new Date(record._begin_time).toISOString().split('T')[0] : '',
          dueDate: record._end_date ? new Date(record._end_date).toISOString().split('T')[0] : '',
          // _status: 0 -> borrowing, 1 -> returned
          status: record._status === 1 ? 'returned' : 'borrowing'
        }));

        // 保存完整副本以供检索使用
        this.allBorrowingRecords = Array.isArray(this.borrowingList) ? [...this.borrowingList] : [];

        // 统计借阅状态（基于已映射的 borrowingList）
        this.borrowingStats = {
          total: this.borrowingList.length,
          borrowing: this.borrowingList.filter((r) => r.status === 'borrowing').length,
          returned: this.borrowingList.filter((r) => r.status === 'returned').length,
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
        const response = await axios.get('/api/borrow-records/my');
        const records = (response && response.data && response.data.data && response.data.data.ownlist) || [];

        this.borrowingHistory = records.map((record) => ({
          _hid: record._hid,
          bookId: record._bid,
          bookName: (record.book && (record.book._book_name || record.book._name)) || record._book_name || '',
          borrowDate: record._begin_time ? new Date(record._begin_time).toISOString().split('T')[0] : '',
          returnDate: record._status === 1 ? (record._end_date ? new Date(record._end_date).toISOString().split('T')[0] : '') : '',
          status: record._status === 1 ? '已还' : '借阅中'
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
        alert("加载公告失败: " + (error.response?.data?.message || error.message));
      }
    },

    // 应用公告过滤（按钮触发）——计算属性会自动生效，此方法用于防止默认行为或做额外操作
    applyAnnouncementFilter() {
      // 目前不需要做额外处理，计算属性 `filteredAnnouncements` 会根据 query 实时更新
      // 这里保留以便将来需要触发远程搜索或统计时使用
      try {
        // 简单聚焦到公告列表顶部以便用户看到结果
        const el = document.getElementById('announcement-list');
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' });
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
  },
  async mounted() {
    this.startCarousel();
    // 先加载分类以便筛选控件显示正确
    await this.loadBookCategories();
    await this.loadSearchPage();
    // 加载本地用户信息以显示头像
    this.loadUserFromStorage();
    // 如果已登录，尝试从后端拉取最新个人信息
    if (localStorage.getItem('token')) {
      this.loadPersonalData();
    }
    // 监听 storage 事件以在其它标签/窗口登录时同步
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', this.onStorageChange);
    }
  },
  beforeDestroy() {
    this.stopCarousel();
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('storage', this.onStorageChange);
    }
  },
};
</script>

<style>
/* 原有样式保持不变 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Arial", sans-serif;
}

body {
  background-image: url("../../public/images.jpg");
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-color: #f4f4f4;
  color: #333;
  line-height: 1.6;
}

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

.logo {
  font-size: 22px;
  font-weight: bold;
  margin-right: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-img {
  height: 40px;
  width: auto;
  vertical-align: middle;
}

.nav-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.nav-links li {
  margin-right: 20px;
}

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

.nav-links a:hover {
  background: #34495e;
  transform: translateY(-1px);
}

main {
  margin-top: 80px;
  padding: 20px;
  min-height: calc(100vh - 84px);
}

h1 {
  text-align: center;
  margin: 20px 0;
}

h2 {
  margin: 30px 0 15px;
  color: #2c3e50;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

th,
td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background: #f8f9fa;
  font-weight: bold;
}

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

.search-container {
  text-align: center;
  margin: 30px 0;
  padding: 0 20px;
}

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

.search-select {
  padding: 16px 20px;
  border: none;
  background-color: #f9f9f9;
  font-size: 16px;
  width: 180px;
  cursor: pointer;
  border-right: 1px solid #eee;
}

.searchbar input {
  padding: 16px 20px;
  flex: 1;
  border: none;
  font-size: 16px;
  outline: none;
}

.searchbar button {
  padding: 16px 30px;
  background-color: #1194ae;
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.searchbar button:hover {
  background-color: #2980b9;
}

.category-filter {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  padding: 10px 0;
}

.filter-label {
  color: #666;
  font-size: 15px;
  align-self: center;
}

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

.category-filter button:hover {
  background-color: #e0e0e0;
}

.category-filter button.active-category {
  background-color: #1194ae;
  color: white;
}

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

button:hover {
  background: #2980b9;
}

.return-btn {
  background-color: #e74c3c;
}

.return-btn:hover {
  background-color: #c0392b;
}

.delay-btn {
  background-color: #3498db;
  margin-left: 5px;
}

.delay-btn:hover {
  background-color: #2980b9;
}

.back-btn {
  margin-bottom: 20px;
  background-color: #34495e;
}

.back-btn:hover {
  background-color: #2c3e50;
}

.borrow-btn {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #27ae60;
}

.borrow-btn:hover {
  background-color: #219653;
}

.borrow-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.announcement-list {
  list-style: none;
  padding: 0;
}

.announcement-list li {
  background-color: #fff;
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 3px;
}

.announcement-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.announcement-date {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 10px;
}

.text-success {
  color: green;
}
.text-warning {
  color: orange;
}

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
.hero-track {
  display: flex;
  height: 100%;
  transition: transform 0.6s ease;
}
.hero-slide {
  flex: 0 0 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.hero-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

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

.hero-carousel:hover .hero-arrow {
  display: flex;
}

.hero-arrow:hover {
  background: rgba(0, 0, 0, 0.6);
  transform: translateY(-50%) scale(1.05);
}

.hero-arrow--left {
  left: 20px;
}
.hero-arrow--right {
  right: 20px;
}

.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 28px;
  width: 64px;
  height: 64px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(17,148,174,0.12), rgba(14,138,160,0.06));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 400;
  box-shadow: 0 10px 24px rgba(17,148,174,0.18), 0 2px 6px rgba(0,0,0,0.12);
  border: 1px solid rgba(255,255,255,0.75);
  backdrop-filter: blur(6px);
  transition: transform 0.18s, box-shadow 0.18s;
}

.back-to-top:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 18px 36px rgba(17,148,174,0.22), 0 6px 12px rgba(0,0,0,0.12);
}

.back-to-top:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(17,148,174,0.12);
}

.back-to-top img {
  width: 46px;
  height: 46px;
  object-fit: cover;
  border-radius: 10px;
  display: block;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12) inset;
}

/* 悬停显示的提示文案（仅 CSS），使用中文文字 */
.back-to-top::after {
  content: "回到顶部";
  position: absolute;
  right: 100%;
  bottom: 50%;
  transform: translateY(50%) translateX(-8px);
  background: rgba(0,0,0,0.78);
  color: #fff;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.back-to-top:hover::after {
  opacity: 1;
  transform: translateY(50%) translateX(-12px);
}

.personal-section {
  background: white;
  border-radius: 5px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* 个人信息页面：左侧侧边栏与内容区域样式 */
.personal-container {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.personal-sidebar {
  width: 260px;
  min-width: 200px;
  background: #ffffff;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 6px 20px rgba(17,148,174,0.08);
  position: sticky;
  top: 100px;
  height: fit-content;
}

.sidebar-nav {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

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

.sidebar-nav li:hover {
  background: #f5fbfc;
  transform: translateX(2px);
}

.sidebar-nav li.active {
  background: linear-gradient(90deg, #1194ae, #0e8aa0);
  color: #fff;
  box-shadow: 0 6px 18px rgba(17,148,174,0.16);
}

.personal-content {
  flex: 1;
  background: #ffffff;
  padding: 22px;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
}

/* 小屏幕下侧边栏折叠到顶部 */
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
/* 意见建议表单错误信息样式*/
.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

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
  border: 1px solid #181616;
  background-color: #82b7ec;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
  min-width: 40px;
}

.pagination button:hover:not(:disabled) {
  background-color: #1976d2;
  border-color: #1976d2;
}

.pagination button.active {
  background-color: #1976d2;
  color: white;
  border-color: #1976d2;
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

.books-section {
  margin: 40px 0;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.view-all {
  color: #1194ae;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.view-all:hover {
  color: #2980b9;
  text-decoration: underline;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

.book-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-align: center;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

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

.cover-placeholder {
  font-size: 32px;
  color: #999;
  font-weight: bold;
}

.book-title {
  font-size: 16px;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-author {
  font-size: 14px;
  color: #666;
}

.book-detail-container {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  margin-top: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.detail-content {
  display: flex;
  gap: 30px;
}

.detail-cover {
  width: 250px;
  height: 350px;
  background-color: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-placeholder {
  font-size: 48px;
  color: #999;
  font-weight: bold;
}

.detail-info {
  flex: 1;
}

.detail-title {
  font-size: 28px;
  margin-bottom: 20px;
  color: #2c3e50;
}

.detail-info p {
  font-size: 16px;
  margin-bottom: 10px;
}

.all-books-container {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  margin-top: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

/* 登录注册链接容器 */
.auth-links {
  margin-left: auto; 
  display: flex;
  align-items: center; 
  gap: 6px; 
  padding-right: 20px; 
}
.auth-link {
  color: white; 
  text-decoration: none; 
  font-size: 16px; 
  font-weight: 500;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  transition: color 0.2s; 
  padding: 3px 6px; 
}
.auth-link:hover {
  color: #f0f0f0; 
  text-decoration: underline; 
}
.auth-divider {
  color: rgba(255, 255, 255, 0.7); 
  font-size: 18px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
  vertical-align: middle;
  border: 2px solid rgba(255,255,255,0.9);
}

.user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  cursor: pointer;
  margin-right: 8px;
}

.user-menu {
  position: relative;
}

.user-dropdown {
  display: none;
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: #fff;
  color: #333;
  padding: 8px;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  min-width: 100px;
  z-index: 300;
}

.user-menu:hover .user-dropdown {
  display: block;
}

.user-dropdown .auth-link {
  color: #333;
  background: transparent;
  border: none;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 14px;
}

/* 账户信息样式 */
.account-info {
  margin-top: 20px;
}

.info-item {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #eee;
}

.info-item label {
  display: inline-block;
  width: 120px;
  color: #666;
  font-weight: 500;
}

.info-actions {
  margin-top: 30px;
}

.edit-btn {
  background-color: #3498db;
  margin-right: 10px;
}

.change-pwd-btn {
  background-color: #9b59b6;
}

/* 我的借阅样式 */
.personal-search {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
  align-items: center;
}

.personal-search .search-select {
  padding: 8px 12px;
  width: 160px;
  font-size: 14px;
}

.personal-search input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.personal-search button {
  padding: 8px 16px;
}

.status-tabs {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.status-tabs button {
  background-color: #f0f0f0;
  color: #333;
  padding: 8px 16px;
  border-radius: 4px;
}

.status-tabs button.active {
  background-color: #1194ae;
  color: white;
}

#borrowing-table th {
  text-align: center;
}

#borrowing-table td {
  text-align: center;
  vertical-align: middle;
}

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

.table-cover .cover-placeholder {
  font-size: 16px;
  font-weight: 700;
  color: #777;
}

/* 针对借阅表格的覆盖规则，确保图片铺满容器并裁切 */
#borrowing-table .table-cover {
  width: 64px;
  height: 88px;
}

#borrowing-table .book-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

#borrowing-table .cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7f9;
}

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

.status-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.borrowing {
  background-color: #ffeeba;
  color: #856404;
}

.status-tag.returned {
  background-color: #c3e6cb;
  color: #155724;
}

.reborrow-btn {
  background-color: #1194ae;
}

/* 我的收藏样式 */
.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.collection-item {
  display: flex;
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.collection-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.collection-item .book-cover {
  width: 100px;
  height: 150px;
  margin-bottom: 0;
}

.collection-info {
  flex: 1;
  padding: 15px;
  text-align: left;
}

.collect-date {
  font-size: 12px;
  color: #888;
  margin: 5px 0;
}

.collection-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.cancel-collect-btn {
  background-color: #e74c3c;
}

/* 意见建议页面样式 */
.feedback-container {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  margin-top: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.feedback-tabs {
  display: flex;
  margin: 20px 0;
  gap: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.feedback-tabs button {
  background-color: #f0f0f0;
  color: #333;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
}

.feedback-tabs button.active {
  background-color: #1194ae;
  color: white;
}

.feedback-form-container {
  max-width: 800px;
  margin: 0 auto;
}

.feedback-form {
  background-color: #f9f9f9;
  padding: 25px;
  border-radius: 8px;
}

.feedback-form .form-row {
  margin-bottom: 15px;
}

.feedback-form label {
  display: block;
  font-size: 15px;
  margin-bottom: 8px;
  font-weight: 500;
}

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

.feedback-form textarea {
  resize: vertical;
}

.feedback-form .form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 20px;
}

.feedback-form .form-actions button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #1194ae;
}

.feedback-history {
  margin-top: 20px;
}

.no-history {
  text-align: center;
  padding: 60px 0;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.history-item {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #1194ae;
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  align-items: center;
}

.history-title {
  font-weight: 600;
  font-size: 16px;
}

.history-date {
  font-size: 14px;
  color: #666;
}

.history-content {
  margin-bottom: 15px;
  line-height: 1.8;
}

.history-status {
  padding-top: 10px;
  border-top: 1px dashed #ddd;
  font-size: 14px;
}

.history-status.replied {
  color: #27ae60;
}

.history-status.pending {
  color: #e67e22;
}

.history-reply {
  margin-top: 8px;
  padding: 10px;
  background-color: rgba(39, 174, 96, 0.1);
  border-radius: 4px;
  color: #333;
}

.required {
  color: #e74c3c;
}

/* 新增：搜索结果页面样式 */
.search-query-display {
  font-size: 18px;
  color: #666;
  font-weight: normal;
  margin-left: 15px;
}

.result-count {
  font-size: 16px;
  color: #1194ae;
  margin-left: 15px;
  font-weight: normal;
}

.no-results {
  text-align: center;
  padding: 60px 0;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
}

.book-category {
  font-size: 12px;
  color: #888;
}
</style>