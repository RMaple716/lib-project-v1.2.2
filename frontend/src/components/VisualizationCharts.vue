<template>
  <div class="visualization-container">
    <!-- 原生加载状态（替代 ElSpinner） -->
    <div v-if="loading" class="loading-mask">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 借阅趋势图表 -->
    <div class="chart-section">
      <h3>个人借阅趋势</h3>
      <div ref="trendChartContainer" class="chart-wrapper"></div>
    </div>

    <!-- 借阅类别分布图表 -->
    <div class="chart-section">
      <h3>借阅类别分布</h3>
      <div ref="categoryChartContainer" class="chart-wrapper"></div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import axios from 'axios';

export default {
  name: 'VisualizationCharts',
  data() {
    return {
      // 加载状态
      loading: false,
      // ECharts 实例
      trendChartInstance: null,
      categoryChartInstance: null,
      // 查询参数（仅保留核心参数）
      queryParams: {
        start: '2025-01-01',
        end: '2025-12-31',
        period: 'month',
        userId: 2 // 建议从登录态动态获取，如：this.$store.state.user.id
      }
    };
  },
  async mounted() {
    // 等待DOM完全渲染
    await this.$nextTick();
    // 初始化图表
    this.initCharts();
    // 加载数据
    this.loadAllData();
    // 监听窗口大小变化，自适应图表
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    // 销毁ECharts实例，避免内存泄漏
    this.disposeCharts();
    // 移除resize监听
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    /**
     * 初始化所有图表实例
     */
    initCharts() {
      this.initTrendChart();
      this.initCategoryChart();
    },

    /**
     * 销毁所有图表实例
     */
    disposeCharts() {
      if (this.trendChartInstance) {
        this.trendChartInstance.dispose();
        this.trendChartInstance = null;
      }
      if (this.categoryChartInstance) {
        this.categoryChartInstance.dispose();
        this.categoryChartInstance = null;
      }
    },

    /**
     * 初始化借阅趋势折线图
     */
    initTrendChart() {
      try {
        const chartDom = this.$refs.trendChartContainer;
        if (!chartDom) {
          console.error('借阅趋势图表容器不存在');
          return;
        }

        // 强制设置容器尺寸（解决0px问题）
        chartDom.style.width = '100%';
        chartDom.style.height = '400px';

        // 初始化实例
        this.trendChartInstance = echarts.init(chartDom);
        console.log('借阅趋势图表初始化成功');
      } catch (error) {
        console.error('借阅趋势图表初始化失败:', error);
        // 原生提示替代 ElMessage
        alert('借阅趋势图表初始化失败');
      }
    },

    /**
     * 初始化借阅类别饼图
     */
    initCategoryChart() {
      try {
        const chartDom = this.$refs.categoryChartContainer;
        if (!chartDom) {
          console.error('借阅类别图表容器不存在');
          return;
        }

        // 强制设置容器尺寸
        chartDom.style.width = '100%';
        chartDom.style.height = '400px';

        this.categoryChartInstance = echarts.init(chartDom);
        console.log('借阅类别图表初始化成功');
      } catch (error) {
        console.error('借阅类别图表初始化失败:', error);
        alert('借阅类别图表初始化失败');
      }
    },

    /**
     * 加载所有图表数据
     */
    async loadAllData() {
      this.loading = true;
      try {
        // 并行加载数据
        await Promise.all([
          this.loadBorrowingTrendData(),
          this.loadCategoryEvolutionData()
        ]);
      } catch (error) {
        console.error('数据加载失败:', error);
        alert('图表数据加载失败');
      } finally {
        this.loading = false;
      }
    },

    /**
     * 加载借阅趋势数据（仅个人）
     */
    async loadBorrowingTrendData() {
      try {
        console.log('请求借阅趋势数据，参数:', this.queryParams);
        const response = await axios.get('/api/borrow-records/personal-trend', {
          params: this.queryParams
        });

        console.log('借阅趋势API响应:', response.data);
        const { success, data } = response.data;

        if (success && data) {
          this.updateBorrowingTrendChart(data);
        } else {
          alert('暂无借阅趋势数据');
          this.updateBorrowingTrendChart([]);
        }
      } catch (error) {
        console.error('加载借阅趋势数据失败:', error);
        alert('加载借阅趋势数据失败');
        this.updateBorrowingTrendChart([]);
      }
    },

    /**
     * 加载借阅类别数据
     */
    async loadCategoryEvolutionData() {
      try {
        const response = await axios.get('/api/borrow-records/category-evolution', {
          params: {
            start: this.queryParams.start,
            end: this.queryParams.end,
            userId: this.queryParams.userId
          }
        });

        console.log('借阅类别API响应:', response.data);
        const { success, data } = response.data;

        if (success && data) {
          // 扁平化季度数据，合并所有类别
          const categoryData = this.flattenCategoryData(data);
          this.updateCategoryChart(categoryData);
        } else {
          alert('暂无借阅类别数据');
          this.updateCategoryChart([]);
        }
      } catch (error) {
        console.error('加载借阅类别数据失败:', error);
        alert('加载借阅类别数据失败');
        this.updateCategoryChart([]);
      }
    },

    /**
     * 扁平化类别数据（合并季度）
     */
    flattenCategoryData(quarterData) {
      const categoryMap = {};
      
      quarterData.forEach(quarterItem => {
        quarterItem.categories.forEach(category => {
          const { categoryId, categoryName, count } = category;
          if (!categoryMap[categoryId]) {
            categoryMap[categoryId] = {
              name: categoryName,
              value: 0
            };
          }
          categoryMap[categoryId].value += count;
        });
      });

      return Object.values(categoryMap);
    },

    /**
     * 更新借阅趋势折线图（仅展示个人借阅数）
     */
    updateBorrowingTrendChart(data) {
      if (!this.trendChartInstance) {
        this.initTrendChart();
        if (!this.trendChartInstance) return;
      }

      // 处理X轴和系列数据（仅取个人借阅数myBorrowCount）
      let xAxisData = [];
      let seriesData = [];
      
      if (data && data.length > 0) {
        xAxisData = data.map(item => item.period);
        seriesData = data.map(item => item.myBorrowCount);
        console.log('借阅趋势数据 - X轴:', xAxisData, '个人借阅数:', seriesData);
      } else {
        // 无数据时的占位提示
        xAxisData = ['暂无数据'];
        seriesData = [0];
      }

      // 核心配置（确保XY轴必显）
      const option = {
        backgroundColor: '#fff',
        title: {
          text: '个人借阅趋势',
          left: 'center',
          textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}: {c} 本',
          textStyle: { fontSize: 12 }
        },
        legend: { data: ['个人借阅数量'], left: 'left' },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '10%',
          top: '15%',
          containLabel: true // 防止标签被裁剪
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLabel: { show: true, rotate: 30, fontSize: 12 },
          axisLine: { show: true, lineStyle: { color: '#ccc' } },
          axisTick: { show: true },
          splitLine: { show: false }
        },
        yAxis: {
          type: 'value',
          min: 0, // Y轴从0开始，更符合数据展示逻辑
          axisLabel: { show: true, formatter: '{value} 本', fontSize: 12 },
          axisLine: { show: true, lineStyle: { color: '#ccc' } },
          axisTick: { show: true },
          splitLine: { show: true, lineStyle: { color: '#eee' } }
        },
        series: [
          {
            name: '个人借阅数量',
            type: 'line',
            data: seriesData,
            symbol: 'circle', // 显示数据点
            symbolSize: 8,
            lineStyle: { width: 2, color: '#409EFF' },
            itemStyle: { color: '#409EFF', borderWidth: 2 },
            // 单个数据点时显示标记
            markPoint: data.length === 1 ? {
              data: [{ type: 'max', name: '当前数据' }]
            } : null
          }
        ],
        // 无数据提示
        noDataLoadingOption: {
          text: '暂无借阅数据',
          effect: 'bubble',
          effectOption: { fontSize: 14 }
        }
      };

      // 设置配置项（替换模式，避免配置叠加）
      this.trendChartInstance.setOption(option, true);
      // 强制重绘
      this.trendChartInstance.resize();
      console.log('借阅趋势图表已更新');
    },

    /**
     * 更新借阅类别饼图
     */
    updateCategoryChart(data) {
      if (!this.categoryChartInstance) {
        this.initCategoryChart();
        if (!this.categoryChartInstance) return;
      }

      let chartData = [];
      if (data && data.length > 0) {
        chartData = data;
      } else {
        // 无数据占位
        chartData = [{ name: '暂无数据', value: 1 }];
      }

      const option = {
        backgroundColor: '#fff',
        title: {
          text: '借阅类别分布',
          left: 'center',
          textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} 本 ({d}%)',
          textStyle: { fontSize: 12 }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'center',
          textStyle: { fontSize: 12 }
        },
        series: [
          {
            name: '借阅数量',
            type: 'pie',
            radius: ['40%', '70%'], // 饼图内外半径
            center: ['50%', '50%'],
            data: chartData,
            label: {
              show: true,
              formatter: '{b}: {c} ({d}%)',
              fontSize: 12
            },
            labelLine: { show: true, length: 20, length2: 10 },
            itemStyle: {
              // 自定义颜色系列
              color: (params) => {
                const colorList = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#722ED1'];
                return colorList[params.dataIndex % colorList.length];
              },
              emphasis: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' }
            }
          }
        ],
        noDataLoadingOption: {
          text: '暂无类别数据',
          effect: 'bubble'
        }
      };

      this.categoryChartInstance.setOption(option, true);
      this.categoryChartInstance.resize();
      console.log('借阅类别图表已更新');
    },

    /**
     * 窗口大小变化时自适应图表
     */
    handleResize() {
      if (this.trendChartInstance) this.trendChartInstance.resize();
      if (this.categoryChartInstance) this.categoryChartInstance.resize();
    }
  }
};
</script>

<style scoped>
.visualization-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 原生加载动画样式（替代 ElSpinner） */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-text {
  color: #666;
  font-size: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chart-section {
  margin-bottom: 40px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
}

.chart-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

/* 图表容器核心样式（必须固定高度） */
.chart-wrapper {
  width: 100%;
  height: 400px;
  min-width: 300px;
  border-radius: 4px;
}

/* 响应式适配：移动端缩小高度 */
@media (max-width: 768px) {
  .chart-wrapper {
    height: 300px !important;
  }
}
</style>