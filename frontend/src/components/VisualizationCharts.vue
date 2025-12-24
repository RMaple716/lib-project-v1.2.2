<!-- src/components/VisualizationCharts.vue -->
<template>
  <div class="visualization-container">
    <!-- 调试信息 -->
    <div v-if="debugMode" class="debug-info">
      <p>User: {{ user ? '已登录' : '未登录' }}</p>
      <p>User ID: {{ user ? (user._uid || user.id) : '无' }}</p>
      <p>Data Loaded: {{ dataLoaded ? '是' : '否' }}</p>
    </div>

    <!-- 个人借阅趋势总览 -->
    <div class="chart-section">
      <h3>📈 个人借阅趋势总览</h3>
      <div class="chart-controls">
        <select v-model="trendTimeUnit" @change="loadBorrowingTrendData">
          <option value="month">按月查看</option>
          <option value="semester">按学期查看</option>
        </select>
        <input 
          type="number" 
          v-model="trendYear" 
          @change="loadBorrowingTrendData" 
          min="2020" 
          :max="new Date().getFullYear()" 
          placeholder="年份"
        >
      </div>
      <div class="chart-wrapper">
        <v-chart 
          :option="borrowingTrendOption" 
          style="height: 400px" 
          v-if="borrowingTrendOption && borrowingTrendOption.series && borrowingTrendOption.series.length > 0"
        ></v-chart>

        <div v-else class="chart-placeholder">
          <p>📊 借阅趋势图表</p>
          <p v-if="dataLoaded">暂无数据可显示</p>
          <p v-else>加载中...</p>
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
          v-if="categoryEvolutionView === 'stacked' && categoryEvolutionStackedOption && categoryEvolutionStackedOption.series && categoryEvolutionStackedOption.series.length > 0" 
          :option="categoryEvolutionStackedOption" 
          style="height: 400px"
        ></v-chart>
        <div 
          v-else-if="categoryEvolutionView === 'pie' && categoryEvolutionPieOptions && categoryEvolutionPieOptions.length > 0" 
          class="pie-charts-container"
        >
          <div 
            v-for="(chart, index) in categoryEvolutionPieOptions" 
            :key="index" 
            class="pie-chart-item"
          >
            <h4>{{ chart.period }}</h4>
            <v-chart :option="chart.option" style="height: 300px"></v-chart>
          </div>
        </div>
        <div 
          v-else 
          class="chart-placeholder"
        >
          <p>📚 领域分布图表</p>
          <p v-if="dataLoaded">暂无数据可显示</p>
          <p v-else>加载中...</p>
        </div>
      </div>
    </div>

    <!-- 阅读习惯日历 -->
    <div class="chart-section">
      <h3>📅 阅读习惯日历</h3>
      <div class="chart-controls">
        <input 
          type="number" 
          v-model="calendarYear" 
          @change="loadReadingCalendarData" 
          min="2020" 
          :max="new Date().getFullYear()" 
          placeholder="年份"
        >
      </div>
      <div class="chart-wrapper">
        <v-chart 
          :option="readingCalendarOption" 
          style="height: 500px" 
          v-if="readingCalendarOption && readingCalendarOption.series && readingCalendarOption.series.length > 0"
        ></v-chart>
        <div 
          v-else 
          class="chart-placeholder"
        >
          <p>📅 阅读习惯日历</p>
          <p v-if="dataLoaded">暂无数据可显示</p>
          <p v-else>加载中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

// 导入 ECharts 核心组件和所需图表类型
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, PieChart, BarChart, HeatmapChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CalendarComponent,
  VisualMapComponent
} from "echarts/components";
import VChart from "vue-echarts";

// 注册所需组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CalendarComponent,
  VisualMapComponent
]);

