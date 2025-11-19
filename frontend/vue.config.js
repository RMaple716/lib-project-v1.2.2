const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {  
      '/api': {
        target: 'http://localhost:3000', //后端服务器地址
        changeOrigin: true, //改变请求源，解决跨域问题
      }
    }
  }
})