export default {
  name: 'VisualizationCharts',
  components: {
    "v-chart": VChart
  },
  props: {
    user: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      debugMode: true, // 调试模式
      dataLoaded: false, // 数据是否已加载
      showBorrowingTrendChart: false,
      showCategoryEvolutionChart: false,
      showReadingCalendarChart: false,
      // 借阅图谱相关数据
      trendTimeUnit: "month", // 'month' 或 'semester'
      trendYear: new Date().getFullYear(),
      borrowingTrendOption: {},
      categoryEvolutionView: "stacked", // 'stacked' 或 'pie'
      categoryEvolutionStackedOption: {},
      categoryEvolutionPieOptions: [],
      calendarYear: new Date().getFullYear(),
      readingCalendarOption: {}
    };
  },
  watch: {
    user: {
      handler(newUser) {
        console.log('VisualizationCharts: User changed', newUser);
        if (newUser) {
          this.loadData();
        }
      },
      immediate: true
    }
  },
  mounted() {
    // 组件挂载后加载数据
    console.log('VisualizationCharts: Component mounted', this.user);
    if (this.user) {
      this.loadData();
    }
  },
  methods: {
    onChartReady(chart) {
      console.log('Chart ready:', chart);
      // 强制重绘
      this.$nextTick(() => {
        chart.resize();
      });
    },
    async loadData() {
      console.log('VisualizationCharts: Loading data for user', this.user);
      try {
        await Promise.all([
          this.loadBorrowingTrendData(),
          this.loadCategoryEvolutionData(),
          this.loadReadingCalendarData()
        ]);
        this.dataLoaded = true;
        console.log('VisualizationCharts: All data loaded');
      } catch (error) {
        console.error('VisualizationCharts: Error loading data', error);
        this.dataLoaded = true; // 即使出错也标记为已加载，以显示空状态
      }
    },

    // 借阅趋势数据
    async loadBorrowingTrendData() {
      try {
        console.log('Loading borrowing trend data');
        const params = {
          year: this.trendYear,
          unit: this.trendTimeUnit,
          userId: this.user?._uid || this.user?.id
        };
        
        // 使用专门的个人借阅趋势接口
        const response = await axios.get('/api/borrow-records/personal-trend', { params });
        console.log('Borrowing trend data response:', response.data);
        
        if (response.data.success) {
          this.updateBorrowingTrendChart(response.data.data || []);
        } else {
          this.updateBorrowingTrendChart([]); // 传入空数组确保图表显示
        }
      } catch (error) {
        console.error('加载借阅趋势数据失败:', error);
        this.updateBorrowingTrendChart([]); // 传入空数组确保图表显示
      }
    },

    // 类别演化数据
    async loadCategoryEvolutionData() {
      try {
        console.log('Loading category evolution data');
        const params = {
          userId: this.user?._uid || this.user?.id
        };
        
        // 使用专门的类别演化接口
        const response = await axios.get('/api/borrow-records/category-evolution', { params });
        console.log('Category evolution data response:', response.data);
        
        if (response.data.success) {
          this.updateCategoryEvolutionChart(response.data.data || []);
        } else {
          this.updateCategoryEvolutionChart([]); // 传入空数组确保图表显示
        }
      } catch (error) {
        console.error('加载类别演化数据失败:', error);
        this.updateCategoryEvolutionChart([]); // 传入空数组确保图表显示
      }
    },

    // 阅读日历数据
    async loadReadingCalendarData() {
      try {
        console.log('Loading reading calendar data');
        const params = {
          year: this.calendarYear,
          userId: this.user?._uid || this.user?.id
        };
        
        // 使用专门的阅读日历接口
        const response = await axios.get('/api/borrow-records/reading-calendar', { params });
        console.log('Reading calendar data response:', response.data);
        
        if (response.data.success) {
          this.updateReadingCalendarChart(response.data.data || []);
        } else {
          this.updateReadingCalendarChart([]); // 传入空数组确保图表显示
        }
      } catch (error) {
        console.error('加载阅读日历数据失败:', error);
        this.updateReadingCalendarChart([]); // 传入空数组确保图表显示
      }
    },

    // 更新借阅趋势图表
    updateBorrowingTrendChart(data) {
      console.log('Updating borrowing trend chart', data);
      
      const periods = data.map(item => item.period);
      const myData = data.map(item => item.myBorrowCount || 0);
      const avgData = data.map(item => item.avgBorrowCount || 0);

      const option = {
        title: {
          text: '个人借阅趋势',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['我的借阅量', '全馆平均'],
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
          data: periods
        },
        yAxis: {
          type: 'value',
          name: '借阅数量'
        },
        series: [
          {
            name: '我的借阅量',
            type: 'line',
            data: myData,
            itemStyle: {
              color: '#409EFF'
            },
            areaStyle: {
              opacity: 0.3
            }
          },
          {
            name: '全馆平均',
            type: 'line',
            data: avgData,
            itemStyle: {
              color: '#67C23A'
            },
            lineStyle: {
              type: 'dashed'
            }
          }
        ]
      };
      
      this.$set(this, 'borrowingTrendOption', option);
    },

    // 更新类别演化图表
    updateCategoryEvolutionChart(data) {
      console.log('Updating category evolution chart', data);
      
      // 按周期组织数据
      const periodGroups = {};
      data.forEach(item => {
        if (!periodGroups[item.period]) {
          periodGroups[item.period] = [];
        }
        periodGroups[item.period].push({
          name: item.category,
          value: item.count
        });
      });

      // 构建堆叠面积图数据
      const periods = Object.keys(periodGroups);
      if (periods.length > 0) {
        // 获取所有类别
        const allCategories = [...new Set(data.map(item => item.category))];
        
        const seriesData = allCategories.map(category => {
          return {
            name: category,
            type: 'line',
            stack: '总量',
            areaStyle: {
              opacity: 0.3
            },
            data: periods.map(period => {
              const items = periodGroups[period] || [];
              const found = items.find(item => item.name === category);
              return found ? found.value : 0;
            })
          };
        });

        this.$set(this, 'categoryEvolutionStackedOption', {
          title: {
            text: '阅读领域分布演化',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: allCategories,
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
            data: periods
          },
          yAxis: {
            type: 'value',
            name: '借阅数量'
          },
          series: seriesData
        });
      }

      // 构建饼图序列数据
      const pieOptions = Object.keys(periodGroups).map(period => {
        return {
          period: period,
          option: {
            title: {
              text: period,
              left: 'center',
              top: '10px'
            },
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
              orient: 'vertical',
              left: 'left'
            },
            series: [{
              name: '借阅类别',
              type: 'pie',
              radius: '50%',
              data: periodGroups[period],
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }]
          }
        };
      });

      this.$set(this, 'categoryEvolutionPieOptions', pieOptions);
    },

    // 更新阅读日历图表
    updateReadingCalendarChart(data) {
      console.log('Updating reading calendar chart', data);
      
      // 转换为热力图数据
      const heatmapData = data.map(item => {
        return [item.date, item.intensity];
      });

      this.$set(this, 'readingCalendarOption', {
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
          max: 4,
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
        series: [{
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: heatmapData
        }]
      });
    }
  }
};
</script>

<style scoped>
/* 借阅图谱样式 */
.visualization-container {
  padding: 20px;
}

.debug-info {
  background-color: #f0f0f0;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 5px;
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